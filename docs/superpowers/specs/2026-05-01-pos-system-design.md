# POS System Design — NOOR E-commerce

**Date:** 2026-05-01  
**Status:** Approved  
**Scope:** Complete Point of Sale module integrated into existing Flask/React e-commerce platform  
**Currency:** XOF (West African CFA franc)  
**Market:** Senegal

---

## 1. Overview

Add a full POS module to the existing NOOR e-commerce platform. The POS operates as an isolated PWA-installable module within the same React codebase, backed by dedicated Flask endpoints under `/api/pos/*`. It supports offline operation with automatic sync, thermal receipt printing, SMS/WhatsApp receipts, cash and mobile money payments, shift management, and product returns.

### Roles

| Role | Access |
|------|--------|
| `admin` | Full dashboard + full POS + all sessions/reports |
| `cashier` | POS only + own session history |
| `user` | No POS access |

The `cashier` role is new. Login uses email + 4-6 digit PIN (not full password) for speed at the register.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────┐
│                 FRONTEND (React PWA)                │
│                                                     │
│  /admin/*  ── AdminDashboard (existing)             │
│  /pos/*    ── POSModule (new, fully isolated)       │
│               ├── POSContext (local state only)     │
│               ├── IndexedDB (offline cache)         │
│               └── SyncQueue (offline transactions)  │
└──────────────────────────┬──────────────────────────┘
                           │ HTTP / Background Sync
┌──────────────────────────▼──────────────────────────┐
│                  BACKEND (Flask)                    │
│  /api/* (existing, unchanged)                       │
│  /api/pos/* (new blueprint)                         │
└──────────────────────────┬──────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────┐
│  MySQL — existing tables + 6 new POS tables         │
└─────────────────────────────────────────────────────┘
```

**Key isolation principle:** The POS module has zero interaction with the existing `CartContext`, `AuthContext` (except JWT token), or any existing page component. It manages its own state via `POSContext`.

---

## 3. Database Schema

### 3.1 Modifications to Existing Tables

```sql
-- Add cashier role
ALTER TABLE users 
  MODIFY role ENUM('user', 'admin', 'cashier') DEFAULT 'user';

-- PIN for POS login
ALTER TABLE users ADD COLUMN pos_pin_hash VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN pos_pin_attempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN pos_pin_locked_until TIMESTAMP NULL;

-- Barcode on products
ALTER TABLE products ADD COLUMN barcode VARCHAR(100) UNIQUE NULL;
ALTER TABLE products ADD INDEX idx_barcode (barcode);
```

### 3.2 New Tables

```sql
-- Cashier shift / register session
CREATE TABLE pos_sessions (
  id VARCHAR(36) PRIMARY KEY,
  cashier_id VARCHAR(36) NOT NULL,
  opening_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  expected_cash DECIMAL(12,2) DEFAULT 0,      -- computed: opening + cash sales + cash_in - cash_out - change_given
  closing_balance DECIMAL(12,2) NULL,          -- entered by cashier at close
  cash_difference DECIMAL(12,2) NULL,          -- closing_balance - expected_cash
  status ENUM('open','closed') DEFAULT 'open',
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  notes TEXT,
  FOREIGN KEY (cashier_id) REFERENCES users(id),
  INDEX idx_cashier_session (cashier_id),
  INDEX idx_status (status)
);

-- POS sale transaction
CREATE TABLE pos_transactions (
  id VARCHAR(36) PRIMARY KEY,
  transaction_number VARCHAR(30) UNIQUE NOT NULL,  -- POS-20260501-CASH01-001
  session_id VARCHAR(36) NOT NULL,
  cashier_id VARCHAR(36) NOT NULL,
  customer_name VARCHAR(255) NULL,
  customer_phone VARCHAR(20) NULL,                 -- for SMS receipt
  subtotal DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  payment_method ENUM('cash','wave','orange_money','mixed') NOT NULL,
  cash_tendered DECIMAL(12,2) DEFAULT 0,
  mobile_tendered DECIMAL(12,2) DEFAULT 0,
  mobile_reference VARCHAR(100) NULL,              -- Wave/OM confirmation code
  change_given DECIMAL(12,2) DEFAULT 0,
  status ENUM('completed','refunded','partially_refunded','voided') DEFAULT 'completed',
  synced BOOLEAN DEFAULT TRUE,                     -- FALSE = created offline, not yet confirmed
  client_created_at TIMESTAMP NULL,                -- timestamp from client device (offline)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES pos_sessions(id),
  FOREIGN KEY (cashier_id) REFERENCES users(id),
  INDEX idx_session_txn (session_id),
  INDEX idx_cashier_txn (cashier_id),
  INDEX idx_txn_number (transaction_number)
);

-- Line items of each POS transaction
CREATE TABLE pos_transaction_items (
  id VARCHAR(36) PRIMARY KEY,
  transaction_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NULL,                     -- nullable: product may be deleted later
  product_name VARCHAR(255) NOT NULL,              -- snapshot at time of sale
  product_barcode VARCHAR(100) NULL,               -- snapshot
  unit_price DECIMAL(12,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  discount DECIMAL(12,2) DEFAULT 0,
  line_total DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (transaction_id) REFERENCES pos_transactions(id),
  INDEX idx_txn_items (transaction_id)
);

-- Return / refund record
CREATE TABLE pos_returns (
  id VARCHAR(36) PRIMARY KEY,
  return_number VARCHAR(30) UNIQUE NOT NULL,
  original_transaction_id VARCHAR(36) NOT NULL,
  session_id VARCHAR(36) NOT NULL,
  cashier_id VARCHAR(36) NOT NULL,
  refund_method ENUM('cash','wave','orange_money') NOT NULL,
  total_refunded DECIMAL(12,2) NOT NULL,
  reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (original_transaction_id) REFERENCES pos_transactions(id),
  INDEX idx_original_txn (original_transaction_id)
);

-- Line items of each return
CREATE TABLE pos_return_items (
  id VARCHAR(36) PRIMARY KEY,
  return_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity_returned INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  line_total DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (return_id) REFERENCES pos_returns(id)
);

-- Manual cash in/out during a session (not from sales)
CREATE TABLE pos_cash_movements (
  id VARCHAR(36) PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL,
  cashier_id VARCHAR(36) NOT NULL,
  type ENUM('in','out') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES pos_sessions(id),
  INDEX idx_session_movements (session_id)
);
```

---

## 4. Backend API — `/api/pos/*`

New file: `backend/routes/pos.py`, registered at `/api/pos` in `app.py`.

New middleware: `cashier_or_admin_required` — accepts JWT with role `cashier` or `admin`.

### 4.1 Sessions (Shifts)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/pos/sessions` | cashier\|admin | Open session with opening balance |
| GET | `/pos/sessions/current` | cashier\|admin | Get caller's active open session |
| PUT | `/pos/sessions/:id/close` | cashier\|admin | Close session, enter counted cash |
| GET | `/pos/sessions/:id/report` | cashier\|admin | Z-report for session (PDF or JSON) |
| GET | `/pos/sessions` | admin | List all sessions with filters |

**Business rules:**
- One cashier can have only one `open` session at a time.
- Closing session computes `cash_difference = closing_balance - expected_cash`.
- `expected_cash = opening_balance + sum(cash_tendered) + sum(cash_in_movements) - sum(cash_out_movements) - sum(change_given)`.

### 4.2 Transactions (Sales)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/pos/transactions` | cashier\|admin | Create single sale (online) |
| POST | `/pos/transactions/batch` | cashier\|admin | Sync batch of offline transactions |
| GET | `/pos/transactions` | cashier\|admin | List (cashier sees own only, admin sees all) |
| GET | `/pos/transactions/:id` | cashier\|admin | Detail + items |
| POST | `/pos/transactions/:id/receipt` | cashier\|admin | Resend receipt (SMS/WhatsApp) |

**On transaction creation:**
1. Validate session is open and belongs to caller.
2. For each item: decrement `products.stock`. If stock goes negative, accept and log alert.
3. Insert `pos_transactions` + `pos_transaction_items`.
4. Update `pos_sessions.expected_cash`.
5. Return transaction with `transaction_number`.

**Batch sync (offline):**
- Server deduplicates on `id` (UUID PRIMARY KEY) — idempotent.
- Processes transactions in `client_created_at` order.
- Returns per-transaction status (`synced`, `conflict`).

### 4.3 Returns

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/pos/returns` | cashier\|admin | Create return linked to original transaction |
| GET | `/pos/returns/:id` | cashier\|admin | Return detail |

**On return creation:**
1. Verify original transaction exists and belongs to accessible sessions.
2. Verify quantities returned ≤ quantities sold (minus prior returns).
3. Restore `products.stock` for returned items.
4. Log stock movement via `stock_sync.increase_stock_from_return`.
5. Update original transaction `status` if fully refunded.

### 4.4 Cash Movements

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/pos/cash-movements` | cashier\|admin | Manual cash in/out |
| GET | `/pos/cash-movements/:session_id` | cashier\|admin | List movements for session |

### 4.5 Products (POS-optimized)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/pos/products` | cashier\|admin | Fast search by name or barcode (returns id, name, price, stock, barcode, images) |
| GET | `/pos/products/barcode/:code` | cashier\|admin | Single product by barcode |

Returns only fields needed for POS — no heavy specifications JSON.

### 4.6 Reports (Admin only)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/pos/reports/daily` | admin | All sessions + totals for a date |
| GET | `/pos/reports/cashier/:id` | admin | Sales by cashier over date range |

### 4.7 Cashier Management (Admin only)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/pos/cashiers` | admin | List users with role cashier or admin |
| POST | `/pos/cashiers` | admin | Create cashier account with PIN |
| PUT | `/pos/cashiers/:id/pin` | admin | Reset cashier PIN |
| PUT | `/pos/cashiers/me/pin` | cashier\|admin | Cashier changes own PIN |

### 4.8 POS Authentication

```
POST /api/pos/auth/login
  Body: { email, pin }
  Returns: { token, user: { id, name, role } }
  
  - PIN verified against pos_pin_hash (bcrypt)
  - After 5 failed attempts: pos_pin_locked_until = NOW() + 15 minutes
  - Token JWT payload includes claim: { scope: "pos" }
  - Token expiry: 12 hours (matches a full working day)
```

The `cashier_or_admin_required` middleware validates:
1. Valid JWT signature
2. Token not expired
3. Role is `cashier` or `admin`
4. (For cashier-scoped tokens) scope claim = "pos"

---

## 5. Frontend Module Structure

```
src/
└── pos/
    ├── index.tsx                  Route entry (/pos/*)
    ├── POSApp.tsx                 Full-screen layout, no global Navbar
    ├── context/
    │   └── POSContext.tsx         POS-only global state (session, cart, network)
    ├── db/
    │   └── posDB.ts               IndexedDB schema + CRUD helpers (via `idb` library)
    ├── sync/
    │   └── syncQueue.ts           Flush pending_txns when back online
    ├── hooks/
    │   ├── usePOSSession.ts       Active shift state
    │   ├── usePOSCart.ts          Cart isolated from e-commerce cart
    │   ├── useBarcode.ts          Listen to rapid keydown (scanner emulates keyboard)
    │   └── useOfflineSync.ts      navigator.onLine events + sync trigger
    ├── pages/
    │   ├── POSLogin.tsx           Email + PIN login
    │   ├── POSOpenSession.tsx     Enter opening balance to start shift
    │   ├── POSMain.tsx            Main sale screen (split: product grid | cart)
    │   ├── POSPayment.tsx         Payment modal (cash/Wave/OM/mixed)
    │   ├── POSReceipt.tsx         Receipt preview + print trigger + SMS send
    │   ├── POSReturn.tsx          Search transaction → select items → confirm return
    │   ├── POSCloseSession.tsx    Count cash → submit → view Z-report
    │   └── POSHistory.tsx         Current session sales list
    └── components/
        ├── ProductGrid.tsx        Touch-friendly product tiles
        ├── ProductSearch.tsx      Text search + barcode result display
        ├── CartPanel.tsx          Right-side cart with quantity controls
        ├── NumPad.tsx             On-screen numpad for quantity entry (tablet mode)
        ├── PaymentSplit.tsx       Mixed payment amount inputs
        ├── SessionBadge.tsx       Session status + online/offline indicator
        └── receiptPrinter.ts      Generates ESC/POS-compatible HTML for thermal printer
```

### Main Screen Layout (POSMain.tsx)

```
┌─────────────────────────────────┬─────────────────────┐
│  🔍 Search / Scan barcode       │  CART               │
│                                 │  ─────────────────  │
│  ┌─────┐ ┌─────┐ ┌─────┐      │  Produit A x2 6 000 │
│  │     │ │     │ │     │      │  Produit B x1 3 500 │
│  │ IMG │ │ IMG │ │ IMG │      │  ─────────────────  │
│  │Name │ │Name │ │Name │      │  Total  9 500 XOF   │
│  │Price│ │Price│ │Price│      │                     │
│  └─────┘ └─────┘ └─────┘      │  [ ENCAISSER  ]     │
│                                 │  [ VIDER      ]     │
│  [RETOUR]     [HISTORIQUE]      │                     │
└─────────────────────────────────┴─────────────────────┘
  📶 En ligne  |  Talla — Shift 08:00  |  14:32
```

---

## 6. Offline Strategy

### How it works

**When online:**
- Sale → `POST /api/pos/transactions` → success → also cached in IndexedDB.

**When offline:**
- Sale → written to IndexedDB `pending_txns` store with `synced: false`.
- UUID generated client-side (prevents duplicate on re-sync).
- Local product cache decremented (optimistic stock update).
- Receipt printed immediately from local data.
- `transaction_number` generated locally: `POS-{YYYYMMDD}-{cashier_code}-{seq}`.

**Back online:**
- `useOfflineSync` detects `navigator.onLine = true`.
- `syncQueue.flush()` calls `POST /api/pos/transactions/batch`.
- Server deduplicates by UUID (UNIQUE PRIMARY KEY).
- Server responds per-transaction: `{id, status: 'synced'|'conflict', detail}`.
- Conflicts (negative stock) are logged, admin alerted, transaction still accepted.

### IndexedDB Stores

| Store | Contents | Refresh |
|-------|----------|---------|
| `products` | All products (id, name, price, stock, barcode, images) | Every 5 min if online; on session open |
| `pending_txns` | Offline transactions awaiting sync | Cleared after successful sync |
| `current_session` | Active session data | Updated on each sale |
| `sync_log` | Sync attempt history | Last 50 entries |

### Transaction Numbering (Offline-safe)

```
Format: POS-{YYYYMMDD}-{cashier_short_code}-{seq_padded_4}
Example: POS-20260501-TALL-0023

- cashier_short_code: first 4 chars of cashier name, uppercase
- seq: per-cashier per-day counter stored in IndexedDB, reset at midnight
- Server accepts client-generated numbers (no server auto-increment)
- UNIQUE constraint on transaction_number catches duplicates on sync
```

---

## 7. Receipt System

### Three delivery methods

**A — Screen display (always)**
- `POSReceipt.tsx` shown after every sale.
- Shows: shop name, date/time, cashier, items, totals, payment method, change given, transaction number.

**B — Thermal printer**
- `receiptPrinter.ts` generates HTML formatted for 58mm/80mm paper.
- Triggered via `window.print()` with a print-only CSS stylesheet.
- No special driver needed — works via browser print dialog or AirPrint.
- ESC/POS commands optional future enhancement via Web USB API.

**C — SMS / WhatsApp**
- Customer phone entered optionally at sale (or at payment modal).
- Backend endpoint `POST /pos/transactions/:id/receipt`:
  - Generates receipt text server-side.
  - Sends via Twilio SMS (existing Twilio config in project) or WhatsApp Business API.
- Message template fixed server-side — no user-supplied content in SMS body (prevents injection).

---

## 8. Security Model

### Authentication

| Control | Implementation |
|---------|---------------|
| POS login | Email + PIN (bcrypt-hashed), not full password |
| Brute force PIN | 5 attempts → 15-min lockout stored in DB |
| JWT scope | POS tokens carry `scope: "pos"` claim |
| Token expiry | 12h (one working day) |
| Route guard (frontend) | `<POSRoute>` component checks role before render |
| Route guard (backend) | `cashier_or_admin_required` decorator on all `/api/pos/*` |

### Data Integrity

| Risk | Mitigation |
|------|------------|
| Modifying past transactions | `pos_transactions` is immutable — no PUT/DELETE endpoints |
| Cross-cashier data access | Server filters by `cashier_id` for cashier role; admin unrestricted |
| Offline replay attack | UUID PRIMARY KEY + server deduplication on batch sync |
| Negative stock from offline | Accepted + stock_movements log + admin alert |
| SMS injection via customer phone | Phone sanitized server-side; message body is fixed template |
| Receipt token reuse | Receipt SMS endpoint rate-limited per transaction (max 3 sends) |
| Unauthorized Z-report | Z-report computed 100% server-side; cashier gets own session only |

### Frontend Guards

```typescript
// All /pos/* routes wrapped in:
<POSRoute allowedRoles={['cashier', 'admin']}>
  <Component />
</POSRoute>

// POSRoute checks:
// 1. localStorage has valid POS token (not expired)
// 2. User role is cashier or admin
// 3. Redirects to /pos/login if not satisfied
```

---

## 9. Implementation Phases

The implementation is split into 4 phases to enable incremental deployment:

**Phase 1 — Foundation**
- DB migrations (new tables + column changes)
- Backend: POS auth + sessions + cashier management
- Frontend: POS login, open session, close session pages
- POSContext + IndexedDB setup

**Phase 2 — Core POS**
- Backend: transactions + product search endpoints
- Frontend: POSMain screen, product grid, cart, payment modal
- Online sale flow end-to-end working

**Phase 3 — Offline + Receipts**
- IndexedDB product cache + sync queue
- Offline sale flow
- Receipt screen + thermal print + SMS

**Phase 4 — Returns + Reports**
- Backend + frontend return flow
- Z-reports + admin daily/cashier reports
- Barcode scanner hook
- Admin cashier management page

---

## 10. Dependencies to Add

**Frontend:**
- `idb` — IndexedDB wrapper (typed, promise-based)
- `vite-plugin-pwa` — PWA manifest + service worker

**Backend:**
- No new pip packages needed (Twilio already in requirements.txt)

**Infrastructure:**
- Thermal printer: standard browser print (no server-side driver)
- SMS: Twilio (already configured)
- WhatsApp: Twilio WhatsApp API (same credentials, different endpoint)
