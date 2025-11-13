"use client";

import React from "react";
import Amplify, * as AmplifyAll from "aws-amplify";

// If TS complains about named export, use this runtime-safe import:
const Auth = (AmplifyAll as any).Auth;

// (Assumes you already imported ./lib/amplify in your root layout so Amplify is configured)

const LoginPage: React.FC = () => {
  const login = () => {
    try {
      Auth.federatedSignIn();
    } catch (err) {
      // runtime fallback
      console.error("Auth.federatedSignIn failed:", err);
    }
  };

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Login</h1>
      <button
        onClick={login}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Login with Cognito
      </button>
    </div>
  );
};

export default LoginPage;
