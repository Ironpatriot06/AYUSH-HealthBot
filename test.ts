import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

async function test() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const res = await model.generateContent("hello");

  console.log(res.response.text());
}

test().catch(console.error);