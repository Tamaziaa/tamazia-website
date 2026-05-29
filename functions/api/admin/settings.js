import { authed, unauth, json, getState } from './_lib.js';
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  return json({
    kill_switch: (await getState(env, 'kill_switch', 'false')) === 'true',
    icp_sectors: (await getState(env, 'icp_sectors', 'hospitality,healthcare,real estate')).split(',').map(s => s.trim()),
    cadence_days: [0, 5, 10, 20, 35, 90],
    quality_pass: 60,
    test_addresses: ['@tamazia-test.dev', '@example.com', '+test@'],
  });
};
