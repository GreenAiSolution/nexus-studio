import { uploadToCliomatter } from './clio';
import { uploadToNetDocuments } from './netdocuments';

export type DmsProvider = 'CLIO' | 'NETDOCUMENTS' | 'IMANAGE';

export interface DmsUploadResult {
  provider: DmsProvider;
  documentId: string;
}

export interface DmsUploadInput {
  organizationId: string;
  provider: DmsProvider;
  fileName: string;
  fileBuffer: Buffer;
  // Provider-specific context
  clioMatterId?: string;
  ndCabinetId?: string;
}

export async function uploadToDms(input: DmsUploadInput): Promise<DmsUploadResult> {
  switch (input.provider) {
    case 'CLIO': {
      if (!input.clioMatterId) throw new Error('clioMatterId required for Clio upload');
      const documentId = await uploadToCliomatter(
        input.organizationId,
        input.clioMatterId,
        input.fileName,
        input.fileBuffer
      );
      return { provider: 'CLIO', documentId };
    }
    case 'NETDOCUMENTS': {
      if (!input.ndCabinetId) throw new Error('ndCabinetId required for NetDocuments upload');
      const documentId = await uploadToNetDocuments(
        input.organizationId,
        input.ndCabinetId,
        input.fileName,
        input.fileBuffer
      );
      return { provider: 'NETDOCUMENTS', documentId };
    }
    case 'IMANAGE': {
      // iManage requires enterprise partnership — stub for EMPIRE tier
      throw new Error('iManage integration requires EMPIRE tier and partnership setup. Contact support.');
    }
  }
}

export { listClioMatters, getClioMatter } from './clio';
