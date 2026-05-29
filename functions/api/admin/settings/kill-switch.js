import { authed, unauth, json, setState, getState } from './_lib.js';
export const onRequestPost = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  const body = await request.json().catch(() => ({}));
  await setState(env, 'kill_switch', body.on ? 'true' : 'false');
  await setState(env, 'kill_switch_reason', String(body.reason || 'cockpit'));
  await setState(env, 'kill_switch_at', new Date().toISOString());
  return json({ ok: true, paused: (await getState(env, 'kill_switch', 'false')) === 'true' });
};
