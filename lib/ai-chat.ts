export type ChatRole = "user" | "assistant";
export type ToolMode = "gemini" | "tavily" | "combined";

export type ChatSource = {
  title: string;
  url: string;
  content?: string;
};

export type AssistantResponsePayload = {
  content: string;
  images: string[];
  sources: ChatSource[];
  mode: ToolMode;
  category: string;
};

const CATEGORY_DOMAINS = {
  financial: [
    "finance.yahoo.com",
    "www.tradingview.com",
    "coinmarketcap.com",
    "www.goldprice.org",
    "markets.businessinsider.com",
  ],
  design: [
    "www.behance.net",
    "dribbble.com",
    "www.awwwards.com",
    "land-book.com",
    "godly.website",
  ],
  news: [
    "www.reuters.com",
    "www.bbc.com",
    "techcrunch.com",
    "www.theverge.com",
    "news.ycombinator.com",
  ],
  startup: [
    "www.producthunt.com",
    "www.crunchbase.com",
    "www.ycombinator.com",
    "wellfound.com",
    "tracxn.com",
  ],
  images: [
    "pexels.com",
    "unsplash.com",
    "openverse.org",
    "www.behance.net",
    "dribbble.com",
  ],
  developer: [
    "github.com",
    "npmjs.com",
    "huggingface.co",
    "paperswithcode.com",
    "stackoverflow.com",
  ],
} as const;

const GOLD_SYSTEM_PROMPT = `You are GoldCraft AI, a refined assistant for gold, jewellery, design inspiration, market research, startups, images, and developer discovery.

Rules:
- Be direct, selective, and on-point.
- Do not use markdown heading markers like #, ##, or ###.
- Do not dump scraped text, navigation labels, footer content, or long name lists without explanation.
- Prefer 2 to 4 short sections or a compact answer with a clear takeaway.
- For search-backed answers, synthesize the findings instead of repeating raw page text.
- Mention only the strongest 1 to 3 references.
- For visual or inspiration requests, prefer direct project pages over generic search, collection, discover, or listing pages.
- If the request is outside supported GoldCraft topics, answer briefly and steer back to relevant gold-related subjects.`;

const JEWELRY_WORDS = [
  "ring",
  "rings",
  "butterfly ring",
  "jewelry",
  "jewellery",
  "necklace",
  "bracelet",
  "earring",
  "earrings",
  "pendant",
  "gemstone",
  "gem stone",
  "diamond",
  "bangle",
  "brooch",
  "gold band",
  "engagement ring",
  "sapphire",
  "emerald",
  "ruby",
];

const VISUAL_INTENT_WORDS = [
  "image",
  "images",
  "photo",
  "photos",
  "picture",
  "pictures",
  "show",
  "show me",
  "inspiration",
  "reference",
  "references",
  "moodboard",
  "visual",
  "look",
  "style",
  "concept",
  "design idea",
  "give me",
  "find me",
];

const UI_INTENT_WORDS = [
  "ui",
  "ux",
  "app",
  "mobile app",
  "dashboard",
  "screen",
  "login",
  "sign up",
  "signup",
  "onboarding",
  "figma",
  "case study",
  "wellness app",
  "smart ring app",
];

const LIVE_DATA_WORDS = [
  "latest",
  "today",
  "current",
  "price",
  "trending",
  "news",
  "market",
  "scrape",
  "search",
  "find on",
  "recent",
  "new",
];

const SEARCH_PLAN_DOMAIN_HINTS: Array<{
  words: string[];
  domain: string;
  category: keyof typeof CATEGORY_DOMAINS | "general";
}> = [
  {
    words: ["yahoo finance"],
    domain: "finance.yahoo.com",
    category: "financial",
  },
  {
    words: ["tradingview"],
    domain: "www.tradingview.com",
    category: "financial",
  },
  {
    words: ["coinmarketcap"],
    domain: "coinmarketcap.com",
    category: "financial",
  },
  {
    words: ["goldprice.org", "gold price"],
    domain: "www.goldprice.org",
    category: "financial",
  },
  {
    words: ["business insider"],
    domain: "markets.businessinsider.com",
    category: "financial",
  },
  { words: ["behance"], domain: "www.behance.net", category: "design" },
  { words: ["dribbble"], domain: "dribbble.com", category: "design" },
  { words: ["awwwards"], domain: "www.awwwards.com", category: "design" },
  {
    words: ["land-book", "landbook"],
    domain: "land-book.com",
    category: "design",
  },
  { words: ["godly"], domain: "godly.website", category: "design" },
  { words: ["reuters"], domain: "www.reuters.com", category: "news" },
  { words: ["bbc"], domain: "www.bbc.com", category: "news" },
  { words: ["techcrunch"], domain: "techcrunch.com", category: "news" },
  {
    words: ["the verge", "verge"],
    domain: "www.theverge.com",
    category: "news",
  },
  {
    words: ["hacker news", "hn"],
    domain: "news.ycombinator.com",
    category: "news",
  },
  { words: ["crunchbase"], domain: "www.crunchbase.com", category: "startup" },
  {
    words: ["y combinator", "yc"],
    domain: "www.ycombinator.com",
    category: "startup",
  },
  {
    words: ["product hunt"],
    domain: "www.producthunt.com",
    category: "startup",
  },
  {
    words: ["wellfound", "angel.co"],
    domain: "wellfound.com",
    category: "startup",
  },
  { words: ["tracxn"], domain: "tracxn.com", category: "startup" },
  { words: ["unsplash"], domain: "unsplash.com", category: "images" },
  { words: ["pexels"], domain: "pexels.com", category: "images" },
  { words: ["openverse"], domain: "openverse.org", category: "images" },
  { words: ["github"], domain: "github.com", category: "developer" },
  { words: ["npm"], domain: "npmjs.com", category: "developer" },
  {
    words: ["hugging face", "huggingface"],
    domain: "huggingface.co",
    category: "developer",
  },
  {
    words: ["papers with code", "paperswithcode"],
    domain: "paperswithcode.com",
    category: "developer",
  },
  {
    words: ["stackoverflow", "stack overflow"],
    domain: "stackoverflow.com",
    category: "developer",
  },
];

type SearchPlan = {
  mode: ToolMode;
  category: keyof typeof CATEGORY_DOMAINS | "general";
  domains: string[];
  searchQuery: string;
  maxResults: number;
  includeImages: boolean;
};

type TavilyResult = {
  title: string;
  url: string;
  content?: string;
};

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function normalizeAssistantText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanScrapedContent(text?: string) {
  if (!text) {
    return "";
  }

  const cleaned = text
    .replace(/\[\.\.\.\]/g, " ")
    .replace(/\b(TOU|Privacy|Community|Help Center|Help|Login|Social)\b/gi, " ")
    .replace(/Do not sell or share my personal information/gi, " ")
    .replace(/Built For Creatives/gi, " ")
    .replace(/Find Inspiration/gi, " ")
    .replace(/Get Hired/gi, " ")
    .replace(/Find Talent/gi, " ")
    .replace(/Popular Search Terms/gi, " ")
    .replace(/�\s*\d{4}[^\n]*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.length > 320 ? `${cleaned.slice(0, 317)}...` : cleaned;
}

export function deriveChatTitle(text: string) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return "New chat";
  }

  return cleaned.length > 48 ? `${cleaned.slice(0, 45)}...` : cleaned;
}

function detectExplicitDomain(query: string) {
  return SEARCH_PLAN_DOMAIN_HINTS.find((hint) =>
    hint.words.some((word) => query.includes(word)),
  );
}

function choosePrimaryDomain({
  category,
  query,
}: {
  category: keyof typeof CATEGORY_DOMAINS;
  query: string;
}) {
  const explicit = detectExplicitDomain(query);

  if (explicit && explicit.category === category) {
    return explicit.domain;
  }

  if (category === "financial") {
    if (includesAny(query, ["gold", "silver", "commodity", "bullion"])) {
      return "www.goldprice.org";
    }
    if (includesAny(query, ["crypto", "bitcoin", "ethereum", "altcoin"])) {
      return "coinmarketcap.com";
    }
    if (includesAny(query, ["chart", "trading", "forex", "candlestick"])) {
      return "www.tradingview.com";
    }
    return "finance.yahoo.com";
  }

  if (category === "design") {
    if (includesAny(query, ["logo", "branding", "motion", "animation"])) {
      return "dribbble.com";
    }
    if (includesAny(query, ["landing page", "website", "portfolio"])) {
      return "land-book.com";
    }
    return "www.behance.net";
  }

  if (category === "news") {
    if (includesAny(query, ["tech", "startup", "product launch"])) {
      return "techcrunch.com";
    }
    return "www.reuters.com";
  }

  if (category === "startup") {
    if (
      includesAny(query, [
        "recent",
        "latest",
        "new startup",
        "new startups",
        "launch",
        "launches",
      ])
    ) {
      return "www.producthunt.com";
    }
    if (includesAny(query, ["funding", "valuation", "investors", "funded"])) {
      return "www.crunchbase.com";
    }
    if (includesAny(query, ["yc", "y combinator"])) {
      return "www.ycombinator.com";
    }
    return "www.producthunt.com";
  }

  if (category === "images") {
    const wantsDesignBoard = includesAny(query, [
      "inspiration",
      "concept",
      "moodboard",
      "design",
      "reference board",
      "art direction",
    ]);

    if (wantsDesignBoard || includesAny(query, UI_INTENT_WORDS)) {
      return "www.behance.net";
    }

    if (
      includesAny(query, [
        "image",
        "images",
        "photo",
        "photos",
        "picture",
        "pictures",
        "show",
        "show me",
        "give me",
      ])
    ) {
      return "pexels.com";
    }

    if (includesAny(query, JEWELRY_WORDS)) {
      return "pexels.com";
    }

    return "openverse.org";
  }

  if (category === "developer") {
    if (includesAny(query, ["package", "library", "package manager"])) {
      return "npmjs.com";
    }
    if (includesAny(query, ["model", "ai model", "llm"])) {
      return "huggingface.co";
    }
    return "github.com";
  }

  return CATEGORY_DOMAINS[category][0];
}

function buildSearchQuery({
  category,
  query,
  domain,
}: {
  category: keyof typeof CATEGORY_DOMAINS;
  query: string;
  domain: string;
}) {
  if (category === "images") {
    if (domain === "www.behance.net") {
      return `${query} gold jewelry design project`;
    }
    if (domain === "dribbble.com") {
      return `${query} jewelry concept shot`;
    }
    if (domain === "pexels.com" || domain === "unsplash.com") {
      return `${query} jewelry photo`;
    }
    return `${query} jewelry image`;
  }

  if (category === "design") {
    if (domain === "www.behance.net") {
      return `${query} ui ux case study`;
    }
    if (domain === "dribbble.com") {
      return `${query} app ui shot`;
    }
    return query;
  }

  if (category === "startup" && domain === "www.producthunt.com") {
    return `${query} startup launch product`;
  }

  return query;
}

export function chooseToolMode(query: string): SearchPlan {
  const lower = query.toLowerCase();
  const explicit = detectExplicitDomain(lower);
  const isJewelry = includesAny(lower, JEWELRY_WORDS);
  const wantsVisual = includesAny(lower, VISUAL_INTENT_WORDS);
  const wantsUi = includesAny(lower, UI_INTENT_WORDS);
  const wantsLiveData = includesAny(lower, LIVE_DATA_WORDS);

  const keywordMap: Array<{
    category: keyof typeof CATEGORY_DOMAINS;
    words: string[];
  }> = [
    {
      category: "financial",
      words: [
        "gold price",
        "price",
        "market",
        "stock",
        "stocks",
        "crypto",
        "commodity",
        "commodities",
        "trading",
        "forex",
        "silver",
        "oil",
      ],
    },
    {
      category: "design",
      words: [
        "design",
        "ui",
        "ux",
        "portfolio",
        "layout",
        "landing page",
        "smart ring app",
        "wellness app",
      ],
    },
    {
      category: "news",
      words: [
        "news",
        "latest",
        "today",
        "headline",
        "trend",
        "trending",
        "reuters",
        "bbc",
        "verge",
        "techcrunch",
      ],
    },
    {
      category: "startup",
      words: [
        "startup",
        "funding",
        "founder",
        "launch",
        "product hunt",
        "company",
        "companies",
        "y combinator",
        "wellfound",
        "crunchbase",
      ],
    },
    {
      category: "images",
      words: [
        "image",
        "images",
        "photo",
        "photos",
        "picture",
        "visual",
        "inspiration",
        "reference",
        ...JEWELRY_WORDS,
      ],
    },
    {
      category: "developer",
      words: [
        "github",
        "repo",
        "repository",
        "npm",
        "library",
        "libraries",
        "model",
        "models",
        "huggingface",
        "paperswithcode",
        "stackoverflow",
        "developer",
      ],
    },
  ];

  let category: keyof typeof CATEGORY_DOMAINS | "general" =
    explicit?.category === "general"
      ? "general"
      : (explicit?.category ?? "general");

  if (category === "general") {
    const matched = keywordMap.find((item) =>
      item.words.some((word) => lower.includes(word)),
    );
    category = matched?.category ?? "general";
  }

  if ((wantsVisual || isJewelry) && wantsUi) {
    category = "design";
  } else if (wantsVisual || isJewelry) {
    category = "images";
  }

  if (category === "general") {
    return {
      mode: wantsLiveData ? "combined" : "gemini",
      category,
      domains: [],
      searchQuery: query,
      maxResults: 0,
      includeImages: false,
    };
  }

  const domain = choosePrimaryDomain({ category, query: lower });
  const searchQuery = buildSearchQuery({ category, query, domain });
  const includeImages = category === "images";

  if (category === "images" || category === "design") {
    return {
      mode: "tavily",
      category,
      domains: [domain],
      searchQuery,
      maxResults: 4,
      includeImages,
    };
  }

  if (
    category === "financial" ||
    category === "news" ||
    category === "startup"
  ) {
    return {
      mode: "combined",
      category,
      domains: [domain],
      searchQuery,
      maxResults: 4,
      includeImages: false,
    };
  }

  return {
    mode: wantsLiveData ? "combined" : "tavily",
    category,
    domains: [domain],
    searchQuery,
    maxResults: 4,
    includeImages: false,
  };
}

function scoreResult(result: TavilyResult, query: string) {
  const haystack = `${result.title} ${result.content ?? ""}`.toLowerCase();
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);

  return tokens.reduce((score, token) => {
    if (haystack.includes(token)) {
      return score + 1;
    }
    return score;
  }, 0);
}

function isGenericSource(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const path = parsed.pathname.toLowerCase();
    const segments = path.split("/").filter(Boolean);

    if (!segments.length) {
      return true;
    }

    if (
      path.includes("/search") ||
      path.includes("/discover") ||
      path.includes("/trending") ||
      path.includes("/explore") ||
      path.includes("/collections") ||
      path.includes("/questions") ||
      path.includes("/photos") ||
      path.includes("/companies/industry/") ||
      path.includes("/discover/") ||
      parsed.searchParams.has("page")
    ) {
      return true;
    }

    if (host === "dribbble.com") {
      return !path.includes("/shots/");
    }

    if (host === "behance.net") {
      return !path.includes("/gallery/");
    }

    if (host === "github.com") {
      return segments.length < 2;
    }

    if (host === "npmjs.com") {
      return !path.includes("/package/");
    }

    if (host === "huggingface.co") {
      return segments.length < 2 || path.includes("/models");
    }

    if (host === "paperswithcode.com") {
      return path === "/" || path.includes("/latest");
    }

    return false;
  } catch {
    return false;
  }
}

function dedupeByUrl(results: TavilyResult[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    if (seen.has(result.url)) {
      return false;
    }
    seen.add(result.url);
    return true;
  });
}

function selectUsefulResults({
  results,
  query,
  category,
  maxResults,
}: {
  results: TavilyResult[];
  query: string;
  category: keyof typeof CATEGORY_DOMAINS | "general";
  maxResults: number;
}) {
  const deduped = dedupeByUrl(results);
  const scored = deduped
    .map((result) => ({
      result,
      score: scoreResult(result, query),
      generic: isGenericSource(result.url),
    }))
    .sort((a, b) => {
      if (a.generic !== b.generic) {
        return a.generic ? 1 : -1;
      }
      return b.score - a.score;
    });

  const preferred = scored.filter((item) => !item.generic);
  const pool = preferred.length ? preferred : scored;
  const limit =
    category === "images" || category === "design"
      ? Math.min(maxResults, 3)
      : maxResults;

  return pool.slice(0, limit).map((item) => item.result);
}

async function tavilySearch({
  query,
  domains,
  maxResults,
  includeImages,
}: {
  query: string;
  domains: string[];
  maxResults: number;
  includeImages: boolean;
}) {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    throw new Error("Missing TAVILY_API_KEY.");
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      include_domains: domains,
      include_images: includeImages,
      include_answer: false,
      include_raw_content: false,
      search_depth: "advanced",
      max_results: maxResults,
      topic: "general",
    }),
  });

  if (!response.ok) {
    throw new Error("Tavily request failed.");
  }

  const data = await response.json();

  return {
    results: (data.results ?? []) as TavilyResult[],
    images:
      includeImages && Array.isArray(data.images)
        ? (data.images as string[])
        : [],
  };
}

async function geminiTextRequest({
  systemPrompt,
  contents,
  maxOutputTokens = 900,
  temperature = 0.3,
}: {
  systemPrompt: string;
  contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>;
  maxOutputTokens?: number;
  temperature?: number;
}) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        generationConfig: {
          temperature,
          maxOutputTokens,
        },
        contents,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Gemini request failed.");
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((part: { text?: string }) => part.text ?? "")
    .join("\n")
    .trim();

  return text || "";
}

async function geminiReply({
  query,
  history,
  contextText,
}: {
  query: string;
  history: Array<{ role: ChatRole; content: string }>;
  contextText?: string;
}) {
  const contents: Array<{
    role: "user" | "model";
    parts: Array<{ text: string }>;
  }> = history.slice(-8).map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));

  contents.push({
    role: "user",
    parts: [
      {
        text: contextText
          ? `User query: ${query}\n\nSelected web context:\n${contextText}\n\nRespond with this shape:\nQuick take: one short paragraph.\nKey points: 2 to 4 short bullets or numbered items.\nIf helpful, add one short final line with what to do next.\nDo not copy raw snippets, headers, navigation, or footer text.`
          : `User query: ${query}\n\nRespond with this shape:\nQuick take: one short paragraph.\nKey points: 2 to 4 short bullets or numbered items.\nIf helpful, add one short final line with what to do next.`,
      },
    ],
  });

  const text = await geminiTextRequest({
    systemPrompt: GOLD_SYSTEM_PROMPT,
    contents,
    maxOutputTokens: 700,
    temperature: 0.28,
  });

  return normalizeAssistantText(
    text || "I couldn't produce a response just now.",
  );
}

export async function generateChatSummary(query: string) {
  try {
    const summary = await geminiTextRequest({
      systemPrompt:
        "You write ultra-short premium chat history summaries for a sidebar. Return a single concise summary in 4 to 8 words. No markdown, no quotes, no numbering, no punctuation at the end.",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Summarize this user request for a chat sidebar: ${query}`,
            },
          ],
        },
      ],
      maxOutputTokens: 30,
      temperature: 0.2,
    });

    const cleaned = summary
      .replace(/[\r\n]+/g, " ")
      .replace(/["'`]/g, "")
      .replace(/^[\-�*\s]+/, "")
      .trim();

    return deriveChatTitle(cleaned || query);
  } catch {
    return deriveChatTitle(query);
  }
}

export async function buildAssistantReply({
  query,
  history,
}: {
  query: string;
  history: Array<{ role: ChatRole; content: string }>;
}): Promise<AssistantResponsePayload> {
  const strategy = chooseToolMode(query);

  if (strategy.mode === "gemini") {
    const content = await geminiReply({ query, history });
    return {
      content,
      images: [],
      sources: [],
      mode: "gemini",
      category: strategy.category,
    };
  }

  const tavily = await tavilySearch({
    query: strategy.searchQuery,
    domains: strategy.domains,
    maxResults: Math.max(strategy.maxResults, 6),
    includeImages: strategy.includeImages,
  });

  const filteredResults = selectUsefulResults({
    results: tavily.results,
    query,
    category: strategy.category,
    maxResults: strategy.maxResults,
  });

  const sources =
    strategy.category === "images"
      ? []
      : filteredResults.map((item) => ({
          title: item.title,
          url: item.url,
          content: cleanScrapedContent(item.content),
        }));
  const images = strategy.includeImages
    ? Array.from(new Set(tavily.images)).slice(0, 4)
    : [];

  if (strategy.mode === "tavily") {
    if (strategy.category === "images" || strategy.category === "design") {
      return {
        content:
          strategy.category === "images" && !images.length
            ? "I could not find a strong direct image match for that request yet."
            : "",
        images,
        sources: strategy.category === "images" ? [] : sources,
        mode: "tavily",
        category: strategy.category,
      };
    }

    const content = sources.length
      ? normalizeAssistantText(
          sources
            .map(
              (item, index) =>
                `${index + 1}. ${item.title}\n${item.content ?? "No summary available."}`,
            )
            .join("\n\n"),
        )
      : "I could not find strong live results for that query.";

    return {
      content,
      images,
      sources,
      mode: "tavily",
      category: strategy.category,
    };
  }

  const contextText = sources.length
    ? sources
        .map(
          (item, index) =>
            `[${index + 1}] ${item.title}\n${item.content ?? "No summary available."}\n${item.url}`,
        )
        .join("\n\n")
    : "No Tavily sources were returned.";

  const content = await geminiReply({ query, history, contextText });

  return {
    content,
    images,
    sources,
    mode: "combined",
    category: strategy.category,
  };
}

export function parseStoredList(value?: string | null) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}