# NexusSearch — Deep Web Search Agent

## Overview

NexusSearch is a top-end AI-powered deep web search agent that rivals and surpasses ChatGPT, Perplexity, and Grok. It uses OpenAI GPT-5 with real-time web search tools to synthesize comprehensive, sourced answers in streaming fashion.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI GPT-5 via Replit AI Integrations (web_search_preview tool)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui

## Features

- **3 Search Modes**: Quick (fast), Deep (comprehensive), Expert (exhaustive multi-angle analysis)
- **Real-time Streaming**: SSE-based streaming of AI synthesis as it's generated
- **Source Attribution**: Credibility-scored sources with domain reputation system
- **Follow-up Questions**: Context-aware follow-up searching on any result
- **Search History**: Full history with searchable past queries
- **Trending Topics**: Live trending intelligence feed
- **System Telemetry**: Stats on total searches, sources, avg response times

## Architecture

- `artifacts/search-agent/` — React + Vite frontend (NexusSearch UI)
- `artifacts/api-server/` — Express 5 backend with SSE streaming search
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod validation schemas
- `lib/db/` — PostgreSQL schema via Drizzle ORM
- `lib/integrations-openai-ai-server/` — OpenAI SDK wrapper

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## API Endpoints

- `POST /api/search` — SSE streaming deep search
- `GET /api/search/history` — search history
- `GET /api/search/trending` — trending topics
- `GET /api/search/stats` — search statistics
- `GET /api/search/:id` — get specific search result
- `DELETE /api/search/:id` — delete from history
- `POST /api/search/:id/follow-up` — SSE streaming follow-up search

## Environment Variables

- `AI_INTEGRATIONS_OPENAI_BASE_URL` — Auto-set by Replit AI Integrations
- `AI_INTEGRATIONS_OPENAI_API_KEY` — Auto-set by Replit AI Integrations
- `DATABASE_URL` — PostgreSQL connection string (auto-set by Replit DB)
- `SESSION_SECRET` — Session secret

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
