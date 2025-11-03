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

export default async function handler(req, res) {
  // ⭐️ En-têtes CORS – doivent être envoyés dans TOUTES les réponses
  res.setHeader('Access-Control-Allow-Origin', 'https://nezzal.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Gérer la requête préflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Seule la méthode POST est autorisée
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
  }

  // === 1. Lire et parser le corps de la requête ===
  let body;
  try {
    const rawBody = await readRequestBody(req);
    body = JSON.parse(rawBody);
  } catch (e) {
    return res.status(400).json({ error: 'Requête JSON invalide.' });
  }

  const { prompt } = body;
  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    return res.status(400).json({ error: 'Le champ "prompt" est requis et doit être une chaîne non vide.' });
  }

  // === 2. Appeler l'IA ===
  try {
    const fullPrompt = `
Tu es LegiMedTrav-AI, expert en réglementation algérienne SST.
Réponds de manière claire, concise, et cite les textes (ex: Loi 02-04, Décret 06-01).
Question : ${prompt.trim()}
    `.trim();

    const result = await model.generateContent(fullPrompt);
    const aiResponse = result.response.text();

    const cleanResponse = aiResponse
      .replace(/^```(html|markdown|javascript)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    return res.status(200).json({ response: cleanResponse });

  } catch (error) {
    console.error('Erreur lors de l’appel à Gemini :', error);
    return res.status(500).json({
      error: 'Échec du traitement par l’IA.',
      details: error.message?.includes('API_KEY') ? 'Clé API invalide.' : undefined,
    });
  }
}