exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const { prompt } = JSON.parse(event.body);
    if (!prompt) return { statusCode: 400, headers, body: JSON.stringify({ error: 'No prompt' }) };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 300, temperature: 0.7 }
        })
      }
    );

    if (!res.ok) {
      const err = await res.json();
      console.error('Gemini error:', err);
      if (res.status === 429) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ advice: 'AI insights are taking a short break due to high demand. Try again in a minute!' })
        };
      }
      throw new Error(`Gemini error: ${res.status}`);
    }

    const data = await res.json();
    const advice = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No advice generated.';
    return { statusCode: 200, headers, body: JSON.stringify({ advice }) };

  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ advice: 'AI insights unavailable right now. Your Waste Score and Cut Plan above are calculated instantly without AI!' })
    };
  }
};