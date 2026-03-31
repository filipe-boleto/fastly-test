# MonetizationOS Fastly Proxy


[MonetizationOS](https://monetizationos.com) powers monetization for human and bot users alike. Use this Fastly Compute edge worker to proxy your website and integrate MonetizationOS Surfaces, enabling seamless monetization experiences for sites served with static HTML.

Read more at [docs.monetizationos.com](https://docs.monetizationos.com).


This Edge Compute Proxy is based on our [cloudflare worker](https://github.com/MonetizationOS/cloudflare-proxy-worker)



---

## Deploy with Fastly

[![Deploy to Fastly](https://deploy.edgecompute.app/button)](https://deploy.edgecompute.app/deploy)

> **Before clicking the Deploy button**, complete Steps 1–3 below. The Cloud Deploy wizard requires the Config Store, Secret Store, and a Compute service to already exist in your Fastly account.

### Step 0 — Create a Fastly Compute Service

The Cloud Deploy wizard deploys into an existing Compute service. If you don't have one yet:

1. Go to the [Fastly Control Panel](https://manage.fastly.com)
2. Click **Compute** in the left sidebar
3. Click **Create a Compute service**
4. Give it a name (e.g. `monetizationos-proxy`) and click **Create**

> Make sure you create a **Compute** service, not a CDN service. These are different service types in Fastly.


### Step 1 — Create the Config Store

In the Fastly Control Panel, go to **Resources → Config Stores → Create a config store**.

Name it exactly **`config`** and add the following items:

| Key | Value |
|---|---|
| `ORIGIN_URL` | Your website's origin URL (e.g. `https://www.example.com`) |
| `SURFACE_SLUG` | Your Surface slug from the MonetizationOS dashboard |
| `AUTHENTICATED_USER_JWT_COOKIE_NAME` | `__session` |
| `ANONYMOUS_SESSION_COOKIE_NAME` | `anon-session-id` |
| `INJECT_SCRIPT_URL` | `https://assets.monetizationos.com/web-components-latest.js` |
| `MONETIZATION_OS_HOST` | `https://api.monetizationos.com` |
| `MONETIZATION_OS_ENDPOINTS_PREFIX` | `/mos-endpoints/` |
| `SURFACE_DECISIONS_IGNORE_PATHS` | Comma-separated regex patterns for paths that should skip surface decisions (optional) |

> The store name must match `CONFIG_STORE_NAME` in `src/env.ts` (default: `config`). You can use a different name as long as you update that constant.

### Step 2 — Create the Secret Store

Go to **Resources → Secret Stores → Create a secret store**.

Name it exactly **`secrets`** and add one item:

| Key | Value |
|---|---|
| `MONETIZATION_OS_SECRET_KEY` | Your Secret Key from the MonetizationOS dashboard, **base64-encoded** |

To encode your key:
```bash
echo -n 'your_secret_key' | base64
```

> The store name must match `SECRET_STORE_NAME` in `src/env.ts` (default: `secrets`). You can use a different name as long as you update that constant.


### Step 3 — Start Deploy

Once the Compute service, Config Store, and Secret Store are created, click the **Deploy to Fastly** button above. The wizard will:
1. Fork this repository to your GitHub account
2. Ask you to confirm the two backends (`origin` and `monetization_api`)
3. Link the service to your existing `config` and `secrets` stores
4. Set up a GitHub Actions workflow for future deploys on push to `main`

---

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) (see `.nvmrc` in parent directory)
- [Fastly CLI](https://developer.fastly.com/learning/tools/cli/) — installed via `pnpm install` as a dev dependency

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure local values

All local config is defined in `fastly.toml` under `[local_server.config_stores.config.contents]`. Update those values to match your environment.

For the secret store, update the base64-encoded value in `fastly.toml`:

```toml
[[local_server.secret_stores.secrets]]
  key = "MONETIZATION_OS_SECRET_KEY"
  data = "<base64-encoded secret key>"
```

To encode your key:

```bash
echo -n 'your_secret_key' | base64
```

### 3. Run locally

```bash
pnpm start          # build + serve at http://127.0.0.1:7676
```

### 4. Run tests

```bash
pnpm test           # run tests in watch mode
pnpm test --run     # run tests once
```

### 5. Type check

```bash
pnpm exec tsc --noEmit
```

### 6. Build

```bash
pnpm run build      # compile TypeScript → bin/main.wasm
```

### 7. Deploy

```bash
pnpm run deploy     # build + publish to Fastly
```
