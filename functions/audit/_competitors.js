// functions/audit/_competitors.js
// Competitor / aggregator hygiene, extracted whole from _adapter.js: the denylist, junk patterns,
// market-TLD guard and the three predicates that keep directories, OTAs and marketplaces out of the
// rendered peer set. Data + pure predicates only; no payload shaping happens here.

export const cleanDomain = (d) => String(d || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, '').trim();
// private minimal accessors (mirror the adapter's g()/arr(); local so this module stays leaf-level)
function _g(obj, path, def) {
  let cur = obj;
  for (const k of String(path).split('.')) { if (cur == null) return def; cur = cur[k]; }
  return cur == null ? def : cur;
}
const _arr = (v) => Array.isArray(v) ? v : [];

/* ---------------- competitor + keyword intelligence (REAL competitors, not directories/blogs) ---------------- */
export const COMPETITOR_DENYLIST = new Set([
  'google.com','bing.com','bing.co.uk','yahoo.com','duckduckgo.com','wikipedia.org','facebook.com','linkedin.com','instagram.com','twitter.com','x.com','youtube.com','pinterest.com','tiktok.com','reddit.com','quora.com','mumsnet.com','apple.com','amazon.com',
  'trustpilot.com','yelp.com','yelp.co.uk','yell.com','yell.co.uk','tripadvisor.com','tripadvisor.co.uk','glassdoor.com','glassdoor.co.uk','indeed.com','g2.com','clutch.co','goodfirms.co','expertise.com','threebestrated.co.uk','bark.com','checkatrade.com','which.co.uk','yellowpages.com','yellowpages.co.uk','justdial.com','thomsonlocal.com','freeindex.co.uk','hotfrog.co.uk','cylex-uk.co.uk','scoot.co.uk','192.com','topconsumerreviews.com','aeroleads.com','f6s.com','disfold.com','rankred.com','spocket.co','metricscart.com','merchantmachine.co.uk','ecommerceguide.com','homelight.com','findanyagent.ae','toppropertydevelopers.com','dentistsearch.co.uk',
  'legal500.com','chambers.com','chambersandpartners.com','chambersstudent.co.uk','reviewsolicitors.co.uk','lawsociety.org.uk','sra.org.uk','findlaw.com','lawyers.findlaw.com','justia.com','avvo.com','lawyers.com','lawfuel.com','bestlawfirms.com','law.usnews.com','bcgsearch.com','statebarattorneys.com','thelawyer.com','courtscast.com','lawzana.com','lawyersuae.ae','dubaimatic.com','dubaisbest.com','edarabia.com',
  'zocdoc.com','whatclinic.com','whatclinic.co.uk','doctify.com','topdoctors.co.uk','topdoctors.com','healthgrades.com','vitals.com','ratemds.com','opencare.com','theteledentists.com','treatwell.co.uk',
  'rightmove.co.uk','zoopla.co.uk','onthemarket.com','primelocation.com','zillow.com','realtor.com','realestate.usnews.com','dubaisells.com','bhomes.com','uniqueproperties.ae','propertyfinder.ae','bayut.com','dubizzle.com','homes.com','redfin.com','trulia.com','apartments.com','loopnet.com',
  'booking.com','expedia.com','hotels.com','opentable.com','luxuryhotel.guide','thehotelguru.com','bestofluxury.com','lastminute.com','agoda.com','trivago.com','trivago.co.uk','kayak.com','kayak.co.uk','skyscanner.net','airbnb.com','vrbo.com','hostelworld.com','laterooms.com','travelsupermarket.com',
  'forbes.com','timeout.com','robbreport.com','luxurylondon.co.uk','londontheinside.com','factmagazines.com','luxsphere.co','thegentlemansjournal.com','ceoreviewmagazine.com','bostoninsider.org','dubaiweek.ae','mr7.ae','investinreading.com','joyofcreating.org','safehome.org','propertysecurity.org','goodguardsecurity.com','cheyenne.org','gov.uk','nhs.uk',
  // additional news/magazine/listicle hosts whose stems dodge the token patterns (ibtimes != "times",
  // lawyermag != "magazine", bestinlondon has no separator after "best"). These co-rank by aggregating firms.
  'ibtimes.co.uk','ibtimes.com','lawyermag.co.uk','lawyermonthly.com','legalfutures.co.uk','bestinlondon.london','bestlondon.co.uk','citymatters.london','londonpost.news','thelondoneconomic.com','standard.co.uk','mirror.co.uk','dailymail.co.uk','telegraph.co.uk','independent.co.uk','metro.co.uk','huffingtonpost.co.uk',
  // tech/SaaS/software listicle, review-aggregator & roundup blogs that co-rank for "saas"/"software"
  // category terms by aggregating vendors (NOT real vendors themselves — real vendors are kept).
  'geekflare.com','g2crowd.com','capterra.com','getapp.com','softwareadvice.com','trustradius.com','techradar.com','pcmag.com','cnet.com','techcrunch.com','venturebeat.com','producthunt.com','saashub.com','slashdot.org','sourceforge.net','financesonline.com','softwaresuggest.com','selecthub.com',
  // listicle / magazine / no-name aggregator hosts the LLM surfaced as "leaders" whose stems dodge the token
  // patterns (no separator before the keyword). These co-rank by aggregating firms and must never be peers. (citations-junk)
  'topschoolguide.com','luxurycolumnist.com','britainsfinest.co.uk','retailgazette.co.uk','lawfuel.com','lawandlegal.co.uk','hrjforemanlaws.co.uk','robertsonmoss.com','counselindex.com','vault.com','thehotelguru.com','lhw.com',
  // fintech / banking & real-estate comparison + directory hosts that co-rank for the category but are NOT real
  // operating rivals (mirrors the engine per-sector blocklist; belt-and-braces for SERP-cache artifacts). (P7)
  'monito.com','pocketwise.co.uk','idobusiness.co.uk','comparebanks.co.uk','moneyfactscompare.co.uk','moneyfacts.co.uk','thebanks.eu','moneyzine.com','compareremit.com','bankofengland.co.uk','fca.org.uk',
  'agentseeker.co.uk','estateagentfinder.co.uk','britishproperty.uk','nethouseprices.com','mouseprice.com','startood.com',
  // e-commerce / retail PLATFORMS — tools a retailer is built ON, never a retail rival (the Gymshark fix). (E2b)
  'shopify.com','woocommerce.com','bigcommerce.com','magento.com','squarespace.com','wix.com','prestashop.com','wordpress.com','weebly.com','ecwid.com','bigcartel.com','volusion.com','godaddy.com',
  // 20-sector directory/platform/news hosts most likely to co-rank as false competitors (E4 mirror of the engine 20-sector blocklist)
  'realself.com','consultingroom.com','glowday.com','save-face.co.uk',
  'coinmarketcap.com','coingecko.com','etherscan.io','blockchain.com','cointelegraph.com','coindesk.com','messari.io','glassnode.com','cryptocompare.com','dappradar.com','defillama.com','cryptoslate.com','decrypt.co','bitcoinmagazine.com','coinjournal.net','cryptonews.com','invezz.com','coingabbar.com','tradingguide.co.uk','theinvestorscentre.co.uk','newsbtc.com','beincrypto.com','cryptopotato.com','ambcrypto.com','u.today','bitcoinist.com','blockworks.co','theblock.co','99bitcoins.com','benzinga.com','coinbureau.com','webopedia.com','investing.com','fool.com','datawallet.com','milkroad.com','techopedia.com','koinly.io','cointracker.io',
  'coursera.org','udemy.com','edx.org','khanacademy.org','greatschools.org','niche.com','qs.com','timeshighereducation.com','topuniversities.com','ratemyprofessors.com','whatuni.com','thecompleteuniversityguide.co.uk','studyportals.com',
  'autotrader.com','autotrader.co.uk','edmunds.com','cars.com','carvana.com','vroom.com','kbb.com','carfax.com','truecar.com','whatcar.com','carwow.co.uk','parkers.co.uk','heycar.co.uk','motors.co.uk','cinch.co.uk','honestjohn.co.uk','mobile.de','autoscout24.de',
  'viator.com','getyourguide.com','klook.com','musement.com','tripadvisor.co.uk','lonelyplanet.com','loveholidays.com','secretescapes.com','civitatis.com',
  'clutch.co','upwork.com','goodfirms.co','toptal.com','fiverr.com','designrush.com','sortlist.com','manta.com','thumbtack.com',
  'labdoor.com','supplementreviews.com','examine.com','iherb.com','leafly.com','weedmaps.com','cbdoracle.com',
  'energysage.com','solarreviews.com','cleanenergyreviews.info','pv-magazine.com','rechargenews.com','energysavingtrust.org.uk',
  'rover.com','care.com','vetster.com','petmd.com','vethelpdirect.com','find-a-vet.co.uk','thedodo.com',
  'treatwell.com','treatwell.co.uk','mindbody.com','classpass.com','fresha.com','booksy.com','wahanda.com','spafinder.com',
  'muckrack.com','about.me','crunchbase.com','pitchbook.com',
]);
export const JUNK_PATTERNS = [
  /(^|\.)wikipedia\.org$/i, /(^|\.)(facebook|linkedin|youtube|instagram|tiktok|x)\.com$/i, /(^|\.)google\./i, /\.gov(\.[a-z]{2})?$/i, /(^|\.)nhs\.uk$/i,
  /(^|[.\-])(directory|directories|reviews?|rated|ranking|rankings|listings?|compare|comparison)([.\-]|$)/i,
  /(^|[.\-])(finder|locator|nearby|near-?me)([.\-]|$)/i,
  /(^|[.\-])(best|top|top-?\d+|leading|guide|guides|hub|portal|insider)([.\-]|$)/i,
  /(^|[.\-])(magazine|magazines|news|times|weekly|daily|journal|gazette|press|blog|wiki)([.\-]|$)/i,
  /(^|[.\-])(marketplace|aggregat|leadgen|lead-?gen)([.\-]|$)/i,
];
// Directory/listicle signal at the START of the registrable stem with NO trailing separator — e.g. reviewbritain.com,
// directorylaw.co.uk, comparethefirm.com, top10lawyers.com. The token-bounded JUNK_PATTERNS miss these because the
// keyword runs straight into the next word. Conservative set (clear directory verbs only) so real brands are kept.
const STEM_JUNK_RX = /^(reviews?|directory|directories|compare|comparison|rated|ranking|rankings|listings?|top\d+|bestrated|bestof|find(a|an|my)|nearme|nearby)/i;
const parentDomain = (host) => { const p = String(host).split('.'); return p.length > 2 ? p.slice(-2).join('.') : host; };
const MARKET_TLD = { UK: ['co.uk', 'uk', 'org.uk'], GB: ['co.uk', 'uk', 'org.uk'], US: ['com', 'us'], USA: ['com', 'us'], UAE: ['ae', 'com'], AE: ['ae', 'com'], SA: ['sa', 'com'], KSA: ['sa', 'com'], QA: ['qa', 'com'] };
// One membrane rule per predicate (flat; same resolution order as the previous inline chain).
const deniedHost = (host) => COMPETITOR_DENYLIST.has(host) || COMPETITOR_DENYLIST.has(parentDomain(host));
const junkHost = (host) => JUNK_PATTERNS.some((rx) => rx.test(host)) || STEM_JUNK_RX.test(parentDomain(host).split('.')[0]);
// strong directory/comparison SUBSTRING signal anywhere in the registrable label (catches comparebanks,
// moneyfactscompare, agentseeker, estateagentfinder that the token-bounded patterns miss). (P7)
const DIRECTORY_STEM_RX = /compare|comparison|finder|seeker|directory|listings?|whatclinic|bestbanks?|whichbank|ratemy|news|magazine|gazette|herald|tribune/;
const directoryStem = (host) => DIRECTORY_STEM_RX.test(host.split('.')[0].replace(/[^a-z0-9]/g, ''));
function wrongMarketTld(host, firmMarket) {
  const allowed = MARKET_TLD[String(firmMarket || '').toUpperCase()];
  if (!allowed) return false;
  const tld1 = host.split('.').pop();
  const tld2 = host.split('.').slice(-2).join('.');
  if (!/^(ae|sa|qa|in|de|fr|it|es|ca|au)$/i.test(tld1)) return false;
  return !allowed.includes(tld1) && !allowed.includes(tld2);
}
const hostShapeOk = (host) => Boolean(host) && host.includes('.');
const EXCLUDED_HOST_RULES = [deniedHost, junkHost, directoryStem];
export function isRealCompetitor(domain, firmMarket) {
  const host = cleanDomain(domain).toLowerCase();
  if (!hostShapeOk(host)) return false;
  if (EXCLUDED_HOST_RULES.some((excluded) => excluded(host))) return false;
  return !wrongMarketTld(host, firmMarket);
}
export function corroborated(host, payload) {
  host = cleanDomain(host).toLowerCase();
  const cb = _arr(_g(payload, 'competitive_benchmark.competitors', []));
  const ai = _arr(_g(payload, 'ai_citation.competitors', []));
  const auth = _arr(_g(payload, 'authority.ranked', []));
  const n = [cb.some((c) => cleanDomain(c.domain).toLowerCase() === host), ai.some((c) => cleanDomain(c.domain).toLowerCase() === host), auth.some((r) => cleanDomain(r.domain).toLowerCase() === host)].filter(Boolean).length;
  const dr10 = ((auth.find((r) => cleanDomain(r.domain).toLowerCase() === host) || {}).dr || 0) * 10;
  return n >= 2 || dr10 >= 20;
}
// Aggregator check that also works on firm NAMES (not just domains), drops OTA / directory / marketplace
// brands the LLM sometimes names as "competitors" (Booking.com for a hotel, Amazon for a sofa maker), which
// must never appear in the rendered peer set. (S-aggname)
const AGG_BRANDS = new Set(['booking', 'expedia', 'hotels', 'agoda', 'trivago', 'kayak', 'tripadvisor', 'trustpilot', 'yelp', 'glassdoor', 'indeed', 'forbes', 'timeout', 'findlaw', 'justia', 'bestlawfirms', 'lawyers', 'avvo', 'zocdoc', 'healthgrades', 'rightmove', 'zoopla', 'onthemarket', 'zillow', 'realtor', 'amazon', 'ebay', 'etsy', 'aliexpress', 'walmart', 'yell', 'thomson', 'clutch', 'g2', 'capterra', 'wikipedia', 'reddit']);
const junkOrDeniedHost = (h) => deniedHost(h) || junkHost(h);
const firstBrandWord = (name) => String(name || '').toLowerCase().replace(/[^a-z0-9 .]/g, '').split(/[ .]/)[0];
export function looksAggregator(name) {
  const h = cleanDomain(name).toLowerCase();
  if (h.includes('.') && junkOrDeniedHost(h)) return true;
  return AGG_BRANDS.has(firstBrandWord(name));
}
