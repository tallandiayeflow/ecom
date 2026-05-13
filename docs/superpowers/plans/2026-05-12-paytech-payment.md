# PayTech Payment Activation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 4 bugs in the PayTech backend, add a cancel-order endpoint, enable the checkout online payment button, and fix the success/cancel pages to read order data from localStorage.

**Architecture:** Backend-only changes in `backend/routes/payments.py` (bug fixes + new route). Frontend changes in 3 pages (Checkout, Payment-succes, Payment-cancel) — no new components needed. Data hand-off between checkout and post-payment pages uses `localStorage` key `pendingPayment`.

**Tech Stack:** Flask + PyMySQL (backend), React 18 + TypeScript + shadcn/ui (frontend), PayTech test environment (`env: "test"`).

---

## File Map

| File | Change |
|------|--------|
| `backend/routes/payments.py` | Fix custom_field, fix IPN handlers, add cancel endpoint |
| `src/pages/Checkout.tsx` | Enable online payment button, save to localStorage |
| `src/pages/Payment-succes.tsx` | Read order data from localStorage |
| `src/pages/Payment-cancel.tsx` | Call cancel-order API on mount, clear localStorage |

---

### Task 1: Fix backend `payments.py` — 4 bugs + cancel endpoint

**Files:**
- Modify: `backend/routes/payments.py`

**Context:**
- `execute_query(sql, params, fetch_one=True)` — returns one dict or None
- `execute_query(sql, params, fetch_all=True)` — returns list of dicts
- `execute_query(sql, params, commit=True)` — INSERT/UPDATE/DELETE
- No test suite — verify by running the backend and calling the API manually

- [ ] **Step 1: Replace `request_payment()` — inject `order_id` into `custom_field` and add `payment_method` to orders INSERT**

Replace lines 118–193 of `backend/routes/payments.py` with:

```python
    try:
        execute_query(
            """
            INSERT INTO orders (id, user_id, total, discount, final_total,
                                status, shipping_address, voucher_code,
                                loyalty_points_earned, payment_method, created_at)
            VALUES (%s, %s, %s, %s, %s, 'pending', %s, %s, %s, 'paytech', NOW())
            """,
            (order_id, user_id, total, discount, final_total,
             shipping_address, voucher_code, loyalty_points),
            commit=True
        )

        for item in items:
            item_id = str(uuid.uuid4())
            product_name = item.get('name', '')
            product_image = ''
            selected_color = item.get('selectedColor')
            selected_size = item.get('selectedSize')
            product = execute_query(
                "SELECT image_url, images FROM products WHERE id=%s",
                (item['productId'],),
                fetch_one=True
            )
            if product:
                try:
                    images = json.loads(product.get('images', '[]'))
                    product_image = images[0] if images else product.get('image_url', '')
                except Exception:
                    product_image = product.get('image_url', '')
            execute_query(
                """
                INSERT INTO order_items (id, order_id, product_id, product_name,
                    product_image, price, quantity, selected_color, selected_size)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (item_id, order_id, item['productId'], product_name, product_image,
                 item['price'], item['quantity'], selected_color, selected_size),
                commit=True
            )

        if voucher_code:
            execute_query(
                "UPDATE vouchers SET used_count = used_count + 1 WHERE code=%s",
                (voucher_code,),
                commit=True
            )

        decrease_stock_from_order(items, user_id, reason=f"Commande #{order_id[:8]}")

        if user_id and loyalty_points > 0:
            execute_query(
                "UPDATE users SET loyalty_points = loyalty_points + %s WHERE id=%s",
                (loyalty_points, user_id),
                commit=True
            )

    except Exception as e:
        print(f"Erreur création commande PayTech : {e}")
        return jsonify({'success': 0, 'message': 'Erreur création commande'}), 500

    item_name = f"Commande {order_id}"
    ref_command = f'ORDER_{order_id}_{int(time.time())}'

    # Inject order_id so IPN can find the existing order
    custom_field_data = {**data, "order_id": order_id}

    payload = {
        "item_name": item_name,
        "item_price": final_total,
        "currency": "XOF",
        "ref_command": ref_command,
        "command_name": item_name,
        "env": "test",
        "ipn_url": f"{BACKEND_URL}/api/payments/ipn",
        "success_url": f"{FRONTEND_URL}/payment-success",
        "cancel_url": f"{FRONTEND_URL}/payment-cancel",
        "custom_field": json.dumps(custom_field_data),
    }
```

- [ ] **Step 2: Fix IPN `sale_complete` — UPDATE existing order instead of creating duplicate**

Replace the `if type_event == 'sale_complete':` block (lines 234–245) with:

```python
    if type_event == 'sale_complete':
        execute_query(
            """UPDATE orders
               SET status='confirmed', payment_status='paid', payment_method='paytech'
               WHERE id=%s""",
            (order_id,),
            commit=True
        )
        execute_query(
            "UPDATE payments SET status='paid' WHERE payment_ref=%s",
            (ref_command,),
            commit=True
        )
        return "IPN OK", 200
```

- [ ] **Step 3: Fix IPN `sale_canceled` — UPDATE order + restore stock**

Replace the `elif type_event == 'sale_canceled':` block (lines 247–253) with:

```python
    elif type_event == 'sale_canceled':
        execute_query(
            """UPDATE orders
               SET status='cancelled', payment_status='failed'
               WHERE id=%s""",
            (order_id,),
            commit=True
        )
        execute_query(
            "UPDATE payments SET status='canceled' WHERE payment_ref=%s",
            (ref_command,),
            commit=True
        )
        items_to_restore = execute_query(
            "SELECT product_id, quantity FROM order_items WHERE order_id=%s",
            (order_id,),
            fetch_all=True
        )
        for item in (items_to_restore or []):
            execute_query(
                "UPDATE products SET stock = stock + %s WHERE id=%s",
                (item['quantity'], item['product_id']),
                commit=True
            )
        return "IPN OK", 200
```

- [ ] **Step 4: Add `cancel-order` endpoint at end of file**

Append after the last line of `backend/routes/payments.py`:

```python

@bp.route('/cancel-order/<order_id>', methods=['POST'])
def cancel_order(order_id):
    order = execute_query(
        "SELECT id, status FROM orders WHERE id=%s",
        (order_id,),
        fetch_one=True
    )
    if not order or order['status'] == 'cancelled':
        return jsonify({'success': True})

    execute_query(
        "UPDATE orders SET status='cancelled', payment_status='failed' WHERE id=%s",
        (order_id,),
        commit=True
    )

    items_to_restore = execute_query(
        "SELECT product_id, quantity FROM order_items WHERE order_id=%s",
        (order_id,),
        fetch_all=True
    )
    for item in (items_to_restore or []):
        execute_query(
            "UPDATE products SET stock = stock + %s WHERE id=%s",
            (item['quantity'], item['product_id']),
            commit=True
        )

    return jsonify({'success': True})
```

- [ ] **Step 5: Verify backend starts cleanly**

```bash
cd backend && python app.py
```

Expected: Flask starts on port 8000, no import errors.

- [ ] **Step 6: Commit**

```bash
git add backend/routes/payments.py
git commit -m "fix: correct PayTech IPN handlers and add cancel-order endpoint"
```

---

### Task 2: Add `order_id` to `PaytechPaymentResponse` type

**Files:**
- Modify: `src/types/index.ts`

The backend `request_payment` returns `{ success, redirect_url, order_id }` but the TypeScript interface only declares `success`, `redirect_url`, `message`. Without `order_id`, `response.order_id` in Checkout.tsx is a TS error.

- [ ] **Step 1: Add `order_id` to `PaytechPaymentResponse`**

In `src/types/index.ts`, find:

```typescript
export interface PaytechPaymentResponse {
  success: number;
  redirect_url?: string;
  message?: string;
}
```

Replace with:

```typescript
export interface PaytechPaymentResponse {
  success: number;
  redirect_url?: string;
  message?: string;
  order_id?: string;
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "fix: add order_id to PaytechPaymentResponse type"
```

---

### Task 3: Activate online payment button in `Checkout.tsx` and save to localStorage

**Files:**
- Modify: `src/pages/Checkout.tsx` (lines 355–376 and 164–168)

- [ ] **Step 1: Replace the disabled "Payer en ligne" button (lines 355–376)**

Replace:

```tsx
                    {/* Paiement en ligne (Temporairement désactivé) */}
                    <button
                      type="button"
                      disabled
                      className="relative p-6 rounded-lg border-2 text-left transition-all border-gray-100 bg-gray-50/50 opacity-60 cursor-not-allowed"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                          <Wallet className="h-6 w-6 text-gray-500" />
                        </div>
                        <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200 uppercase tracking-wider">
                          Hors service
                        </Badge>
                      </div>
                      <div className="font-semibold text-lg mb-1 text-gray-400">Payer en ligne</div>
                      <div className="text-sm text-gray-400 mb-3">
                        Wave, Orange Money (Indisponible)
                      </div>
                      <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-400 border-none">
                        <Shield className="h-3 w-3 mr-1" />
                        Temporairement indisponible
                      </Badge>
                    </button>
```

With:

```tsx
                    {/* Paiement en ligne */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('online')}
                      className={`relative p-6 rounded-lg border-2 text-left transition-all ${
                        paymentMethod === 'online'
                          ? 'border-primary bg-primary/5 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                          <Wallet className="h-6 w-6 text-white" />
                        </div>
                        <div
                          className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === 'online'
                              ? 'border-primary bg-primary'
                              : 'border-gray-300'
                          }`}
                        >
                          {paymentMethod === 'online' && (
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          )}
                        </div>
                      </div>
                      <div className="font-semibold text-lg mb-1">Payer en ligne</div>
                      <div className="text-sm text-muted-foreground mb-3">
                        Wave, Orange Money, Carte bancaire
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Paiement sécurisé PayTech
                      </Badge>
                    </button>
```

- [ ] **Step 2: Save `order_id` and `amount` to localStorage before redirect (lines 164–168)**

Replace:

```tsx
      } else {
        const response = await requestPaytechPayment(orderData);

        if (response.success === 1 && response.redirect_url) {
          window.location.href = response.redirect_url;
        } else {
          toast.error(
            'Erreur lors de la préparation du paiement : ' + (response.message || '')
          );
        }
      }
```

With:

```tsx
      } else {
        const response = await requestPaytechPayment(orderData);

        if (response.success === 1 && response.redirect_url) {
          localStorage.setItem(
            'pendingPayment',
            JSON.stringify({ orderId: response.order_id, amount: finalTotal })
          );
          window.location.href = response.redirect_url;
        } else {
          toast.error(
            'Erreur lors de la préparation du paiement : ' + (response.message || '')
          );
        }
      }
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Checkout.tsx
git commit -m "feat: enable online payment button and save order to localStorage"
```

---

### Task 4: Fix `Payment-succes.tsx` — read from localStorage

**Files:**
- Modify: `src/pages/Payment-succes.tsx`

- [ ] **Step 1: Rewrite `Payment-succes.tsx` to read from localStorage**

Replace the entire file content with:

```tsx
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState<string | undefined>();
  const [amount, setAmount] = useState<number | undefined>();

  useEffect(() => {
    const raw = localStorage.getItem('pendingPayment');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setOrderId(parsed.orderId);
        setAmount(parsed.amount);
      } catch {
        // malformed — ignore
      }
      localStorage.removeItem('pendingPayment');
    }
  }, []);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Paiement réussi</h1>
      <p className="text-muted-foreground mb-4 text-center max-w-md">
        Merci pour votre commande. Votre paiement a été confirmé.
      </p>

      {orderId && (
        <p className="mb-1">
          <span className="font-semibold">Numéro de commande :</span> {orderId}
        </p>
      )}
      {amount !== undefined && (
        <p className="mb-4">
          <span className="font-semibold">Montant payé :</span>{" "}
          {amount.toLocaleString('fr-FR')} FCFA
        </p>
      )}

      <div className="flex gap-3 mt-4">
        <Button onClick={() => navigate("/orders")}>Voir mes commandes</Button>
        <Button variant="outline" onClick={() => navigate("/")}>
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Payment-succes.tsx
git commit -m "fix: read payment result from localStorage instead of router state"
```

---

### Task 5: Fix `Payment-cancel.tsx` — call cancel API on mount

**Files:**
- Modify: `src/pages/Payment-cancel.tsx`

- [ ] **Step 1: Rewrite `Payment-cancel.tsx` to cancel order on mount**

Replace the entire file content with:

```tsx
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const PaymentCancel = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem('pendingPayment');
    if (raw) {
      try {
        const { orderId } = JSON.parse(raw);
        if (orderId) {
          api.post(`/payments/cancel-order/${orderId}`).catch(() => {});
        }
      } catch {
        // malformed — ignore
      }
      localStorage.removeItem('pendingPayment');
    }
  }, []);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <XCircle className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Paiement annulé</h1>
      <p className="text-muted-foreground mb-4 text-center max-w-md">
        Le paiement a été annulé. Votre commande a été supprimée et le stock restauré.
      </p>

      <div className="flex gap-3 mt-4">
        <Button onClick={() => navigate("/checkout")}>Réessayer</Button>
        <Button variant="outline" onClick={() => navigate("/cart")}>
          Retour au panier
        </Button>
      </div>
    </div>
  );
};

export default PaymentCancel;
```

- [ ] **Step 2: Check that `api` default export exists in `src/lib/api.ts`**

Run:
```bash
grep -n "^export default\|^const api\|^export const api" src/lib/api.ts | head -5
```

Expected: a line like `export default api;` or `const api = axios.create(...)` with a default export.

If `api` is not the default export, use the named axios instance instead. Check `src/lib/api.ts` for the actual export name and adjust the import accordingly.

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Payment-cancel.tsx
git commit -m "fix: cancel order and restore stock on payment cancel page"
```

---

### Task 6: End-to-end test

**No automated tests exist in this project. Verify manually.**

- [ ] **Step 1: Start backend**

```bash
cd backend && python app.py
```

Expected: `Running on http://0.0.0.0:8000`

- [ ] **Step 2: Start frontend**

```bash
npm run dev
```

Expected: `Local: http://localhost:8080`

- [ ] **Step 3: Test happy path — full payment flow**

1. Go to `http://localhost:8080`, add a product to cart
2. Go to checkout (`/checkout`)
3. Fill in delivery info (name, phone, address, city)
4. Click "Payer en ligne" — button should become selected (blue border)
5. Click "Valider la commande"
6. Expected: redirect to PayTech payment page at `paytech.sn`
7. On PayTech test page, use test card to complete payment
8. Expected: redirect to `http://localhost:8080/payment-success`
9. Expected: success page shows order ID and amount (read from localStorage)

- [ ] **Step 4: Test cancel path**

1. Repeat steps 1–6 above
2. On PayTech test page, click "Annuler" / cancel
3. Expected: redirect to `http://localhost:8080/payment-cancel`
4. Expected: cancel page shows "paiement annulé" message
5. Check DB: order status should be `cancelled`, stock restored

```sql
-- Run on MySQL (mysql-talla.alwaysdata.net, db: talla_phone)
SELECT id, status, payment_status, payment_method FROM orders ORDER BY created_at DESC LIMIT 5;
```

- [ ] **Step 5: Final build check**

```bash
npm run build
```

Expected: `✓ built in XX.XXs` with no errors.

- [ ] **Step 6: Commit if any tweaks were needed during testing**

```bash
git add -p
git commit -m "fix: paytech integration tweaks from manual testing"
```
