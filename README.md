# @botbye/express

[BotBye!](https://botbye.com) integration for Node.js [Express](https://expressjs.com/) applications.

Full documentation: https://botbye.com/docs/server-side/node-js/express

## Install

```bash
npm i @botbye/express
```

```bash
yarn add @botbye/express
```

Requires `express >= 4` as a peer dependency.

## Configuration

Call `init` once at application startup, before any routes are defined:

```javascript
import { init } from "@botbye/express";

init({
  // Use your project server-key
  serverKey: "00000000-0000-0000-0000-000000000000",
});
```

### `init` options

| Option | Type | Required | Description |
|---|---|---|---|
| `serverKey` | `string` | Yes | Server key from your BotBye project |
| `url` | `string` | No | Override BotBye API endpoint (default: `https://verify.botbye.com`) |
| `logger.level` | `"error" \| "warn" \| "info" \| "debug" \| "log"` | No | Log level (default: `"info"`) |
| `logger.logger` | `TLogger` | No | Custom logger instance implementing `{ error, warn, info, debug, log }` |
| `timeouts.evaluate` | `number` | No | Timeout in milliseconds for each `evaluate` call |

## Usage

Call `evaluate` in route handlers where bot protection is needed. It accepts an event object describing what you know about the request and the context around it, and returns a promise that resolves to a decision.

There are three event types — `validate`, `risk`, and `full` — each suited for a different layer of your application.

---

### `validate` — edge-level bot check

Use at the edge — API gateway, route handler, middleware — when you just want to know: **was this request made by a bot?** No user or domain context needed.

**Event fields:**

```typescript
{
  type: "validate";

  request:
    // Option A: pass the Express request object directly — SDK extracts everything automatically
    | { request: express.Request; token?: string | null }
    // Option B: construct request info manually
    | { ip: string; headers: Record<string, string>; requestMethod?: string | null; requestUri?: string | null; token?: string | null };

  customFields?: Record<string, string>;

  config?: {
    bypassBotValidation?: boolean | null;
  };
}
```

The SDK extracts IP, headers, method, and URI from the Express request automatically. You can also pass request info manually — see Option B above. The `token` is a one-time token from the [BotBye client-side SDK](https://botbye.com/docs/client-side/npm-module) that contains information about the user's device. Pass whatever the client sent; if no token is received, the decision will be `"BLOCK"`.

```javascript
import { evaluate } from "@botbye/express";

app.post("/api/submit", async (req, res) => {
  const result = await evaluate({
    type: "validate",
    request: {
      request: req,
      // "x-botbye-token" is an example — pass the token from wherever you store it
      token: req.headers["x-botbye-token"],
    },
  });

  if (result.decision === "BLOCK") {
    return res.status(403).json({ error: "Forbidden" });
  }

  // proceed normally
});
```

---

### `risk` — domain-level risk scoring

Use inside services that already know the user: auth, payments, account management. The purpose shifts from "is this a bot?" to **"is something suspicious happening for this user?"** — credential stuffing, account takeover, account sharing, logins from a new geo.

**Event fields:**

```typescript
{
  type: "risk";

  request:
    // Only ip is needed at this level
    | { ip: string; headers?: Record<string, string>; requestMethod?: string | null; requestUri?: string | null; token?: string | null }
    // Express request object also accepted if convenient
    | { request: express.Request };

  event: {
    type: string;   // e.g. "login", "password_change", "checkout"
    status: "ATTEMPTED" | "SUCCESSFUL" | "FAILED" | "UNKNOWN";
  };

  user: {
    accountId: string;
    username?: string | null;
    email?: string | null;
    phone?: string | null;
  };

  customFields?: Record<string, string>;
  botbyeResult?: string;

  config?: {
    bypassBotValidation?: boolean | null;
  };
}
```

`event` and `user` are the key fields here — they define what action is being performed and who is performing it, which is what drives the risk score. `ip` is equally important: BotBye tracks which IPs access the account to detect patterns like account sharing, credential stuffing, and suspicious geo logins. Pass it directly as `{ ip }`, or pass the Express request object if that's more convenient.

```javascript
import { evaluate } from "@botbye/express";

// Inside an auth service, after a login attempt
async function onLoginAttempt({ ip, userId, email, loginSucceeded }) {
  const result = await evaluate({
    type: "risk",
    request: {
      ip,
      headers: {},
    },
    event: {
      type: "login",
      status: loginSucceeded ? "SUCCESSFUL" : "FAILED",
      // "SUCCESSFUL" | "FAILED" | "ATTEMPTED" | "UNKNOWN"
    },
    user: {
      accountId: userId,
      email,
    },
  });

  if (result.decision === "BLOCK") {
    // Lock account, trigger MFA, send alert, etc.
  }
}
```

### `full` — edge check and domain scoring in one call

Use when you have all context at once: raw request, token, user, and event. A login endpoint is a typical example — it receives the HTTP request and immediately knows the user and outcome.

**Event fields:**

```typescript
{
  type: "full";

  request:
    | { request: express.Request; token?: string | null }
    | { ip: string; headers: Record<string, string>; requestMethod?: string | null; requestUri?: string | null; token?: string | null };

  event: {
    type: string;
    status: "ATTEMPTED" | "SUCCESSFUL" | "FAILED" | "UNKNOWN";
  };

  user: {
    accountId: string;
    username?: string | null;
    email?: string | null;
    phone?: string | null;
  };

  customFields?: Record<string, string>;

  config?: {
    bypassBotValidation?: boolean | null;
  };
}
```

Equivalent to running `validate` and `risk` in a single call.

```javascript
import { evaluate } from "@botbye/express";

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await findUser(email);
  const loginSucceeded = user && (await checkPassword(user, password));

  const result = await evaluate({
    type: "full",
    request: {
      request: req,
      token: req.headers["x-botbye-token"], // example header — pass the token from wherever you store it
    },
    event: {
      type: "login",
      status: loginSucceeded ? "SUCCESSFUL" : "FAILED",
    },
    user: {
      accountId: user?.id ?? "unknown",
      email,
    },
  });

  if (result.decision === "BLOCK") {
    return res.status(403).json({ error: "Forbidden" });
  }

  // proceed normally
});
```

---

## Response

`evaluate` always returns a `Promise<TEvaluationResult>`:

```typescript
type TEvaluationResult =
  | {
      decision: "ALLOW" | "BLOCK" | "CHALLENGE";
      request_id: string;
      risk_score: number;
      scores: Record<string, number>;
      signals: string[];
      config: { bypass_bot_validation: boolean };
    }
  | {
      decision: "ALLOW" | "BLOCK" | "CHALLENGE";
      config: { bypass_bot_validation: boolean };
      error: { message: string };
    };
```

Check `result.decision` to decide how to handle the request:

- `"ALLOW"` — request appears legitimate, proceed normally
- `"BLOCK"` — bot or suspicious activity detected, block the request
- `"CHALLENGE"` — uncertain, consider issuing a CAPTCHA, MFA or additional verification step

When the response contains an `error` field, BotBye could not evaluate the request (e.g. invalid server key). In that case `decision` defaults to `"ALLOW"` so that a misconfiguration does not block real users — but you should monitor and fix the underlying error.

### Response examples

Blocked (bot detected):

```json
{
  "request_id": "f77b2abd-c5d7-44f0-be4f-174b04876583",
  "decision": "BLOCK",
  "risk_score": 0.95,
  "scores": { "bot": 0.95 },
  "signals": ["AutomationTool"],
  "config": { "bypass_bot_validation": false }
}
```

Allowed:

```json
{
  "request_id": "f77b2abd-c5d7-44f0-be4f-174b04876583",
  "decision": "ALLOW",
  "risk_score": 0.05,
  "scores": { "bot": 0.05, "ato": 0.02 },
  "signals": [],
  "config": { "bypass_bot_validation": false }
}
```

Challenge:

```json
{
  "request_id": "f77b2abd-c5d7-44f0-be4f-174b04876583",
  "decision": "CHALLENGE",
  "risk_score": 0.65,
  "scores": { "bot": 0.65 },
  "signals": ["SuspiciousFingerprint"],
  "challenge": { "type": "captcha", "token": "..." },
  "config": { "bypass_bot_validation": false }
}
```

Invalid `serverKey`:

```json
{
  "decision": "ALLOW",
  "config": { "bypass_bot_validation": true },
  "error": { "message": "[BotBye] Bad Request: Invalid Server Key" }
}
```

## Middleware usage

You can wrap `evaluate` into reusable Express middleware to protect multiple routes:

```javascript
import { evaluate } from "@botbye/express";

async function botProtection(req, res, next) {
  const result = await evaluate({
    type: "validate",
    request: {
      request: req,
      token: req.headers["x-botbye-token"], // example header — pass the token from wherever you store it
    },
  });

  if (result.decision === "BLOCK") {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
}

app.post("/protected", botProtection, (req, res) => {
  res.json({ ok: true });
});
```

## Advanced: multiple instances

Use `factory` to create independent SDK instances (useful when protecting multiple projects from one service):

```javascript
import { factory } from "@botbye/express";

const sdk = factory();

sdk.init({
  // Use your project server-key
  serverKey: "00000000-0000-0000-0000-000000000000",
});

const result = await sdk.evaluate({
  type: "validate",
  request: { request: req, token },
});
```

## Dev utilities

```javascript
import { dev } from "@botbye/express";

// Change log verbosity at runtime
dev.setLoggerLevel("debug"); // "error" | "warn" | "info" | "debug" | "log"
```

## Documentation

- Web: https://botbye.com/docs/server-side/node-js/express
- Markdown (for AI tools and agents): https://botbye.com/docs/server-side/node-js/express.md
