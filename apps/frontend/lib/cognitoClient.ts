import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  CognitoUserSession,
  IStorage
} from "amazon-cognito-identity-js";

export type SignInCredentials = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export type SignInSuccess = {
  status: "SUCCESS";
  session: CognitoUserSession;
  idToken: string;
  accessToken: string;
  refreshToken?: string;
};

export type NewPasswordRequiredChallenge = {
  status: "NEW_PASSWORD_REQUIRED";
  cognitoUser: CognitoUser;
  requiredAttributes?: string[];
  userAttributes?: Record<string, string>;
};

export type SignInResponse = SignInSuccess | NewPasswordRequiredChallenge;

function requiredEnv(name: keyof NodeJS.ProcessEnv): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not defined in the environment.`);
  }
  return value;
}

function assertBrowser() {
  if (typeof window === "undefined") {
    throw new Error("Cognito authentication is only available in the browser context.");
  }
}

function createStorage(target: Storage): IStorage {
  return {
    setItem: (key: string, value: string) => target.setItem(key, value),
    getItem: (key: string) => target.getItem(key) ?? null,
    removeItem: (key: string) => target.removeItem(key),
    clear: () => target.clear()
  };
}

function buildUserPool(storage: IStorage) {
  const userPoolId = requiredEnv("NEXT_PUBLIC_COGNITO_USER_POOL_ID");
  const clientId = requiredEnv("NEXT_PUBLIC_COGNITO_CLIENT_ID");

  return new CognitoUserPool({
    UserPoolId: userPoolId,
    ClientId: clientId,
    Storage: storage
  });
}

function collectBrowserStorages(): Storage[] {
  try {
    return [window.localStorage, window.sessionStorage];
  } catch (error) {
    console.warn("ストレージへのアクセスに失敗しました", error);
    return [];
  }
}

function normalizeCognitoError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return new Error(message);
    }
  }

  return new Error("ログインに失敗しました。時間をおいて再度お試しください。");
}

function mapSessionToSuccess(session: CognitoUserSession, cognitoUser: CognitoUser): SignInSuccess {
  const idToken = session.getIdToken().getJwtToken();
  const accessToken = session.getAccessToken().getJwtToken();
  const refreshToken = session.getRefreshToken()?.getToken();

  cognitoUser.setSignInUserSession(session);

  return {
    status: "SUCCESS",
    session,
    idToken,
    accessToken,
    refreshToken: refreshToken ?? undefined
  };
}

function sanitizeUserAttributes(attributes: Record<string, unknown> | undefined): Record<string, string> | undefined {
  if (!attributes) return undefined;

  const clone: Record<string, string> = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (typeof value === "string") {
      clone[key] = value;
    }
  }

  delete clone.email_verified;
  delete clone.phone_number_verified;

  return Object.keys(clone).length > 0 ? clone : undefined;
}

export async function signInWithCognito({
  email,
  password,
  rememberMe
}: SignInCredentials): Promise<SignInResponse> {
  assertBrowser();

  const storageTarget = rememberMe ? window.localStorage : window.sessionStorage;
  const userPool = buildUserPool(createStorage(storageTarget));

  const authenticationDetails = new AuthenticationDetails({
    Username: email,
    Password: password
  });

  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: userPool
  });

  return new Promise<SignInResponse>((resolve, reject) => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (session: CognitoUserSession) => {
        resolve(mapSessionToSuccess(session, cognitoUser));
      },
      onFailure: (err: unknown) => {
        reject(normalizeCognitoError(err));
      },
      newPasswordRequired: (userAttributes, requiredAttributes) => {
        resolve({
          status: "NEW_PASSWORD_REQUIRED",
          cognitoUser,
          requiredAttributes: requiredAttributes ?? undefined,
          userAttributes: sanitizeUserAttributes(userAttributes as Record<string, unknown> | undefined)
        });
      }
    });
  });
}

export async function completeNewPasswordChallenge(
  cognitoUser: CognitoUser,
  newPassword: string,
  attributes: Record<string, string> | undefined = undefined
): Promise<SignInSuccess> {
  assertBrowser();

  return new Promise<SignInSuccess>((resolve, reject) => {
    cognitoUser.completeNewPasswordChallenge(
      newPassword,
      attributes ?? {},
      {
        onSuccess: (session) => {
          resolve(mapSessionToSuccess(session, cognitoUser));
        },
        onFailure: (err) => {
          reject(normalizeCognitoError(err));
        }
      }
    );
  });
}

export async function signOutFromCognito(): Promise<void> {
  assertBrowser();

  collectBrowserStorages().forEach((storage) => {
    const userPool = buildUserPool(createStorage(storage));
    const currentUser = userPool.getCurrentUser();
    currentUser?.signOut();
  });
}
