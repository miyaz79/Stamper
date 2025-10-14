export type Env = {
  region: string;
  userPoolId: string;
  appClientId: string;
  issuer: string;
  audience: string;
};

const cachedEnv: Partial<Env> = {};

function readEnvVar(name: keyof NodeJS.ProcessEnv): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required.`);
  }
  return value;
}

export function getEnv(): Env {
  if (
    cachedEnv.region &&
    cachedEnv.userPoolId &&
    cachedEnv.appClientId &&
    cachedEnv.issuer &&
    cachedEnv.audience
  ) {
    return cachedEnv as Env;
  }

  const env: Env = {
    region: readEnvVar("AWS_REGION"),
    userPoolId: readEnvVar("COGNITO_USER_POOL_ID"),
    appClientId: readEnvVar("COGNITO_APP_CLIENT_ID"),
    issuer: readEnvVar("JWT_ISSUER"),
    audience: readEnvVar("JWT_AUDIENCE")
  };

  Object.assign(cachedEnv, env);
  return env;
}
