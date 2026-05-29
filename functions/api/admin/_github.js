// GitHub content API helper · read + write any file in the repo via Contents API
const REPO = 'Tamaziaa/tamazia-website';
const BRANCH = 'main';

export async function ghRead(env, path) {
  if (!env.GH_TOKEN) throw new Error('GH_TOKEN unbound');
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`, {
    headers: { 'Authorization': 'Bearer ' + env.GH_TOKEN, 'User-Agent': 'tamazia-cockpit', 'Accept': 'application/vnd.github+json' }
  });
  if (!r.ok) throw new Error('GH read ' + r.status);
  const d = await r.json();
  return { content: atob(d.content.replace(/\n/g, '')), sha: d.sha, size: d.size };
}

export async function ghWrite(env, path, newContent, message, sha) {
  if (!env.GH_TOKEN) throw new Error('GH_TOKEN unbound');
  // base64 encode without splitting unicode
  const body = {
    message: message || 'cockpit edit',
    content: btoa(unescape(encodeURIComponent(newContent))),
    branch: BRANCH,
    committer: { name: 'Tamazia Cockpit', email: 'cockpit@tamazia.co.uk' },
  };
  if (sha) body.sha = sha;
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { 'Authorization': 'Bearer ' + env.GH_TOKEN, 'User-Agent': 'tamazia-cockpit', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error('GH write ' + r.status + ': ' + t.slice(0, 200));
  }
  return await r.json();
}
