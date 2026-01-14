// src/types/cryptography.types.ts

export interface CryptographicEvidence {
  hash: string;
  algorithm: string;
  timestamp: Date;
  certificateChain: string[];
  tsaResponse?: string;
  ocspResponse?: string;
  crlUrl?: string;
}
