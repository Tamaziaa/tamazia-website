import { authed, unauth } from '../_lib.js';
// CF Pages Functions support streaming responses · SSE works natively
export const onRequestGet = async ({ request, env }) => {
  // Auth from query (EventSource doesn't support custom headers) OR a Cloudflare
  // Access JWT — /api/admin/_middleware.js has already verified the JWT signature
  // before this handler runs, so header presence here means cryptographically verified.
  const url = new URL(request.url);
  const secret = url.searchParams.get('s');
  const accessJwt = request.headers.get('cf-access-jwt-assertion');
  const secretOk = !!env.ADMIN_SECRET && secret === env.ADMIN_SECRET;
  if (!secretOk && !accessJwt) return unauth();
  // SSE stream · CF Workers v8 streams API
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('event: ready\ndata: {"connected":true}\n\n'));
      let count = 0;
      const interval = setInterval(() => {
        count++;
        controller.enqueue(encoder.encode(': ping ' + count + '\n\n'));
        if (count >= 12) { // 12 × 25s = 5 min then close (CF Pages caps at ~5min)
          clearInterval(interval);
          controller.enqueue(encoder.encode('event: bye\ndata: {"reason":"timeout","reconnect":true}\n\n'));
          controller.close();
        }
      }, 25000);
    }
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    }
  });
};
