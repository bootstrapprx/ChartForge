# Supabase Migration Guide

This project now uses Supabase for the database and authentication. We rely on Supabase CLI migrations instead of `Base.metadata.create_all`.

## Prerequisites
- Supabase CLI installed
- Access to the project `qjqiafkgvagaawwhmcuc`

## CLI Setup
```bash
supabase login
supabase link --project-ref qjqiafkgvagaawwhmcuc
```

## Apply Migrations
```bash
supabase db push
```

This will apply:
- `supabase/migrations/20250209000000_init.sql`
- `supabase/migrations/20250209001000_rls.sql`

## Environment Variables
Backend:
```
SUPABASE_URL=https://qjqiafkgvagaawwhmcuc.supabase.co
SUPABASE_JWT_AUD=authenticated
SUPABASE_JWT_ISSUER=https://qjqiafkgvagaawwhmcuc.supabase.co/auth/v1
DATABASE_URL=postgresql+psycopg2://postgres:<DB_PASSWORD>@db.qjqiafkgvagaawwhmcuc.supabase.co:5432/postgres
DATABASE_SSLMODE=require
```

Frontend (Vite):
```
VITE_SUPABASE_URL=https://qjqiafkgvagaawwhmcuc.supabase.co
VITE_SUPABASE_ANON_KEY=<your anon key>
VITE_API_URL=<your backend base URL>
```

## Notes
- RLS policies are enabled by default; the backend sets `request.jwt.claims` and role for each request.
- Use Supabase Auth for sign-in/sign-up. The backend no longer provides local login endpoints.
