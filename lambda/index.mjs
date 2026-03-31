import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const GEN_MODEL = 'models/gemini-2.5-flash';
<<<<<<< HEAD
const EMBED_MODEL = 'models/text-embedding-004';
=======
const EMBED_MODEL = "models/gemini-embedding-001";
>>>>>>> feature/docker-setup
const TIMEOUT_MS = 30000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'https://d112tlzkqjy7m4.cloudfront.net';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

let store = null;
function loadStoreOnce() {
  if (store) return store;
  const file = path.join(process.cwd(), 'vector_store_precomputed.json');
  if (!fs.existsSync(file)) {
    throw new Error('vector_store_precomputed.json not found');
  }
  const raw = JSON.parse(fs.readFileSync(file, 'utf-8'));
  store = raw;
  return store;
}

function cors() {
  return {
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
  };
}

export const handler = async (event) => {
  const ORIGIN = "https://d112tlzkqjy7m4.cloudfront.net"; // your CloudFront domain
  const CORS = {
    "Access-Control-Allow-Origin": ORIGIN,
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Cache-Control": "no-store",
  };

  // Preflight
  if (event.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 204, headers: CORS };
  }

  try {
    // ---- your existing logic (read body, RAG, Gemini, etc.) ----
    // Example minimal happy path:
    const body = JSON.parse(event.body || "{}");
    const q = body.question?.trim();
    if (!q) {
      return {
        statusCode: 400,
        headers: { ...CORS, "Content-Type": "text/plain" },
        body: "Missing question",
      };
    }

    // ... build your answer here ...
    const answer = "Namaste! I’m your Ayurveda assistant. Ask about herbs or remedies.";

    return {
      statusCode: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { ...CORS, "Content-Type": "text/plain" },
      body: e?.message || "Server error",
    };
  }
};
