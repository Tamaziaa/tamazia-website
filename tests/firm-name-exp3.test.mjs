/* ══════════════════════════════════════════════════════════════════════════════════════════════════════════════
   EXP-3 · A SURNAME IS NOT AN ADJECTIVE.

   bhatiabest.co.uk's audit was headed "Bhatiabest". The firm is Bhatia Best Solicitors, named after Bhatia and
   Best, and `TITLE_SIGNS` carries the bare word `best `, so `looksLikeTitle` was TRUE for both "Bhatia Best
   Solicitors" and "Bhatia Best Limited" — every door into the real name shut, on the one field a client reads
   first.

   The hard part is not admitting the firm. It is admitting the firm WITHOUT admitting the marketing lines the
   guard exists for, and every one of those certificates is asserted below, on the domain that would most help it
   through. "Best Solicitors" on bestsolicitors.co.uk is the load-bearing case: the marketing word IS in that
   domain stem, and it must still be rejected, because nothing else in the candidate identifies a firm.
   ══════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
import { test } from 'node:test';
import assert from 'node:assert';
import { looksLikeTitle, sharesTokenWithDomain } from '../functions/audit/_names.js';

test('EXP-3: the firm named Best is admitted, on both of its own name forms', () => {
  assert.strictEqual(looksLikeTitle('Bhatia Best Solicitors', 'bhatiabest.co.uk'), false);
  assert.strictEqual(looksLikeTitle('Bhatia Best Limited', 'bhatiabest.co.uk'), false);
  // and NAME-01 always would have: the guard that fired was the wrong one.
  assert.strictEqual(sharesTokenWithDomain('Bhatia Best Solicitors', 'bhatiabest.co.uk'), true);
});

test('EXP-3: no other firm in the wave moves', () => {
  for (const [n, d] of [['Slee Blackwell Solicitors', 'sleeblackwell.co.uk'],
    ['Cullimore Dutton Solicitors Limited', 'cullimoredutton.co.uk'],
    ['J F Law Limited', 'jflaw.co.uk'], ['Harrowells Solicitors', 'harrowells.co.uk'],
    ['Kirwans', 'kirwanssolicitors.co.uk'], ['BDO LLP', 'bdo.co.uk']]) {
    assert.strictEqual(looksLikeTitle(n, d), false, n + ' must be admitted');
  }
});

test('EXP-3: every marketing certificate is still rejected, on its most favourable domain', () => {
  const certs = [
    ['Best Solicitors', 'bestsolicitors.co.uk'],          // the word IS in the stem; nothing else identifies a firm
    ['Best Legal Reviews', 'bestlegalreviews.co.uk'],     // two marketing words and no name
    ['Best Solicitors in Leeds', 'bhatiabest.co.uk'],     // in-city sign, unconditional
    ['Our Team', 'bhatiabest.co.uk'],
    ['About Us', 'bhatiabest.co.uk'],
    ['Pricing Plans', 'pricingplans.com'],
    ['News', 'news.co.uk'],
    ['Reviews', 'reviews.co.uk'],
    ['Conference & Event Venue in Leeds', 'thevenue.co.uk'],
    ['14 Independent Brands you need to know', 'brands.co.uk'],
    ['New Construction Homes for Sale in New York by Toll Brothers', 'tollbrothers.com'],
  ];
  for (const [n, d] of certs) assert.strictEqual(looksLikeTitle(n, d), true, n + ' must be rejected');
});

test('EXP-3: the domain argument is optional and omitting it changes nothing for old callers', () => {
  // A caller with no domain cannot corroborate, so it gets exactly the pre-fix answer.
  assert.strictEqual(looksLikeTitle('Bhatia Best Solicitors'), true);
  assert.strictEqual(looksLikeTitle('Slee Blackwell Solicitors'), false);
  assert.strictEqual(looksLikeTitle(''), true);
  assert.strictEqual(looksLikeTitle(null), true);
});

test('EXP-3: a marketing word in the stem does not license a heading lifted off the page', () => {
  // "Best Reviews" on bhatiabest.co.uk: 'best' is in the stem, but every remaining token is itself a marketing
  // word, so condition 2 fails and the candidate is still a title.
  assert.strictEqual(looksLikeTitle('Best Reviews', 'bhatiabest.co.uk'), true);
  assert.strictEqual(looksLikeTitle('Best News', 'bhatiabest.co.uk'), true);
});

console.log('EXP-3: ALL GREEN');
