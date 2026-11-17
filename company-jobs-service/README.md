# Compass AI — Company Openings Search Service

Dedicated Python FastAPI microservice wrapping [`python-jobspy`](https://github.com/speedyapply/JobSpy) (`1.4.1`, MIT License) for live job discovery inside Compass AI's **Company Interview Prep** dossier.

## Endpoints

- `GET /health` — Service health check and enabled sources (`indeed`, `naukri`, `linkedin`).
- `POST /api/company-interview/openings/search` — Validates search criteria, queries enabled sources concurrently with per-source isolation, normalizes results, verifies company identity, and applies deterministic rule-based experience classification.

## Local Development

```bash
cd company-jobs-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

Then set `COMPANY_OPENINGS_SERVICE_URL=http://127.0.0.1:8001` (for Express dev proxy) or `VITE_COMPANY_OPENINGS_API_URL=http://127.0.0.1:8001` for Vite.

## Deploying on Render Free

1. Create a new **Web Service** on Render connected to this repository with **Root Directory** set to `company-jobs-service` (or deploy via `render.yaml`).
2. Build Command: `pip install -r requirements.txt`
3. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Copy the Render HTTPS URL (e.g. `https://compass-company-jobs-service.onrender.com`) and set it as GitHub Actions secret/variable `VITE_COMPANY_OPENINGS_API_URL`.

### Render Free Cold-Start Limitation

Render Free web services automatically spin down after **15 minutes of inactivity**. The first search after an idle period can take **~50–60 seconds** while the container boots. The frontend explicitly surfaces a cold-start notice during slow requests and waits up to 65 seconds before timing out.
