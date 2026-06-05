# Deploy HelpImTooLazy to CSBIWEB Ubuntu Server

Based on the course Medium guide: Docker + GitHub Actions self-hosted runner + Docker Hub + Neon.

---

## Overview (same flow as the article)

1. **Server**: Ubuntu CSBIWEB + rootless Docker + **self-hosted GitHub runner**
2. **Database**: Neon (`DATABASE_URL`)
3. **CI**: GitHub Actions runs tests on push
4. **CD**: Build image → push Docker Hub → server pulls → `docker compose up`

---

## Part 1 — Server setup (one time)

### 1. Access server

- Open: https://csbiweb-ssh.csbihub.id/
- Sign in with Binus email
- Log in with your lab `server_username` / password

### 2. Enable rootless Docker (if `docker ps` fails)

```bash
dockerd-rootless-setuptool.sh install
# press Ctrl+C when setup finishes

systemctl --user daemon-reexec
systemctl --user daemon-reload
systemctl --user enable --now docker.service
systemctl --user restart docker
docker ps
```

### 3. Install GitHub Actions self-hosted runner

On GitHub repo → **Settings → Actions → Runners → New self-hosted runner** (Linux x64).

On server:

```bash
mkdir -p ~/actions-runner && cd ~/actions-runner
# use the curl + tar commands from GitHub's runner page
./config.sh --url https://github.com/YOUR_ORG/YOUR_REPO --token YOUR_TOKEN
sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status
```

Runner should show **Idle** in GitHub.

---

## Part 2 — Secrets (GitHub repo → Settings → Secrets → Actions)

Add these **Repository secrets** (copy values from your local `.env`):

| Secret | Example / note |
|--------|----------------|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub password or access token |
| `DATABASE_URL` | Neon connection string |
| `NEXT_PUBLIC_FIREBASE_*` | All 7 Firebase client vars |
| `FIREBASE_PROJECT_ID` | Admin |
| `FIREBASE_CLIENT_EMAIL` | Admin |
| `FIREBASE_PRIVATE_KEY` | Full key; paste with real newlines in GitHub |
| `GROQ_API_KEY` | For AI features |
| `GROQ_MODEL` | e.g. `llama-3.3-70b-versatile` |

Also add Firebase **Authorized domain** for your server URL/domain in Firebase Console.

---

## Part 3 — Deploy automatically (after runner + secrets)

Push to `main` or `master`:

```bash
git add .
git commit -m "deploy app"
git push origin master
```

Watch **Actions** tab:

1. `quality` — lint / test
2. `build` — push `YOUR_USERNAME/helpimtoolazy:latest` to Docker Hub
3. `deploy` — runs on **self-hosted** server, pulls image, starts container

On server verify:

```bash
docker ps
docker compose -f docker-compose.prod.yml logs --tail=50 app
```

Open app: `http://YOUR_SERVER_IP:3000` (or domain from lab email).

---

## Part 4 — Manual deploy (without waiting for CI/CD)

If you only want to test on server first:

1. Copy project folder + `.env` to server (SCP / git clone)
2. On server in project folder:

```bash
export DOCKER_USERNAME=your_dockerhub_user
docker compose -f docker-compose.prod.yml up --build -d
docker ps
```

---

## Files in this project

| File | Role |
|------|------|
| `Dockerfile.prod` | Production image build |
| `docker-compose.prod.yml` | Run app on server (port 3000) |
| `.github/workflows/cicd.yml` | Full CI/CD like Medium article |
| `.github/workflows/ci.yml` | Tests only (no deploy) |
| `.env` | Local secrets — **never commit** |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails on Firebase | Ensure GitHub secrets for Firebase + `build.args` in compose |
| `Can't reach database at localhost` | `DATABASE_URL` must be **Neon**, not localhost |
| Google login fails on server | Add server IP/domain to Firebase Authorized domains |
| AI not working | Check `GROQ_API_KEY` in secrets / `.env` |
| `self-hosted` job stuck | Runner not online — check `sudo ./svc.sh status` on server |
