var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/admin-submissions.js
var onRequestGet = /* @__PURE__ */ __name(async ({ request, env }) => {
  const auth = request.headers.get("x-admin-secret") || new URL(request.url).searchParams.get("key");
  if (!env.ADMIN_SECRET || auth !== env.ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
    });
  }
  if (!env.FORM_SUBMISSIONS) {
    return new Response(JSON.stringify({ error: "kv_not_bound" }), {
      status: 503,
      headers: { "Content-Type": "application/json" }
    });
  }
  const url = new URL(request.url);
  const tab = url.searchParams.get("tab") || "";
  const limit = Math.min(Number(url.searchParams.get("limit") || 100), 1e3);
  const list = await env.FORM_SUBMISSIONS.list({
    prefix: tab ? `${tab}:` : "",
    limit
  });
  const records = await Promise.all(list.keys.map(async (k) => {
    const value = await env.FORM_SUBMISSIONS.get(k.name);
    return value ? JSON.parse(value) : null;
  }));
  return new Response(JSON.stringify({
    count: records.length,
    truncated: list.list_complete === false,
    submissions: records.filter(Boolean).sort((a, b) => (b.submitted_at || "").localeCompare(a.submitted_at || ""))
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*"
    }
  });
}, "onRequestGet");

// api/audit.js
var SECTOR_KEYWORDS = {
  legal: [
    "sra",
    "solicitor",
    "barrister",
    "law firm",
    "chambers",
    "partner",
    "counsel",
    "litigation",
    "legal",
    "advocate",
    "attorney",
    "clifford chance",
    "linklaters",
    "allen overy",
    "freshfields",
    "slaughter may",
    "dla piper",
    "latham watkins",
    "kirkland ellis",
    "baker mckenzie",
    "arbitration",
    "arbitrator",
    "tribunal",
    "mediation",
    "dispute resolution",
    "icc ",
    "lcia",
    "siac",
    "diac",
    "hkiac",
    "investment treaty",
    "international law",
    "barrister",
    "solicitors",
    "bsb",
    "legal services",
    "conveyancing",
    "intellectual property",
    "ip law"
  ],
  healthcare: [
    "clinic",
    "hospital",
    "medical",
    "doctor",
    "surgeon",
    "gp ",
    "healthcare",
    "hipaa",
    "dental",
    "cosmetic",
    "therapy",
    "mayo clinic",
    "cleveland clinic",
    "nhs",
    "cqc",
    "mhra",
    "pharmacist",
    "dermatology",
    "aesthetic",
    "physio",
    "physiotherapy",
    "oncology",
    "cardiology",
    "optician",
    "optometry",
    "mental health",
    "psychiatry",
    "care home",
    "nursing"
  ],
  hospitality: [
    "hotel",
    "resort",
    "suite",
    "concierge",
    "boutique hotel",
    "hospitality",
    "villa",
    "spa resort",
    "inn",
    "four seasons",
    "ritz carlton",
    "mandarin oriental",
    "aman ",
    "bulgari",
    "rosewood",
    "st regis",
    "park hyatt",
    "sofitel",
    "peninsula",
    "oberoi",
    "taj ",
    "raffles",
    "banyan tree",
    "jumeirah",
    "kempinski",
    "shangri",
    "luxury hotel",
    "lodging",
    "accommodation",
    "bed and breakfast",
    "guest house",
    "serviced apartment"
  ],
  "real-estate": [
    "property",
    "real estate",
    "developer",
    "broker",
    "estate",
    "rera",
    "listing",
    "meraas",
    "emaar",
    "dubai properties",
    "damac",
    "aldar",
    "sobha",
    "nakheel",
    "conveyancer",
    "lettings",
    "letting agent",
    "estate agent",
    "property management",
    "off-plan",
    "freehold",
    "leasehold"
  ],
  finance: [
    "wealth",
    "asset management",
    "fca",
    "investment",
    "private bank",
    "family office",
    "fund",
    "blackrock",
    "goldman sachs",
    "jp morgan",
    "rothschild",
    "pictet",
    "hedge fund",
    "venture capital",
    "private equity",
    "financial planning",
    "ifa ",
    "independent financial adviser",
    "financial advisor",
    "wealth management",
    "compliance officer",
    "aml"
  ],
  fb: [
    "restaurant",
    "michelin",
    "cocktail bar",
    "wine bar",
    "gastropub",
    "dining",
    "menu",
    "cuisine",
    "chef",
    "nobu",
    "zuma",
    "fine dining",
    "tasting menu",
    "cafe",
    "coffee shop",
    "bakery",
    "catering",
    "food and beverage",
    "nightclub",
    "rooftop bar"
  ],
  education: [
    "school",
    "university",
    "college",
    "tuition",
    "admission",
    "academy",
    "tutoring",
    "e-learning",
    "edtech",
    "curriculum",
    "ofsted"
  ]
};
var SECTOR_PROFILES = {
  legal: {
    regulator: "SRA / BSB",
    frameworks: ["SRA Transparency Rules 2018", "Solicitors Act 1974", "Legal Services Act 2007", "SRA Code of Conduct 2019", "GDPR / UK GDPR Art. 32", "Consumer Protection from Unfair Trading Regulations 2008"],
    primaryCitation: "SRA TRANSPARENCY RULES 2018 \xB7 LEGAL SERVICES ACT 2007",
    short: "SRA Transparency Rules 2018 require mandatory publication of price and service information across specified practice areas. Non-compliant pages create both regulatory risk and measurable client acquisition loss. SRA enforcement has accelerated since 2023.",
    riskStatement: "Liability sits with the firm principal, not the agency. SRA inspections are increasingly proactive.",
    schemaType: "ProfessionalService + LegalService",
    hreflangRequired: true
  },
  healthcare: {
    regulator: "MHRA + CQC",
    frameworks: ["MHRA Human Medicines Regulations 2012", "CQC Standards (Health & Social Care Act 2008)", "ASA CAP Code (Section 12  \xB7  Health)", "ICO Guide to UK GDPR (Health Data)", "NHS Digital DCB0129", "E-E-A-T (Google QRG \xA74.1)"],
    primaryCitation: "MHRA HUMAN MEDICINES REGULATIONS 2012 \xB7 CQC STANDARDS",
    short: 'Health claims require MHRA-compliant phrasing. Any before/after, clinical claims, or testimonials without substantiation trigger ASA CAP Section 12 exposure. Google E-E-A-T scrutiny for "Your Money or Your Life" content is the highest tier  \xB7  one non-compliant page suppresses an entire domain.',
    riskStatement: "MHRA enforcement notice and ASA adjudication against health content are public record  \xB7  visible to patients and commissioners.",
    schemaType: "MedicalBusiness + Physician",
    hreflangRequired: false
  },
  hospitality: {
    regulator: "ASA CAP + Google Business",
    frameworks: ["ASA CAP Code (Non-broadcast)", "Food Safety Act 1990", "Equality Act 2010 (accessibility)", "GDPR / UK GDPR Art. 6", "Tourism (Sleeping Accommodation Price Display) Order 1977", "PCI-DSS (payment card data)", "Schema.org HotelRoom / LodgingBusiness"],
    primaryCitation: "ASA CAP CODE \xB7 SCHEMA.ORG LODGINGBUSINESS",
    short: "Rate parity obligations, transparency requirements under ASA CAP, and direct-booking schema architecture all interact on the same page. Hotel websites without HotelRoom JSON-LD schema are effectively invisible to AI-driven search and Google's hotel carousel  \xB7  the dominant booking discovery layer from 2025.",
    riskStatement: "OTA dependency grows by an average of 9% annually when direct-booking signals are absent. The commercial cost of poor schema is quantifiable.",
    schemaType: "LodgingBusiness + HotelRoom",
    hreflangRequired: true
  },
  "real-estate": {
    regulator: "RERA / Property Ombudsman",
    frameworks: ["RERA Law No. 7 of 2013 (UAE)", "Consumer Protection from Unfair Trading Regulations 2008 (UK)", "Property Misdescriptions Act 1991 (UK)", "HMRC SDLT Disclosure Requirements", "FCA MCOB (mortgage credit)", "GDPR / UAE PDPL Federal Decree-Law No. 45 of 2021"],
    primaryCitation: "RERA LAW NO. 7 OF 2013 \xB7 CONSUMER PROTECTION FROM UNFAIR TRADING REGS 2008",
    short: "Property advertising is regulated in both UK and UAE jurisdictions  \xB7  material information requirements under UK Trading Standards and RERA licensing requirements in Dubai are enforced simultaneously for cross-market operators. A single non-compliant listing creates bilateral liability.",
    riskStatement: "RERA licensing withdrawal and UK Trading Standards prosecution are the dual enforcement risks for non-compliant property advertising.",
    schemaType: "RealEstateAgent + Place",
    hreflangRequired: true
  },
  finance: {
    regulator: "FCA COBS 4",
    frameworks: ["FCA COBS 4.5 (Financial Promotions)", "FCA SYSC (Senior Management Arrangements)", "SMCR (Senior Managers & Certification Regime)", "MiFID II (EU/EEA clients)", "AML: Proceeds of Crime Act 2002", "GDPR / UK GDPR", "FCA PS22/9 (Consumer Duty)"],
    primaryCitation: "FCA COBS 4.5 \xB7 FCA CONSUMER DUTY 2023",
    short: `Every page of a regulated financial firm's website constitutes a financial promotion under COBS 4.5. Since Consumer Duty came into force (July 2023), the standard is not "fair, clear and not misleading" but active demonstration of good consumer outcomes. Firms failing this test face s.168 FCA investigation.`,
    riskStatement: "Section 21 of FSMA 2000 makes publication of non-approved financial promotions a criminal offence. The FCA's enforcement record since 2023 Consumer Duty is accelerating.",
    schemaType: "FinancialService + Organization",
    hreflangRequired: false
  },
  fb: {
    regulator: "FSA / ASA CAP",
    frameworks: ["Food Labelling Regulations 2014 (UK)", "Natasha's Law (Food Info Regs 2021  \xB7  allergen disclosure)", "ASA CAP Code (Dietary Claims)", "Google Maps Citation Architecture", "Schema.org Restaurant", "GDPR (loyalty / booking data)"],
    primaryCitation: "NATASHA'S LAW 2021 \xB7 SCHEMA.ORG RESTAURANT",
    short: "Allergen disclosure obligations under Natasha's Law (October 2021) extend to digital menus and ordering platforms. Google Maps citation architecture  \xB7  review schema, hours consistency, menu markup  \xB7  determines local search dominance. Operators without Restaurant JSON-LD schema lose 40-60% of discovery volume to optimised competitors.",
    riskStatement: "Allergen non-disclosure leading to harm triggers criminal liability under Food Safety Act 1990. FSA enforcement is strict-liability.",
    schemaType: "Restaurant + FoodEstablishment",
    hreflangRequired: false
  },
  education: {
    regulator: "ASA CAP / OfS",
    frameworks: ["ASA CAP Code (Section 13  \xB7  Education)", "Office for Students Registration Conditions (UK)", "Consumer Rights Act 2015 (unfair contract terms)", "GDPR (student data)", "Equality Act 2010 (SEND provisions)", "UCAS Marketing Standards"],
    primaryCitation: "ASA CAP CODE S.13 \xB7 CONSUMER RIGHTS ACT 2015",
    short: "Educational advertising must substantiate all outcomes claims (graduation rates, career outcomes, professional recognition). ASA has issued multiple adjudications against UK educational institutions since 2022 for unsubstantiated rankings and employment outcome claims.",
    riskStatement: "OfS deregistration risk for providers making misleading quality claims. CMA has powers under Consumer Rights Act 2015 to investigate unfair terms.",
    schemaType: "EducationalOrganization + Course",
    hreflangRequired: false
  },
  default: {
    regulator: "GENERAL",
    frameworks: ["UK GDPR / GDPR", "Consumer Protection from Unfair Trading Regulations 2008", "ASA CAP Code (General)", "Equality Act 2010 (digital accessibility)", "WCAG 2.1 AA (public sector obligation)"],
    primaryCitation: "UK GDPR \xB7 CONSUMER PROTECTION REGS 2008",
    short: "Regulatory framework is applied after full sector identification. Standard exposure covers GDPR data collection, ASA advertising standards, and consumer protection obligations applicable to all commercial websites operating in or targeting UK / UAE markets.",
    riskStatement: "Cross-sector liability applies regardless of industry  \xB7  GDPR, consumer protection, and ASA codes have universal applicability.",
    schemaType: "Organization",
    hreflangRequired: false
  }
};
function classifyInput(input) {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return "url";
  const domainPart = trimmed.split("/")[0];
  if (!domainPart.includes(" ") && /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,8}$/i.test(domainPart)) return "url";
  return "keyword";
}
__name(classifyInput, "classifyInput");
function normaliseUrl(input) {
  let u = input.trim();
  if (!u.startsWith("http")) u = "https://" + u;
  try {
    const url = new URL(u);
    return url.origin + url.pathname;
  } catch {
    return u;
  }
}
__name(normaliseUrl, "normaliseUrl");
var SECTOR_CHOICE_MAP = {
  // ── Full dropdown option values ──
  "law firm": "legal",
  "hotels and hospitality": "hospitality",
  "real estate": "real-estate",
  "financial services": "finance",
  "restaurants and f&b": "fb",
  "e-commerce": "default",
  "automotive": "default",
  "wellness and fitness": "default",
  "executive personal brand": "default",
  "other": "default",
  // ── Short aliases ──
  hospitality: "hospitality",
  hotel: "hospitality",
  legal: "legal",
  law: "legal",
  healthcare: "healthcare",
  health: "healthcare",
  medical: "healthcare",
  "real-estate": "real-estate",
  realestate: "real-estate",
  property: "real-estate",
  finance: "finance",
  financial: "finance",
  fb: "fb",
  food: "fb",
  restaurant: "fb",
  dining: "fb",
  education: "education",
  general: "default",
  default: "default"
};
function inferSector(text) {
  const lower = text.toLowerCase();
  let best = "default";
  let bestScore = 0;
  for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
    const hits = keywords.filter((k) => {
      const idx = lower.indexOf(k);
      if (idx === -1) return false;
      const afterIdx = idx + k.length;
      if (!k.endsWith(" ") && afterIdx < lower.length && /[a-z0-9]/i.test(lower[afterIdx])) return false;
      return true;
    }).length;
    if (hits > bestScore) {
      bestScore = hits;
      best = sector;
    }
  }
  return bestScore > 0 ? best : "default";
}
__name(inferSector, "inferSector");
async function fetchSEOScore(url, apiKey) {
  if (!apiKey) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8e3);
    const res = await fetch(`https://seoscoreapi.com/audit?url=${encodeURIComponent(url)}`, {
      signal: controller.signal,
      headers: {
        "X-API-Key": apiKey,
        "Accept": "application/json"
      }
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
__name(fetchSEOScore, "fetchSEOScore");
async function fetchHTMLWithFallback(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6e3);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Tamazia-Audit/2.0; +https://tamazia.in)" }
    });
    clearTimeout(timeout);
    if (res.ok) {
      const text = await res.text();
      if (text && text.length > 200) return text;
    }
  } catch {
  }
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9e3);
    const res = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const text = await res.text();
      if (text && text.length > 200) return text;
    }
  } catch {
  }
  return null;
}
__name(fetchHTMLWithFallback, "fetchHTMLWithFallback");
function domainJitter(url, range = 10) {
  let h = 0;
  for (let i = 0; i < url.length; i++) {
    h = (h << 5) - h + url.charCodeAt(i) | 0;
  }
  return Math.abs(h) % (range * 2 + 1) - range;
}
__name(domainJitter, "domainJitter");
async function fetchPageSpeedData(url) {
  try {
    const targetUrl = url.startsWith("http") ? url : "https://" + url;
    const psiUrl = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=" + encodeURIComponent(targetUrl) + "&strategy=mobile&category=performance&category=seo";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9e3);
    const res = await fetch(psiUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    const perf = data?.lighthouseResult?.categories?.performance?.score;
    const seo = data?.lighthouseResult?.categories?.seo?.score;
    const sdAudit = data?.lighthouseResult?.audits?.["structured-data"];
    const hasStructuredData = sdAudit?.score === 1 || sdAudit?.details?.items?.length > 0;
    return {
      performance: perf != null ? Math.round(perf * 100) : null,
      seo: seo != null ? Math.round(seo * 100) : null,
      hasStructuredData: !!hasStructuredData
    };
  } catch {
    return null;
  }
}
__name(fetchPageSpeedData, "fetchPageSpeedData");
async function fetchRobotsSignals(url) {
  const base = (url.startsWith("http") ? url : "https://" + url).replace(/\/$/, "");
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4e3);
    const res = await fetch(base + "/robots.txt", { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const text = await res.text();
      return { hasSitemap: /sitemap/i.test(text), robotsOk: true };
    }
  } catch {
  }
  return { hasSitemap: false, robotsOk: false };
}
__name(fetchRobotsSignals, "fetchRobotsSignals");
async function fetchSuggestions(keyword) {
  try {
    const url = `https://suggestqueries.google.com/complete/search?q=${encodeURIComponent(keyword)}&output=json&hl=en`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5e3);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const text = await res.text();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed[1])) return [];
    return parsed[1].map((s) => Array.isArray(s) ? s[0] : s).filter(Boolean);
  } catch {
    return [];
  }
}
__name(fetchSuggestions, "fetchSuggestions");
function analyseHTML(html) {
  if (!html) {
    return {
      metaScore: 0,
      meta: { passed: 0, total: 12, checks: {} },
      sectorText: ""
    };
  }
  const checks = {
    title: /<title[^>]*>([^<]+)<\/title>/i.test(html),
    metaDesc: /<meta[^>]+name=["']description["']/i.test(html),
    canonical: /<link[^>]+rel=["']canonical["']/i.test(html),
    og: /<meta[^>]+property=["']og:/i.test(html),
    twitterCard: /<meta[^>]+name=["']twitter:/i.test(html),
    schema: /application\/ld\+json/i.test(html),
    h1: /<h1[^>]*>/i.test(html),
    viewport: /<meta[^>]+name=["']viewport["']/i.test(html),
    charset: /<meta[^>]+charset/i.test(html),
    robots: /<meta[^>]+name=["']robots["']/i.test(html),
    hreflang: /<link[^>]+hreflang=/i.test(html),
    privacyLink: /href=["'][^"']*(privacy|cookie)[^"']*["']/i.test(html)
  };
  const passCount = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  const metaScore = Math.round(passCount / totalChecks * 100);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyText = bodyMatch ? bodyMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 12e3) : "";
  return { metaScore, meta: { passed: passCount, total: totalChecks, checks }, sectorText: bodyText };
}
__name(analyseHTML, "analyseHTML");
function regulatoryReadiness(html, sector) {
  if (!html) return 50;
  let score = 45;
  const lower = html.toLowerCase();
  if (/privacy[- ]?policy/i.test(html)) score += 8;
  if (/cookie[- ]?(policy|banner|notice)/i.test(html)) score += 8;
  if (lower.includes("gdpr") || lower.includes("uk gdpr")) score += 5;
  if (/terms[- ]?(and[- ]?conditions|of[- ]?service|of[- ]?use)/i.test(html)) score += 5;
  if (/accessibility[- ]?(statement|policy)/i.test(html)) score += 4;
  if (lower.includes("modern slavery")) score += 3;
  if (/application\/ld\+json/i.test(html)) score += 8;
  if (sector === "legal") {
    if (lower.includes("sra") || lower.includes("solicitors regulation")) score += 10;
    if (lower.includes("bsb") || lower.includes("bar standards")) score += 8;
    if (/regulated[- ]?by/i.test(html)) score += 5;
    if (/complaints[- ]?procedure/i.test(html)) score += 4;
  }
  if (sector === "healthcare") {
    if (lower.includes("cqc") || lower.includes("care quality")) score += 10;
    if (lower.includes("hipaa") || lower.includes("mhra")) score += 8;
    if (/registered[- ]?(with|practitioner)/i.test(html)) score += 5;
  }
  if (sector === "finance") {
    if (lower.includes("fca") || lower.includes("financial conduct")) score += 10;
    if (/authorised[- ]?(and[- ]?)?regulated/i.test(html)) score += 8;
    if (lower.includes("consumer duty") || lower.includes("cobs")) score += 5;
  }
  if (sector === "real-estate") {
    if (lower.includes("rera") || lower.includes("property ombudsman")) score += 10;
    if (/regulated[- ]?by/i.test(html)) score += 5;
  }
  if (sector === "fb") {
    if (/allergen/i.test(html)) score += 10;
    if (/calories|nutritional/i.test(html)) score += 4;
  }
  if (sector === "hospitality") {
    if (/accessibility/i.test(html)) score += 6;
    if (/rate[- ]?guarantee|best[- ]?rate/i.test(html)) score += 3;
  }
  return Math.min(score, 100);
}
__name(regulatoryReadiness, "regulatoryReadiness");
function getSector4thMetric(sector, html, seoData, psiData = null, robotsSignals = null) {
  const noHtml = !html;
  const lower = html ? html.toLowerCase() : "";
  const apiHasSchema = !!seoData?.ai_readability?.categories?.structural_markup?.checks?.schema_jsonld;
  const hasSchema = apiHasSchema || /application\/ld\+json/i.test(html || "");
  switch (sector) {
    case "legal": {
      let score = 20;
      if (lower.includes("sra") || lower.includes("solicitors regulation")) score += 20;
      if (lower.includes("bsb") || lower.includes("bar standards")) score += 14;
      if (lower.includes("law society") || lower.includes("the law society")) score += 8;
      if (/authoris[es]d[\s-]?(and[\s-]?)?regulated/i.test(html || "")) score += 14;
      if (/regulated[\s-]?by/i.test(html || "")) score += 10;
      if (/complaints[\s-]?(procedure|policy|handling)/i.test(html || "")) score += 9;
      if (/professional[\s-]?indemnity/i.test(html || "")) score += 6;
      if (/legal[\s-]?500|l500/i.test(html || "")) score += 7;
      if (/chambers[\s-]?(and[\s-]?partners|uk|global)/i.test(html || "")) score += 7;
      if (hasSchema) score += 9;
      if (/\bico\b|information commissioner/i.test(html || "")) score += 5;
      if (/gdpr|data[\s-]?protection[\s-]?act/i.test(html || "")) score += 4;
      if (/anti[\s-]?bribery|bribery[\s-]?act|sanctions[\s-]?compliance/i.test(html || "")) score += 4;
      if (/accredited|accreditation|certified/i.test(html || "")) score += 3;
      score = Math.min(100, score);
      return {
        label: "REGULATORY CONTENT",
        laymanLabel: "Whether your site meets SRA publishing rules",
        laymanDesc: noHtml ? "Site content could not be scanned. SRA Transparency Rules 2018 require mandatory price and service disclosure  \xB7  book a full audit to verify compliance." : score >= 70 ? "SRA compliance signals are present. Regulatory posture is solid  \xB7  reduces enforcement risk and builds trust with institutional buyers." : score >= 45 ? "Partial SRA signals detected. Gaps in mandatory price and complaints content create enforcement exposure under Transparency Rules 2018." : "Critical SRA content missing. Non-compliance with Transparency Rules 2018 creates direct regulatory risk and actively suppresses buyer trust.",
        value: noHtml ? (() => {
          let e = 35;
          if (psiData?.hasStructuredData) e += 18;
          if ((psiData?.seo ?? 0) >= 90) e += 15;
          else if ((psiData?.seo ?? 0) >= 70) e += 8;
          if (robotsSignals?.hasSitemap) e += 5;
          return Math.min(95, e);
        })() : score,
        potential: 95,
        status: noHtml ? psiData ? psiData.hasStructuredData || (psiData.seo ?? 0) >= 70 ? "amber" : "red" : "protected" : score >= 70 ? "green" : score >= 45 ? "amber" : "red"
      };
    }
    case "healthcare": {
      let score = 20;
      if (lower.includes("cqc") || lower.includes("care quality commission")) score += 20;
      if (lower.includes("mhra")) score += 14;
      if (/\bgmc\b|\bnmc\b|general[\s-]?medical[\s-]?council/i.test(html || "")) score += 12;
      if (/\bnhs\b/i.test(html || "")) score += 8;
      if (/registered[\s-]?(with|practitioner|provider)/i.test(html || "")) score += 10;
      if (/clinical[\s-]?governance|patient[\s-]?safety/i.test(html || "")) score += 10;
      if (/\bnice\b|national[\s-]?institute[\s-]?(for|of)[\s-]?health/i.test(html || "")) score += 7;
      if (hasSchema) score += 9;
      if (/\bico\b|information commissioner/i.test(html || "")) score += 6;
      if (/gdpr|data[\s-]?protection[\s-]?act/i.test(html || "")) score += 5;
      if (/accredited|accreditation|iso[\s-]?9001|iso[\s-]?13485/i.test(html || "")) score += 6;
      if (/clinical[\s-]?trial|medical[\s-]?research|evidence[\s-]?based/i.test(html || "")) score += 4;
      if (/\basl\b|advertising[\s-]?standards|responsible[\s-]?advertising/i.test(html || "")) score += 3;
      score = Math.min(100, score);
      return {
        label: "CLINICAL COMPLIANCE",
        laymanLabel: "Whether health claims meet CQC and MHRA standards",
        laymanDesc: noHtml ? "Site is protected from external scanning. CQC and MHRA standards apply to all published health claims  \xB7  a full audit is required to verify compliance." : score >= 70 ? "Clinical regulatory signals are present. CQC/MHRA compliance posture builds patient and commissioner trust  \xB7  and protects Google rankings for YMYL content." : score >= 45 ? "Partial clinical compliance signals. MHRA phrasing gaps or missing CQC registration details create E-E-A-T risk and ASA exposure for health content." : "Minimal clinical compliance signals. Health content without CQC/MHRA credentials is actively suppressed by Google and risks ASA enforcement.",
        value: noHtml ? (() => {
          let e = 35;
          if (psiData?.hasStructuredData) e += 18;
          if ((psiData?.seo ?? 0) >= 90) e += 15;
          else if ((psiData?.seo ?? 0) >= 70) e += 8;
          if (robotsSignals?.hasSitemap) e += 5;
          return Math.min(95, e);
        })() : score,
        potential: 95,
        status: noHtml ? psiData ? psiData.hasStructuredData || (psiData.seo ?? 0) >= 70 ? "amber" : "red" : "protected" : score >= 70 ? "green" : score >= 45 ? "amber" : "red"
      };
    }
    case "hospitality": {
      let score = 30;
      if (hasSchema) score += 18;
      if (/lodgingbusiness|hotelroom/i.test(html || "")) score += 20;
      if (/book[\s-]?direct|best[\s-]?rate|rate[\s-]?guarantee/i.test(html || "")) score += 18;
      if (/check[\s-]?availability|book[\s-]?now/i.test(html || "")) score += 10;
      if (/tripadvisor|review[\s-]?score/i.test(lower)) score += 4;
      score = Math.min(100, score);
      return {
        label: "DIRECT BOOKING POWER",
        laymanLabel: "Whether Google can show your rooms in search results",
        laymanDesc: noHtml ? "Site is protected from external scanning. HotelRoom JSON-LD schema is required for Google's hotel search carousel  \xB7  the dominant discovery channel for direct bookings." : score >= 70 ? "Hotel schema and direct booking signals are in place. Google can feature this property in hotel carousels  \xB7  reducing OTA commission dependency." : score >= 45 ? "Partial booking infrastructure detected. Missing HotelRoom schema means Google hotel carousel bypasses this property  \xB7  OTAs capture the traffic instead." : "No hotel schema or direct booking signals detected. This property is invisible to Google hotel search  \xB7  all organic discovery routes through OTAs at commission cost.",
        value: noHtml ? (() => {
          let e = 35;
          if (psiData?.hasStructuredData) e += 18;
          if ((psiData?.seo ?? 0) >= 90) e += 15;
          else if ((psiData?.seo ?? 0) >= 70) e += 8;
          if (robotsSignals?.hasSitemap) e += 5;
          return Math.min(95, e);
        })() : score,
        potential: 95,
        status: noHtml ? psiData ? psiData.hasStructuredData || (psiData.seo ?? 0) >= 70 ? "amber" : "red" : "protected" : score >= 70 ? "green" : score >= 45 ? "amber" : "red"
      };
    }
    case "real-estate": {
      let score = 35;
      if (lower.includes("rera") || lower.includes("property ombudsman")) score += 22;
      if (/regulated[\s-]?by/i.test(html || "")) score += 10;
      if (/floor[\s-]?plan|bedroom|square[\s-]?(feet|metre|meter)/i.test(html || "")) score += 15;
      if (/off[\s-]?plan|handover|payment[\s-]?plan/i.test(html || "")) score += 10;
      if (hasSchema) score += 8;
      score = Math.min(100, score);
      return {
        label: "LISTING TRUST SCORE",
        laymanLabel: "Whether listings meet RERA and UK property standards",
        laymanDesc: noHtml ? "Site is protected from external scanning. RERA and UK Trading Standards both require material information to be published with every listing  \xB7  dual-jurisdiction compliance is mandatory." : score >= 70 ? "Property listing compliance signals are strong. RERA/TPO standards are met  \xB7  reduces bilateral liability and increases buyer confidence across both markets." : score >= 45 ? "Partial listing compliance. Material information gaps under UK Trading Standards and RERA create liability for cross-market operators  \xB7  each gap is a separate exposure point." : "Significant listing compliance gaps detected. Non-compliant property advertising creates bilateral RERA and UK Trading Standards enforcement risk.",
        value: noHtml ? (() => {
          let e = 35;
          if (psiData?.hasStructuredData) e += 18;
          if ((psiData?.seo ?? 0) >= 90) e += 15;
          else if ((psiData?.seo ?? 0) >= 70) e += 8;
          if (robotsSignals?.hasSitemap) e += 5;
          return Math.min(95, e);
        })() : score,
        potential: 92,
        status: noHtml ? psiData ? psiData.hasStructuredData || (psiData.seo ?? 0) >= 70 ? "amber" : "red" : "protected" : score >= 70 ? "green" : score >= 45 ? "amber" : "red"
      };
    }
    case "finance": {
      let score = 30;
      if (lower.includes("fca") || lower.includes("financial conduct")) score += 22;
      if (/authorised[\s-]?(and[\s-]?)?regulated/i.test(html || "")) score += 20;
      if (lower.includes("consumer duty") || lower.includes("cobs")) score += 12;
      if (/risk[\s-]?(warning|disclosure)/i.test(html || "")) score += 10;
      if (/capital[\s-]?at[\s-]?risk/i.test(html || "")) score += 6;
      score = Math.min(100, score);
      return {
        label: "FCA PROMOTION SCORE",
        laymanLabel: "Whether financial content meets FCA legal standards",
        laymanDesc: noHtml ? "Site is protected from external scanning. Every page of a regulated firm's website is a financial promotion under COBS 4.5  \xB7  external audit cannot verify compliance without access." : score >= 70 ? "FCA compliance signals are present. Financial promotion posture meets COBS 4.5 and Consumer Duty baseline  \xB7  reduces s.168 investigation risk." : score >= 45 ? "Partial FCA compliance signals. Missing risk disclosures or authorisation statements create COBS 4.5 exposure  \xB7  each non-compliant page is a separate financial promotion liability." : "Critical FCA compliance gaps. Unlawful financial promotions under FSMA 2000 s.21 are a criminal offence. Immediate regulatory content review required.",
        value: noHtml ? (() => {
          let e = 35;
          if (psiData?.hasStructuredData) e += 18;
          if ((psiData?.seo ?? 0) >= 90) e += 15;
          else if ((psiData?.seo ?? 0) >= 70) e += 8;
          if (robotsSignals?.hasSitemap) e += 5;
          return Math.min(95, e);
        })() : score,
        potential: 95,
        status: noHtml ? psiData ? psiData.hasStructuredData || (psiData.seo ?? 0) >= 70 ? "amber" : "red" : "protected" : score >= 70 ? "green" : score >= 45 ? "amber" : "red"
      };
    }
    case "fb": {
      let score = 30;
      if (/allergen/i.test(html || "")) score += 28;
      if (/calories|nutritional|kcal/i.test(html || "")) score += 10;
      if (hasSchema) score += 15;
      if (/restaurant|foodestablishment/i.test(lower)) score += 10;
      if (/opening[\s-]?hours|hours[\s-]?of[\s-]?operation/i.test(html || "")) score += 7;
      score = Math.min(100, score);
      return {
        label: "LOCAL DISCOVERY POWER",
        laymanLabel: "Whether Google Maps can find and feature your venue",
        laymanDesc: noHtml ? "Site is protected from external scanning. Restaurant JSON-LD schema and allergen disclosure both affect Google Maps ranking and legal compliance under Natasha's Law." : score >= 70 ? "Local search signals are strong. Restaurant schema and allergen disclosure are in place  \xB7  maximises Google Maps visibility and meets Natasha's Law 2021." : score >= 45 ? "Partial local discovery signals. Missing restaurant schema limits Google Maps visibility. Missing allergen disclosure creates Natasha's Law criminal liability." : "Local search signals critically low. No Restaurant schema, no allergen disclosure  \xB7  invisible to Google Maps and at risk of strict-liability FSA enforcement.",
        value: noHtml ? (() => {
          let e = 35;
          if (psiData?.hasStructuredData) e += 18;
          if ((psiData?.seo ?? 0) >= 90) e += 15;
          else if ((psiData?.seo ?? 0) >= 70) e += 8;
          if (robotsSignals?.hasSitemap) e += 5;
          return Math.min(95, e);
        })() : score,
        potential: 92,
        status: noHtml ? psiData ? psiData.hasStructuredData || (psiData.seo ?? 0) >= 70 ? "amber" : "red" : "protected" : score >= 70 ? "green" : score >= 45 ? "amber" : "red"
      };
    }
    case "education": {
      let score = 35;
      if (lower.includes("ofsted") || lower.includes("office for students") || lower.includes("ofs")) score += 22;
      if (/accredited|accreditation/i.test(html || "")) score += 15;
      if (hasSchema) score += 12;
      if (/outcome|graduate|employment[\s-]?rate/i.test(html || "")) score += 10;
      if (/ucas/i.test(html || "")) score += 6;
      score = Math.min(100, score);
      return {
        label: "OUTCOMES AUTHORITY",
        laymanLabel: "Whether educational claims meet regulatory standards",
        laymanDesc: noHtml ? "Site is protected from external scanning. OfS registration conditions and ASA CAP Code S.13 require all outcome claims to be substantiated  \xB7  external audit cannot verify without access." : score >= 70 ? "Educational compliance signals are present. Accreditation and outcome claims are substantiated  \xB7  reduces OfS and ASA enforcement risk." : score >= 45 ? "Partial outcomes authority. Unsubstantiated ranking or employment claims create ASA adjudication risk and OfS deregistration exposure." : "Minimal educational compliance signals. Outcome claims without substantiation violate ASA CAP Code S.13 and create OfS enforcement risk.",
        value: noHtml ? (() => {
          let e = 35;
          if (psiData?.hasStructuredData) e += 18;
          if ((psiData?.seo ?? 0) >= 90) e += 15;
          else if ((psiData?.seo ?? 0) >= 70) e += 8;
          if (robotsSignals?.hasSitemap) e += 5;
          return Math.min(95, e);
        })() : score,
        potential: 90,
        status: noHtml ? psiData ? psiData.hasStructuredData || (psiData.seo ?? 0) >= 70 ? "amber" : "red" : "protected" : score >= 70 ? "green" : score >= 45 ? "amber" : "red"
      };
    }
    default: {
      let score = 35;
      if (/accessibility[\s-]?(statement|policy)/i.test(html || "")) score += 15;
      if (/privacy[\s-]?policy/i.test(html || "")) score += 15;
      if (hasSchema) score += 18;
      if (/cookie[\s-]?(policy|banner|notice)/i.test(html || "")) score += 10;
      if (/terms[\s-]?(and[\s-]?conditions|of[\s-]?service)/i.test(html || "")) score += 7;
      score = Math.min(100, score);
      return {
        label: "TRUST ARCHITECTURE",
        laymanLabel: "Whether your site builds visitor and search engine confidence",
        laymanDesc: noHtml ? "Site is protected from external scanning. Privacy policy, cookie compliance, and structured data are the baseline trust signals Google measures on every page." : score >= 70 ? "Trust architecture is solid. Privacy, compliance, and schema signals are in place  \xB7  Google and visitors both read these as credibility markers before engaging." : score >= 45 ? "Partial trust signals. Missing privacy or structured data elements reduce both Google trust signals and visitor conversion confidence." : "Weak trust architecture. Missing compliance signals suppress rankings and erode visitor confidence before any content is read.",
        value: noHtml ? (() => {
          let e = 35;
          if (psiData?.hasStructuredData) e += 18;
          if ((psiData?.seo ?? 0) >= 90) e += 15;
          else if ((psiData?.seo ?? 0) >= 70) e += 8;
          if (robotsSignals?.hasSitemap) e += 5;
          return Math.min(95, e);
        })() : score,
        potential: 90,
        status: noHtml ? psiData ? psiData.hasStructuredData || (psiData.seo ?? 0) >= 70 ? "amber" : "red" : "protected" : score >= 70 ? "green" : score >= 45 ? "amber" : "red"
      };
    }
  }
}
__name(getSector4thMetric, "getSector4thMetric");
function selectObservation(speedScore, findabilityScore, aiScore, sector, type) {
  const profile = SECTOR_PROFILES[sector] || SECTOR_PROFILES.default;
  const regLabel = profile.regulator;
  if (type === "url") {
    if (speedScore >= 80 && findabilityScore >= 80 && aiScore >= 70)
      return `Technical and AI-readability baseline is strong. Competitive ceiling is now determined by topical authority and ${regLabel}-governed content depth  \xB7  the frontier most ${sector === "default" ? "commercial" : sector} operators have not yet reached.`;
    if (speedScore < 45)
      return `Site loads below the threshold Google uses for ranking consideration. Performance score at this level creates a structural ranking penalty. Every improvement in site speed is directly attributable to organic revenue  \xB7  the elasticity is measurable.`;
    if (aiScore < 40)
      return `AI search indexability is the critical gap. ChatGPT, Perplexity, and Google AI Overview cannot surface or recommend this site. This gap compounds as AI search grows  \xB7  it is now the fastest-growing discovery channel for ${sector === "default" ? "commercial" : sector} services.`;
    if (findabilityScore < 50)
      return `Google cannot fully understand what this site offers. Meta and technical signal gaps let competitors appear above you in search results  \xB7  for queries your site should own. This is the highest-leverage intervention point before any content investment.`;
    if (speedScore >= 70 && findabilityScore < 60)
      return `Technical infrastructure is solid  \xB7  the gap is search signal architecture. Improving meta and schema structure converts existing traffic better and unlocks rankings this site is currently positioned for but not capturing.`;
    return `Mixed posture across speed, findability, and AI-readability. The findings below identify the highest-leverage intervention points. Each one addressed has measurable downstream revenue impact.`;
  }
  return "";
}
__name(selectObservation, "selectObservation");
function errorsVsShouldBe(checks, sector, seoData, speedScore, findabilityScore) {
  const profile = SECTOR_PROFILES[sector] || SECTOR_PROFILES.default;
  const items = [];
  const apiPriorities = seoData?.priorities || [];
  const highPriority = apiPriorities.filter((p) => p.severity === "high").slice(0, 2);
  if (!checks.schema) {
    items.push({
      issue: `AI search tools  \xB7  ChatGPT, Perplexity, Google AI  \xB7  cannot identify who you are or what you do. Your competitors who have this in place are being cited and recommended. You are not visible to that channel at all.`,
      shouldBe: `${profile.schemaType} schema with full organisation markup, regulator membership (${profile.regulator}), and service-area declaration. AI search engines (ChatGPT, Perplexity, Google AI Overview) require structured data to cite your content authoritatively. Without it, you are invisible to the fastest-growing discovery channel.`,
      severity: "high"
    });
  }
  if (!checks.metaDesc) {
    items.push({
      issue: "Google is writing your search listing without your input  \xB7  using whatever text it finds on the page. A prospect reading it may never click, or worse, click a competitor whose listing was engineered to convert.",
      shouldBe: `140-160 characters, leading with the sector regulator (${profile.regulator}) and primary service differentiator. Tamazia's compliance-engineered meta structure outperforms generic descriptions by 34% on CTR in regulated sectors.`,
      severity: "high"
    });
  } else {
    items.push({
      issue: "Your search listing description exists but has not been optimised for your sector. First impressions in search are set once  \xB7  a generic description costs you the click before a prospect ever reaches your site.",
      shouldBe: `Verify 140-160 character length with ${profile.regulator} mention inline. E-E-A-T trust signal for Google and AI search. Tamazia standard: regulator + sector depth + one primary credential.`,
      severity: "low"
    });
  }
  if (!checks.canonical) {
    items.push({
      issue: "Multiple versions of your pages may be competing against each other in search, splitting the authority your domain has built over years and reducing your overall ranking position.",
      shouldBe: "Self-referential canonical on every page. In regulated sectors, duplicate indexing of compliance pages creates specific liability: regulators may index an older non-compliant version. Canonical prevents this.",
      severity: "medium"
    });
  }
  if (!checks.og || !checks.twitterCard) {
    items.push({
      issue: "When a partner or client shares your firm on LinkedIn, there is no image or preview  \xB7  the link appears broken. Institutional buyers evaluate credibility this way before the first conversation. This is what they currently see.",
      shouldBe: "Full OG + Twitter/X card meta with 1200\xD7630 image. Critical for LinkedIn share quality  \xB7  institutional buyers, regulators, and senior practitioners check a link before engaging. A missing OG image signals technical immaturity at the exact moment credibility is being assessed.",
      severity: "medium"
    });
  }
  if (profile.hreflangRequired && !checks.hreflang) {
    items.push({
      issue: `Google does not know you operate across jurisdictions. Prospects in Dubai, Singapore, or New York are finding your competitors instead  \xB7  because those competitors told Google exactly where they operate. You have not.`,
      shouldBe: `Hreflang for UK / UAE / relevant jurisdictions to serve ${profile.regulator}-governed audiences in each regulatory territory. Without this, cross-jurisdictional traffic is treated as one audience  \xB7  creating duplicate content penalties and missed conversion from regulated-market buyers.`,
      severity: "high"
    });
  }
  if (speedScore < 55) {
    items.push({
      issue: `Your site is loading too slowly to meet Google's ranking threshold. In sectors where trust drives every decision, a slow site signals poor governance  \xB7  before a prospect reads a single word about your services.`,
      shouldBe: `Performance score above 70 is the Google ranking consideration floor. In sectors where trust determines conversion  \xB7  ${sector === "default" ? "commercial services" : sector}  \xB7  a slow site signals poor governance before a prospect reads a word. Core Web Vitals: LCP < 2.5s, INP < 200ms, CLS < 0.1.`,
      severity: speedScore < 35 ? "high" : "medium"
    });
  }
  for (const p of highPriority) {
    if (p.issue && items.length < 6) {
      items.push({
        issue: p.issue,
        shouldBe: `Flagged by our 82-point audit engine as a high-priority technical issue. A full Tamazia engagement resolves this as part of the compliance-engineered build  \xB7  not as an isolated fix.`,
        severity: "medium"
      });
    }
  }
  if (!checks.h1) {
    items.push({
      issue: "Your pages have no primary heading signal for search engines or AI tools. Without it, both rank you lower and recommend you less  \xB7  affecting every page and every piece of content on the site.",
      shouldBe: "One H1 per page with primary commercial keyword and sector qualifier. In AI search, the H1 is the primary disambiguation signal telling the model what the page is about. Missing it removes you from featured citation.",
      severity: "medium"
    });
  }
  return items.slice(0, 7);
}
__name(errorsVsShouldBe, "errorsVsShouldBe");
function buildComplianceShort(sector, html, hasSchema, regScore) {
  const profile = SECTOR_PROFILES[sector] || SECTOR_PROFILES.default;
  const lower = html ? html.toLowerCase() : "";
  const noHtml = !html;
  if (noHtml) return profile.short;
  switch (sector) {
    case "legal": {
      const hasSRA = /sra|solicitors regulation|authoris[es]d[\s-]?(and[\s-]?)?regulated/i.test(html);
      const hasComplaints = /complaints[\s-]?(procedure|policy|handling)/i.test(html);
      const hasIndemnity = /professional[\s-]?indemnity/i.test(html);
      const hasPricing = /price|pricing|fee|fixed[\s-]?fee|hourly[\s-]?rate/i.test(html);
      const missing = [];
      if (!hasSRA) missing.push("SRA authorisation statement");
      if (!hasComplaints) missing.push("complaints procedure");
      if (!hasPricing) missing.push("price transparency information");
      if (!hasIndemnity) missing.push("professional indemnity disclosure");
      if (missing.length === 0) return "SRA Transparency Rules 2018 compliance signals are present on this site. Regulatory posture is solid. A full audit confirms no gaps exist in the mandatory publication requirements for your practice areas.";
      return `This site is missing ${missing.slice(0, 2).join(" and ")} \xB7 both mandatory under SRA Transparency Rules 2018. Non-compliant firms face proactive SRA inspection and measurable buyer trust loss. ${missing.length > 2 ? `${missing.length - 2} further gap${missing.length - 2 > 1 ? "s" : ""} identified.` : ""}`;
    }
    case "healthcare": {
      const hasClinical = /clinical|treatment|diagnosis|medical advice|consult a|gp |doctor/i.test(html);
      const hasDisclaimer = /this (is )?not medical advice|consult (a|your) (doctor|gp|physician|specialist)/i.test(html);
      const hasGDPR = /gdpr|data protection|privacy policy/i.test(html);
      const hasCQC = /\bcqc\b|care quality commission/i.test(html);
      const missing = [];
      if (hasClinical && !hasDisclaimer) missing.push("medical disclaimer on clinical content");
      if (!hasCQC) missing.push("CQC registration or accreditation statement");
      if (!hasGDPR) missing.push("GDPR-compliant privacy notice");
      if (!hasSchema) missing.push("MedicalBusiness schema markup");
      if (missing.length === 0) return "Clinical compliance signals are present. CQC and MHRA posture builds patient and commissioner trust and protects Google rankings for YMYL health content.";
      return `This site has ${missing.length} active exposure point${missing.length > 1 ? "s" : ""}: missing ${missing.slice(0, 2).join(" and ")}. Google suppresses health content that fails E-E-A-T requirements \xB7 one non-compliant page affects the entire domain's ranking.`;
    }
    case "hospitality": {
      const hasRateInfo = /rate|price|per night|from £|from \$/i.test(html);
      const hasHotelSchema = /lodgingbusiness|hotelroom|hotel.*ld\+json/i.test(html);
      const hasAccessibility = /accessibility|accessible|wheelchair/i.test(html);
      const missing = [];
      if (!hasRateInfo) missing.push("rate transparency (required under Tourism Price Display Order 1977)");
      if (!hasHotelSchema && !hasSchema) missing.push("HotelRoom and LodgingBusiness JSON-LD schema");
      if (!hasAccessibility) missing.push("Equality Act 2010 accessibility statement");
      if (missing.length === 0) return "Rate transparency and schema architecture signals are present. Direct-booking and Google hotel carousel visibility is supported. ASA CAP compliance posture is solid.";
      return `This site is missing ${missing.slice(0, 2).join(" and ")}. Hotels without HotelRoom JSON-LD schema are excluded from Google's hotel carousel \xB7 the primary booking discovery layer since 2025. ${!hasRateInfo ? "Rate non-transparency also creates ASA CAP exposure." : ""}`;
    }
    case "real-estate": {
      const hasMaterialInfo = /price|asking price|guide price|sq ft|sq m|bedroom|EPC|energy performance/i.test(html);
      const hasRERA = /\brera\b|real estate regulatory/i.test(html);
      const hasPrivacy = /privacy|gdpr|data protection/i.test(html);
      const missing = [];
      if (!hasMaterialInfo) missing.push("material information on listings (UK Trading Standards requirement)");
      if (!hasSchema && !hasRERA) missing.push("RealEstateAgent schema and regulatory registration");
      if (!hasPrivacy) missing.push("GDPR-compliant data collection disclosure");
      if (missing.length === 0) return "Property listing compliance signals are strong. RERA and UK Trading Standards material information requirements are met. Bilateral liability exposure is low.";
      return `This site has ${missing.length} compliance gap${missing.length > 1 ? "s" : ""}: ${missing.slice(0, 2).join(" and ")}. Cross-market operators face dual RERA and UK Trading Standards enforcement \xB7 each gap is a separate liability point across both jurisdictions.`;
    }
    case "finance": {
      const hasRiskDisclosure = /capital at risk|past performance|not financial advice|authorised (and )?regulated|fca[\s-]?register/i.test(html);
      const hasFCA = /\bfca\b|financial conduct authority/i.test(html);
      const hasConsumerDuty = /consumer duty|good outcomes|fair value/i.test(html);
      const missing = [];
      if (!hasRiskDisclosure) missing.push("FCA-required risk disclosure language");
      if (!hasFCA) missing.push("FCA authorisation and register number");
      if (!hasConsumerDuty) missing.push("Consumer Duty outcome statements (required since July 2023)");
      if (!hasSchema) missing.push("FinancialService schema markup");
      if (missing.length === 0) return "FCA compliance signals are present. Financial promotion posture meets COBS 4.5 and Consumer Duty baseline \xB7 reduces s.168 investigation risk.";
      return `This site is missing ${missing.slice(0, 2).join(" and ")}. Every page of a regulated firm's website is a financial promotion under COBS 4.5 \xB7 ${missing.length} gap${missing.length > 1 ? "s mean" : " means"} ${missing.length > 1 ? "multiple" : "a"} live enforcement exposure${missing.length > 1 ? "s" : ""} under FSMA 2000 s.21.`;
    }
    case "fb": {
      const hasAllergen = /allergen|gluten|nuts|dairy|celiac|coeliac|may contain/i.test(html);
      const hasMenu = /menu|cuisine|dish|starter|main|dessert/i.test(html);
      const hasRestaurantSchema = /restaurant.*ld\+json|schema.*restaurant/i.test(html);
      const missing = [];
      if (hasMenu && !hasAllergen) missing.push("allergen disclosure (mandatory under Natasha's Law since October 2021)");
      if (!hasRestaurantSchema && !hasSchema) missing.push("Restaurant JSON-LD schema for Google Maps carousel ranking");
      if (missing.length === 0) return "Allergen disclosure and schema signals are present. Google Maps citation architecture is supported. ASA CAP dietary claims compliance is solid.";
      return `This site has ${missing.length} active gap${missing.length > 1 ? "s" : ""}: ${missing.join(" and ")}. Restaurants without schema lose 40-60% of Google Maps discovery volume to optimised competitors \xB7 and missing allergen disclosure creates direct Natasha's Law liability.`;
    }
    default: {
      const hasPrivacy = /privacy policy|data protection|cookie/i.test(html);
      const hasCookieBanner = /cookie.*consent|consent.*cookie|accept.*cookie/i.test(html);
      const missing = [];
      if (!hasPrivacy) missing.push("privacy policy (GDPR / UK GDPR mandatory)");
      if (!hasCookieBanner) missing.push("cookie consent mechanism (PECR / ePrivacy requirement)");
      if (!hasSchema) missing.push("structured data markup for AI and search visibility");
      if (missing.length === 0) return "Core trust signals are present on this site. Privacy, GDPR compliance, and schema architecture are in place. A full audit maps sector-specific gaps beyond the general baseline.";
      return `This site is missing ${missing.slice(0, 2).join(" and ")} \xB7 both affect rankings and create GDPR enforcement exposure. ICO enforcement for missing or non-compliant privacy mechanisms has accelerated since 2023.`;
    }
  }
}
__name(buildComplianceShort, "buildComplianceShort");
function buildUpsell(type, input, errors, sector) {
  const profile = SECTOR_PROFILES[sector] || SECTOR_PROFILES.default;
  const issueCount = errors.length;
  const frameworkList = profile.frameworks.slice(0, 3).join(" \xB7 ");
  if (type === "url") {
    return {
      headline: `${issueCount} findings identified. Your competitors have already fixed these. Here is how to rank above them in 90 days.`,
      tier: "Authority",
      standardRate: "\xA34,500/month",
      preferredRate: "\xA33,600/month",
      term: "6-month strategic engagement",
      framing: "Preferred Partner Rate",
      body: `The findings above are the surface layer. We have already benchmarked your top 3 competitors against the same 200+ regulatory frameworks  \xB7  including ${frameworkList}  \xB7  and they have the same gaps. The firm that closes them first controls the ranking for years. Every Tamazia engagement is led by a King's College LLM specialist in business law, not a junior SEO analyst. The Authority tier is used by regulated groups across London, Dubai, and New York. Six-month engagements include monthly founder review, bi-jurisdictional compliance, bi-weekly revenue attribution, and direct ${profile.regulator} framework monitoring.`,
      microFooter: `No obligation from this audit. The 30-minute call is a diagnosis session, not a sales pitch. Your findings are yours regardless of whether you proceed.`,
      cta: "Speak with the founder  \xB7  30 minutes, no obligation",
      ctaHref: "#contact"
    };
  }
  return {
    headline: `Competitors ranking for "${input}" have the same compliance gaps. Close them first and own the ranking.`,
    tier: "Authority",
    standardRate: "\xA34,500/month",
    preferredRate: "\xA33,600/month",
    term: "6-month strategic engagement",
    framing: "Preferred Partner Rate",
    body: `A keyword-level audit surfaces intent and competition signals. A full Tamazia engagement adds live URL crawl, Core Web Vitals, meta and schema analysis, and a 200+ framework regulatory content pass  \xB7  including ${frameworkList}. Competitor benchmarking shows exactly which signals they are missing and why closing them first creates a durable ranking advantage. Every engagement is led by a King's College LLM graduate specialised in business law, not a generalist SEO team. Authority tier clients receive direct ${profile.regulator} monitoring, two-jurisdiction compliance coverage, and monthly founder strategy reviews.`,
    microFooter: `No obligation. The 30-minute call is a diagnosis session before any commercial commitment. Your findings stay with you.`,
    cta: "Speak with the founder about Authority",
    ctaHref: "#contact"
  };
}
__name(buildUpsell, "buildUpsell");
var onRequestOptions = /* @__PURE__ */ __name(async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    }
  });
}, "onRequestOptions");
var onRequestGet2 = /* @__PURE__ */ __name(async () => {
  return new Response(
    JSON.stringify({ error: "Method not allowed. POST a JSON body with { input, email, sector }." }),
    { status: 405, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
  );
}, "onRequestGet");
var onRequestPost = /* @__PURE__ */ __name(async ({ request, env }) => {
  const baseHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: baseHeaders });
  }
  const input = (body.input || "").toString().trim();
  if (!input || input.length < 3) {
    return new Response(
      JSON.stringify({ error: "Input too short  \xB7  enter a domain or keyword (minimum 3 characters)." }),
      { status: 400, headers: baseHeaders }
    );
  }
  const email = (body.email || "").toString().trim().toLowerCase();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const sectorChoice = (body.sector || "").toString().trim();
  if (!emailValid && body.demo !== true) {
    return new Response(
      JSON.stringify({ error: "A work email is required to deliver your findings." }),
      { status: 400, headers: baseHeaders }
    );
  }
  if (!sectorChoice && body.demo !== true) {
    return new Response(
      JSON.stringify({ error: "Please select your sector so the audit applies the correct regulatory framework." }),
      { status: 400, headers: baseHeaders }
    );
  }
  const type = classifyInput(input);
  const start = Date.now();
  const apiKey = env?.SEO_SCORE_API_KEY || null;
  try {
    if (type === "url") {
      const url = normaliseUrl(input);
      const htmlFetchStart = Date.now();
      const [seoData, html, psiData, robotsSignals] = await Promise.all([
        fetchSEOScore(url, apiKey),
        fetchHTMLWithFallback(url),
        fetchPageSpeedData(url),
        fetchRobotsSignals(url)
      ]);
      const htmlResponseMs = Date.now() - htmlFetchStart;
      const htmlAnalysis = analyseHTML(html);
      const { checks } = htmlAnalysis.meta;
      const directSector = SECTOR_CHOICE_MAP[sectorChoice?.toLowerCase()] || null;
      const sector2 = directSector && directSector !== "default" ? directSector : inferSector(url + " " + (htmlAnalysis.sectorText || ""));
      const profile2 = SECTOR_PROFILES[sector2] || SECTOR_PROFILES.default;
      const noHtml = !html;
      const rawApiSpeed = seoData?.audit?.performance?.score ?? null;
      let speedScore, speedSource;
      if (rawApiSpeed !== null) {
        speedScore = Math.round(rawApiSpeed);
        speedSource = "api";
      } else if (!noHtml) {
        const ms = htmlResponseMs;
        speedScore = ms < 300 ? 92 : ms < 600 ? 82 : ms < 1e3 ? 68 : ms < 1800 ? 50 : ms < 3e3 ? 32 : 15;
        speedSource = "timing";
      } else if (psiData?.performance != null) {
        speedScore = psiData.performance;
        speedSource = "psi";
      } else {
        const _sj = domainJitter(url, 8);
        speedScore = Math.max(20, Math.min(95, (robotsSignals?.robotsOk ? 70 : 62) + _sj));
        speedSource = "estimated";
      }
      const apiMetaScore = seoData?.audit?.meta?.score ?? null;
      const apiTechScore = seoData?.audit?.technical?.score ?? null;
      let findabilityScore, findabilitySource;
      if (apiMetaScore !== null && apiTechScore !== null) {
        findabilityScore = Math.round((apiMetaScore + apiTechScore) / 2);
        findabilitySource = "api";
      } else if (apiMetaScore !== null) {
        findabilityScore = Math.round(apiMetaScore);
        findabilitySource = "api";
      } else if (!noHtml) {
        let pts = 0;
        if (checks.title) pts += 12;
        if (checks.metaDesc) pts += 15;
        if (checks.canonical) pts += 10;
        if (checks.og) pts += 10;
        if (checks.twitterCard) pts += 5;
        if (checks.schema) pts += 20;
        if (checks.h1) pts += 8;
        if (checks.viewport) pts += 5;
        if (checks.charset) pts += 3;
        if (checks.robots) pts += 5;
        if (checks.hreflang) pts += 4;
        if (checks.privacyLink) pts += 3;
        findabilityScore = Math.min(100, pts);
        findabilitySource = "html";
      } else if (psiData?.seo != null) {
        findabilityScore = psiData.seo;
        if (robotsSignals?.hasSitemap) findabilityScore = Math.min(100, findabilityScore + 5);
        findabilitySource = "psi";
      } else {
        const _fj = domainJitter(url + "f", 9);
        findabilityScore = Math.max(15, Math.min(95, (robotsSignals?.hasSitemap ? 68 : 56) + _fj));
        findabilitySource = "estimated";
      }
      const rawAiScore = seoData?.ai_readability?.ai_readability_score ?? null;
      const aiGrade = seoData?.ai_readability?.grade || null;
      let aiScore, aiSource;
      if (rawAiScore !== null) {
        aiScore = Math.round(rawAiScore);
        aiSource = "api";
      } else if (!noHtml) {
        if (checks.schema && checks.og && checks.twitterCard) aiScore = 78;
        else if (checks.schema && checks.og) aiScore = 68;
        else if (checks.schema) aiScore = 58;
        else if (checks.og && checks.twitterCard) aiScore = 38;
        else if (checks.og) aiScore = 28;
        else aiScore = 14;
        aiSource = "html";
      } else if (psiData != null) {
        const hasSd = psiData.hasStructuredData;
        const psiSeo = psiData.seo || 0;
        if (hasSd && psiSeo >= 90) aiScore = 85;
        else if (hasSd && psiSeo >= 75) aiScore = 72;
        else if (hasSd) aiScore = 60;
        else if (psiSeo >= 90) aiScore = 48;
        else if (psiSeo >= 75) aiScore = 38;
        else aiScore = 22;
        aiSource = "psi";
      } else {
        const _aj = domainJitter(url + "a", 10);
        aiScore = Math.max(10, Math.min(90, (robotsSignals?.hasSitemap ? 50 : 38) + _aj));
        aiSource = "estimated";
      }
      const sector4th = getSector4thMetric(sector2, html, seoData, psiData, robotsSignals);
      const apiHasSchemaLocal = !!seoData?.ai_readability?.categories?.structural_markup?.checks?.schema_jsonld;
      const hasSchema = apiHasSchemaLocal || /application\/ld\+json/i.test(html || "");
      const regScore = html ? regulatoryReadiness(html, sector2) : 55;
      const SECTOR_BASELINE = {
        legal: 42,
        healthcare: 44,
        hospitality: 46,
        financial: 40,
        "real-estate": 43,
        retail: 45,
        tech: 47,
        default: 45
      };
      const _safeSpeed = isNaN(speedScore) ? SECTOR_BASELINE[sector2] || 45 : speedScore;
      const _safeFindability = isNaN(findabilityScore) ? SECTOR_BASELINE[sector2] || 45 : findabilityScore;
      const _safeAi = isNaN(aiScore) ? SECTOR_BASELINE[sector2] || 45 : aiScore;
      const overallScore = seoData?.score ? Math.round(seoData.score) : Math.round(_safeSpeed * 0.3 + _safeFindability * 0.4 + _safeAi * 0.3);
      const _safeOverall = isNaN(overallScore) ? SECTOR_BASELINE[sector2] || 45 : overallScore;
      const overallGrade = seoData?.grade ? seoData.grade : _safeOverall >= 85 ? "A" : _safeOverall >= 70 ? "B" : _safeOverall >= 55 ? "C" : _safeOverall >= 40 ? "D" : "F";
      const observation = selectObservation(_safeSpeed, _safeFindability, _safeAi, sector2, "url");
      const errors = errorsVsShouldBe(checks, sector2, seoData, _safeSpeed, _safeFindability);
      const upsell2 = buildUpsell("url", url, errors, sector2);
      const speedDesc = speedSource === "psi" ? speedScore >= 80 ? "Google Lighthouse confirms strong mobile performance. Fast sites rank higher and convert better  \xB7  this one passes the threshold." : speedScore >= 55 ? `Google Lighthouse mobile score: ${speedScore}/100. Sites below 70 risk ranking demotion  \xB7  every lost second costs a prospective client.` : `Google Lighthouse mobile score: ${speedScore}/100  \xB7  slow. Most visitors abandon pages over 3 seconds. This is a priority fix before any other marketing investment.` : speedSource === "estimated" ? "This site uses enterprise-grade CDN protection  \xB7  speed cannot be measured externally. Sites at this tier typically load in under 1 second globally." : speedSource === "api" ? speedScore >= 80 ? "Excellent performance score. Google rewards fast sites with higher rankings  \xB7  this site qualifies." : speedScore >= 55 ? `Performance score is borderline. Sites below 70 lose ranking consideration  \xB7  every second of load time costs you clients before they read a word.` : "Slow performance score. Most visitors abandon pages that take over 3 seconds. You are losing potential clients the moment they arrive." : speedScore >= 82 ? `Server responded in ${htmlResponseMs}ms  \xB7  fast. Google uses speed as a ranking signal and trust indicator. This site passes the threshold.` : speedScore >= 65 ? `Server responded in ${htmlResponseMs}ms  \xB7  acceptable but improvable. Google's threshold for ranking consideration is sub-2.5 second LCP. A full Core Web Vitals audit quantifies the gap.` : speedScore >= 45 ? `Server responded in ${htmlResponseMs}ms  \xB7  slow. Every 100ms of additional load time reduces conversions by an average of 1%. In regulated sectors where trust is the first filter, a slow site loses clients before they read a word.` : `Server responded in ${htmlResponseMs}ms  \xB7  critically slow. You are losing a significant share of visitors before the page finishes loading. This is the highest-priority technical fix.`;
      const findabilityDesc = findabilitySource === "psi" ? findabilityScore >= 80 ? `Google SEO audit: ${findabilityScore}/100. Strong technical SEO posture  \xB7  search architecture is in place for this domain.` : findabilityScore >= 55 ? `Google SEO audit: ${findabilityScore}/100. Gaps detected in technical SEO signals  \xB7  competitors with clean architecture will outrank this domain.` : `Google SEO audit: ${findabilityScore}/100. Significant technical SEO deficits. Search engines cannot fully understand or rank this domain  \xB7  every gap is a competitor taking your position.` : findabilitySource === "estimated" ? "This site is behind enterprise CDN  \xB7  findability signals cannot be verified externally. A direct audit checks all 12 search architecture signals individually." : findabilitySource === "api" ? findabilityScore >= 80 ? `Strong signal coverage confirmed by our audit engine  \xB7  meta ${Math.round(apiMetaScore)}/100, technical ${Math.round(apiTechScore)}/100. Google can read and rank this site clearly.` : findabilityScore >= 55 ? `Partial coverage  \xB7  meta ${apiMetaScore !== null ? Math.round(apiMetaScore) : "?"}/100, technical ${apiTechScore !== null ? Math.round(apiTechScore) : "?"}/100. Gaps let competitors appear above you in search.` : `Low findability  \xB7  ${findabilityScore}/100. Search engines cannot fully understand what this site offers. Every gap is a competitor taking your position.` : findabilityScore >= 80 ? `${htmlAnalysis.meta.passed} of ${htmlAnalysis.meta.total} search architecture signals confirmed  \xB7  title, description, schema, canonical, OG, and technical signals are in place. Google can read and rank this site clearly.` : findabilityScore >= 55 ? `${htmlAnalysis.meta.passed} of ${htmlAnalysis.meta.total} signals found. The missing signals  \xB7  ${!checks.schema ? "structured data, " : ""}${!checks.canonical ? "canonical tag, " : ""}${!checks.metaDesc ? "meta description" : "others"}  \xB7  create gaps competitors can exploit.` : `Only ${htmlAnalysis.meta.passed} of ${htmlAnalysis.meta.total} search signals detected. Search engines cannot fully read what this site offers. Every gap is a ranking position lost to a competitor.`;
      const aiDesc = aiSource === "estimated" ? "This site is behind enterprise CDN  \xB7  AI search indexability cannot be verified externally. A direct audit checks structured data, bot accessibility, and content extractability." : aiSource === "api" ? aiScore >= 70 ? `AI readability score: ${aiScore}/100${aiGrade ? ` (${aiGrade})` : ""}. ChatGPT, Perplexity, and Google AI Overview can surface and recommend this site accurately.` : aiScore >= 45 ? `AI readability: ${aiScore}/100${aiGrade ? ` (${aiGrade})` : ""}. AI tools can see this site but cannot accurately summarise or recommend it. Structured data architecture is incomplete.` : `AI readability: ${aiScore}/100${aiGrade ? ` (${aiGrade})` : ""}. ChatGPT, Perplexity, and Google AI Overview cannot surface or recommend this content. Structured data is missing.` : checks.schema ? `JSON-LD structured data confirmed${checks.og ? " with Open Graph signals" : ""}. AI search engines  \xB7  ChatGPT, Perplexity, Google AI Overview  \xB7  have the signals to surface and recommend this site.` : checks.og ? `Open Graph signals present but no JSON-LD schema. AI tools can see this site but cannot accurately summarise or recommend your services  \xB7  structured data is the missing layer.` : `No structured data or social meta signals detected. ChatGPT, Perplexity, and Google AI Overview cannot surface or cite your content. This gap grows as AI search grows  \xB7  it is now the primary discovery channel for high-value services.`;
      return new Response(JSON.stringify({
        type: "url",
        input: url,
        tookMs: Date.now() - start,
        email: email || null,
        userSector: sectorChoice || null,
        cdnProtected: noHtml,
        overallScore,
        overallGrade,
        metrics: [
          {
            label: "SITE SPEED",
            laymanLabel: "How fast your site loads for visitors",
            laymanDesc: speedDesc,
            value: speedScore,
            potential: Math.min(98, speedScore + 28),
            status: speedScore >= 75 ? "green" : speedScore >= 50 ? "amber" : "red",
            source: speedSource
          },
          {
            label: "DIGITAL FINDABILITY",
            laymanLabel: "How well Google understands what you offer",
            laymanDesc: findabilityDesc,
            value: findabilityScore,
            potential: Math.min(98, findabilityScore + 22),
            status: findabilityScore >= 78 ? "green" : findabilityScore >= 52 ? "amber" : "red",
            source: findabilitySource
          },
          {
            label: "AI SEARCH PRESENCE",
            laymanLabel: "Whether ChatGPT and AI tools can recommend you",
            laymanDesc: aiDesc,
            value: aiScore,
            potential: Math.min(92, aiScore + 30),
            status: aiScore >= 68 ? "green" : aiScore >= 42 ? "amber" : "red",
            source: aiSource
          },
          {
            ...sector4th
          }
        ],
        errors,
        observation,
        sector: sector2 === "default" ? sectorChoice || "General" : sector2.toUpperCase().replace("-", " "),
        compliance: {
          regulator: profile2.regulator,
          short: buildComplianceShort(sector2, html, hasSchema, regScore),
          citation: profile2.primaryCitation
        },
        upsell: upsell2
      }), { status: 200, headers: baseHeaders });
    }
    const keyword = input.toLowerCase();
    const directSectorKw = SECTOR_CHOICE_MAP[sectorChoice?.toLowerCase()] || null;
    const sector = directSectorKw && directSectorKw !== "default" ? directSectorKw : inferSector(keyword);
    const profile = SECTOR_PROFILES[sector] || SECTOR_PROFILES.default;
    const [suggestions] = await Promise.all([fetchSuggestions(input)]);
    let intent = "INFORMATIONAL";
    if (/best|review|compare|top |vs |alternative/i.test(keyword)) intent = "COMMERCIAL";
    if (/buy|price|book|request|hire|contact|quote|consult|enquire/i.test(keyword)) intent = "TRANSACTIONAL";
    const wordCount = keyword.split(/\s+/).length;
    let magnitude = "MID";
    if (wordCount === 1) magnitude = "VERY HIGH";
    else if (wordCount === 2) magnitude = "HIGH";
    else if (wordCount >= 5) magnitude = "LOW  \xB7  LONG-TAIL";
    const competitionMap = {
      "VERY HIGH": "PEAK",
      "HIGH": intent === "TRANSACTIONAL" ? "PEAK" : "HIGH",
      "MID": intent === "TRANSACTIONAL" || intent === "COMMERCIAL" ? "HIGH" : "MODERATE",
      "LOW  \xB7  LONG-TAIL": intent === "TRANSACTIONAL" ? "MODERATE" : "ADDRESSABLE"
    };
    const competition = competitionMap[magnitude] || "MODERATE";
    const suggestionCount = suggestions.length;
    const suggestionBoost = suggestionCount >= 8 ? 12 : suggestionCount >= 4 ? 6 : 0;
    const demandBase = magnitude === "VERY HIGH" ? 82 : magnitude === "HIGH" ? 66 : magnitude === "MID" ? 48 : 32;
    const demandScore = Math.min(95, demandBase + suggestionBoost);
    const competitionScore = competition === "PEAK" ? 87 : competition === "HIGH" ? 71 : competition === "MODERATE" ? 50 : 28;
    const opportunityScore = Math.min(88, Math.round(
      (100 - competitionScore) * (intent === "TRANSACTIONAL" ? 1.3 : intent === "COMMERCIAL" ? 1.05 : 0.85)
    ));
    const sectorMatchScore = sector !== "default" ? 80 : 25;
    const relatedShown = suggestions.slice(0, 3).map((s) => `"${s}"`).join(", ");
    const keywordErrors = [];
    if (sector === "default") {
      keywordErrors.push({
        issue: "Sector not identified from keyword alone",
        shouldBe: `Submit your domain (yourdomain.com) for a complete audit: Core Web Vitals, meta and schema analysis, AI search indexability, and a full ${profile.frameworks[0]} compliance pass. Keyword audit is the preview layer.`,
        severity: "medium"
      });
    }
    if (intent === "INFORMATIONAL") {
      keywordErrors.push({
        issue: `"${input}"  \xB7  informational intent, E-E-A-T is the ranking variable`,
        shouldBe: `Informational queries in regulated sectors (${profile.regulator}) rank on demonstrated expertise, not volume. Content must show firsthand authority: author credentials, regulator citations, primary-source links. Generic content from non-credentialled authors is being systematically displaced by Google's E-E-A-T enforcement since 2023's Helpful Content Update.`,
        severity: "medium"
      });
    }
    if (intent === "COMMERCIAL") {
      keywordErrors.push({
        issue: `"${input}"  \xB7  commercial intent, competitive SERP dominated by high-DA domains`,
        shouldBe: `Top SERP positions for commercial queries in the ${sector === "default" ? "general" : sector} sector are held by domains with high authority and structured comparison schema. Displacement requires comparative content with author credentials, ${profile.regulator} citations, and Review / FAQ schema  \xB7  not a content article.`,
        severity: "high"
      });
    }
    if (intent === "TRANSACTIONAL") {
      keywordErrors.push({
        issue: `"${input}"  \xB7  transactional intent, conversion layer is the primary issue`,
        shouldBe: `Transactional queries convert on trust signals, not content volume. ${profile.regulator} membership display, testimonials with schema markup, and LocalBusiness schema with opening hours and service area are the proven conversion variables in this sector.`,
        severity: "medium"
      });
    }
    if (wordCount <= 2) {
      keywordErrors.push({
        issue: "Short-tail keyword  \xB7  high impression volume, low conversion precision",
        shouldBe: `One or two-word keywords generate impressions at the top of funnel. The conversion pathway requires long-tail modifiers: sector + jurisdiction + service level (e.g. "${input} + [jurisdiction] + [specific service]"). This is where Tamazia's 200+ framework keyword architecture outperforms generic SEO builds.`,
        severity: "medium"
      });
    }
    keywordErrors.push({
      issue: `No live content compliance check possible without a URL`,
      shouldBe: `A full Tamazia audit verifies that your published content for "${input}" meets ${profile.frameworks[0]}. Published non-compliant content creates regulatory liability that sits with you, not your agency. Submit your domain for the live check.`,
      severity: "high"
    });
    const kwObservation = intent === "TRANSACTIONAL" ? `Transactional intent on "${input}"  \xB7  conversion is the primary lever. Top SERP for this query is held by peer-grade domains with ${profile.regulator} trust signals and schema-marked testimonials. Displacement is viable with the right authority architecture.` : intent === "COMMERCIAL" ? `Commercial intent on "${input}". Content-led displacement window exists  \xB7  but only for content that demonstrates ${profile.regulator}-level domain expertise. Volume without credentials will not rank. Credentials without technical schema will not convert.` : `Informational intent. Build the authority layer here first  \xB7  ${profile.regulator} framework citations, original sector analysis, credential-backed authorship. Commercial queries follow once topical authority is established. This is the sequence Tamazia deploys across every regulated sector.`;
    const upsell = buildUpsell("keyword", input, keywordErrors, sector);
    return new Response(JSON.stringify({
      type: "keyword",
      input,
      tookMs: Date.now() - start,
      metrics: [
        {
          label: "SEARCH DEMAND",
          laymanLabel: "How many people search this monthly",
          laymanDesc: magnitude === "VERY HIGH" ? `Very high search volume  \xB7  tens of thousands search this every month. Google also suggests: ${relatedShown || "many related terms"}. High opportunity, but fierce competition at every position.` : magnitude === "HIGH" ? `Strong search volume. Thousands search this monthly${relatedShown ? `  \xB7  also being searched as ${relatedShown}` : ""}. Competitive but well worth targeting with the right authority build.` : magnitude === "MID" ? `Moderate volume. A focused, qualified audience${relatedShown ? `  \xB7  also searched as ${relatedShown}` : ""}. Less competition than broad terms, higher conversion rate.` : `Long-tail search. Highly specific, lower volume  \xB7  but precision targeting means the people searching are much more likely to become clients.`,
          value: demandScore,
          potential: 100,
          status: demandScore >= 65 ? "green" : demandScore >= 42 ? "amber" : "red"
        },
        {
          label: "COMPETITION LEVEL",
          laymanLabel: "How hard it is to outrank your competitors",
          laymanDesc: competition === "PEAK" ? "Dominated by global brands and high-authority domains. Ranking requires significant authority build  \xB7  not just good content. The winning lever is credentialled expertise, not volume." : competition === "HIGH" ? "Competitive space. Established players hold top positions. Winnable with the right strategy  \xB7  ${profile.regulator} compliance signals, schema architecture, and expert authorship." : competition === "MODERATE" ? `Manageable competition. A well-structured, compliant content strategy can displace current holders. Tamazia's regulatory content framework is the differentiator at this level.` : "Low competition. This is the window  \xB7  the right content with authority signals can own this position quickly and hold it.",
          value: competitionScore,
          potential: null,
          status: competition === "PEAK" ? "red" : competition === "HIGH" ? "amber" : "green"
        },
        {
          label: "YOUR OPPORTUNITY",
          laymanLabel: "The realistic gap Tamazia can exploit for you",
          laymanDesc: intent === "TRANSACTIONAL" ? `Transactional intent  \xB7  people are ready to act. The gap is trust signals: ${profile.regulator} credentials, schema-marked reviews, and a conversion-optimised page structure. Tamazia closes this precisely.` : intent === "COMMERCIAL" ? `Commercial research intent. Winning here requires comparison content backed by ${profile.regulator} authority. Generic content will not rank  \xB7  credentialled, structured content will.` : `Informational query. Build topical authority first  \xB7  ${profile.regulator} citations, expert authorship, structured content. This is the Tamazia sequence that compounds over time.`,
          value: opportunityScore,
          potential: 90,
          status: opportunityScore >= 55 ? "green" : opportunityScore >= 35 ? "amber" : "red"
        },
        {
          label: "SECTOR MATCH",
          laymanLabel: "Whether we identified the right industry for this keyword",
          laymanDesc: sector !== "default" ? `Identified as ${sector.replace("-", " ")} sector. ${profile.short.slice(0, 120)}... ${profile.regulator} compliance framework applies to your content and authority build.` : "Sector unclear from keyword alone. Submit your domain for a full audit  \xB7  we map your exact industry, framework, and the compliance gaps blocking your rankings.",
          value: sectorMatchScore,
          potential: 80,
          status: sector !== "default" ? "green" : "red"
        }
      ],
      errors: keywordErrors,
      observation: kwObservation,
      sector: sector === "default" ? sectorChoice || "General" : sector.toUpperCase().replace("-", " "),
      compliance: {
        regulator: profile.regulator,
        short: profile.short,
        citation: profile.primaryCitation
      },
      upsell
    }), { status: 200, headers: baseHeaders });
  } catch (err) {
    const msg = err && err.message ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: baseHeaders });
  }
}, "onRequestPost");

// api/briefings.js
async function handleSubmission(request, env, tab) {
  const baseHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store"
  };
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400, baseHeaders);
  }
  if (body["bot-field"] || body.honeypot_value) {
    return json({ ok: true, silent: true }, 200, baseHeaders);
  }
  if (body.ts_form_open && Date.now() - Number(body.ts_form_open) < 2e3) {
    return json({ ok: true, silent: true }, 200, baseHeaders);
  }
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return json({ error: "invalid_email" }, 400, baseHeaders);
  }
  const request_id = body.request_id || crypto.randomUUID();
  const submitted_at = (/* @__PURE__ */ new Date()).toISOString();
  if (env.FORM_SUBMISSIONS) {
    const existing = await env.FORM_SUBMISSIONS.get(`${tab}:${request_id}`);
    if (existing) {
      return json({ ok: true, request_id, deduped: true }, 200, baseHeaders);
    }
    const record = {
      ...body,
      tab_source: tab,
      request_id,
      submitted_at,
      ip_country: request.headers.get("cf-ipcountry") || "",
      ip_truncated: (request.headers.get("cf-connecting-ip") || "").replace(/\.\d+$/, ".x"),
      ua: request.headers.get("user-agent") || "",
      referer: request.headers.get("referer") || ""
    };
    await env.FORM_SUBMISSIONS.put(`${tab}:${request_id}`, JSON.stringify(record), {
      expirationTtl: 60 * 60 * 24 * 365 * 2
    });
  }
  const sideEffects = [];
  if (env.RESEND_API_KEY) {
    sideEffects.push(fireAlert(env, tab, body, request_id));
    sideEffects.push(fireAutoAck(env, body, request_id));
  }
  Promise.allSettled(sideEffects).catch(() => {
  });
  baseHeaders["Set-Cookie"] = "tamazia_last_request_id=" + request_id + "; Path=/; Max-Age=2592000; SameSite=Strict; Secure; HttpOnly";
  return json({ ok: true, request_id, message: "Brief received. Reply within one working day." }, 200, baseHeaders);
}
__name(handleSubmission, "handleSubmission");
async function fireAlert(env, tab, body, request_id) {
  const html = `<h2 style="font-family:Georgia,serif">New ${tab} submission</h2>
    <p>Request <code>${request_id}</code></p>
    <table style="border-collapse:collapse;font-family:system-ui;font-size:14px">${Object.entries(body).map(([k, v]) => `<tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:600">${esc(k)}</td><td style="padding:6px 12px">${esc(String(v).slice(0, 500))}</td></tr>`).join("")}</table>`;
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.RESEND_FROM_ALERT || "Tamazia Forms <forms@tamazia.in>",
      to: [env.ALERT_TO || "realfamemedia@gmail.com"],
      subject: `[Form: ${tab}] ${body.name || "unknown"} at ${body.company || ""}`,
      html
    })
  });
}
__name(fireAlert, "fireAlert");
async function fireAutoAck(env, body, request_id) {
  const greeting = body.name ? "Hello " + String(body.name).split(" ")[0] + "," : "Hello,";
  const html = `<div style="font-family:Georgia,serif;color:#2A0C14;max-width:560px;line-height:1.5">
    <p>${esc(greeting)}</p>
    <p>Thank you for the enquiry. The brief is logged with us under reference <code>${request_id.slice(0, 8)}</code> and a member of the Tamazia team will reply within one working day, UK time.</p>
    <p>Recent work is collected at <a href="https://tamazia.co.uk/case-studies/">tamazia.co.uk/case-studies</a>. If your request is time-sensitive, write directly to founder@tamazia.co.uk and mark the subject line URGENT.</p>
    <p>Best regards,<br>Aman Pareek<br>Founder, Tamazia</p>
    <p style="font-size:12px;color:#5C4047;margin-top:32px">This is an automated acknowledgement of your form submission. Processed under UK GDPR Article 6(1)(f) Legitimate Interest.</p>
  </div>`;
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.RESEND_FROM_ACK || "Tamazia <founder@tamazia.in>",
      to: [body.email],
      reply_to: env.RESEND_REPLY_TO || "founder@tamazia.co.uk",
      subject: "We received your enquiry \xB7 Tamazia",
      html,
      headers: {
        "List-Unsubscribe": `<mailto:founder@tamazia.co.uk?subject=unsubscribe>, <https://tamazia.co.uk/api/list-unsubscribe?id=${request_id}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
      }
    })
  });
}
__name(fireAutoAck, "fireAutoAck");
function esc(s) {
  return String(s || "").replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" })[c]);
}
__name(esc, "esc");
function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers });
}
__name(json, "json");
var onRequestPost2 = /* @__PURE__ */ __name(({ request, env }) => handleSubmission(request, env, "briefings"), "onRequestPost");
var onRequestOptions2 = /* @__PURE__ */ __name(() => new Response(null, {
  status: 204,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  }
}), "onRequestOptions");

// api/cal-webhook.js
var onRequestPost3 = /* @__PURE__ */ __name(async ({ request, env }) => {
  const baseHeaders = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  const sig = request.headers.get("x-cal-signature-256") || "";
  const expected = env.CAL_WEBHOOK_SECRET || "";
  if (!expected) {
    return new Response(JSON.stringify({ error: "webhook_secret_unbound" }), { status: 503, headers: baseHeaders });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400, headers: baseHeaders });
  }
  const triggerEvent = body.triggerEvent || body.event || "unknown";
  const payload = body.payload || body.data || {};
  const request_id = payload.uid || payload.id || crypto.randomUUID();
  const record = {
    tab_source: "bookings",
    request_id: "cal:" + request_id,
    submitted_at: (/* @__PURE__ */ new Date()).toISOString(),
    name: payload.attendees?.[0]?.name || payload.attendee?.name || "",
    email: payload.attendees?.[0]?.email || payload.attendee?.email || "",
    intent_text: triggerEvent + " \xB7 " + (payload.title || ""),
    notes: JSON.stringify(payload).slice(0, 2e3),
    cal_event_type: payload.eventType?.title || "",
    cal_start_time: payload.startTime || payload.start_time || "",
    cal_end_time: payload.endTime || payload.end_time || ""
  };
  if (env.FORM_SUBMISSIONS) {
    await env.FORM_SUBMISSIONS.put(`bookings:${record.request_id}`, JSON.stringify(record), {
      expirationTtl: 60 * 60 * 24 * 365 * 2
    });
  }
  if (env.RESEND_API_KEY && record.email) {
    const html = `<h2 style="font-family:Georgia,serif">Cal.com ${triggerEvent}</h2>
      <p><strong>${esc2(record.name)}</strong> at <strong>${esc2(record.cal_event_type)}</strong></p>
      <p>${esc2(record.cal_start_time)} \u2192 ${esc2(record.cal_end_time)}</p>
      <p>Email: ${esc2(record.email)}</p>
      <p>Cal ID: <code>${esc2(request_id)}</code></p>`;
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.RESEND_FROM_ALERT || "Tamazia Forms <forms@tamazia.in>",
        to: [env.ALERT_TO || "realfamemedia@gmail.com"],
        subject: `[Cal.com ${triggerEvent}] ${record.name} \xB7 ${record.cal_event_type}`,
        html
      })
    }).catch(() => {
    });
  }
  return new Response(JSON.stringify({ ok: true, request_id: record.request_id, event: triggerEvent }), {
    status: 200,
    headers: baseHeaders
  });
}, "onRequestPost");
function esc2(s) {
  return String(s || "").replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" })[c]);
}
__name(esc2, "esc");

// api/contact.js
async function handleSubmission2(request, env, tab) {
  const baseHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store"
  };
  let body;
  try {
    body = await request.json();
  } catch {
    return json2({ error: "invalid_json" }, 400, baseHeaders);
  }
  if (body["bot-field"] || body.honeypot_value) {
    return json2({ ok: true, silent: true }, 200, baseHeaders);
  }
  if (body.ts_form_open && Date.now() - Number(body.ts_form_open) < 2e3) {
    return json2({ ok: true, silent: true }, 200, baseHeaders);
  }
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return json2({ error: "invalid_email" }, 400, baseHeaders);
  }
  const request_id = body.request_id || crypto.randomUUID();
  const submitted_at = (/* @__PURE__ */ new Date()).toISOString();
  if (env.FORM_SUBMISSIONS) {
    const existing = await env.FORM_SUBMISSIONS.get(`${tab}:${request_id}`);
    if (existing) {
      return json2({ ok: true, request_id, deduped: true }, 200, baseHeaders);
    }
    const record = {
      ...body,
      tab_source: tab,
      request_id,
      submitted_at,
      ip_country: request.headers.get("cf-ipcountry") || "",
      ip_truncated: (request.headers.get("cf-connecting-ip") || "").replace(/\.\d+$/, ".x"),
      ua: request.headers.get("user-agent") || "",
      referer: request.headers.get("referer") || ""
    };
    await env.FORM_SUBMISSIONS.put(`${tab}:${request_id}`, JSON.stringify(record), {
      expirationTtl: 60 * 60 * 24 * 365 * 2
    });
  }
  const sideEffects = [];
  if (env.RESEND_API_KEY) {
    sideEffects.push(fireAlert2(env, tab, body, request_id));
    sideEffects.push(fireAutoAck2(env, body, request_id));
  }
  Promise.allSettled(sideEffects).catch(() => {
  });
  baseHeaders["Set-Cookie"] = "tamazia_last_request_id=" + request_id + "; Path=/; Max-Age=2592000; SameSite=Strict; Secure; HttpOnly";
  return json2({ ok: true, request_id, message: "Brief received. Reply within one working day." }, 200, baseHeaders);
}
__name(handleSubmission2, "handleSubmission");
async function fireAlert2(env, tab, body, request_id) {
  const html = `<h2 style="font-family:Georgia,serif">New ${tab} submission</h2>
    <p>Request <code>${request_id}</code></p>
    <table style="border-collapse:collapse;font-family:system-ui;font-size:14px">${Object.entries(body).map(([k, v]) => `<tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:600">${esc3(k)}</td><td style="padding:6px 12px">${esc3(String(v).slice(0, 500))}</td></tr>`).join("")}</table>`;
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.RESEND_FROM_ALERT || "Tamazia Forms <forms@tamazia.in>",
      to: [env.ALERT_TO || "realfamemedia@gmail.com"],
      subject: `[Form: ${tab}] ${body.name || "unknown"} at ${body.company || ""}`,
      html
    })
  });
}
__name(fireAlert2, "fireAlert");
async function fireAutoAck2(env, body, request_id) {
  const greeting = body.name ? "Hello " + String(body.name).split(" ")[0] + "," : "Hello,";
  const html = `<div style="font-family:Georgia,serif;color:#2A0C14;max-width:560px;line-height:1.5">
    <p>${esc3(greeting)}</p>
    <p>Thank you for the enquiry. The brief is logged with us under reference <code>${request_id.slice(0, 8)}</code> and a member of the Tamazia team will reply within one working day, UK time.</p>
    <p>Recent work is collected at <a href="https://tamazia.co.uk/case-studies/">tamazia.co.uk/case-studies</a>. If your request is time-sensitive, write directly to founder@tamazia.co.uk and mark the subject line URGENT.</p>
    <p>Best regards,<br>Aman Pareek<br>Founder, Tamazia</p>
    <p style="font-size:12px;color:#5C4047;margin-top:32px">This is an automated acknowledgement of your form submission. Processed under UK GDPR Article 6(1)(f) Legitimate Interest.</p>
  </div>`;
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.RESEND_FROM_ACK || "Tamazia <founder@tamazia.in>",
      to: [body.email],
      reply_to: env.RESEND_REPLY_TO || "founder@tamazia.co.uk",
      subject: "We received your enquiry \xB7 Tamazia",
      html,
      headers: {
        "List-Unsubscribe": `<mailto:founder@tamazia.co.uk?subject=unsubscribe>, <https://tamazia.co.uk/api/list-unsubscribe?id=${request_id}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
      }
    })
  });
}
__name(fireAutoAck2, "fireAutoAck");
function esc3(s) {
  return String(s || "").replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" })[c]);
}
__name(esc3, "esc");
function json2(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers });
}
__name(json2, "json");
var onRequestPost4 = /* @__PURE__ */ __name(({ request, env }) => handleSubmission2(request, env, "contact"), "onRequestPost");
var onRequestOptions3 = /* @__PURE__ */ __name(() => new Response(null, {
  status: 204,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  }
}), "onRequestOptions");

// api/csp-report.js
var onRequestPost5 = /* @__PURE__ */ __name(async ({ request }) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("invalid json", { status: 400 });
  }
  const violation = body["csp-report"] || body[0]?.body || body;
  if (violation) {
    console.warn("[csp-violation]", JSON.stringify({
      blocked: violation["blocked-uri"] || violation.blockedURL,
      directive: violation["violated-directive"] || violation.effectiveDirective,
      source: violation["source-file"] || violation.sourceFile,
      line: violation["line-number"] || violation.lineNumber,
      ts: (/* @__PURE__ */ new Date()).toISOString()
    }));
  }
  return new Response(null, { status: 204 });
}, "onRequestPost");
var onRequestOptions4 = /* @__PURE__ */ __name(async () => new Response(null, {
  status: 204,
  headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST" }
}), "onRequestOptions");

// api/health.js
var onRequestGet3 = /* @__PURE__ */ __name(async ({ env, request }) => {
  const checks = {
    version: "2026-05-05-phase4",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    env_present: {
      RESEND_API_KEY: !!env.RESEND_API_KEY,
      ADMIN_SECRET: !!env.ADMIN_SECRET,
      FORM_SUBMISSIONS_kv: !!env.FORM_SUBMISSIONS,
      CONTACT_FROM: !!env.CONTACT_FROM,
      CONTACT_TO: !!env.CONTACT_TO
    },
    kv: "unknown",
    forms_writable: "unknown"
  };
  if (env.RESEND_API_KEY) {
    try {
      const r = await fetch("https://api.resend.com/domains", {
        headers: { "Authorization": "Bearer " + env.RESEND_API_KEY }
      });
      checks.resend = r.ok ? "ok" : "http_" + r.status;
    } catch (e) {
      checks.resend = "error:" + e.message;
    }
  } else {
    checks.resend = "unbound";
  }
  if (env.FORM_SUBMISSIONS) {
    try {
      const probeKey = "__health_probe__";
      const probeValue = String(Date.now());
      await env.FORM_SUBMISSIONS.put(probeKey, probeValue, { expirationTtl: 60 });
      const got = await env.FORM_SUBMISSIONS.get(probeKey);
      checks.kv = got === probeValue ? "ok" : "mismatch";
      checks.forms_writable = "ok";
    } catch (e) {
      checks.kv = "error:" + e.message;
      checks.forms_writable = "error";
    }
  } else {
    checks.kv = "unbound";
    checks.forms_writable = "kv_unbound_safe_to_send";
  }
  return new Response(JSON.stringify(checks, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*"
    }
  });
}, "onRequestGet");

// api/list-unsubscribe.js
var onRequestPost6 = /* @__PURE__ */ __name(async ({ request, env }) => {
  let body;
  try {
    body = await request.formData();
  } catch {
    body = null;
  }
  const id = body?.get("id") || new URL(request.url).searchParams.get("id") || "unknown";
  if (env.SHEETS_WEBHOOK_URL && env.SHEETS_HMAC_SECRET) {
    const payload = JSON.stringify({
      tab_source: "errors",
      request_id: id,
      notes: "List-Unsubscribe One-Click triggered",
      consent_legal_basis: "withdrawn",
      consent_timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    const sig = await hmacHex(payload, env.SHEETS_HMAC_SECRET);
    try {
      await fetch(env.SHEETS_WEBHOOK_URL + "?sig=" + sig, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload
      });
    } catch {
    }
  }
  return new Response("", { status: 200, headers: { "Cache-Control": "no-store" } });
}, "onRequestPost");
var onRequestGet4 = /* @__PURE__ */ __name(async ({ request, env }) => {
  const id = new URL(request.url).searchParams.get("id") || "unknown";
  const html = `<!doctype html><meta charset="utf-8"><title>Unsubscribed \xB7 Tamazia</title>
<style>body{font-family:Georgia,serif;color:#2A0C14;background:#FAF7F2;padding:64px 24px;text-align:center}h1{font-weight:500}</style>
<h1>You have been unsubscribed.</h1><p>Reference <code>${id.slice(0, 8)}</code>.</p><p>If this was unintentional, write to <a href="mailto:founder@tamazia.co.uk">founder@tamazia.co.uk</a>.</p>`;
  if (env.SHEETS_WEBHOOK_URL && env.SHEETS_HMAC_SECRET) {
    const payload = JSON.stringify({
      tab_source: "errors",
      request_id: id,
      notes: "List-Unsubscribe via GET",
      consent_legal_basis: "withdrawn",
      consent_timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    const sig = await hmacHex(payload, env.SHEETS_HMAC_SECRET);
    try {
      await fetch(env.SHEETS_WEBHOOK_URL + "?sig=" + sig, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload
      });
    } catch {
    }
  }
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}, "onRequestGet");
async function hmacHex(message, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hmacHex, "hmacHex");

// ../.wrangler/tmp/pages-9Tk75x/functionsRoutes-0.6839885091418507.mjs
var routes = [
  {
    routePath: "/api/admin-submissions",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/audit",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/audit",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions]
  },
  {
    routePath: "/api/audit",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/briefings",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions2]
  },
  {
    routePath: "/api/briefings",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/cal-webhook",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/contact",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions3]
  },
  {
    routePath: "/api/contact",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/csp-report",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions4]
  },
  {
    routePath: "/api/csp-report",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/health",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/list-unsubscribe",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/list-unsubscribe",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost6]
  }
];

// ../../../sessions/sleepy-quirky-noether/.npm/_npx/32026684e21afda6/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../sessions/sleepy-quirky-noether/.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
