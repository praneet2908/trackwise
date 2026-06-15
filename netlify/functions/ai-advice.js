export default async (request) => {
  const { prompt } = await request.json();
  
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  );
  
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Try again!';
  
  return new Response(JSON.stringify({ advice: text }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const config = { path: '/api/ai-advice' };