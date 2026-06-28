import { createApp } from '../../packages/api/src/index';

const app = createApp();

export const handler = async (event: {
  path: string;
  httpMethod: string;
  headers: Record<string, string>;
  body: string | null;
  queryStringParameters: Record<string, string> | null;
  isBase64Encoded?: boolean;
}) => {
  try {
    const { path, httpMethod, headers, body, queryStringParameters, isBase64Encoded } = event;
    const scheme = headers['x-forwarded-proto'] || 'https';
    const host = headers.host || 'localhost';
    const url = new URL(path, `${scheme}://${host}`);

    if (queryStringParameters) {
      for (const [k, v] of Object.entries(queryStringParameters)) {
        if (v !== undefined && v !== null) {
          url.searchParams.set(k, String(v));
        }
      }
    }

    const reqHeaders = new Headers();
    for (const [k, v] of Object.entries(headers)) {
      if (v !== undefined && v !== null) {
        reqHeaders.set(k, String(v));
      }
    }

    // Let Hono handle its own content-length
    reqHeaders.delete('content-length');
    reqHeaders.delete('transfer-encoding');

    const init: RequestInit = {
      method: httpMethod,
      headers: reqHeaders,
    };

    if (body && httpMethod !== 'GET' && httpMethod !== 'HEAD') {
      init.body = isBase64Encoded
        ? Buffer.from(body, 'base64').toString()
        : body;
    }

    const req = new Request(url.toString(), init);
    const res = await app.fetch(req);

    const resBody = await res.text();
    const resHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      resHeaders[k] = v;
    });

    return {
      statusCode: res.status,
      headers: resHeaders,
      body: resBody,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: message }),
    };
  }
};
