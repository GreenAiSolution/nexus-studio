import { prisma } from '@/lib/db';

const ND_BASE_URL = 'https://api.vault.netvoyage.com';
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // refresh 5 min before expiry

async function getNetDocumentsToken(organizationId: string): Promise<string> {
  const integration = await prisma.integration.findUnique({
    where: { organizationId_provider: { organizationId, provider: 'NETDOCUMENTS' as const } },
  });
  if (!integration?.accessToken) throw new Error('NetDocuments not connected');

  // Refresh if expiring soon
  if (integration.expiresAt && integration.expiresAt.getTime() - Date.now() < TOKEN_REFRESH_BUFFER_MS) {
    const refreshed = await fetch('https://login.netdocuments.com/newebas/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: integration.refreshToken ?? '',
        client_id: process.env.NETDOCUMENTS_CLIENT_ID ?? '',
        client_secret: process.env.NETDOCUMENTS_CLIENT_SECRET ?? '',
      }),
    });
    if (refreshed.ok) {
      const tokens = await refreshed.json();
      await prisma.integration.update({
        where: { id: integration.id },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        },
      });
      return tokens.access_token as string;
    }
  }

  return integration.accessToken;
}

async function ndFetch(organizationId: string, path: string, options: RequestInit = {}) {
  const token = await getNetDocumentsToken(organizationId);
  return fetch(`${ND_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...options.headers,
    },
  });
}

export async function uploadToNetDocuments(
  organizationId: string,
  cabinetId: string,
  fileName: string,
  fileBuffer: Buffer
): Promise<string> {
  const form = new FormData();
  const blob = new Blob([new Uint8Array(fileBuffer)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  form.append('file', blob, fileName);

  const res = await ndFetch(organizationId, `/v1/Document?cabinet=${cabinetId}`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(`NetDocuments upload failed: ${res.statusText}`);
  const data = await res.json();
  return data.id as string;
}

export async function getNetDocumentsDocument(organizationId: string, docId: string) {
  const res = await ndFetch(organizationId, `/v1/Document/${docId}`);
  if (!res.ok) throw new Error(`NetDocuments fetch failed: ${res.statusText}`);
  return res.json();
}
