export default async (request) => {
  try {
    const { prompt } = await request.json();
    
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    
    const data = await res.json();
    
    // Log full response so we can see what Gemini returns
    console.log('Gemini response:', JSON.stringify(data));
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Try again!';
    
    return new Response(JSON.stringify({ advice: text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch(err) {
    console.log('Error:', err.message);
    return new Response(JSON.stringify({ advice: 'Error: ' + err.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = { path: '/api/ai-advice' };