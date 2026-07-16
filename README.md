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

Use inside services that already know the user: auth, payments, account management, etc. The purpose shifts from "is this a bot?" to **"is something suspicious happening for this user?"** — credential stuffing, account takeover, account sharing, logins from a new geo.

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

#### Linking `validate` and `risk` events

When the same request is evaluated at two layers — for example, once at the edge (`type: "validate"`) and then again inside a domain service (`type: "risk"`) — BotBye can link both events and display them as a single event in the dashboard.

**Step 1 — edge layer** (gateway, middleware, or route handler): run `validate` and capture `botbye_result`:

```javascript
const edgeResult = await evaluate({
  type: "validate",
  request: {
    request: req,
    // "x-botbye-token" is an example — pass the token from wherever you store it
    token: req.headers["x-botbye-token"],
  },
});
const edgeBotbyeResult = edgeResult.botbye_result;
// Pass edgeBotbyeResult downstream — a request header, function argument, shared context, etc.
```

**Step 2 — domain service** (auth, payment, account management): pass it as `botbyeResult` in the `risk` call:

```javascript
const riskResult = await evaluate({
  type: "risk",
  request: { ip },
  event: {
    type: "login",
    status: loginSucceeded ? "SUCCESSFUL" : "FAILED",
  },
  user: {
    accountId: userId,
    email,
  },
  botbyeResult: edgeBotbyeResult,
});
```

`botbye_result` is optional in the response — if it is absent, omit `botbyeResult` and the events will be recorded independently.

---

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
      botbye_result?: string;
    }
  | {
      decision: "ALLOW" | "BLOCK" | "CHALLENGE";
      botbye_result?: string;
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
  "signals": ["AutomationTool"]
}
```

Allowed:

```json
{
  "request_id": "f77b2abd-c5d7-44f0-be4f-174b04876583",
  "decision": "ALLOW",
  "risk_score": 0.05,
  "scores": { "bot": 0.05, "ato": 0.02 },
  "signals": []
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
  "challenge": { "type": "CAPTCHA", "token": "..." }
}
```

Invalid `serverKey`:

```json
{
  "decision": "ALLOW",
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

## Anti-Phishing

BotBye's anti-phishing detects look-alike sites that clone your pages to steal credentials. This integration serves the detection **catcher** from your own origin, so the BotBye domain stays hidden from the client.

- [Anti-Phishing Protection overview](https://botbye.com/docs/anti-phishing/overview)
- [Why a server-side integration is needed](https://botbye.com/docs/anti-phishing/overview#server-integration)

Anti-phishing is identified by its own `clientKey` (available in your Phishing Project in the Dashboard), not the server key used by `evaluate`, so it is configured separately.

### Init

Call `phishing.init` once at application startup, before serving any catcher requests.

```javascript
import { phishing } from "@botbye/express";

phishing.init({
  // clientKey from your Phishing Project on the Admin Dashboard
  clientKey: "00000000-0000-0000-0000-000000000000",
});
```

### Configuration

| Option | Type | Required | Description |
|---|---|---|---|
| `clientKey` | `string` | Yes | `clientKey` from your Phishing Project on the Admin Dashboard |
| `url` | `string` | No | Override BotBye API endpoint (default: `https://verify.botbye.com`) |
| `logger.level` | `"error" \| "warn" \| "info" \| "debug" \| "log"` | No | Log level (default: `"info"`) |
| `logger.logger` | `TLogger` | No | Custom logger instance implementing `{ error, warn, info, debug, log }` |
| `timeouts.fetchCatcher` | `number` | No | Timeout in milliseconds for each `fetchCatcher` call |

### Usage

Anti-phishing needs **two routes on your own origin**, each proxied through `fetchCatcher`:

- **SVG route** — serves the SVG catcher. This is the URL your [client](https://botbye.com/docs/anti-phishing/integrations/client/js-tag#getcatcher-options) passes to `getCatcher({ url })`.
- **PNG route** — serves the PNG that the SVG references (via `innerPngUrl`).

The paths are arbitrary — name the routes however you like. Pass the raw request as `request` and the `format`. For the SVG, `innerPngUrl` must be the **absolute URL** of your PNG route — the browser loads that PNG directly from your origin.

```javascript
import { phishing } from "@botbye/express";

// Absolute URL of your PNG endpoint — the SVG catcher references it through innerPngUrl.
const PNG_CATCHER_URL = "https://your-site.example/botbye-catcher.png";

// Endpoint 1 — SVG catcher (this URL goes into the catcher element on your pages)
app.get("/botbye-catcher.svg", async (req, res) => {
  const catcher = await phishing.fetchCatcher({
    request: req,
    format: "svg",
    innerPngUrl: PNG_CATCHER_URL, // absolute URL of the PNG endpoint below
  });

  res.status(catcher.status).set(catcher.headers).send(Buffer.from(catcher.body));
});

// Endpoint 2 — companion PNG the SVG above references via innerPngUrl (PNG_CATCHER_URL)
app.get("/botbye-catcher.png", async (req, res) => {
  const catcher = await phishing.fetchCatcher({ request: req, format: "png" });

  res.status(catcher.status).set(catcher.headers).send(Buffer.from(catcher.body));
});
```

We recommend embedding the **SVG catcher**: it is designed to keep tracking even when a phishing site copies all of your assets to its own infrastructure (the PNG route exists because the SVG catcher relies on it).

#### Multiple instances

`phishing` is a ready default instance. Use `phishingFactory()` to create isolated instances for multiple projects.

```javascript
import { phishingFactory } from "@botbye/express";

const phishing = phishingFactory();
phishing.init({ clientKey: "00000000-0000-0000-0000-000000000000" });
```

## Documentation

- Web: https://botbye.com/docs/server-side/node-js/express
- Markdown (for AI tools and agents): https://botbye.com/docs/server-side/node-js/express.md
