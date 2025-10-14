import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { describe, it, expect, beforeEach, vi } from "vitest";

const sendMock = vi.fn();
const verifyAccessTokenMock = vi.fn();
let lastClientConfig: Record<string, unknown> | undefined;

vi.mock("@aws-sdk/client-cognito-identity-provider", () => {
  class MockClient {
    public send = sendMock;

    constructor(config: Record<string, unknown>) {
      lastClientConfig = config;
    }
  }

  class MockInitiateAuthCommand {
    public input: unknown;

    constructor(input: unknown) {
      this.input = input;
    }
  }

  return {
    CognitoIdentityProviderClient: MockClient,
    InitiateAuthCommand: MockInitiateAuthCommand
  };
});

vi.mock("../lib/jwt", () => ({
  verifyAccessToken: verifyAccessTokenMock
}));

function createHttpEvent(
  method: string,
  path: string,
  overrides: Partial<APIGatewayProxyEventV2> = {}
): APIGatewayProxyEventV2 {
  const base = {
    version: "2.0",
    routeKey: "$default",
    rawPath: path,
    rawQueryString: "",
    headers: {},
    requestContext: {
      accountId: "123456789012",
      apiId: "test",
      domainName: "example.com",
      domainPrefix: "example",
      http: {
        method,
        path,
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "vitest"
      },
      requestId: "req-id",
      routeKey: "$default",
      stage: "dev",
      time: "10/Oct/2025:12:00:00 +0000",
      timeEpoch: Date.now()
    },
    isBase64Encoded: false,
    body: undefined
  } as unknown as APIGatewayProxyEventV2;

  return {
    ...base,
    ...overrides,
    rawPath: path,
    headers: { ...base.headers, ...(overrides.headers ?? {}) },
    requestContext: {
      ...base.requestContext,
      ...(overrides.requestContext ?? {}),
      http: {
        ...base.requestContext.http,
        ...(overrides.requestContext?.http ?? {}),
        method,
        path
      }
    }
  };
}

beforeEach(() => {
  vi.resetModules();
  sendMock.mockReset();
  verifyAccessTokenMock.mockReset();
  lastClientConfig = undefined;

  process.env.AWS_REGION = "ap-northeast-1";
  process.env.COGNITO_USER_POOL_ID = "pool-id";
  process.env.COGNITO_APP_CLIENT_ID = "client-id";
  process.env.JWT_ISSUER = "https://issuer.example.com";
  process.env.JWT_AUDIENCE = "client-id";
});

describe("auth handler", () => {
  it("POST /auth/login で Cognito 認証を実行し、結果を返す", async () => {
    const { handler } = await import("./auth");

    sendMock.mockResolvedValue({
      AuthenticationResult: {
        AccessToken: "access",
        IdToken: "id",
        RefreshToken: "refresh",
        TokenType: "Bearer",
        ExpiresIn: 3600
      }
    });

    const response = await handler(
      createHttpEvent("POST", "/auth/login", {
        body: JSON.stringify({ email: "user@example.com", password: "Password123!", rememberMe: true })
      })
    );

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body ?? "{}")).toEqual({
      accessToken: "access",
      idToken: "id",
      refreshToken: "refresh",
      tokenType: "Bearer",
      expiresIn: 3600
    });
    expect(sendMock).toHaveBeenCalledTimes(1);
    const command = sendMock.mock.calls[0][0] as { input: Record<string, unknown> };
    expect(command.input).toMatchObject({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: "client-id",
      AuthParameters: {
        USERNAME: "user@example.com",
        PASSWORD: "Password123!"
      }
    });
    expect(lastClientConfig).toMatchObject({ region: "ap-northeast-1" });
  });

  it("POST /auth/login で Cognito エラーを 401 に変換する", async () => {
    const { handler } = await import("./auth");

    sendMock.mockRejectedValue(Object.assign(new Error("Not authorized"), { name: "NotAuthorizedException" }));

    const response = await handler(
      createHttpEvent("POST", "/auth/login", {
        body: JSON.stringify({ email: "user@example.com", password: "wrongpassword" })
      })
    );

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body ?? "{}")).toEqual({ error: "Not authorized" });
  });

  it("GET /auth/session でアクセストークンを検証し、ペイロードを返す", async () => {
    const { handler } = await import("./auth");

    verifyAccessTokenMock.mockResolvedValue({
      sub: "user-sub",
      email: "user@example.com",
      "cognito:username": "user",
      iat: 1700000000,
      exp: 1700003600,
      "cognito:groups": ["admin"]
    });

    const response = await handler(
      createHttpEvent("GET", "/auth/session", {
        headers: { authorization: "Bearer token" }
      })
    );

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body ?? "{}")).toEqual({
      sub: "user-sub",
      email: "user@example.com",
      username: "user",
      issuedAt: 1700000000,
      expiresAt: 1700003600,
      groups: ["admin"]
    });
    expect(verifyAccessTokenMock).toHaveBeenCalledWith("token", expect.anything());
  });

  it("GET /auth/session でトークンが無い場合は 401 を返す", async () => {
    const { handler } = await import("./auth");

    const response = await handler(createHttpEvent("GET", "/auth/session"));

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body ?? "{}")).toEqual({ error: "認証情報が不足しています" });
    expect(verifyAccessTokenMock).not.toHaveBeenCalled();
  });
});
