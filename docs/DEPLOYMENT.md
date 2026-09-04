# Deployment Guide — EVIDENT

## Health Check
`GET /api/health` → `{ "status": "ok" }`

## Production Checklist
1. **Database**: Provision MongoDB (e.g. MongoDB Atlas). Set `MONGO_URL` and `DB_NAME`. Indexes are created automatically on startup.
2. **Secrets**: Generate a strong `JWT_SECRET` (`python -c "import secrets;print(secrets.token_hex(32))"`). Set a strong `ADMIN_PASSWORD`. Never commit `.env`.
3. **Environment**: Set `ENVIRONMENT=production`. This hides internal error details and **disables sandbox payments**.
4. **CORS / URLs**: Set `FRONTEND_URL` to your production frontend origin. Keep `CORS_ORIGINS` restricted (the app uses `FRONTEND_URL` for credentialed CORS).
5. **Storage**: Ensure `EMERGENT_LLM_KEY` is set (used for private object storage). Files are served only through authenticated backend routes.
6. **Payments (Razorpay)**:
   - Create keys in the Razorpay Dashboard.
   - Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.
   - Set `PAYMENT_SANDBOX=false`.
   - Configure a webhook to `POST /api/payments/webhook` (signature verified).
7. **Email (optional)**: Set `EMERGENT_EMAIL_KEY` and `EMAIL_FROM_NAME`. If unset, the app still runs; emails are skipped and logged.
8. **HTTPS**: Required. Auth cookies are `Secure` + `SameSite=None`.
9. **Frontend build**: `cd frontend && yarn build` → serve the static `build/` behind your CDN/host. Set `REACT_APP_BACKEND_URL` to the backend origin at build time.
10. **Backend run**: `uvicorn server:app --host 0.0.0.0 --port 8001` behind a reverse proxy (or the platform's process manager).

## Environment Variables (production)
| Variable | Purpose |
|---|---|
| `MONGO_URL`, `DB_NAME` | Database |
| `JWT_SECRET` | Token signing |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | Seeded super admin |
| `EMERGENT_LLM_KEY` | Private object storage |
| `EMERGENT_EMAIL_KEY`, `EMAIL_FROM_NAME`, `EMAIL_REPLY_TO` | Transactional email |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Payments |
| `PAYMENT_SANDBOX` | `false` in production |
| `FRONTEND_URL`, `CORS_ORIGINS` | CORS / links |
| `ENVIRONMENT` | `production` |
| `MAX_FILE_MB` | Upload size limit |

## What needs external credentials (add before going live)
- **Razorpay** live keys + webhook secret (payments run in sandbox until provided).
- **Email**: Emergent-managed email key (optional; app works without it).
- **MongoDB** production connection string.

## GitHub / Ownership
This is a standard source project. Push to your own GitHub, clone, open in VS Code, set env vars, run backend + frontend independently. No platform lock-in.
