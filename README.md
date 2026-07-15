# LinkVault — Smart Dynamic Redirect Platform

A production-ready dynamic link management platform. Create short links that always keep the same URL while letting you change the destination at any time.

## Tech Stack

| Layer        | Technology                          |
|-------------|-------------------------------------|
| Framework   | Next.js 15+ (App Router)            |
| Language    | TypeScript (strict)                 |
| Styling     | Tailwind CSS + shadcn/ui            |
| Animation   | Framer Motion                       |
| Auth        | Clerk                               |
| Database    | PostgreSQL via Prisma ORM           |
| State       | TanStack Query (React Query)        |
| Validation  | Zod                                 |
| Charts      | Recharts                            |

## Quick Start

### 1. Prerequisites
- Node.js 18+
- PostgreSQL database
- Clerk account → https://clerk.com

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — from Clerk dashboard
- `CLERK_SECRET_KEY` — from Clerk dashboard

### 4. Database Setup
```bash
# Push schema to database
npm run db:push

# Seed with sample data (optional)
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

### 5. Run Development Server
```bash
npm run dev
```

Open http://localhost:3000

---

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── (dashboard)/            # Authenticated layout group
│   │   ├── dashboard/          # Main dashboard pages
│   │   │   ├── page.tsx        # Dashboard home
│   │   │   ├── links/          # Link management
│   │   │   ├── analytics/      # Analytics page
│   │   │   ├── projects/       # Projects page
│   │   │   └── settings/       # User settings
│   │   └── admin/              # Admin panel (admin only)
│   ├── api/                    # API routes
│   │   ├── links/              # CRUD + bulk + history + analytics
│   │   ├── projects/           # Project management
│   │   ├── analytics/          # Dashboard stats + CSV export
│   │   ├── user/               # Profile + settings + API keys
│   │   ├── admin/              # Admin: users, stats, audit logs
│   │   └── webhooks/clerk/     # Clerk user sync webhook
│   ├── [slug]/                 # ← Redirect engine
│   ├── sign-in/                # Clerk sign-in
│   ├── sign-up/                # Clerk sign-up
│   ├── not-found.tsx           # 404 page
│   ├── error.tsx               # 500 error boundary
│   └── page.tsx                # Landing page
│
├── components/
│   ├── ui/                     # shadcn/ui base components
│   ├── dashboard/              # Sidebar, header, stats, charts
│   ├── links/                  # Links table, create form, detail
│   ├── analytics/              # Analytics dashboard + mini charts
│   ├── settings/               # Settings tabs
│   ├── projects/               # Projects grid
│   ├── admin/                  # Admin dashboard
│   ├── redirect/               # Password gate, delay, expired
│   └── providers/              # Theme + Query providers
│
├── hooks/                      # Custom React hooks
│   ├── use-links.ts            # All link mutations/queries
│   └── use-toast.ts            # Toast notifications
│
├── lib/
│   ├── prisma.ts               # Prisma client singleton
│   ├── auth.ts                 # Auth helpers (requireAuth, etc.)
│   ├── analytics.ts            # Visit recording + stats queries
│   ├── audit.ts                # Audit log helpers
│   ├── errors.ts               # Typed error classes + API response helpers
│   ├── hash.ts                 # bcrypt password + API key hashing
│   ├── rate-limit.ts           # In-memory rate limiting
│   ├── utils.ts                # Shared utilities
│   └── validations.ts          # Zod schemas for all inputs
│
├── repositories/               # Data access layer
│   ├── link.repository.ts
│   ├── user.repository.ts
│   └── project.repository.ts
│
└── middleware.ts               # Clerk auth + route protection
```

---

## Features

### Redirect Engine (`/[slug]`)
- Sub-100ms redirects via Next.js server components
- Password protection with bcrypt verification
- Expiry date checking
- Click limit enforcement
- Redirect delay with countdown UI
- UTM parameter pass-through
- Async analytics recording (non-blocking)
- Open Graph meta tags support

### Link Management
- Create / Edit / Delete / Duplicate / Archive links
- Bulk actions (enable, disable, archive, delete)
- Custom or auto-generated slugs
- Search, filter, sort, paginate
- Link history with rollback to any previous destination

### Analytics
- Total / today / monthly / unique clicks
- Top countries, browsers, devices, referrers
- Click-over-time area chart
- CSV export
- Bot filtering

### Authentication & Security
- Clerk authentication with webhook sync
- Role-based access (USER / ADMIN / SUPER_ADMIN)
- API key creation with hashed storage
- Audit logs for all critical actions
- Rate limiting on redirect + API routes
- Secure HTTP headers (CSP, HSTS, X-Frame-Options)
- Input validation with Zod on every endpoint

### Admin Panel
- Platform-wide stats
- User management (ban / unban)
- Audit log viewer
- Recent links overview

---

## API Reference

### Links
| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| GET    | /api/links            | List links           |
| POST   | /api/links            | Create link          |
| GET    | /api/links/:id        | Get link details     |
| PATCH  | /api/links/:id        | Update link          |
| DELETE | /api/links/:id        | Delete link          |
| POST   | /api/links/:id/duplicate | Duplicate link    |
| GET    | /api/links/:id/analytics | Link analytics   |
| GET    | /api/links/:id/history   | History entries  |
| POST   | /api/links/:id/history   | Rollback destination|
| POST   | /api/links/bulk       | Bulk actions         |
| GET    | /api/links/check-slug | Check slug availability|

### Analytics
| Method | Endpoint                    | Description     |
|--------|-----------------------------|-----------------|
| GET    | /api/analytics/dashboard    | Dashboard stats |
| GET    | /api/analytics/export       | Export CSV      |

### User
| Method | Endpoint                | Description     |
|--------|-------------------------|-----------------|
| GET    | /api/user               | Get profile     |
| PATCH  | /api/user               | Update profile  |
| POST   | /api/user               | Sync from Clerk |
| PATCH  | /api/user/settings      | Update settings |
| GET    | /api/user/api-keys      | List API keys   |
| POST   | /api/user/api-keys      | Create API key  |
| DELETE | /api/user/api-keys/:id  | Revoke API key  |

### Admin
| Method | Endpoint                     | Description     |
|--------|------------------------------|-----------------|
| GET    | /api/admin/stats             | Platform stats  |
| GET    | /api/admin/users             | List users      |
| POST   | /api/admin/users/:id/ban     | Ban user        |
| DELETE | /api/admin/users/:id/ban     | Unban user      |
| GET    | /api/admin/audit-logs        | Audit logs      |

---

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

### Database
Use any PostgreSQL provider:
- [Neon](https://neon.tech) — serverless PostgreSQL (free tier)
- [Supabase](https://supabase.com) — free tier available
- [Railway](https://railway.app) — simple deployment

### After Deployment
```bash
# Run migrations
npx prisma migrate deploy

# Or push schema directly
npx prisma db push
```

---

## Make Someone an Admin

1. Find their Clerk user ID from the Clerk dashboard
2. Update their role in the database:

```sql
UPDATE users SET role = 'ADMIN' WHERE clerk_id = 'user_xxx';
```

Or via Prisma Studio (`npm run db:studio`).
