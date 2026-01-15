# Redis + BullMQ (OTP Email Queue) — Noob Friendly Guide

This project uses Redis + BullMQ to send OTP/verification emails in the background (queue), instead of blocking the API request.

## 0) Requirements (Windows)

- Docker Desktop installed
- Docker Desktop running (very important)
- Node.js + npm installed

## 1) Start Redis with Docker (recommended)

From the project root:

```bash
docker compose -f compose.yaml up -d redis
```

Check Redis container:

```bash
docker compose -f compose.yaml ps
```

You should see `marcus-redis` as `running`.

Test Redis:

```bash
docker exec -it marcus-redis redis-cli ping
```

Expected output:

```text
PONG
```

If `docker exec` gives 500 error, Docker Desktop is not running properly. Open Docker Desktop and wait until it becomes “Running”.

## 2) Run the Nest server (local dev)

Make sure your `.env` has these (local run):

```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

Install deps and start:

```bash
npm install
npm run start:dev
```

## 3) How the OTP email queue works (in this codebase)

- Your API endpoints generate OTP and save it in DB.
- Instead of sending email directly, it adds a job to the `emails` queue.
- A BullMQ worker in the same Nest app consumes jobs and sends email using nodemailer.

Code references:
- Producer used by user service: [email.producer.ts](file:///d:/Projects/marcus-backend-nestjs/src/queue/producers/email.producer.ts)
- Worker/processor: [email.processors.ts](file:///d:/Projects/marcus-backend-nestjs/src/queue/processors/email.processors.ts)
- User service enqueues emails: [user.service.ts](file:///d:/Projects/marcus-backend-nestjs/src/user/user.service.ts)

## 4) Trigger an email job (easy test)

Any of these will enqueue an email:
- `POST /user` (registration)
- `POST /user/login`
- `POST /user/resend-login-otp`
- `POST /user/forgotten-password`

Important:
- If SMTP env is missing, the job will fail (you will see it in dashboard). That’s normal.

SMTP env needed:

```env
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_FROM=your_email@gmail.com
```

## 5) Open BullMQ Dashboard (Bull Board)

This project exposes Bull Board at:

- `http://localhost:3000/admin/queues`

It requires an **ADMIN JWT**:
- Add request header: `Authorization: Bearer <ADMIN_ACCESS_TOKEN>`

### How to get an admin token (dev shortcut)

If you already have an admin user in database:
- Call `POST /user/temp-login` with body `{ "email": "admin@example.com" }`
- It returns `access_token`

Then open dashboard URL in browser and use a browser extension like “ModHeader” to set the Authorization header.

## 6) What you should see in Bull Board

- Queues:
  - `activities`
  - `events`
  - `emails`
  - `notifications`
- After you trigger a job, `emails` queue will show:
  - `waiting` → `active` → `completed`
  - or `failed` if SMTP is missing/wrong

## 7) Run everything with Docker (optional)

If your `.env` also has `DATABASE_URL` and other required configs, you can run:

```bash
docker compose -f compose.yaml up -d --build
```

Then open:
- API: `http://localhost:3000`
- Bull Board: `http://localhost:3000/admin/queues`

