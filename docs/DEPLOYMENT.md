# Deployment Guide — HelpImTooLazy

This document describes steps to build, run, and deploy the application using the provided production Dockerfile and Compose configuration.

Local production-like run (build image and run Compose):

```bash
# build and run production services (local)
docker compose -f docker-compose.prod.yml up --build -d

# check status
docker compose -f docker-compose.prod.yml ps

# view logs
docker compose -f docker-compose.prod.yml logs -f app
```

Common post-deploy steps:
- Run database migrations: `npx prisma migrate deploy` against the production `DATABASE_URL`.
- Run seed (if needed and safe): `npx prisma db seed`.
- Verify endpoints: open `https://<host>/api/health` (if health route exists) and primary UI routes.

CI / Registry deployment checklist:
- Build image and tag: `docker build -f Dockerfile.prod -t ghcr.io/<org>/helpimtoolazy:<tag> .`
- Push to registry: `docker push ghcr.io/<org>/helpimtoolazy:<tag>`
- Configure host environment with required env vars (see `.env.example`). Avoid committing secrets.
- On host: `docker run -d --env-file .env --network host ghcr.io/<org>/helpimtoolazy:<tag>` or use `docker-compose` with `docker-compose.prod.yml`.

Smoke tests (post-deploy):
- Check that `/` or `/dashboard` returns 200.
-- Run a small integration test hitting `/api/ai/chat` (requires `GROQ_API_KEY` set for the AI service (Jessalyne)).

Rollback plan:
- Keep previous image tags available in registry.
- On failure, stop current containers and redeploy previous tag.

Security notes:
-- Keep `FIREBASE_PRIVATE_KEY` and the AI API key out of VCS. Use secret managers when available.
- Rotate keys via provider console and update host env. Limit scope where possible.
