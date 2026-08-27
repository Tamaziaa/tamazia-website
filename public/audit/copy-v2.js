/* ============================================================
   TAMAZIA AUDIT · COPY-v2 — every prose string on the report.
   REPORT-SPEC N5: no prose literals inside render logic.
   Rules applied to every entry below:
     W1  explainer <= 1 sentence, target <= 12 words
     W2  the 28-row rewrite table (C §8) + R4's 6 rewrites
     W5  BPMMR 2008 + CAP 3.7 (never state an unmeasured finding as fact)
         + CAP 4.2 (no undue fear) + DMCCA Sch 20 (no fake urgency)
     W6  time-sensitive comparatives live in a dated footnote
     N4  UK spelling, no em dashes, evidence over fear
   Anything count-dependent is a FUNCTION taking the count, so plur() runs
   at the call site and "All 1 finding" can never ship (P6 / R4 rule 9).

   CONFUSION-LEDGER pass (2026-07-29). The grammar rules that close whole
   classes rather than single strings are enforced here:
     G1  one name per thing        -> COPY.sections is the ONLY section name source
     G2  one count vocabulary      -> framework · obligation · breach · finding ·
                                      failing element. "rule", "issue", "gap" and
                                      "check" are banned as COUNT nouns.
     G4  every money figure carries one of three basis labels
     G5  one money format          -> TZTEXT.norm
     G6  one date format           -> TZTEXT.norm
     G8  unmeasured never renders as zero or as a clean state
     G9  a heading never asserts what its body denies -> the *NA twins below
     G14 no engine internals reach the reader -> TZTEXT.norm
     G15 abbreviations expanded at first use
     G17 UK spelling enforced at the render chokepoint -> TZTEXT.norm
     G19 a CTA says the outcome, not the mechanism
     G22 name the actor
   ============================================================ */
(function(){
  const plur = (n,s,p)=> n===1 ? s : (p||s+'s');
  const pron = (n,s,p)=> n===1 ? (s||'it') : (p||'them');

  /* ------------------------------------------------------------------
     TZTEXT — the ONE display normaliser. Every data-sourced string that
     reaches the DOM passes through it (audit-app-v2 escH / audit-charts-v2
     esc), so a format defect is fixed once rather than at 200 call sites.
     It never invents a value: it only re-renders one the engine supplied.
     ------------------------------------------------------------------ */
  const MONTHS = ['January','February','March','April','May','June','July',
                  'August','September','October','November','December'];

  // whole-string URLs, paths, mail links and CSS selectors are NEVER normalised:
  // a date rewrite inside an href would break the link (G6 must not eat a URL).
  const OPAQUE = /^(?:https?:\/\/|mailto:|tel:|data:|\/|#|\.{0,2}\/)\S*$/i;

  const ENTITIES = {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'","#39":"'",nbsp:' ',
    rsquo:'’',lsquo:'‘',ldquo:'“',rdquo:'”',
    middot:'·',hellip:'…',ndash:'–',mdash:'—'};

  // CONF-112 / P021: the payload already holds "&lt;title&gt;". Decode ONCE here so the
  // render escapes ONCE and the reader sees <title>, never a literal "&lt;".
  function decodeOnce(s){
    return String(s).replace(/&(amp|lt|gt|quot|apos|#39|nbsp|rsquo|lsquo|ldquo|rdquo|middot|hellip|ndash|mdash);/gi,
      (m,k)=> ENTITIES[String(k).toLowerCase()] || m);
  }

  /* G14 · engine internals never reach a buyer. */
  function stripInternals(t){
    return t
      .replace(/`/g,'')                                                   // CONF-113 markdown backticks
      .replace(/\s*[-,;(]?\s*see\s+excluded_when\s*\)?/gi,'')             // CONF-158 raw field name
      .replace(/\(\s*universal-conditional\s+([^)]*)\)/gi,'($1)')         // CONF-157 taxonomy token
      .replace(/\s*\(\s*universal-conditional\s*\)/gi,'')
      .replace(/\badvisory:\s*/g,'Advisory: ')                            // CONF-159 confidence marker
      .replace(/\bdescendents\b/gi,'descendants')                         // CONF-114 shipped misspelling
      .replace(/\baxe-core\b/gi,'an automated accessibility scanner')     // CONF-127 tool name
      .replace(/\bDOM\b/g,'rendered pages')                               // CONF-154 developer noun
      .replace(/\bn\/a\b/gi,'not assessed')                              // CONF-016 banned absence marker
      .replace(/\bOG\b/g,'Open Graph')                                    // CONF-152 abbreviation
      .replace(/\bWCAG (\d\.\d) SC /g,'WCAG $1 success criterion ');     // CONF-143 abbreviation
  }

  /* G17 · UK spelling. "Organization" keeps its capital O (the schema.org type name). */
  function ukSpelling(t){
    return t
      .replace(/\bcolors\b/g,'colours').replace(/\bColors\b/g,'Colours')
      .replace(/\bcolor\b/g,'colour').replace(/\bColor\b/g,'Colour')
      .replace(/\bauthorization\b/g,'authorisation').replace(/\bAuthorization\b/g,'Authorisation')
      .replace(/\bunauthorized\b/g,'unauthorised').replace(/\bUnauthorized\b/g,'Unauthorised')
      .replace(/\bauthorized\b/g,'authorised')
      .replace(/\bminimize\b/g,'minimise').replace(/\bMinimize\b/g,'Minimise')
      .replace(/\borganization\b/g,'organisation')
      .replace(/\boptimize\b/g,'optimise').replace(/\bOptimize\b/g,'Optimise')
      .replace(/\bcenter\b/g,'centre');
  }

  /* G5 · one money format. Word-form currency codes become symbols; magnitudes lowercase. */
  function moneyForm(t){
    return t
      .replace(/\bGBP\s+(?=[\d£])/g,'£')
      .replace(/\bUSD\s+(?=[\d$])/g,'$')
      .replace(/\bEUR\s+(?=[\d€])/g,'€')
      .replace(/(\d)\s*M\b/g,'$1m')
      .replace(/(\d)\s*BN\b/gi,'$1bn')
      .replace(/(\d)\s*K\b/g,'$1k');
  }

  /* G6 · one date format: 20 November 2025 · November 2025. No ISO dates in visible text. */
  function dateForm(t){
    return t
      .replace(/\b(19|20)(\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/g,
        (m,c,y,mo,d)=> String(+d)+' '+MONTHS[+mo-1]+' '+c+y)
      .replace(/\b(19|20)(\d{2})-(0[1-9]|1[0-2])\b/g,
        (m,c,y,mo)=> MONTHS[+mo-1]+' '+c+y);
  }

  /* G7 · one unit per metric, no space before it. G20 · "to" in prose ranges. */
  function unitForm(t){
    return t
      .replace(/\bEst\.?\s+savings?\s+of\s+/gi,'Estimated saving: ')   // CONF-051 / CONF-128
      .replace(/\bKiB\b/g,'KB')                                        // CONF-073 base-10
      .replace(/(\d)\s+(ms|s|KB|MB)\b/g,'$1$2')                        // CONF-116 unit spacing
      .replace(/([£$€])([\d,.]+)\s*-\s*([£$€])?([\d,.]+)/g,'$1$2 to $3$4'); // CONF-104
  }

  /* N2 · legacy payload prose carries the banned "400+" register claim. */
  function claimFix(t){
    return t
      .replace(/\b400\+\s*rule\s+compliance\s+database\b/gi,'full compliance rule register')
      .replace(/\b400\+\s*rule\b/gi,'full-register rule')
      .replace(/\b400\+\s*(compliance\s+)?frameworks?\b/gi,'full framework register');
  }

  /* G22 · CONF-218 / 219 · the two payload sentences that hide their actor. */
  const ACTIVE_VOICE = [
    [/Frameworks from every other region are screened but do not attach here/gi,
     'Tamazia screens frameworks from every other region; they do not attach here'],
    [/Every finding on this page was re-examined against the text of the statute it cites, and each one was upheld on the evidence quoted/gi,
     'Tamazia’s adjudication layer re-examined every finding against the statute it cites and upheld each one on the evidence quoted'],
  ];
  function activeVoice(t){ for(const [re,sub] of ACTIVE_VOICE) t=t.replace(re,sub); return t; }

  function normPart(t){
    t = activeVoice(t);
    t = t.replace(/(\d)\s*\u2197\s*/g,'$1 \u2192 ');   // CONF-040 · growth is \u2192, never \u2197
    t = stripInternals(t);
    t = claimFix(t);
    t = ukSpelling(t);
    t = moneyForm(t);
    t = dateForm(t);
    t = unitForm(t);
    t = t.replace(/([^.])\.\.(?!\.)/g,'$1.');        // CONF-108 double full stop
    return t;
  }

  function norm(v){
    let s = String(v==null?'':v);
    if(!s) return s;
    if(OPAQUE.test(s.trim())) return s;              // href / src / selector: leave untouched
    s = decodeOnce(s);
    // keep any inline URL out of the normaliser's reach
    return s.split(/(https?:\/\/\S+)/g)
      .map((part,i)=> (i%2===1) ? part : normPart(part))
      .join('');
  }

  /* CONF-021…025 / 141 / 142 · one plain-English title per Lighthouse audit id, in UK
     spelling. The raw id and the console-speak title never reach a managing partner. */
  const PSI_TITLES = {
    'interactive':'The page is slow to become usable',
    'speed-index':'Content takes too long to fill the screen',
    'target-size':'Tap targets are too small or too close together',
    'color-contrast':'Text and background colours fail the contrast minimum',
    'link-text':'Link text is generic, such as “click here”',
    'link-name':'Links have no name a screen reader can read',
    'skip-link':'There is no skip link to the main content',
    'select-name':'Form menus have no label a screen reader can read',
    'heading-order':'Headings run out of order',
    'landmark-one-main':'The page has no main landmark',
    'aria-hidden-focus':'Hidden elements can still be focused',
    'unsized-images':'Images have no width and height, so the layout jumps',
    'errors-in-console':'The page logs errors in the browser console',
    'bootup-time':'Scripts take too long to start up',
    'mainthread-work-breakdown':'The browser is busy too long to respond',
    'max-potential-fid':'The worst-case delay before the page responds',
    'legacy-javascript-insight':'Outdated JavaScript is shipped to modern browsers',
    'legacy-javascript':'Outdated JavaScript is shipped to modern browsers',
    'render-blocking-insight':'Files block the page from painting',
    'render-blocking-resources':'Files block the page from painting',
    'lcp-breakdown-insight':'The main content takes too long to appear',
    'lcp-lazy-loaded':'The main image is lazy loaded, so it appears late',
    'prioritize-lcp-image':'The main image is not requested early enough',
    'unused-css-rules':'Unused stylesheet code is downloaded',
    'unused-javascript':'Unused JavaScript is downloaded',
    'total-blocking-time':'The page is frozen while scripts run',
    'first-contentful-paint':'The first content appears too slowly',
    'largest-contentful-paint':'The main content appears too slowly',
    'cumulative-layout-shift':'Content moves around as the page loads',
    'server-response-time':'Your server answers the first request too slowly',
    'uses-responsive-images':'Images are larger than they are displayed',
    'modern-image-formats':'Images are not served in a modern format',
    'efficient-animated-content':'Animated content is heavier than it needs to be',
    'uses-text-compression':'Text files are sent without compression',
    'duplicated-javascript':'The same JavaScript is shipped more than once',
  };

  /* CONF-044 / 008 / 010 · one name per metric, applied to engine-authored labels. */
  const LABEL_KIND = { 'law':'The rule', 'signal':'The signal', 'rule':'The rule' };

  const TERM_FIX = [
    [/^Authority\s*&\s*backlinks$/i,'Backlink authority'],
    [/\bDA\b/g,'Domain rating'],
    [/\bidentity anchors\b/gi,'entity signals'],
  ];
  function termFix(s){
    let t=String(s==null?'':s);
    for(const [re,sub] of TERM_FIX) t=t.replace(re,sub);
    return t;
  }

  const COPY = {
    /* ---- G1 · the ONE section-name source. railNav, SECT and SUMM all read it. ---- */
    sections: {
      overview:    'Overview',
      seo:         'SEO & technical',
      geo:         'AI & GEO',
      regulatory:  'Regulatory exposure',
      competitors: 'Competitors',
      plan:        'Plan & pricing',
    },

    /* ---- G8 · the ONLY two absence strings (N1, R1-R18) ---- */
    notAssessed:      'Not assessed on this scan.',
    notAssessedShort: 'not assessed',
    notAssessedChip:  'Not assessed',
    statusWords: { fail:'Fail', warn:'Needs work', pass:'Pass', na:'Not assessed' },
    // CONF-252 · a MEASURED absence on a legacy payload, worded so it cannot be mistaken
    // for "we did not look".
    noneFound:        'None found on the pages we scanned',
    // CONF-253 · one sentence, no comma splice, "scan" vocabulary (CONF-031)
    notReachable:     'Not assessed. We could not reach your site on this scan.',

    /* ---- rail (L2) ---- */
    reportName:    'The Exposure Report',
    // C §8 row 1 · was "Walk the report through in 20 minutes with the founder"
    ctaRail:       'Book a 20 minute review ↗',
    // CONF-054 · the gauge states its own scale, next to the number
    scoreScale:    'Tamazia compliance and visibility score, 0 to 100',
    // CONF-211 · no assessed dimension means no score. Never a grade computed from nothing.
    notScoredChip: 'Not scored',
    notScoredLine: 'Not scored on this scan.',
    notScoredWhy:  'No dimension could be measured on your live site, so no score is claimed.',
    // C §8 row 8 · was a 171-character paragraph in the rail
    exposureLabel:      'Median enforcement exposure',
    exposureLabelNoFine:'Ranking and AI visibility cost',
    // the detail that used to sit in the rail now sits on the tooltip (C §10)
    exposureTip:   'Ceilings in the statute’s own currency, unconverted. Not a prediction of enforcement.',
    screenedFallback: 'Screened the catalogue',
    bindYou:       (n)=> n+' '+plur(n,'framework','frameworks')+' bind'+(n===1?'s':'')+' you',
    checkedOnPages:(n)=> n+' checked on your pages',
    preparedBy:    'Aman Pareek, LLM · King’s College London',
    // CONF-055 / 086 / 087 · "rule checks" is a unit nobody recognises and it disagreed with the
    // framework count beside it. One vocabulary, one unit: obligations.
    rulesLine:     ()=> 'Every fix is checked against the obligations that bind you',

    /* ---- verdict (A2, R1) ---- */
    verdictEyebrow: 'The verdict',
    verdictWhat:    (co)=> 'A live audit of '+co+' across regulation, search and AI visibility.',
    verdictHeadline:(n)=> n+' '+plur(n,'breach','breaches')+' evidenced on your live site.',
    verdictClean:   'No statutory breach surfaced this scan.',
    // CONF-224 · name the actor, drop "no pass is implied"
    verdictBlocked: 'Your site blocked a deep compliance read, so we are not saying your site passes.',
    verdictStand:   (n)=> n+' '+plur(n,'framework','frameworks')+' legally bind'+(n===1?'s':'')+' you.',
    verdictKeep:    'Re-run monthly so a new breach is caught the day it appears.',
    instanceLine:   (breaches,inst,total)=> breaches+' '+plur(breaches,'breach','breaches')+' · '+inst+' failing '+plur(inst,'element','elements')+((total&&total>breaches)?(' · '+total+' '+plur(total,'finding')+' in total'):''),
    labelWhat:'What this is', labelHeadline:'The headline', labelStand:'Where you stand',
    labelRead:'How to read it', labelKeep:'Keep it current',
    // R4 rewrite (c) · was "Open any of the six sections below. Each box opens in place, with..."
    verdictRead: 'Evidence on the left. The fix on the right.',
    // CONF-210 · on a clean scan the foot must not point at "the gaps below"
    verdictGapsLine: 'The gaps below cost rankings, buyers and AI visibility.',
    verdictNoGaps:   'Nothing below is a breach. The items are ranking and visibility gaps.',

    /* ---- priority-breach trio (T2, T4, W7) ---- */
    priorityBreach: 'Priority breach',
    // CONF-175 · the header may only say "breaches" when every card IS a breach.
    trioHeader:  (n)=> 'Your '+n+' highest-priority '+plur(n,'breach','breaches')+', fix '+plur(n,'this','these')+' first',
    trioHeaderMixed:(n)=> 'Your '+n+' highest-priority '+plur(n,'finding')+', fix '+plur(n,'this','these')+' first',
    // CONF-078 · the trio shows a subset of the total; say so rather than letting two totals disagree
    trioSubset:  (shown,total,allBreached)=> 'Your top '+shown+' of '+total+' '+(allBreached?plur(total,'breach','breaches'):plur(total,'finding'))+', fix '+plur(shown,'this','these')+' first',
    trioNone:    'No breach was evidenced on your live site this scan.',
    tamaziaFix:  'Tamazia fix',
    // CONF-014 / 056 · one name for this number, everywhere
    maxPenalty:  'Statutory ceiling',
    // CONF-057 · "typical" and "max" are opposites; G4 allows exactly three basis labels
    typicalBand: 'Typical enforcement band',
    untitledFinding: 'Finding',
    fixHint:     'Tamazia fix ›',

    /* ---- regulatory (R1-R5, C §8 rows 9-12) ---- */
    regEyebrow:  'Regulatory exposure',
    // CONF-013 / G4 · exactly three basis labels for a money figure exist, and these are two of them
    regMedian:   'Median enforcement exposure',
    regCeiling:  'Statutory ceiling',
    regBinding:  (n)=> plur(n,'framework binds you','frameworks bind you'),
    // CONF-081 · the bridge sentence that stops £61k and £31k reading as a contradiction
    regBandBridge:(ceiling,median)=> ceiling+' is the legal maximum. '+median+' is the median of what regulators actually levy.',
    // CONF-244 · the median needs a pointer to what it is a median of
    regMedianBasis:'Median of the published enforcement outcomes recorded for these frameworks.',
    // C §8 row 9 · was a 197-character triple restatement
    regLede:     (breached,binding)=> breached+' '+plur(breached,'obligation','obligations')+' '+plur(breached,'is','are')+' breached on your live site. '+binding+' further '+plur(binding,'framework binds','frameworks bind')+' you.',
    regLedeClean:(binding)=> 'No obligation is breached on your live site. '+binding+' '+plur(binding,'framework binds','frameworks bind')+' you.',
    // CONF-084 / 085 · one sentence that reconciles the band count with the lede count
    regLedeOfTotal:(breached,total,rest)=> breached+' of the '+total+' '+plur(total,'framework')+' that bind you '+plur(breached,'is','are')+' breached. The other '+rest+' '+plur(rest,'is','are')+' clean on this scan.',
    // C §8 row 12
    registersSub:'Pulled by API from the official registers. Verify each on the source.',
    registersHead:'Registered reality: your public register record, checked',
    // CONF-249 / 250 · a framework with no exposure is not "carrying your exposure"
    fwListHead:  (n)=> 'The '+n+' '+plur(n,'framework','frameworks')+' that bind you, highest exposure first',
    // CONF-227 · stated ONCE above the list, not appended to twenty cards
    fwBindingPreamble:'Every framework below legally binds you. The obligations under each are the controls you must be able to demonstrate.',
    breachesHead:'The breaches on your live site, and the Tamazia fix for each',
    whereLabel:  'Where',
    pageLabel:   'Page',
    // CONF-045 · "Element" also labels a node count in PSI evidence; this slot is a location
    elementLabel:'Element on the page',
    regNoFine:   'no monetary ceiling',
    // CONF-034 · "APPLIES · ASSESSED" is internal shorthand
    bindsYouBadge:'Binds you',
    // CONF-167 / 168 / 229 / 230 · a label promises the content type it delivers, and no
    // template may build a sentence by inlining a multi-clause regulator string.
    fwRequiresLabel:'What this framework requires',
    fwQuestionLabel:'What the regulator will ask',
    fwAssessedLabel:'What is assessed',
    fwAssessedBy:   'Assessed by',
    fwFocusLabel:   'What the regulator will ask you',
    fwEnforcement:  'Recent enforcement',
    fwGuidance:     'Recent regulatory change',
    fwLawLabel:     'The law',
    fwLawLink:      'Read the statute ↗',

    /* ---- SEO (S1-S5, C §8 rows 13-14) ---- */
    seoEyebrow:  'Search and AI both read these signals',
    // C §8 row 13 · was 230 characters
    seoLede:     'Measured live on your site. Each signal is a buyer a rival is capturing.',
    // C §8 row 14
    seoSub:      'On-page, technical and security signals.',
    // CONF-047 · "page one" collides with "Page" meaning a URL
    seoHeadline: (off,total)=> 'Outside the top 10 for '+off+' of '+total+' high-intent '+plur(total,'search','searches')+' your buyers are typing.',
    seoHeadlineTech:'The technical signals below decide who the answer engines surface.',
    // G9 · when nothing was measured the heading degrades with the body
    seoHeadNA:   'Search and technical signals were not assessed on this scan.',
    // CONF-162 · the heading may only claim a measurement the body carries
    psiHead:     'Google PageSpeed, measured live on your rendered pages.',
    psiHeadNA:   'Google PageSpeed',
    psiNA:       'PageSpeed was not assessed on this scan.',
    psiMobile:   'Mobile', psiDesktop:'Desktop',
    // CONF-166 · say WHICH signal is unassessed
    perfChipNA:  'PageSpeed not assessed',
    cwvHead:     'Core Web Vitals',
    cwvFailing:  (f,t)=> f+' of '+t+' failing',
    psiAuditsHead:'Failing audits on your live pages',
    // CONF-046 · "Evidence" is reserved for the quote block; provenance says who measured it
    psiMeasuredBy:'Measured by Google PageSpeed',
    psiNodes:    (n)=> n+' '+plur(n,'element')+' affected',
    techHead:    'Tech & tracking',
    techNA:      'Not assessed on this scan',
    keywordsHead:'Keyword demand a rival is capturing',
    keywordsHeadNA:'Keyword demand',
    keywordsNA:  'Keyword positions were not assessed on this scan.',
    keywordsPageOne:'in the top 10 today',
    // R4 rewrite (f) · was the three-sentence "near me" panel
    nearMeTitle: 'Local searches are not your battleground.',
    nearMeBody:  'Your buyers compare firms nationally, not by postcode.',
    onpageHead:  'On-page issues',
    securityHead:'Security headers',
    // CONF-266 · one phrasing of the enterprise-review claim, in one place
    securitySub: 'Each missing header is a red flag in enterprise review.',
    volumeCol:   'Volume', intentCol:'Intent',

    /* ---- GEO (G1-G3) ---- */
    geoEyebrow:  'When your buyers ask AI',
    modelled:    'modelled estimate',
    modelledTip: 'Derived from your live entity signals, not from a probe of each engine. A real probe replaces it when wired.',
    // CONF-160 · a persistent provenance line, so a reader can tell measured from modelled
    geoProvenance:(modelled)=> modelled
      ? 'Structured data, schema and entity signals are measured on your live site. Per-engine grades are modelled, not probed.'
      : 'Structured data, schema, entity signals and per-engine citation are all measured on your live site.',
    // CONF-179 / 214 · a modelled answer is not an answer
    geoCiteQ:    'Do AI engines cite you?',
    geoCiteQModelled:'Are AI engines likely to cite you?',
    engineCiting:'Citing you', engineNotCiting:'Not citing you',
    engineLikely:'Likely to cite', engineUnlikely:'Unlikely to cite',
    // CONF-212 · the engine grid uses its own alphabet, so it prints its own key
    engineGradeKey:'Readiness graded A to E. A is strongest.',
    notAssessedCell:'Not assessed',
    geoCiteHead: 'Who AI names instead of you',
    geoCiteHeadNA:'AI citations',
    geoFixHead:  'The fix, in full',
    // CONF-070 / 156 / 245 · no abstract noun, and the sample size is on the face
    repeatLine:  (named,runs)=> 'Asked '+runs+' '+plur(runs,'time')+'. Named '+named+' '+plur(named,'time')+'.',
    // CONF-010 · one name for the construct
    entityStat:  'Entity readiness',
    // CONF-068 · the threshold is stated where the number is
    entityChip:  (v)=> 'Entity readiness '+v+' / 100',
    sovStat:     'Share of voice',
    // CONF-009 / 137 · expanded at first use, abbreviated after
    sovChip:     (v)=> 'Share of voice '+v,
    schemaHead:  'Structured-data gaps',
    schemaMeta:  'what AI reads first',
    sourceHead:  'Authority sources you are absent from',
    sourceMeta:  'source gap',
    aiVisHead:   'AI visibility',
    aiVisMeta:   '6 signals',
    // CONF-255 · one phrasing of "you are absent", per surface
    notRanking:  'Not ranking', notNamed:'Not named',

    /* ---- competitors (C1, C2, C §8 row 15) ---- */
    cmpEyebrow:  'The firms being chosen over you',
    // G9 · the eyebrow cannot assert rivals are winning when nothing was checked
    cmpEyebrowNA:'Competitors',
    // C §8 row 15 · was 250 characters
    cmpLede:     'Real rivals ranked ahead of you, and the one gap that decides each.',
    // C2 · replaces "Your category was mis-classified upstream, competitor set is being re-probed"
    cmpNA:       'Competitor set not assessed on this scan.',
    cmpHead:     'Head-to-head',
    cmpBeatHead: 'How you beat each of them, rival by rival',
    cmpAhead:    (n)=> n+' '+plur(n,'rival','rivals')+' ahead',
    // CONF-012 · one label for "what we do about it"
    cmpBeatLabel:'Tamazia fix · how you beat them',
    cmpLever:    'Tamazia lever',
    // CONF-008 / 074 / 138 · one name, one scale statement
    drHead:      'Domain rating vs rivals',
    drMeta:      'Domain rating, 0 to 100, higher is stronger',
    drChip:      (you,best)=> 'Domain rating '+you+' vs '+best,
    drChipSolo:  (you)=> 'Domain rating '+you,
    sovHead:     'AI share of voice',
    sovMeta:     (n)=> 'real probe · '+n+' '+plur(n,'run'),
    estimatedTag:'estimated',
    estimatedTip:'Estimated from authority signals. This rival publishes no domain rating.',

    /* ---- overview ---- */
    ovMetrics:   'Every metric behind your score, visualised.',
    ovSeverity:  'Findings by severity',
    // CONF-182 · "v." was unparseable
    ovConfirmed: (n)=> n+' confirmed against live evidence',
    ovExposure:  (v)=> 'How your '+v+' exposure is calculated',
    ovExposureNone:'Exposure breakdown',
    ovNoExposure:'No statutory exposure confirmed this scan.',
    ovCausal:    (co)=> 'Why AI cannot see '+co,
    ovCausalOk:  'Your entity signals are largely present.',
    ovJurisdiction:'Jurisdiction that governs you',
    ovScoring:   (s)=> 'How your '+s+'/100 is calculated',
    ovScoringNA: 'How the score is calculated',
    ovTrajectory:'Where Tamazia takes you',
    // CONF-183 · the meta and the caption must agree: this is a model, not prior results
    ovTrajectoryMeta:'projected from this report’s fix plan',
    ovTrajectoryNA:'A trajectory needs a measured starting score, so none is projected on this scan.',
    ovAdjudication:(n)=> n+' '+plur(n,'finding','findings')+' re-examined against the statute',
    // CONF-139 · "dims" is not a word a buyer knows
    dimsChip:    (fail,total)=> fail+' of '+total+' dimensions failing',
    // CONF-216 · say that the sentence is a scoring rule, not a finding
    whyZero:     'Why 0:',
    // CONF-042 · "Critical" is already a severity word; an F band is Failing
    bandCritical:'Failing',

    /* ---- plan and pricing (P1-P6, C §8 rows 17, 23-27) ----
       PRICING DIET (founder 2026-07-28 20:57 "the pricing panel has so much text"):
       every block below is 1-2 lines. Meaning is preserved, and so is the arc
       W8 demands: real problem -> urgency -> opportunity -> action. Each route
       ends in its own CTA, so the diet never removes the ask. Substantiation that
       a compressed line cannot carry (SCCO provenance, the strike basis, the Watch
       scope limit) moves behind a <details>, never off the page (W6 / P5). */
    planEyebrow: 'Three ways forward',
    // CONF-217 · a count of one takes a singular pronoun
    planHead:    (crit)=> crit+' Critical '+plur(crit,'finding')+' on your live site today. Three ways to close '+pron(crit)+', and the trajectory once you do.',
    planHeadClean:'Three ways to close your highest-severity gaps, and the trajectory once you do.',
    // C §8 row 17 · CONF-225 names the owner of the work
    pricingNotes:'90-day rolling. No lock-in. You own the work outright. Legally reviewed.',
    // P057 · the chart, its axis and .traj-pts already print today/wk12/wk24. The meta line
    // restated all three a fourth time AND went stale on tier hover (morphTrajectory never
    // updated it), so it is now the interaction hint alone.
    trajHint:    'Hover a tier to see it lift.',
    // C §8 row 23 · headline out of the card, provenance into a dated footnote (W6, R4 (e))
    // CONF-059 · the hours figure is a worked example and now says so on its face.
    sccoHeadline:(hrs,rate,total)=> 'A '+hrs+' hour counsel review at '+rate+'/hr is '+total+' in fee-earner time.',
    sccoSummary: 'How this comparison is costed',
    // CONF-133 / 134 · SCCO and Grade A expanded at first use
    sccoDetail:  (rate,band,date,total,hrs)=> 'Costed against the Senior Courts Costs Office (SCCO) guideline hourly rate for the most senior solicitor band (Grade A), '+band+', in force '+date+': '+rate+'/hr. The '+hrs+' hour figure is a worked example of a review of this scope, not a quotation, and comes to '+total+' in fee-earner time. The Senior Courts Costs Office reviews these rates annually.',
    // Route 1 · was 3 sentences of foot copy, then a 24-word first-engagement paragraph that
    // simply restated the struck price beside it, then a 2-sentence credit paragraph.
    sprintFoot:  'Delivery is contractual. The Sprint clears today’s backlog; Watch, below, covers tomorrow.',
    // CONF-270 · "unlock" means opening the locked report and nothing else
    firstEngagement:(std,off)=> 'Standard fee '+std+'. This report discounts it to '+off+' on a first engagement.',
    // Split in two: the "covers your first Foundation month" claim is only TRUE when the
    // credit actually reaches the Foundation fee (it does not on Sprint I: 50% of £4,900 is
    // £2,450 against £2,500), and the old single sentence asserted it unconditionally.
    // CONF-096 · the credit window is labelled, so it cannot be read against the other one.
    sprintCredit:(pct,credit,days)=> 'Sprint credit: '+pct+'% of the fee, '+credit+', against any mandate begun within '+days+' days.',
    sprintCreditCovers:(found)=> ' That covers your first Foundation month at '+found+'.',
    // CONF-161 · "prosecution-grade" is an invented grade
    sprintReScan:'a full re-scan of every binding framework, with the evidence pack',
    /* ---- Route 2 · REGULATORY WATCH, the monitoring tier (FOUNDER DECISION Q4, 2026-07-29) ----
       The £495 unlock framing is retired. £1,500 a month, month one free, sitting between the
       one-time Sprint and the mandates. Every claim below is written to the cadence the system
       actually runs: the law watch is continuous, the full audit re-runs MONTHLY, and Watch
       delivers the fix specification rather than implementing it. No "real-time scanning"
       claim appears anywhere. DMCCA Sch 20: the renewal is stated on the card, not hidden.
       CONF-269 · ONE phrasing of the free month, reused by the lede, the badge, the terms
       and the lock-veil aria label. */
    routeWatchHead:    'Route 2 · Unlock this report, and keep it watched',
    routeWatchHeadOpen:'Route 2 · Regulatory Watch',
    // "Where most boardrooms start" was a popularity claim with nothing behind it
    // (BPMMR 2008 / CAP 3.7 both require evidence for that kind of statement), so the ribbon
    // now states the product's position instead, which is verifiable from this page alone.
    watchRib:    'The monitoring tier',
    watchEyebrow:'Between the one-time Sprint and a full mandate',
    watchOffer:  'First month free',
    watchLede:   (cover)=> 'First month free, then '+cover+' a month. It unlocks every finding here, then watches the law for you.',
    watchLedeOpen:(cover)=> 'Every fix here is already open to you. Keep it that way: first month free, then '+cover+' a month.',
    watchFree:   'First month free',
    watchCta:    'Start Regulatory Watch',
    // C §8 row 24 · the identical .r3-body literal, de-duplicated to one constant. Q4 splits
    // the single 72-hour promise into the two SLAs the radar states, so the page carries one
    // number per event rather than one number for both.
    watchBody:   'A law change reaches you within 48 hours. A breach on your site is specified within 72. Re-run monthly.',
    watchHead:   'See everything today. Be told the moment anything changes.',
    // DMCCA · plain renewal on the card itself, in the buyer's line of sight.
    watchTerms:  (cover)=> 'First month free, then it renews at '+cover+' a month until you cancel. Cancel anytime.',
    r3TermsSummary:'What you are paying for, and the terms',
    // The cadence sentence lives on the radar caption, in plain sight, so it is not repeated here.
    watchTermsDetail:'Watch delivers the fix specification: the exact page, the rule and the change required. It never edits a page, so implementation is a Sprint or a mandate.',
    // C §8 row 25
    addonDisclosure:'Illustrative figures are worked examples, not client results. Full terms: /legal/service-terms.',
    // Independent Solutions · the struck anchor is already on the card, so this line states
    // the basis for the strike only (R4: a comparative price claim must be substantiated).
    addonFirst:  (anchor,off)=> 'Standard '+anchor+'; discounted to '+off+' on a first engagement.',
    // CONF-097 · the "typical" figure sat above the offer price and read as a third price
    addonTypical:(off,typ)=> off+' covers the standard scope; larger sites typically land at '+typ+'.',
    /* ---- the monitoring radar (Q4) ----
       The spokes are a capability statement, not a measurement, and radarCaption says so.
       The 48-hour law-change intimation is NEW per Q4; the 72-hour breach line already
       existed in the Watch spec, and the two are stated consistently everywhere. */
    radarHead:   'What Regulatory Watch is watching',
    radarAria:   'Radar of the compliance, search and AI areas Regulatory Watch monitors',
    radarChips:  [
      'A law changes and you know within 48 hours.',
      'A breach appears on your site and the exact fix is specified within 72 hours.',
      'Agents tuned to your site and your sector’s laws, watching around the clock.',
    ],
    // CONF-276 · "dimensions" collides with the ten scorecard dimensions; the ring is now named
    radarCaption:'What Watch monitors, not a measurement of your site. The law watch runs continuously; the full audit re-runs monthly.',
    radarRegs:   (n)=> 'The outer band lists the '+n+' regulators that bind you.',
    radarRegsNone:'The outer band lists your regulators once the framework set names them.',
    // Founder 2026-07-29: bound-but-not-breached frameworks are the retainer inventory, not empty
    // space. One count-aware line ties the clean frameworks to what Watch monitors. Numbers reuse
    // the SAME sources as the regulatory pane (G-rules: no second count vocabulary).
    watchTieIn:  (bind, breached)=> breached>0
      ? bind+' '+plur(bind,'framework')+' '+(bind===1?'binds':'bind')+' you today; '+breached+' verified '+plur(breached,'breach','breaches')+' on this scan. Watch re-checks all '+bind+' monthly.'
      : bind+' '+plur(bind,'framework')+' '+(bind===1?'binds':'bind')+' you today, none with a verified breach. Watch keeps it that way, re-checking all '+bind+' monthly.',
    /* ---- Route 3 · the mandates (unchanged prices, live-site parity) ---- */
    routeMandateHead:'Route 3 · A mandate',
    routeMandateLede:'Mandates sustain the fixes and add rankings, AI visibility and reviewed content.',
    // CONF-274 · the button says what pressing it does
    pilotToggle: 'Show the six-month rate',
    // CONF-272 · the struck anchor is labelled, so the price line cannot read as one number
    tierStandard:'standard',
    // CONF-273 · the arithmetic is stated, not left for the reader
    tierSaves:   (perMonth,standard,saves)=> perMonth+' a month less than the standard '+standard+', so '+saves+' over six months.',
    // CONF-271 · which term the price on the card assumes, said plainly
    mandateNote: 'Mandates run on 90-day rolling terms. The rate shown is available on a six-month term. Quoted and invoiced in GBP.',
    // C §8 row 16 · CONF-279 · two booking cards, so two ways to start
    bookingLede: 'Two ways to start. Your route and top finding carry into the call.',
    bookingHead: 'Book a 20 minute review',
    // C23 · the founder is named once, in the rail. Here the pane states the fact, not the person.
    // CONF-221 · active voice with the actor in front
    legalReviewed:'The Tamazia legal team reviews every report before it reaches you.',
    // CONF-278 · the duration is on the card and matches the heading (20 minutes, everywhere)
    bookMandateTag:'Mandate enquiries',
    bookMandateHead:'Discuss a mandate',
    bookMandateBody:(co)=> 'A confidential 20 minute session on which mandate fits '+co+'.',
    bookSprintTag: 'One-time sprint',
    bookSprintHead:'Start a Fix Sprint',
    bookSprintBody:'A confidential 20 minute session to scope a fixed-scope Sprint, urgent items first.',
    bookPick:      'Pick a time above, or ',
    bookPickLink:  'open the calendar directly',
    bookSprintNote:'A written confirmation follows by email.',
    // Q4 · the routes now climb: one-time fix, then monitoring, then a mandate. The
    // monitoring tier sits BETWEEN the Sprint and the retainers, so the numbers ascend
    // with the commitment rather than jumping back.
    routeSprintHead:'Route 1 · One-time Fix Sprint',
    addonsHead:  'Independent Solutions, each one a programme in its own right',
    addonsLede:  'Take one on its own, or layer it onto a Sprint or a mandate.',
    writtenHead: 'Prefer a written reply? Leave your details',
    writtenLede: 'Send the basics and Tamazia replies within one business day.',
    // CONF-222 · we record, we reply
    writtenFine: 'We record your details and email you an acknowledgement. No payment is taken here.',
    // C §8 row 27 · required disclosure, kept verbatim in meaning, moved behind <details> (P5)
    legalSummary:'Scope and legal notice',
    // CONF-233 · the two load-bearing sentences lead; the rest follows
    legalBody:   (cat)=> 'The monetary figures are statutory maximum fines: worst-case ceilings that indicate exposure, not predictions of enforcement. This is not legal advice. This is an automated marketing diagnostic from publicly observable signals. Framework catalogue '+cat+'. Produced by Tamazia Ltd, London. Marketing diagnostic only.',
    trajectoryCaption:'The trajectory is a model of the fix plan, not a promise.',

    /* ---- CTA layer (G19) ---- */
    ctaSprintBuy:  'Pay and start the Sprint ↗',      // CONF-192
    ctaSprintScope:'Scope your Fix Sprint ↗',          // CONF-190
    ctaSprintCall: 'Book a call to scope the Sprint ↗',// CONF-191
    ctaAddon:      (nm)=> 'Enquire about '+nm+' ↗',    // CONF-189
    ctaTier:       (nm)=> 'Talk to us about '+nm+' ↗', // CONF-196
    ctaWritten:    'Send my details, reply within one business day ↗', // CONF-194
    ctaIntake:     'Save and pick a time ↗',           // CONF-195
    ctaShowMore:   'Show all inclusions',              // CONF-198
    ctaShowLess:   'Hide inclusions',
    navPrev:       'Previous solutions', navNext:'Next solutions',   // CONF-199
    // CONF-193 / 202 · one string per product, whatever the lock state
    unlockCta:   'Unlock the full report',
    unlockAria:  'Unlock the full report, first month free',
    verifyRegister:'Verify on the official register ↗',
    sourceLink:  'source ↗',

    /* ---- register rows (CONF-050 / 257 / 258) ---- */
    regOnRegister:  'Found on the register',
    regNoMatch:     'No exact match found',
    regUnavailable: 'Register unavailable this scan',
    regVerify:      'Verify on the register',
    siteShown:      'Shown on your site',
    siteNotShown:   'Not shown on your site',
    siteUnknown:    'Not assessed on this scan',

    /* ---- shared micro-copy ---- */
    donutKicker: 'FINDINGS',
    youTag:      'YOU',
    // CONF-231 · three short sentences, not one 55-word chain
    pointInTime: (when)=> 'Point-in-time scan'+(when?' of '+when:'')+'.',
    pointInTime2:'It shows register facts, the binding-law map, and only the findings that passed Tamazia’s evidence gates on that scan.',
    pointInTime3:'A fresh assessment re-checks every line against your live site',
    // CONF-201 · the re-check names its price
    pointInTimeBook:(price)=> 'book the re-check ('+price+' a month, first month free)',
    // CONF-218 · name the actor
    jurAllRegions:'Tamazia screens frameworks from every other region; they do not attach here.',
    // CONF-220 · name the actor
    wfNote:      (raw,collapsed,pct)=> 'We collapse overlapping data-protection ceilings instead of stacking them: '+raw+' becomes '+collapsed+', a '+pct+'% reduction. '+collapsed+' is the number a regulator’s general counsel would accept.',
    wfNoteFlat:  'This is the statutory ceiling across your binding frameworks. There were no overlapping data-protection maxima to collapse, so the figure stands as your real exposure.',
    // CONF-015 / 131 · fixed step vocabulary, no abbreviation
    wfSteps:     ['Statutory ceilings, summed','Overlapping data-protection ceilings collapsed','Median enforcement band'],
    // CONF-082 / 083 · the bars overlap, so say so
    barsCaption: 'Statutory ceiling per framework. They overlap, so they do not sum to the total.',
    glossaryHead:(n)=> 'Plain-English glossary · '+n+' terms',
  };

  /* CONF-259 … 267 · ONE glossary, superset, one definition per term, title-cased at render.
     The payload glossaries ship two disjoint sets (19 terms on two fixtures, 5 on six); this
     is the union, and the render merges the payload on top of it without ever overriding a
     term defined here. UK GDPR is corrected (it is not the EU's law) and da/pa are gone. */
  COPY.glossaryBase = {
    'GEO':'Generative Engine Optimisation: whether AI answer engines name and cite your business.',
    'Schema':'Machine-readable tags that tell search and AI engines what your pages are about.',
    'Share of voice':'How often AI engines name you, out of the times they answer your buyers’ questions.',
    'Entity readiness':'How completely the web describes who you are, scored 0 to 100. 70 is the point AI engines start naming you.',
    'Domain rating (DR)':'A 0 to 100 estimate of how strong your backlink profile is. Higher is stronger.',
    'E-E-A-T':'Experience, Expertise, Authoritativeness and Trust: how Google judges who to surface for money and health topics.',
    'UK GDPR':'The UK’s data-protection law, carried over from the EU GDPR after Brexit.',
    'PECR':'The Privacy and Electronic Communications Regulations: the UK rules on cookies, marketing email and calls.',
    'LCP':'Largest Contentful Paint: how long until your main content appears.',
    'CLS':'Cumulative Layout Shift: how much the page jumps around while it loads.',
    'FCP':'First Contentful Paint: how long until anything appears.',
    'TBT':'Total Blocking Time: how long the page is frozen while scripts run.',
    'HSTS':'A security header that forces browsers to use an encrypted connection.',
    'CSP':'Content Security Policy: a security header that limits what code a page may run.',
    'sameAs':'A schema property that links your site to your verified profiles elsewhere.',
    'llms.txt':'A file that tells AI crawlers which of your pages to read first.',
    'Wikidata':'The open knowledge base that Google and the AI engines read entity facts from.',
    'NAP':'Name, address and phone: the three details that must match across every listing.',
    'Map pack':'The block of local business results Google shows above the classic links.',
    'Google Business Profile':'Your business listing on Google Search and Maps.',
    'WCAG 2.2 AA':'The accessibility standard UK and US regulators treat as the benchmark.',
    'YMYL':'Your Money or Your Life: content Google holds to its highest quality standard.',
    'AI answer engines':'ChatGPT, Claude, Gemini, Perplexity, Copilot and Google AI Overviews.',
  };

  const TZTEXT = { norm, decodeOnce, termFix, PSI_TITLES, LABEL_KIND, MONTHS };

  if (typeof window !== 'undefined') { window.COPY = COPY; window.COPY_PLUR = plur; window.COPY_PRON = pron; window.TZTEXT = TZTEXT; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = COPY; }
})();
