export default async function handler(req, res) {
  // Ajoute les en-têtes CORS pour autoriser les requêtes depuis GitHub Pages
  res.setHeader('Access-Control-Allow-Origin', 'https://nezzal.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Gère la préflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Ton code existant pour traiter la requête POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt requis' });
    }

    // ... ton code pour appeler Gemini ...

    res.status(200).json({ response: aiResponse });

  } catch (error) {
    console.error('Erreur dans l’API :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}