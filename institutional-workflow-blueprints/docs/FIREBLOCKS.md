# Fireblocks setup checklist

Short, consistent list for sandbox + your custom app + webhooks.

---

## 1. Sandbox credentials

- [ ] Log in to [sandbox.fireblocks.io](https://sandbox.fireblocks.io)
- [ ] Generate key pair on your machine:
  ```bash
  openssl req -new -newkey rsa:4096 -nodes \
    -keyout ~/fireblocks_secret.key \
    -out ~/fireblocks_csr.csr \
    -subj "/O=treasury-demo"
  ```
- [ ] Developer Center → API users → Add API user
- [ ] Upload `fireblocks_csr.csr` (`.csr` extension required)
- [ ] Role: **Editor** or **Signer**
- [ ] Copy **API User ID** (UUID) into `.env.local`

---

## 2. Environment variables (server only)

Copy `.env.example` → `.env.local`:

```bash
FIREBLOCKS_API_KEY=your-api-user-uuid
FIREBLOCKS_SECRET_KEY_PATH=/path/to/fireblocks_secret.key
FIREBLOCKS_BASE_PATH=https://sandbox-api.fireblocks.io/v1
FIREBLOCKS_SOURCE_VAULT_ID=0
FIREBLOCKS_ASSET_ETH=ETH_TEST5
```

Never expose these to the browser.

---

## 3. Fund the vault

- [ ] Accounts → Vault **0**
- [ ] Activate **ETH_TEST5** (Sepolia test asset)
- [ ] Copy deposit address
- [ ] Fund from Sepolia faucet (~0.05 ETH_TEST5)

---

## 4. Custom app (local)

- [ ] `npm run dev` (Node 20+)
- [ ] Admin → Enable Fireblocks → Sync vaults
- [ ] Analyst → Create transfer
- [ ] Treasury Manager → Approvals → Approve
- [ ] Confirm TX in Fireblocks console

---

## 5. Deploy to Vercel

- [ ] Push repo to GitHub
- [ ] Import project in Vercel
- [ ] Add all `FIREBLOCKS_*` env vars in Vercel project settings
- [ ] Deploy → note URL: `https://your-app.vercel.app`

---

## 6. Webhooks (live settlement status)

### Register in Fireblocks

- [ ] Sandbox → **Developer Center → Webhooks → Create webhook**
- [ ] Endpoint URL:
  ```
  https://your-app.vercel.app/api/fireblocks/webhook
  ```
- [ ] Enable transaction events:
  - `TRANSACTION_CREATED`
  - `TRANSACTION_STATUS_UPDATED`
  - `TRANSACTION_APPROVAL_STATUS_UPDATED`

### What the app does

- [ ] Fireblocks **POSTs** signed events to `/api/fireblocks/webhook`
- [ ] Server **verifies signature** (sandbox public key)
- [ ] Status saved server-side (`.data/fireblocks-transactions.json`)
- [ ] UI **polls every 5s** + merges status into transfer cards
- [ ] **COMPLETED** → audit log entry + green status badge

### Verify webhook endpoint

```bash
curl https://your-app.vercel.app/api/fireblocks/webhook
```

Returns setup JSON with your webhook URL.

### Check tx status manually

```bash
curl "https://your-app.vercel.app/api/fireblocks/transactions/status?externalTxId=TRX-DEMO-001"
```

---

## 7. API routes (reference)

| Route | Purpose |
|-------|---------|
| `GET /api/fireblocks/status` | Server configured? |
| `GET /api/fireblocks/vaults` | Vault balances |
| `POST /api/fireblocks/transactions` | Submit transfer |
| `GET /api/fireblocks/transactions/status` | Poll / webhook store |
| `GET /api/fireblocks/webhook` | Webhook setup info |
| `POST /api/fireblocks/webhook` | Receive Fireblocks events |

---

## 8. Architecture (one line)

**My custom app** = roles, policy, approval queue, mobile UX, audit  
**Fireblocks** = custody, signing, settlement, TAP, webhooks

---

## 9. CRO pitch (30 sec)

> I built a custom treasury workflow app on mobile. Fireblocks sandbox handles custody and settlement when a manager approves. Webhooks keep the UI in sync as transactions move from submitted to completed.

---

## 10. Troubleshooting

| Problem | Fix |
|---------|-----|
| Invalid signature | Regenerate CSR/key; create new API user |
| No ETH balance | Fund vault with ETH_TEST5 via Sepolia faucet |
| Webhook not firing | Must use HTTPS public URL (Vercel), not LAN IP |
| Status stuck | Check `/api/fireblocks/transactions/status`; confirm webhook events in Fireblocks console |
| Local webhook test | Use ngrok or deploy to Vercel first |

Optional local-only testing (skip signature verify):

```bash
FIREBLOCKS_WEBHOOK_SKIP_VERIFY=true
```

Use only in development.
