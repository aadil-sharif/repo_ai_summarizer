import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.GITHUB_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'GitHub access token not configured' }, { status: 500 });
  }

  try {
    const res = await fetch('https://api.github.com/user/repos', {
      headers: {
        Authorization: `token ${token}`,
      },
    });

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json({ error }, { status: res.status });
    }

    const repos = await res.json();
    return NextResponse.json(repos);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch repos' }, { status: 500 });
  }
}
