# PayTech Payment Activation Design

**Date:** 2026-05-12
**Status:** Approved

## Summary

Activate the existing (but disabled) PayTech online payment flow. Fix 4 bugs in `backend/routes/payments.py`, enable the "Payer en ligne" button in checkout, fix the success page to read order data from `localStorage`, and add a cancel-order endpoint that restores stock.

Testing scope: redirect flow only (no IPN — `BACKEND_URL=http://localhost:8000`, PayTech cannot reach localhost). IPN code is fixed for correctness but will only fire in production.

---

## Section 1: Backend (`backend/routes/payments.py`)

### Fix 1 — `order_id` missing from `custom_field`

`request_payment()` generates `order_id` but passes `json.dumps(data)` as `custom_field` to PayTech — `data` is the raw frontend payload with no `order_id`. The IPN handler then does `custom_field.get('order_id')` → `None` → returns "IPN KO - Missing order_id".

Fix: inject `order_id` into `custom_field` before sending:
```python
custom_field_data = {**data, "order_id": order_id}
payload["custom_field"] = json.dumps(custom_field_data)
```

### Fix 2 — `payment_method` absent from orders INSERT

The `INSERT INTO orders` in `request_payment()` does not set `payment_method`. Fix: add `payment_method='paytech'` to the INSERT.

### Fix 3 — IPN `sale_complete` creates duplicate order

`payment_ipn()` on `sale_complete` calls `create_order_from_data(custom_field)`, which INSERTs a new order with a new UUID. The order already exists. Fix: replace with UPDATEs on the existing order:

```python
execute_query(
    "UPDATE orders SET status='confirmed', payment_status='paid', payment_method='paytech' WHERE id=%s",
    (order_id,), commit=True
)
execute_query(
    "UPDATE payments SET status='paid' WHERE payment_ref=%s",
    (ref_command,), commit=True
)
```

### Fix 4 — IPN `sale_canceled` does not restore stock or update order

Current code only updates `payments.status`. Fix: also update `orders` and restore stock:

```python
execute_query(
    "UPDATE orders SET status='cancelled', payment_status='failed' WHERE id=%s",
    (order_id,), commit=True
)
execute_query(
    "UPDATE payments SET status='canceled' WHERE payment_ref=%s",
    (ref_command,), commit=True
)
# fetch order_items and call increase_stock for each
items = execute_query("SELECT product_id, quantity FROM order_items WHERE order_id=%s", (order_id,), fetch_all=True)
for item in items:
    execute_query("UPDATE products SET stock = stock + %s WHERE id=%s",
                  (item['quantity'], item['product_id']), commit=True)
```

### New endpoint — `POST /api/payments/cancel-order/<order_id>`

Called by the frontend cancel page. No auth required (order_id is a UUID, unguessable). Actions:
1. Verify order exists and status is `'pending'`
2. `UPDATE orders SET status='cancelled', payment_status='failed'`
3. Fetch `order_items` for the order
4. Restore stock: `UPDATE products SET stock = stock + quantity WHERE id = product_id` for each item
5. Return `{"success": true}`

If order not found or already cancelled: return `{"success": true}` (idempotent).

---

## Section 2: Frontend

### `Checkout.tsx`

- Remove "Hors service" badge and disabled state from the "Payer en ligne" card
- Remove `pointer-events-none` / `opacity` / `cursor-not-allowed` if present
- Before `window.location.href = response.redirect_url`, save to localStorage:
  ```ts
  localStorage.setItem('pendingPayment', JSON.stringify({
    orderId: response.order_id,
    amount: finalTotal,
  }))
  ```

### `Payment-succes.tsx`

Replace `location.state` read with `localStorage` read:

```ts
useEffect(() => {
  const raw = localStorage.getItem('pendingPayment')
  if (raw) {
    const parsed = JSON.parse(raw)
    setOrderId(parsed.orderId)
    setAmount(parsed.amount)
    localStorage.removeItem('pendingPayment')
  }
}, [])
```

Display: order ID + formatted amount in XOF + "Voir mes commandes" and "Accueil" buttons.

### `Payment-cancel.tsx`

On mount, read `orderId` from `localStorage` and call the cancel endpoint:

```ts
useEffect(() => {
  const raw = localStorage.getItem('pendingPayment')
  if (raw) {
    const { orderId } = JSON.parse(raw)
    api.post(`/payments/cancel-order/${orderId}`).catch(() => {})
    localStorage.removeItem('pendingPayment')
  }
}, [])
```

Display: annulation message + "Retour au panier" button (cart is preserved).

---

## File Change Summary

| File | Change |
|------|--------|
| `backend/routes/payments.py` | Fix custom_field, fix IPN handlers, add cancel-order endpoint |
| `src/pages/Checkout.tsx` | Enable online payment button, save to localStorage before redirect |
| `src/pages/Payment-succes.tsx` | Read order data from localStorage instead of location.state |
| `src/pages/Payment-cancel.tsx` | Call cancel-order endpoint on mount, clear localStorage |

## Out of Scope

- IPN production testing (requires public BACKEND_URL)
- Switching `env` from `"test"` to `"prod"` (production deployment concern)
- Admin payment dashboard
- Partial refunds
