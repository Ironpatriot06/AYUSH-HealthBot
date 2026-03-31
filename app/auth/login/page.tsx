"use client";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const supabase = getBrowserSupabase();
  const [email, setEmail] = useState("");

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  const loginWithMagicLink = async () => {
    await supabase.auth.signInWithOtp({
      email,
    });
  };

  return (
    <div className="p-10 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Login</h1>

      <button
        onClick={loginWithGoogle}
        className="w-full bg-red-500 text-white py-2 rounded mb-4"
      >
        Login with Google
      </button>

      <div className="my-4 text-center">OR</div>

      <input
        type="email"
        placeholder="Enter email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 w-full mb-3 rounded"
      />

      <button
        onClick={loginWithMagicLink}
        className="w-full bg-blue-600 text-white py-2 rounded"
      >
        Send Magic Link
      </button>
    </div>
  );
}