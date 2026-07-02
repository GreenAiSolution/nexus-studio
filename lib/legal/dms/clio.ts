import { prisma } from '@/lib/db';

const CLIO_BASE_URL = 'https://app.clio.com/api/v4';

interface ClioTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

async function getClioTokens(organizationId: string): Promise<ClioTokens | null> {
  const integration = await prisma.integration.findUnique({
    where: { organizationId_provider: { organizationId, provider: 'CLIO' as const } },
  });
  if (!integration?.accessToken) return null;
  return {
    accessToken: integration.accessToken,
    refreshToken: integration.refreshToken ?? '',
    expiresAt: integration.expiresAt ?? new Date(0),
  };
}

async function clioFetch(
  organizationId: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const tokens = await getClioTokens(organizationId);
  if (!tokens) throw new Error('Clio not connected for this organization');

  return fetch(`${CLIO_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      'X-API-VERSION': '4.0.13',
      ...options.headers,
    },
  });
}

export async function getClioMatter(organizationId: string, matterId: string) {
  const res = await clioFetch(organizationId, `/matters/${matterId}.json?fields=id,display_number,description,client,practice_area,status`);
  if (!res.ok) throw new Error(`Clio matter fetch failed: ${res.statusText}`);
  const data = await res.json();
  return data.data;
}

export async function uploadToCliomatter(
  organizationId: string,
  matterId: string,
  fileName: string,
  fileBuffer: Buffer,
  mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
): Promise<string> {
  const form = new FormData();
  const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });
  form.append('data[name]', fileName);
  form.append('data[parent][id]', matterId);
  form.append('data[parent][type]', 'Matter');
  form.append('file', blob, fileName);

  const res = await clioFetch(organizationId, '/documents.json', {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(`Clio upload failed: ${res.statusText}`);
  const data = await res.json();
  return data.data.id as string;
}

export async function listClioMatters(organizationId: string, query?: string) {
  const params = new URLSearchParams({
    fields: 'id,display_number,description,client,status',
    limit: '25',
    ...(query ? { query } : {}),
  });
  const res = await clioFetch(organizationId, `/matters.json?${params}`);
  if (!res.ok) throw new Error(`Clio matters list failed: ${res.statusText}`);
  const data = await res.json();
  return data.data as Array<{ id: string; display_number: string; description: string; client: { name: string } }>;
}
