# SiteScout AI

## Overview

SiteScout AI is an autonomous SEO optimization platform powered by multi-agent AI systems. The application analyzes websites, identifies SEO issues, and provides intelligent suggestions for optimization. It features a risk-based approval system where low-risk changes can be auto-fixed while high-risk changes require manual approval. The platform includes real-time agent activity logs, audit tracking, and performance monitoring.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**Routing**: Wouter for client-side routing (lightweight alternative to React Router)

**UI Component Library**: Radix UI primitives with shadcn/ui styling system
- Material Design 3 (Material You) adapted for enterprise data applications
- Custom design tokens defined in CSS variables for theming
- Dark/light mode support with theme persistence

**State Management**: 
- TanStack Query (React Query) for server state management
- Local React state for UI-specific state
- Custom hooks for authentication and theme management

**Styling**:
- Tailwind CSS with custom configuration
- Inter font for primary text, JetBrains Mono for code/URLs
- Custom HSL-based color system with CSS variables
- Design system follows spacing primitives: 2, 4, 6, 8, 12, 16 (rem-based)

**Key Design Patterns**:
- Component composition with Radix UI primitives
- Custom wrapper components (WebsiteCard, AgentBadge, HealthScore, etc.)
- Reusable form components with react-hook-form and zod validation
- Responsive layouts using CSS Grid and Flexbox

### Backend Architecture

**Runtime**: Node.js with TypeScript

**Web Framework**: Express.js
- Custom middleware for request logging
- Session-based authentication via express-session
- JSON body parsing with raw body preservation for webhooks

**API Design**: RESTful endpoints with conventional HTTP methods
- `/api/auth/*` - Authentication endpoints
- `/api/websites` - Website CRUD operations
- `/api/audits` - SEO audit management
- `/api/issues` - Issue tracking and approval
- `/api/agent-logs` - AI agent activity logs
- `/api/changes` - Change history and rollbacks

**Build System**: 
- Vite for frontend bundling
- esbuild for server bundling with selective dependency bundling
- Custom build script that bundles frequently-used dependencies to reduce cold start times

**Development Environment**:
- Vite dev server with HMR in middleware mode
- Replit-specific plugins for development tooling
- Separate development and production configurations

### Data Storage

**Database**: PostgreSQL

**ORM**: Drizzle ORM
- Type-safe database queries
- Schema-first design with migrations
- Zod integration for runtime validation

**Schema Design**:

**Core Tables**:
- `users` - User accounts (required for Replit Auth)
- `sessions` - Session storage (required for Replit Auth with connect-pg-simple)
- `websites` - Tracked websites with health scores
- `audits` - SEO audit records with status tracking
- `issues` - Individual SEO issues with severity and risk levels
- `changes` - Applied changes with rollback capability
- `agent_logs` - AI agent activity and reasoning logs
- `agent_memory` - Persistent agent context and learnings

**Enums**:
- `severity` - Issue severity levels (critical, high, medium, low)
- `issue_status` - Issue workflow states (pending, approved, rejected, fixed, auto_fixed)
- `risk_level` - Change risk classification (high, medium, low)
- `agent_type` - AI agent types (strategy, audit, content, fix, ranking)
- `audit_status` - Audit workflow states (pending, running, completed, failed)

**Relationships**:
- Websites → Users (many-to-one)
- Audits → Websites (many-to-one)
- Issues → Audits (many-to-one)
- Changes → Issues (one-to-one)
- Agent Logs → Websites and Audits (many-to-one)
- Agent Memory → Websites (many-to-one)

**Storage Layer**: 
- Abstracted storage interface (`IStorage`) in `server/storage.ts`
- Implements CRUD operations for all entities
- Uses Drizzle ORM for query building

### Authentication & Authorization

**Provider**: Replit Auth (OpenID Connect)
- OIDC discovery flow
- Passport.js strategy integration
- Session-based authentication with PostgreSQL session store

**Session Management**:
- 7-day session TTL
- HTTP-only, secure cookies
- PostgreSQL-backed session storage using connect-pg-simple

**User Model**:
- User records created/updated on authentication
- Profile information from OIDC claims (email, name, profile image)
- User ID from OIDC subject claim

**Protected Routes**:
- All `/api/*` endpoints (except auth endpoints) require authentication
- `isAuthenticated` middleware validates session
- Frontend redirects unauthenticated users to landing page

### AI Agent System

**Architecture**: Multi-agent orchestration system

**Agent Types**:
1. **Strategy Agent** - Plans audit approach and coordinates other agents
2. **Audit Agent** - Crawls websites and identifies SEO issues
3. **Content Agent** - Analyzes content quality and generates improvements
4. **Fix Agent** - Applies approved changes to websites
5. **Ranking Agent** - Monitors search performance and suggests optimizations

**Orchestrator Pattern** (`AgentOrchestrator` class):
- Manages agent lifecycle and coordination
- Logs agent thoughts, reasoning, and actions
- Handles audit workflow from crawling to analysis to fix application

**Crawler**:
- Fetches and parses web pages
- Extracts SEO-relevant data (title, meta tags, headings, content)
- Supports internal link discovery for multi-page audits
- Configurable page limits

**SEO Analyzer**:
- Rule-based issue detection (missing/short/long titles, meta descriptions, etc.)
- Severity and risk classification
- Auto-fix eligibility determination
- Health score calculation based on issue distribution

**AI Engine** (Optional OpenAI Integration):
- Uses GPT-4o for intelligent suggestions when API key is provided
- Falls back to rule-based suggestions without API key
- Generates context-aware improvements with reasoning and confidence scores
- Agent thought generation for transparency

## External Dependencies

### Third-Party Services

**OpenAI API** (Optional):
- Model: GPT-4o
- Purpose: Generate intelligent SEO suggestions and agent reasoning
- Graceful degradation: Falls back to rule-based suggestions without API key

**Replit Platform Services**:
- Authentication via OIDC
- PostgreSQL database provisioning
- Session storage

### Key NPM Packages

**Frontend**:
- `@tanstack/react-query` - Server state management and caching
- `wouter` - Lightweight routing
- `@radix-ui/*` - Headless UI component primitives
- `react-hook-form` - Form state management
- `zod` - Schema validation
- `date-fns` - Date formatting and manipulation
- `lucide-react` - Icon library
- `tailwindcss` - Utility-first CSS framework
- `class-variance-authority` - Variant-based component styling

**Backend**:
- `express` - Web framework
- `drizzle-orm` - PostgreSQL ORM
- `passport` - Authentication middleware
- `openid-client` - OIDC client for Replit Auth
- `express-session` - Session middleware
- `connect-pg-simple` - PostgreSQL session store
- `pg` - PostgreSQL client
- `openai` - OpenAI API client (optional)

**Build Tools**:
- `vite` - Frontend bundler with HMR
- `esbuild` - Fast server bundling
- `tsx` - TypeScript execution for development
- `drizzle-kit` - Database migration tool

### Database

**PostgreSQL** (provisioned via Replit):
- Connection via `DATABASE_URL` environment variable
- Connection pooling with `pg.Pool`
- Required tables include `sessions` and `users` for authentication

### Environment Variables

**Required**:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `REPL_ID` - Replit environment identifier (for OIDC)

**Optional**:
- `OPENAI_API_KEY` - Enable AI-powered suggestions
- `ISSUER_URL` - OIDC issuer URL (defaults to Replit)
- `NODE_ENV` - Environment mode (development/production)