export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      UMI_RPC_URL: string;
      PRIVATE_KEY: string;
    }
  }
}