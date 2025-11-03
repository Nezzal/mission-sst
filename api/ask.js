// api/ask.js
// Version stable avec API REST (pas de SDK)

export default async function handler(req, res) {
  // ✅ En-têtes CORS – toujours envoyés
  res.setHeader('Access-Control-Allow-Origin', 'https://nezzal.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Gérer la requête préflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
  }

  // Lire le corps de la requête
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

  const { prompt } = body;
  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    return res.status(400).json({ error: 'Le champ "prompt" est requis.' });
  }

  // 🔑 Récupérer la clé API
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY manquante dans les variables d’environnement.');
    return res.status(500).json({ error: 'Erreur interne : clé API manquante.' });
  }

  // 💬 Construire le prompt
  const systemPrompt = `
Tu es LegiMedTrav-AI, expert en réglementation algérienne Santé et Sécurité au Travail (SST).
Réponds de façon claire, concise, professionnelle et pédagogique.
Cite systématiquement les textes applicables (ex: Loi 02-04, Décret 06-01, Arrêté du 16 octobre 2001).
Ne donne jamais d’avis médical, seulement des références réglementaires.
Question : ${prompt.trim()}
  `.trim();

  // 🌐 Appel à l'API REST de Gemini
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
      const errorData = await response.text();
      console.error('Erreur Gemini API (HTTP):', response.status, errorData);
      return res.status(500).json({ error: 'Échec de la réponse IA.' });
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      console.error('Réponse IA vide ou mal formée:', data);
      return res.status(500).json({ error: 'Réponse IA incomplète.' });
    }

    // Nettoyer les blocs de code markdown éventuels
    const cleanResponse = aiResponse
      .replace(/^```(html|markdown|javascript)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    return res.status(200).json({ response: cleanResponse });

  } catch (error) {
    console.error('Erreur lors de l’appel à l’IA :', error);
    return res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}