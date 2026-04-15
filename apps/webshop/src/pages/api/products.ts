import type { NextApiRequest, NextApiResponse } from 'next';

// F4: This API route exists but is never used.
// All pages (index.tsx, search.tsx, product/[id].tsx, Header.tsx) call
// http://localhost:4000/graphql directly from the client — exposing the internal
// server address to every browser that loads the page.
//
// This route is the correct pattern: a server-side proxy that keeps the GraphQL
// server address private. Pages should call /api/products instead of the raw server.
//
// Additionally, using an API route would allow:
// - Adding authentication headers server-side
// - Rate limiting at the Next.js layer
// - Hiding the implementation detail (could swap GraphQL for REST without frontend changes)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  });

  const data = await response.json();
  return res.status(200).json(data);
}
