// src/types/config.types.ts

export interface HsmCredentials {
  apiKey: string;
  apiSecret: string;
}

export interface TsaCredentials {
  username: string;
  password: string;
}

export interface AppConfig {
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  storage: {
    provider: 'aws' | 'azure' | 'gcp' | 'local';
    bucket: string;
    region?: string;
  };
  hsm: {
    provider: string;
    endpoint: string;
    credentials: HsmCredentials;
  };
  tsa: {
    url: string;
    credentials?: TsaCredentials;
  };
}
