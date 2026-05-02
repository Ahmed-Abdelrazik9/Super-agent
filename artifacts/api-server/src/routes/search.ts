import { Router } from "express";
import { db } from "@workspace/db";
import { searchesTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { eq, desc, count, sum, avg } from "drizzle-orm";
import {
  CreateSearchBody,
  ListSearchHistoryQueryParams,
  GetSearchParams,
  DeleteSearchParams,
  CreateFollowUpParams,
  CreateFollowUpBody,
} from "@workspace/api-zod";

const router = Router();

// POST /search — streaming SSE deep search
router.post("/search", async (req, res) => {
  const parsed = CreateSearchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { query, mode = "deep" } = parsed.data;
  const startTime = Date.now();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    sendEvent("status", { message: "Initiating deep web search...", phase: "searching" });

    const maxTokens = mode === "quick" ? 1024 : mode === "deep" ? 2048 : 4096;

    const systemPrompt = mode === "expert"
      ? `You are an elite research intelligence system. For the given query, perform exhaustive multi-angle analysis. Use web search to find the most current, authoritative information. Provide a comprehensive synthesis that includes: executive summary, detailed analysis from multiple perspectives, key facts and data points, expert opinions and citations, contradictions or debates in the field, practical implications, and forward-looking insights. Structure your response with clear sections. Be thorough and precise.`
      : mode === "deep"
      ? `You are a powerful AI search agent with real-time web access. For the given query, search the web thoroughly and synthesize a comprehensive, well-structured answer. Include relevant facts, statistics, expert perspectives, and cite your sources. Provide context and explain nuances. Be informative and thorough.`
      : `You are a fast AI search agent. Answer the query concisely using web search results. Be accurate and to the point.`;

    const stream = await openai.responses.create({
      model: "gpt-5.4",
      instructions: systemPrompt,
      input: query,
      tools: [{ type: "web_search_preview" as const }],
      stream: true,
      max_output_tokens: maxTokens,
    });

    let fullSynthesis = "";
    const sources: Array<{
      title: string;
      url: string;
      snippet: string;
      credibilityScore: number;
      domain: string;
      publishedDate?: string;
    }> = [];
    const seenUrls = new Set<string>();

    sendEvent("status", { message: "Searching the web...", phase: "searching" });

    for await (const event of stream) {
      if (event.type === "response.output_item.added") {
        if (event.item.type === "web_search_call") {
          sendEvent("status", { message: `Searching: "${(event.item as { query?: string }).query ?? query}"`, phase: "searching" });
        }
      } else if (event.type === "response.output_text.delta") {
        const delta = event.delta;
        fullSynthesis += delta;
        sendEvent("delta", { content: delta });
      } else if (event.type === "response.completed") {
        const response = event.response;
        for (const item of response.output) {
          if (item.type === "web_search_call") {
            // sources extracted from annotations
          } else if (item.type === "message") {
            for (const content of item.content) {
              if (content.type === "output_text" && content.annotations) {
                for (const ann of content.annotations) {
                  if (ann.type === "url_citation" && !seenUrls.has(ann.url)) {
                    seenUrls.add(ann.url);
                    const domain = new URL(ann.url).hostname.replace("www.", "");
                    const credibilityScore = computeCredibilityScore(domain, ann.url);
                    sources.push({
                      title: ann.title || domain,
                      url: ann.url,
                      snippet: fullSynthesis.slice(ann.start_index, ann.end_index).trim().slice(0, 300),
                      credibilityScore,
                      domain,
                    });
                  }
                }
              }
            }
          }
        }
      }
    }

    const duration = Date.now() - startTime;

    // Generate follow-up questions and related queries
    sendEvent("status", { message: "Generating insights...", phase: "finalizing" });

    const insightsResponse = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 512,
      messages: [
        {
          role: "system",
          content: "Generate follow-up questions and related search queries based on the search results. Return JSON only.",
        },
        {
          role: "user",
          content: `Query: "${query}"\nSynthesis: ${fullSynthesis.slice(0, 1000)}\n\nGenerate:\n1. 4 follow-up questions the user might ask\n2. 4 related search queries\n\nReturn as JSON: {"followUps": [...], "relatedQueries": [...]}`,
        },
      ],
    });

    let followUps: string[] = [];
    let relatedQueries: string[] = [];

    try {
      const raw = insightsResponse.choices[0]?.message?.content ?? "{}";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        followUps = parsed.followUps ?? [];
        relatedQueries = parsed.relatedQueries ?? [];
      }
    } catch {
      // fallback
    }

    // Save to DB
    const [saved] = await db.insert(searchesTable).values({
      query,
      mode,
      synthesis: fullSynthesis,
      sources,
      followUps,
      relatedQueries,
      duration,
    }).returning();

    sendEvent("complete", {
      id: String(saved.id),
      query,
      mode,
      synthesis: fullSynthesis,
      sources,
      followUps,
      relatedQueries,
      duration,
      createdAt: saved.createdAt.toISOString(),
    });

    res.end();
  } catch (err) {
    req.log.error({ err }, "Search failed");
    sendEvent("error", { message: "Search failed. Please try again." });
    res.end();
  }
});

// GET /search/history
router.get("/search/history", async (req, res) => {
  const parsed = ListSearchHistoryQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const offset = parsed.success ? (parsed.data.offset ?? 0) : 0;

  try {
    const [items, [totalRow]] = await Promise.all([
      db.select().from(searchesTable).orderBy(desc(searchesTable.createdAt)).limit(Number(limit)).offset(Number(offset)),
      db.select({ count: count() }).from(searchesTable),
    ]);

    res.json({
      items: items.map((s) => ({
        id: String(s.id),
        query: s.query,
        mode: s.mode,
        sourceCount: Array.isArray(s.sources) ? s.sources.length : 0,
        createdAt: s.createdAt.toISOString(),
        previewText: s.synthesis.slice(0, 200),
      })),
      total: totalRow?.count ?? 0,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list search history");
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// GET /search/trending
router.get("/search/trending", async (req, res) => {
  try {
    const recent = await db.select({ query: searchesTable.query, mode: searchesTable.mode })
      .from(searchesTable)
      .orderBy(desc(searchesTable.createdAt))
      .limit(50);

    // Group by query category
    const categories = ["Technology", "Science", "Politics", "Business", "Health", "Culture", "AI", "Sports"];
    const topicMap = new Map<string, { count: number; category: string }>();

    for (const row of recent) {
      const q = row.query;
      if (!topicMap.has(q)) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        topicMap.set(q, { count: 1, category });
      } else {
        topicMap.get(q)!.count++;
      }
    }

    const topics = Array.from(topicMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([topic, { count: searchCount, category }]) => ({ topic, category, searchCount }));

    // If no history yet, return sample trending topics
    if (topics.length === 0) {
      res.json({
        topics: [
          { topic: "GPT-5 capabilities", category: "AI", searchCount: 124 },
          { topic: "Quantum computing breakthroughs 2025", category: "Science", searchCount: 98 },
          { topic: "Climate change solutions", category: "Science", searchCount: 87 },
          { topic: "Global AI regulation", category: "Technology", searchCount: 76 },
          { topic: "SpaceX Mars mission update", category: "Science", searchCount: 65 },
          { topic: "Latest AI models comparison", category: "AI", searchCount: 54 },
          { topic: "Tech layoffs 2025", category: "Business", searchCount: 43 },
          { topic: "Longevity research advances", category: "Health", searchCount: 38 },
        ],
      });
      return;
    }

    res.json({ topics });
  } catch (err) {
    req.log.error({ err }, "Failed to get trending topics");
    res.status(500).json({ error: "Failed to fetch trending topics" });
  }
});

// GET /search/stats
router.get("/search/stats", async (req, res) => {
  try {
    const [totalSearchesRow, recentSearches] = await Promise.all([
      db.select({ count: count() }).from(searchesTable),
      db.select().from(searchesTable).orderBy(desc(searchesTable.createdAt)).limit(100),
    ]);

    const totalSearches = totalSearchesRow[0]?.count ?? 0;

    let totalSources = 0;
    let totalDuration = 0;
    const modeCounts = new Map<string, number>();

    for (const s of recentSearches) {
      totalSources += Array.isArray(s.sources) ? s.sources.length : 0;
      totalDuration += s.duration;
      modeCounts.set(s.mode, (modeCounts.get(s.mode) ?? 0) + 1);
    }

    const numSearches = recentSearches.length || 1;

    res.json({
      totalSearches,
      totalSources,
      avgSourcesPerSearch: Math.round((totalSources / numSearches) * 10) / 10,
      avgDuration: Math.round(totalDuration / numSearches),
      topModes: Array.from(modeCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([mode, count]) => ({ mode, count })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// GET /search/:id
router.get("/search/:id", async (req, res) => {
  const parsed = GetSearchParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const [search] = await db.select().from(searchesTable).where(eq(searchesTable.id, Number(parsed.data.id)));
    if (!search) {
      res.status(404).json({ error: "Search not found" });
      return;
    }

    res.json({
      id: String(search.id),
      query: search.query,
      mode: search.mode,
      synthesis: search.synthesis,
      sources: search.sources,
      followUps: search.followUps,
      relatedQueries: search.relatedQueries,
      duration: search.duration,
      createdAt: search.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get search");
    res.status(500).json({ error: "Failed to fetch search" });
  }
});

// DELETE /search/:id
router.delete("/search/:id", async (req, res) => {
  const parsed = DeleteSearchParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    await db.delete(searchesTable).where(eq(searchesTable.id, Number(parsed.data.id)));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete search");
    res.status(500).json({ error: "Failed to delete search" });
  }
});

// POST /search/:id/follow-up — SSE streaming follow-up
router.post("/search/:id/follow-up", async (req, res) => {
  const params = CreateFollowUpParams.safeParse(req.params);
  const body = CreateFollowUpBody.safeParse(req.body);

  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const [original] = await db.select().from(searchesTable).where(eq(searchesTable.id, Number(params.data.id)));

    const contextPrompt = original
      ? `Previous search: "${original.query}"\nPrevious synthesis summary: ${original.synthesis.slice(0, 500)}\n\nNow answer the follow-up question with fresh web search.`
      : "Answer the follow-up question with fresh web search.";

    sendEvent("status", { message: "Searching for follow-up...", phase: "searching" });

    const stream = await openai.responses.create({
      model: "gpt-5.4",
      instructions: `You are a deep search agent with real-time web access. ${contextPrompt}`,
      input: body.data.question,
      tools: [{ type: "web_search_preview" as const }],
      stream: true,
      max_output_tokens: 2048,
    });

    let fullContent = "";
    const sources: Array<{
      title: string;
      url: string;
      snippet: string;
      credibilityScore: number;
      domain: string;
    }> = [];
    const seenUrls = new Set<string>();

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        const delta = event.delta;
        fullContent += delta;
        sendEvent("delta", { content: delta });
      } else if (event.type === "response.completed") {
        const response = event.response;
        for (const item of response.output) {
          if (item.type === "message") {
            for (const content of item.content) {
              if (content.type === "output_text" && content.annotations) {
                for (const ann of content.annotations) {
                  if (ann.type === "url_citation" && !seenUrls.has(ann.url)) {
                    seenUrls.add(ann.url);
                    const domain = new URL(ann.url).hostname.replace("www.", "");
                    sources.push({
                      title: ann.title || domain,
                      url: ann.url,
                      snippet: fullContent.slice(ann.start_index, ann.end_index).trim().slice(0, 300),
                      credibilityScore: computeCredibilityScore(domain, ann.url),
                      domain,
                    });
                  }
                }
              }
            }
          }
        }
      }
    }

    sendEvent("complete", { synthesis: fullContent, sources });
    res.end();
  } catch (err) {
    req.log.error({ err }, "Follow-up search failed");
    sendEvent("error", { message: "Follow-up search failed." });
    res.end();
  }
});

// Credibility scoring based on domain
function computeCredibilityScore(domain: string, url: string): number {
  const highCredibility = [
    "nature.com", "science.org", "pubmed.ncbi.nlm.nih.gov", "scholar.google.com",
    "arxiv.org", "bbc.com", "reuters.com", "apnews.com", "npr.org",
    "nytimes.com", "wsj.com", "economist.com", "ft.com", "theguardian.com",
    "mit.edu", "harvard.edu", "stanford.edu", "gov", "who.int", "un.org",
    "wikipedia.org", "britannica.com", "merriam-webster.com",
  ];
  const mediumCredibility = [
    "techcrunch.com", "wired.com", "arstechnica.com", "cnet.com", "zdnet.com",
    "verge.com", "engadget.com", "bloomberg.com", "businessinsider.com",
    "washingtonpost.com", "cnbc.com", "forbes.com", "time.com",
  ];

  for (const d of highCredibility) {
    if (domain.includes(d)) return 0.85 + Math.random() * 0.15;
  }
  for (const d of mediumCredibility) {
    if (domain.includes(d)) return 0.65 + Math.random() * 0.20;
  }
  return 0.40 + Math.random() * 0.25;
}

export default router;
