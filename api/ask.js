// api/ask.js
export default async function handler(req, res) {
  // 🔐 Gestion flexible des origines CORS (pour local + production)
  const allowedOrigins = [
    'https://nezzal.github.io',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost:8080',
    'http://localhost:3000'
  ];
  const origin = req.headers.origin;
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : 'https://nezzal.github.io';

  // ⚙️ Appliquer les en-têtes CORS
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', true);

  // 🛑 Requête OPTIONS (preflight CORS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 🚫 Seule la méthode POST est autorisée
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
  }

  // 🔍 Lire le corps de la requête
  let rawBody = '';
  for await (const chunk of req) {
    rawBody += chunk.toString();
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (e) {
    return res.status(400).json({ error: 'Requête JSON invalide.' });
  }

  // ✅ Lire "question" (pas "prompt")
  const { question } = body;
  if (!question || typeof question !== 'string' || question.trim() === '') {
    return res.status(400).json({ error: 'Le champ "question" est requis.' });
  }

  // 🔑 Récupérer la clé API
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY manquante dans les variables d’environnement.');
    return res.status(500).json({ error: 'Erreur interne : clé API manquante.' });
  }

  // 💬 Construire le prompt système
  const systemPrompt = `
Tu es LegiMedTrav-AI, expert en réglementation algérienne Santé et Sécurité au Travail (SST).
Réponds de façon claire, concise, professionnelle et pédagogique.
Cite systématiquement les textes applicables (ex: Loi 02-04, Décret 06-01, Arrêté du 16 octobre 2001).
Ne donne jamais d’avis médical, seulement des références réglementaires.
Question : ${question.trim()}
  `.trim();

  // 🌐 Appel à l’API Gemini (URL corrigée, sans espaces)
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur Gemini (HTTP):', response.status, errorText);
      return res.status(500).json({ error: 'Échec de la réponse IA (serveur).' });
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      console.error('Réponse IA vide:', data);
      return res.status(500).json({ error: 'Réponse IA vide ou invalide.' });
    }

    const cleanResponse = aiResponse
      .replace(/^```(?:html|markdown|javascript)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    return res.status(200).json({ response: cleanResponse });

  } catch (error) {
    console.error('Erreur serveur:', error);
    return res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}