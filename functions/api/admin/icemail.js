import { authed, unauth, json, getState } from './_lib.js';
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  const last_job = await getState(env, 'icemail_last_job', '01KSRF389GHPT0QA023Y16GV2F');
  const last_progress = await getState(env, 'icemail_last_progress', '0');
  const last_check = await getState(env, 'icemail_last_check', '');
  return json({
    last_job_id: last_job,
    last_progress_pct: Number(last_progress) || 0,
    last_check: last_check,
    mailbox_count_target: 30,
    mystrika_target: 299,
    note: 'IceMail has no public read API · this is set by manual sync from app.icemail.ai/mailboxes/export-history',
  });
};
