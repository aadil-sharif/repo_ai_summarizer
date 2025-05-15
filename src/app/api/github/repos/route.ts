import { NextResponse } from 'next/server';

export async function GET() {
  const username = process.env.GITHUB_USERNAME || 'octocat';

  const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=30`, {
    headers: { Accept: 'application/vnd.github.v3+json' },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch repos' }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
