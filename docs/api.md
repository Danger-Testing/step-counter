# Step Counter API

Base URL: `https://step-counter-mocha.vercel.app`

---

## Link flow (full example)

### 1. iPhone requests a link code

```bash
curl -s -X POST https://step-counter-mocha.vercel.app/api/link-code \
  -H "Content-Type: application/json" \
  -d '{"appUserId":"marc"}'
```

```json
{
  "code": "381942",
  "expiresAt": "2026-04-20T18:30:00.000Z"
}
```

Code is valid for 10 minutes. Show it to the user in the app.

---

### 2. Roblox sends the code + player ID

Called from a Roblox server script when the player types their code in-game.

```bash
curl -s -X POST https://step-counter-mocha.vercel.app/api/link-roblox \
  -H "Content-Type: application/json" \
  -d '{"robloxUserId":"123456789","code":"381942"}'
```

```json
{ "ok": true, "appUserId": "marc" }
```

Errors:
- `404` — code not found
- `409` — code expired or already used

---

### 3. Roblox fetches world data

```bash
curl -s "https://step-counter-mocha.vercel.app/api/world?robloxUserId=123456789"
```

```json
{
  "robloxUserId": "123456789",
  "appUserId": "marc",
  "steps": 8421,
  "mapConfig": {
    "trees": 12,
    "tower": true
  }
}
```

Errors:
- `400` — missing robloxUserId
- `404` — Roblox account not linked

---

### 4. iPhone POSTs step count

```bash
curl -s -X POST https://step-counter-mocha.vercel.app/api/checkin \
  -H "Content-Type: application/json" \
  -d '{"appUserId":"marc","steps":8421}'
```

```json
{ "ok": true, "appUserId": "marc", "steps": 8421 }
```

---

## Map config tiers

| Steps       | Trees | Tower |
|-------------|-------|-------|
| < 2,000     | 1     | no    |
| < 5,000     | 4     | no    |
| < 8,000     | 8     | no    |
| < 12,000    | 12    | yes   |
| 12,000+     | 20    | yes   |

---

## Supabase schema

```sql
create table checkins (
  app_user_id text primary key,
  steps       integer not null default 0,
  updated_at  timestamptz default now()
);

create table link_codes (
  code        text primary key,
  app_user_id text not null,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz default now()
);

create table roblox_links (
  roblox_user_id text primary key,
  app_user_id    text not null,
  linked_at      timestamptz default now()
);
```
