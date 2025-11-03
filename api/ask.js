// api/ask.js

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY n'est pas défini.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Fonction utilitaire pour lire le corps de la requête
async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export default async function (req, res) {
  // CORS – pré-vol
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(405).json({ error: "Méthode non autorisée. Utilisez POST." });
  }

  // === 1. Parser le corps de la requête ===
  let body;
  try {
    const rawBody = await readRequestBody(req);
    body = JSON.parse(rawBody);
  } catch (e) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(400).json({ error: "Requête JSON invalide." });
  }

  const { question } = body;

  if (!question || typeof question !== "string" || question.trim() === "") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(400).json({ error: "Le champ 'question' est requis et doit être une chaîne non vide." });
  }

  // === 2. Appeler Gemini ===
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    const prompt = `
Tu es LegiMedTrav-AI, expert en réglementation algérienne SST.
Réponds de manière claire, concise, et cite les textes (ex: Loi 02-04, Décret 06-01).
Question : ${question.trim()}
    `.trim();

    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    const cleanAnswer = answer
      .replace(/^```(html|markdown|javascript)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    return res.status(200).json({ answer: cleanAnswer });

  } catch (error) {
    console.error("Erreur Gemini :", error);

    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(500).json({
      error: "Échec du traitement par l’IA.",
      details: error.message?.includes("API_KEY") ? "Clé API invalide." : undefined,
    });
  }
}