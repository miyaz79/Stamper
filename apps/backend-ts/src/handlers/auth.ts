import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  InitiateAuthCommandInput,
  AuthenticationResultType
} from "@aws-sdk/client-cognito-identity-provider";
import { z } from "zod";
import { getEnv } from "../lib/env";
import { jsonResponse } from "../lib/http";
import { verifyAccessToken } from "../lib/jwt";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberMe: z.boolean().default(true)
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(20)
});

const env = getEnv();
const cognitoClient = new CognitoIdentityProviderClient({ region: env.region });

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const method = event.requestContext.http.method;
  const path = event.rawPath ?? event.requestContext.http.path ?? "";

  if (method === "POST" && path.endsWith("/auth/login")) {
    return handleLogin(event);
  }

  if (method === "POST" && path.endsWith("/auth/refresh")) {
    return handleRefresh(event);
  }

  if (method === "GET" && path.endsWith("/auth/session")) {
    return handleSession(event);
  }

  return jsonResponse(404, { error: "Not Found" });
}

async function handleLogin(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse(400, { error: parsed.error.issues.map((issue) => issue.message).join(", ") });
    }

    const result = await initiateAuth({
      AuthFlow: "USER_PASSWORD_AUTH",
      AuthParameters: {
        USERNAME: parsed.data.email,
        PASSWORD: parsed.data.password
      }
    });

    if (!result.AuthenticationResult) {
      return jsonResponse(401, { error: "認証に失敗しました" });
    }

    return jsonResponse(200, formatAuthResult(result.AuthenticationResult));
  } catch (error) {
    return handleCognitoError(error);
  }
}

async function handleRefresh(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const parsed = RefreshSchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse(400, { error: parsed.error.issues.map((issue) => issue.message).join(", ") });
    }

    const result = await initiateAuth({
      AuthFlow: "REFRESH_TOKEN_AUTH",
      AuthParameters: {
        REFRESH_TOKEN: parsed.data.refreshToken
      }
    });

    if (!result.AuthenticationResult) {
      return jsonResponse(401, { error: "トークンの更新に失敗しました" });
    }

    return jsonResponse(200, formatAuthResult(result.AuthenticationResult));
  } catch (error) {
    return handleCognitoError(error);
  }
}

async function handleSession(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const authorization = event.headers?.authorization ?? event.headers?.Authorization;
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return jsonResponse(401, { error: "認証情報が不足しています" });
  }

  const token = authorization.replace(/^Bearer\s+/i, "");
  try {
    const payload = await verifyAccessToken(token, env);
    return jsonResponse(200, {
      sub: payload.sub,
      email: payload.email,
      username: payload["cognito:username"],
      issuedAt: payload.iat,
      expiresAt: payload.exp,
      groups: payload["cognito:groups"]
    });
  } catch (error) {
    return handleCognitoError(error);
  }
}

async function initiateAuth(params: Omit<InitiateAuthCommandInput, "ClientId">) {
  const input: InitiateAuthCommandInput = {
    ClientId: env.appClientId,
    ...params
  };
  const command = new InitiateAuthCommand(input);
  return cognitoClient.send(command);
}

function formatAuthResult(result: AuthenticationResultType) {
  const expiresIn = result.ExpiresIn ?? 3600;
  return {
    accessToken: result.AccessToken,
    idToken: result.IdToken,
    refreshToken: result.RefreshToken,
    tokenType: result.TokenType,
    expiresIn
  };
}

function handleCognitoError(error: unknown): APIGatewayProxyStructuredResultV2 {
  if (error instanceof Error) {
    const authErrors = new Set([
      "NotAuthorizedException",
      "UserNotConfirmedException",
      "PasswordResetRequiredException",
      "UserNotFoundException",
      "CodeMismatchException",
      "ExpiredCodeException",
      "JWTExpired"
    ]);
    if (authErrors.has(error.name)) {
      return jsonResponse(401, { error: error.message });
    }
    return jsonResponse(500, { error: error.message });
  }
  return jsonResponse(500, { error: "認証処理で予期せぬエラーが発生しました" });
}
