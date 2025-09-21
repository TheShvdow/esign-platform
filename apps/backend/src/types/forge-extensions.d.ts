// src/types/forge-extensions.d.ts
import 'node-forge';

declare module 'node-forge' {
  namespace pkcs7 {
    interface SignedData {
      signers: any[];
      certificates: any[];
    }
  }
}
