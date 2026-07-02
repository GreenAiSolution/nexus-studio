/**
 * NEXUS AI — Agent Execution Streaming Endpoint
 *
 * Real-time streaming responses for agent task execution.
 * Uses Server-Sent Events (SSE) for browser compatibility.
 */

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { inngest } from '@/inngest/client';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const orgId = sessionClaims?.org_id as string;
    if (!orgId) {
      return new Response('No organization', { status: 400 });
    }

    const { agentId, input } = await request.json();

    // Verify agent ownership
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent || agent.organizationId !== orgId) {
      return new Response('Agent not found', { status: 404 });
    }

    // Create readable stream for SSE
    const encoder = new TextEncoder();
    let streamClosed = false;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initialization
          controller.enqueue(encoder.encode('data: {"type": "start", "agentId": "' + agentId + '"}\n\n'));

          // Trigger background execution
          await inngest.send({
            name: 'agent/execute.with-tools',
            data: {
              organizationId: orgId,
              agentId,
              input,
              streamUserId: userId,
            },
          });

          // Poll for results (since streaming from background job is complex)
          // In production, use WebSockets or Inngest's streaming capabilities
          const maxWaitTime = 30000; // 30 seconds
          const startTime = Date.now();
          let attempt = 0;

          while (!streamClosed && Date.now() - startTime < maxWaitTime) {
            const execution = await prisma.taskExecution.findFirst({
              where: {
                agentId,
                status: { in: ['COMPLETED', 'FAILED'] },
                completedAt: { gte: new Date(Date.now() - 60000) },
              },
              orderBy: { completedAt: 'desc' },
              take: 1,
            });

            if (execution) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'response',
                    output: execution.output,
                    status: execution.status,
                  })}\n\n`
                )
              );

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'complete',
                    success: execution.status === 'COMPLETED',
                  })}\n\n`
                )
              );

              controller.close();
              streamClosed = true;
              return;
            }

            // Send heartbeat every 5 attempts
            if (++attempt % 5 === 0) {
              controller.enqueue(encoder.encode('data: {"type": "heartbeat"}\n\n'));
            }

            // Wait before next poll
            await new Promise((resolve) => setTimeout(resolve, 500));
          }

          if (!streamClosed) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'error',
                  message: 'Execution timeout',
                })}\n\n`
              )
            );
            controller.close();
          }
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                message: error instanceof Error ? error.message : 'Execution failed',
              })}\n\n`
            )
          );
          controller.close();
        }
      },

      cancel() {
        streamClosed = true;
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[Stream Error]', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Stream failed',
      }),
      { status: 500 }
    );
  }
}
