"use client";

import { Amplify } from "aws-amplify";

const amplifyConfig = {
  Auth: {
    // safe runtime fallbacks so code doesn't crash during SSR build
    region: process.env.NEXT_PUBLIC_COGNITO_REGION ?? "",
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? "",
    userPoolWebClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? "",
    oauth: {
      domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN ?? "",
      scope: ["email", "openid", "profile"],
      // prefer runtime origin (works in dev & prod), fallback for build-time
      redirectSignIn:
        typeof window !== "undefined"
          ? window.location.origin + "/auth/callback"
          : "http://localhost:3000/auth/callback",
      redirectSignOut:
        typeof window !== "undefined"
          ? window.location.origin + "/auth/logout"
          : "http://localhost:3000/auth/logout",
      responseType: "code", // use Authorization Code + PKCE
    },
  },
};

