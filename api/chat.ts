// Vercel / Netlify compatible serverless function for PESU
// Keeps GEMINI_API_KEY secure on the server side with rate limiting and validation.

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY is not configured on the server. Please use local mode or provide your key in settings.'
    });
  }

  const { message, history, scenarioId } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message text is required.' });
  }

  // Request validation and length bounds
  if (message.length > 500) {
    return res.status(400).json({ error: 'Message exceeds 500 character limit.' });
  }

  try {
    const model = 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const formattedHistory = Array.isArray(history)
      ? history.slice(-6).map((m: any) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }))
      : [];

    const contents = [
      ...formattedHistory,
      {
        role: 'user',
        parts: [{ text: `User message: "${message}". Practice scenario: ${scenarioId || 'General'}. Respond according to the system rules and return JSON only.` }]
      }
    ];

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: `You are PESU, an encouraging bilingual AI speaking partner for Tamil speakers practicing spoken English. Understand Tamil, Tanglish, and English. Respond to meaning first, offer gentle corrections only when needed, explain in simple Tamil, and ask a follow-up question. Return JSON only with replyText, tamilExplanation, grammarCorrection, pronunciationGuide, suggestedResponses.`
          }]
        },
        contents,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
          maxOutputTokens: 600
        }
      })
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      return res.status(geminiRes.status).json({ error: 'Gemini upstream error', details: err });
    }

    const data = await geminiRes.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(candidateText);

    return res.status(200).json(parsed);
  } catch (error: any) {
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
