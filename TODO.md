# Security vulnerability review — PlateAI

**Review date:** 2026-07-02  
**Baseline:** `main` after merge of PR #6 (`3b59faf`)  
**Scope:** Authentication, authorization, API abuse, secrets handling, data exposure, DoS, mobile/web config.

Statuses: `PENDING` → work not done · `DONE` → fixed in this branch (with timestamps).

---

## Findings

### AUTH-01 — Password hashes returned to clients
- **Severity:** Critical
- **Status:** DONE
- **Opened:** 2026-07-02T14:18:33Z
- **Closed:** 2026-07-02T14:24:38Z
- **Where:** `server/src/modules/auth/authController.ts` register/login responses return full Prisma `user` including `password`.
- **Risk:** Offline cracking of bcrypt hashes; credential stuffing follow-on.
- **Fix plan:** Strip `password` (and other secrets) from all auth API responses.

### AUTH-02 — Plaintext password logged on login
- **Severity:** Critical
- **Status:** DONE
- **Opened:** 2026-07-02T14:18:33Z
- **Closed:** 2026-07-02T14:24:38Z
- **Where:** `authController.login` → `console.log(email, password)`.
- **Risk:** Credentials in log aggregators, backups, support terminals.
- **Fix plan:** Remove password logging entirely; log only non-sensitive metadata (e.g. email domain / success).

### AUTH-03 — JWT has no expiry
- **Severity:** High
- **Status:** DONE
- **Opened:** 2026-07-02T14:18:33Z
- **Closed:** 2026-07-02T14:24:38Z
- **Where:** `server/src/utils/jwt.ts` `jwt.sign(payload, SECRET)` with no `expiresIn`.
- **Risk:** Stolen tokens valid forever.
- **Fix plan:** Sign with `{ userId }` + configurable `expiresIn` (default 7d); validate SECRET presence/strength at boot.

### AUTH-04 — Auth middleware unused / cookie-only
- **Severity:** Critical
- **Status:** DONE
- **Opened:** 2026-07-02T14:18:33Z
- **Closed:** 2026-07-02T14:24:38Z
- **Where:** `server/src/middlewares/auth.ts` only reads `req.cookies.token`; not applied to meals/AI. Mobile sends `Authorization: Bearer`.
- **Risk:** All protected resources effectively public; Bearer tokens never accepted.
- **Fix plan:** Accept Bearer **or** cookie; attach `req.userId`; apply middleware to meals + AI (except health).

### AUTH-05 — Mass assignment on registration
- **Severity:** High
- **Status:** DONE
- **Opened:** 2026-07-02T14:18:33Z
- **Closed:** 2026-07-02T14:24:38Z
- **Where:** `prisma.user.create({ data: { ...user, password: hash } })`.
- **Risk:** Client-controlled unexpected fields / future privilege fields.
- **Fix plan:** Explicit allow-list of profile fields + required email/password validation.

### IDOR-01 — Meals API unauthenticated & client-supplied userId
- **Severity:** Critical
- **Status:** DONE
- **Opened:** 2026-07-02T14:18:33Z
- **Closed:** 2026-07-02T14:24:38Z
- **Where:** `mealsRouter` / `mealsController` — no auth; create uses `req.body.userId`; list by arbitrary `:userId`.
- **Risk:** Read/write any user's meal history and meal images (PII/health data).
- **Fix plan:** Require auth; bind create/list/get to authenticated user; reject cross-user access.

### ABUSE-01 — AI endpoints unauthenticated
- **Severity:** Critical
- **Status:** DONE
- **Opened:** 2026-07-02T14:18:33Z
- **Closed:** 2026-07-02T14:24:38Z
- **Where:** `/ai/*` except health is open (Groq/IBM cost + data exfil via model prompts).
- **Risk:** Billing abuse, resource exhaustion, unrestricted model use.
- **Fix plan:** Require JWT on all AI mutations; keep `/ai/health` and `/health` public for probes.

### ABUSE-02 — No rate limiting on auth or AI
- **Severity:** High
- **Status:** DONE
- **Opened:** 2026-07-02T14:18:33Z
- **Closed:** 2026-07-02T14:24:38Z
- **Where:** Express app has no rate limiter.
- **Risk:** Credential stuffing, AI cost attacks, DoS.
- **Fix plan:** `express-rate-limit` on `/auth` (strict) and `/ai` (moderate); document env knobs.

### DOS-01 — 100mb JSON body limit globally
- **Severity:** Medium
- **Status:** DONE
- **Opened:** 2026-07-02T14:18:33Z
- **Closed:** 2026-07-02T14:24:38Z
- **Where:** `server.ts` `bodyParser.json({ limit: '100mb' })`.
- **Risk:** Memory exhaustion with large POSTs.
- **Fix plan:** Default lower limit (e.g. 12mb) via env `JSON_BODY_LIMIT`; STT still stream-capped separately.

### CONFIG-01 — Hardcoded production host in clients / core
- **Severity:** Medium
- **Status:** DONE
- **Opened:** 2026-07-02T14:18:33Z
- **Closed:** 2026-07-02T14:24:38Z
- **Where:** `mobile/lib/axios.config.ts`, `web/src/axios.config.ts`, `cook_meal_service.py` image URL, TTS historical hardcoding.
- **Risk:** Accidental traffic to shared host; no env flexibility; supply-chain of wrong backend.
- **Fix plan:** Env-driven base URLs (`EXPO_PUBLIC_API_URL`, web env, `MEAL_IMAGE_SEARCH_URL`).

### SEC-01 — Weak / missing JWT secret not validated at boot
- **Severity:** High
- **Status:** DONE
- **Opened:** 2026-07-02T14:18:33Z
- **Closed:** 2026-07-02T14:24:38Z
- **Where:** Server starts even if `SECRET` missing/short (signing becomes insecure/undefined).
- **Risk:** Forged tokens if secret empty/default.
- **Fix plan:** Fail fast on boot if SECRET missing or too short (unless `ALLOW_INSECURE_DEV=true`).

### SEC-02 — Registration input validation missing
- **Severity:** Medium
- **Status:** DONE
- **Opened:** 2026-07-02T14:18:33Z
- **Closed:** 2026-07-02T14:24:38Z
- **Where:** No email format / password minimum checks server-side.
- **Risk:** Junk accounts, weak passwords.
- **Fix plan:** Basic email regex + min password length server-side.

---

## Tracking notes
- Items will flip to **DONE** with **Closed** timestamps as fixes land in this branch.
- Out of scope for this pass (documented only): full gRPC mTLS mesh, WAF, managed secrets rotation, removing demo seed password (dev-only by design).


---

## Resolution log

All findings above were remediated on branch `security/harden-api-auth-and-abuse-controls` at **2026-07-02T14:24:38Z**.

| ID | Outcome |
|----|---------|
| AUTH-01 | Password field stripped via `publicUser()` on register/login |
| AUTH-02 | Removed plaintext password logging |
| AUTH-03 | JWT signed with `expiresIn` (default 7d) + structured payload |
| AUTH-04 | Bearer **or** cookie auth; middleware on meals + AI |
| AUTH-05 | Registration field allow-list |
| IDOR-01 | Meals bound to `req.userId`; cross-user 403 |
| ABUSE-01 | JWT required on `/ai/*` (health public) |
| ABUSE-02 | `express-rate-limit` on `/auth` and `/ai` |
| DOS-01 | Default JSON body limit `12mb` (`JSON_BODY_LIMIT`) |
| CONFIG-01 | Env-driven API/image URLs (mobile/web/core) |
| SEC-01 | Boot-time SECRET validation (override only with `ALLOW_INSECURE_DEV`) |
| SEC-02 | Server-side email + min password length |
