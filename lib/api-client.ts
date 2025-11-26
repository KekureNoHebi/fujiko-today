import createClient, { type Middleware } from 'openapi-fetch';
import type { paths } from '@/lib/api/v1';

const accessToken: string | undefined = process.env.DIRECTUS_TOKEN;

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    request.headers.set('Authorization', `Bearer ${accessToken}`);
    return request;
  },
};

const client = createClient<paths>({ baseUrl: process.env.DIRECTUS_URL });
client.use(authMiddleware);

export default client;
