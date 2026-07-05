// FIX-R1 verify: a voluntary-code framework must NEVER render a statutory fine.
import assert from 'assert';
import { noStatutoryFine, setVoluntaryBinding, bingoFromPointer } from '../functions/audit/_adapter.js';
// seed binding from an engine payload
setVoluntaryBinding({ UK_ABI: 'voluntary_code', UK_GDPR_A13: 'statute', UK_CYBER_ESSENTIALS: 'voluntary_code' });
assert.strictEqual(noStatutoryFine('UK_ABI'), true, 'ABI (voluntary) => no statutory fine');
assert.strictEqual(noStatutoryFine('UK_CYBER_ESSENTIALS'), true, 'Cyber Essentials (voluntary) => no fine');
assert.strictEqual(noStatutoryFine('UK_GDPR_A13'), false, 'GDPR (statute) => fine allowed');
assert.strictEqual(noStatutoryFine('UK_ABPI'), true, 'ABPI (hardcoded voluntary fallback) => no fine even without payload');
// render: a voluntary framework carrying a fine figure must NOT show a GBP range
const volCard = bingoFromPointer({ framework_short: 'UK_ABI', fine_low_gbp: 500000, fine_high_gbp: 1000000, fact: 'ABI code point', severity: 'P2' }, 'Regulatory', {}, 0, '£');
assert(!/£\s?[\d,]/.test(volCard.exp), `voluntary card must not show a GBP fine, got: ${volCard.exp}`);
// statutory framework with a fine SHOULD show the range
const statCard = bingoFromPointer({ framework_short: 'UK_GDPR_A13', fine_low_gbp: 500000, fine_high_gbp: 17500000, fact: 'A13 breach', severity: 'P1' }, 'Regulatory', {}, 0, '£');
assert(/£/.test(statCard.exp), `statutory card should show a GBP fine, got: ${statCard.exp}`);
console.log('FIX-R1 OK: voluntary code =>', JSON.stringify(volCard.exp), '| statutory =>', JSON.stringify(statCard.exp));
