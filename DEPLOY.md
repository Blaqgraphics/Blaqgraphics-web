# Deploying Blaqgraphics Backend

This project is ready for a simple Node backend deploy.

## Recommended host

Render is the easiest fit for this project because it can run the Node server and serve the public site from one web service.

## Before deploy

1. Push the folder to a GitHub repository.
2. Make sure `.env` is NOT committed.
3. Keep `render.yaml` in the project root.

## Render steps

1. Create a new GitHub repo and push this project.
2. In Render, click `New` > `Blueprint`.
3. Connect the repo.
4. Render will detect `render.yaml`.
5. Fill these environment variables in Render:
   - `PUBLIC_BASE_URL`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_SECURE`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `QUOTE_TO_EMAIL`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
6. Deploy.
7. After deploy, set `PUBLIC_BASE_URL` to your real Render URL and redeploy once.

## Health check

Use `/healthz`.

## Important note about file storage

`data/quotes.json` is fine for local development, but hosted filesystems can be ephemeral. Your quote emails are the important durable delivery path. If you want server-side quote history to survive restarts, the next step is moving quotes to a database.

## Railway

A `railway.toml` file is also included if you prefer Railway instead of Render.
