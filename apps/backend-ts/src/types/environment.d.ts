declare namespace NodeJS {
  interface ProcessEnv {
    AWS_REGION: string;
    COGNITO_USER_POOL_ID: string;
    COGNITO_APP_CLIENT_ID: string;
    JWT_ISSUER: string;
    JWT_AUDIENCE: string;
  }
}
