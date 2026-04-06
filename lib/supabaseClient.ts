"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

export function getBrowserSupabase() {
  // Always create a fresh client to avoid caching issues
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("Missing Supabase env vars:", { url: !!url, key: !!key });
    throw new Error("Supabase URL or Anon Key is not defined");
  }

  if (!supabase) {
    console.log("Creating NEW Supabase client with URL:", url);
    console.log("Key (first 20 chars):", key.substring(0, 20) + "...");

    try {
      supabase = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        }
      });
      
      console.log("Supabase client created successfully");
    } catch (error) {
      console.error("Error creating Supabase client:", error);
      throw error;
    }
  } else {
    console.log("Returning cached Supabase client");
  }

  return supabase;
}