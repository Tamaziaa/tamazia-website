// Phase 12 · CSP nonce middleware
// Generates a per-request nonce, swaps every <script ... and <style ... in HTML responses
// to include nonce="...", and replaces 'unsafe-inline' in CSP with 'nonce-XXX'.
// Skip for non-HTML responses and for /api/* paths.

export const onRequest = async (context) => {
  const response = await context.next();
  const url = new URL(context.request.url);
  if (url.pathname.startsWith('/api/')) return response;
  const ctype = response.headers.get('content-type') || '';
  if (!ctype.startsWith('text/html')) return response;

  // Generate nonce
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))))
    .replace(/[^A-Za-z0-9]/g, '').slice(0, 22);

  // Read body
  let body = await response.text();

  // Swap script + style tags to include nonce
  body = body.replace(/<script(?![^>]*\snonce=)/g, `<script nonce="${nonce}"`);
  body = body.replace(/<style(?![^>]*\snonce=)/g, `<style nonce="${nonce}"`);

  // Build new headers · clone existing then patch CSP
  const newHeaders = new Headers(response.headers);
  let csp = newHeaders.get('content-security-policy') || '';
  if (csp) {
    // Replace 'unsafe-inline' in script-src and style-src with nonce
    csp = csp.replace(/script-src([^;]+)/, (m, rest) => {
      const cleaned = rest.replace(/\s'unsafe-inline'/g, '');
      return `script-src${cleaned} 'nonce-${nonce}' 'strict-dynamic'`;
    });
    csp = csp.replace(/style-src([^;]+)/, (m, rest) => {
      // Keep 'unsafe-inline' on style-src for now (reduced-motion media queries rely on inline styles)
      // but also include nonce so inline <style> tags with our nonce match
      return `style-src${rest} 'nonce-${nonce}'`;
    });
    newHeaders.set('content-security-policy', csp);
  }
  // Update Vary
  const existingVary = newHeaders.get('vary') || '';
  if (!existingVary.includes('Cookie')) {
    newHeaders.set('vary', existingVary ? existingVary + ', Cookie' : 'Cookie');
  }

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
};
