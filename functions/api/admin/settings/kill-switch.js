import { authed, unauth, json, setState, getState } from '../_lib.js';
// POST { on: true|false }  — pause/resume ALL sending. Writes the KV flag (website
// buffer) AND the engine's Neon system_state.paused, which scripts/send-due.js checks
// on every cycle — so the cockpit button genuinely halts the engine, not just the UI.
export const onRequestPost = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  const body = await request.json().catch(() => ({}));
  const on = !!body.on;
  await setState(env, 'kill_switch', on ? 'true' : 'false');
  await setState(env, 'kill_switch_reason', String(body.reason || 'cockpit'));
  await setState(env, 'kill_switch_at', new Date().toISOString());
  // Mirror to the engine's authoritative pause flag (additive upsert; never throws the request).
  let engine = null;
  if (env.NEON_URL) {
    try {
      const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
      await fetch('https://' + host + '/sql', {
        method: 'POST',
        headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `INSERT INTO system_state (key, value) VALUES ('paused', $1)
                  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
          params: [on ? 'true' : 'false'],
        }),
      });
      engine = on ? 'paused' : 'running';
    } catch (e) { engine = 'error:' + e.message; }
  }
  return json({ ok: true, paused: (await getState(env, 'kill_switch', 'false')) === 'true', engine });
};
