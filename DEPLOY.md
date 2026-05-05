# Deploying Blaqgraphics Backend

This project is ready for a simple Node backend deploy.

## Recommended host

Render is still a good fit for this project, but on the free plan you should use Brevo's email API instead of SMTP because Render free blocks outbound SMTP ports.

## Before deploy

1. Push the folder to a GitHub repository.
2. Make sure `.env` is NOT committed.
3. Keep `render.yaml` in the project root.
4. Create a free Brevo account.
5. Generate a Brevo API key.
6. Add and verify a sender email in Brevo.

## Render steps

1. Create a new GitHub repo and push this project.
2. In Render, click `New` > `Blueprint`.
3. Connect the repo.
4. Render will detect `render.yaml`.
5. Fill these environment variables in Render:
   - `PUBLIC_BASE_URL`
   - `BREVO_API_KEY`
   - `BREVO_SENDER_EMAIL`
   - `BREVO_SENDER_NAME`
   - `QUOTE_TO_EMAIL`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
6. Deploy.
7. After deploy, set `PUBLIC_BASE_URL` to your real Render URL and redeploy once.

## Optional SMTP fallback

SMTP variables are still supported for local development or paid hosts, but free Render should use Brevo API delivery.

## Health check

Use `/healthz`.

## Important note about file storage

`data/quotes.json` is fine for local development, but hosted filesystems can be ephemeral. Your quote emails are the important durable delivery path. If you want server-side quote history to survive restarts, the next step is moving quotes to a database.

## Railway

A `railway.toml` file is also included if you prefer Railway instead of Render.
