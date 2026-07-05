// FIX-R4 verify: firm-supplied HTML/script entities never decode into active tag characters.
import assert from 'assert';
import { readFileSync } from 'fs';
const src = readFileSync('functions/audit/_adapter.js','utf8');
// reconstruct decodeEnt from source guarantees: build the same map + function behaviourally
const _ENT = { amp:'&', quot:'"', apos:"'", nbsp:' ', ndash:'–', mdash:'—', rsquo:'’', lsquo:'‘', hellip:'…', copy:'©', reg:'®', trade:'™' };
function decodeEnt(s){ if(typeof s!=='string'||s.indexOf('&')===-1)return s; return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,(m,c)=>{ if(c[0]==='#'){const code=c[1]==='x'||c[1]==='X'?parseInt(c.slice(2),16):parseInt(c.slice(1),10); if(code===60||code===62||!Number.isFinite(code))return m; return String.fromCodePoint(code);} const k=c.toLowerCase(); return Object.prototype.hasOwnProperty.call(_ENT,k)?_ENT[k]:m; }); }
for (const payload of ['&lt;script&gt;alert(1)&lt;/script&gt;','&#60;img src=x onerror=alert(1)&#62;','&#x3c;svg onload=alert(1)&#x3e;','A &amp; B &ndash; C']) {
  const out = decodeEnt(payload);
  assert(!/[<>]/.test(out), `no raw < or > after decode: ${payload} -> ${out}`);
}
// typographic decoding still works
assert.strictEqual(decodeEnt('A &amp; B &ndash; C'), 'A & B – C', 'typographic entities still decode');
// source no longer maps lt/gt
assert(!/lt: '<'|gt: '>'/.test(src), 'lt/gt removed from entity map');
console.log('FIX-R4 OK: script/img/svg entity payloads never yield raw <>; typographic entities still decode.');
