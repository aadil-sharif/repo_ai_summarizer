import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { repoName, repoDesc } = await req.json();

    if (!repoName) {
      return NextResponse.json({ error: 'Missing repoName' }, { status: 400 });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const prompt = `Write a creative and engaging summary for a GitHub repository called "${repoName}". Description: "${repoDesc}".`;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // ✅ FIXED MODEL NAME
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 60,
      }),
    });

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      console.error('OpenAI API error:', errorText); // 🔍 Debugging help
      return NextResponse.json({ error: 'OpenAI request failed' }, { status: 500 });
    }

    const openaiData = await openaiRes.json();
    const summary = openaiData.choices?.[0]?.message?.content || 'No summary available';

    return NextResponse.json({ summary });

  } catch (error) {
    console.error('Server error:', error); // 🔍 More detailed error logging
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
