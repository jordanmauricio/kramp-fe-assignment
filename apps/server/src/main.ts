import { createServer } from 'node:http';
import { createYoga } from 'graphql-yoga';
import { schema } from './schema';

const yoga = createYoga({
  schema,
  // B3: logs every incoming request to stdout — should not be in production
  plugins: [
    {
      onRequest({ request }) {
        console.log(`[${new Date().toISOString()}] incoming request: ${request.method} ${request.url}`);
      },
    },
  ],
});

const server = createServer(yoga);

server.listen(4000, () => {
  console.log('Visit http://localhost:4000/graphql');
});
