# Security Specification — Helios Solar Direct (`security_spec.md`)

## 1. Data Invariants

1. **Default-Deny Catch-All**: Any path not explicitly matched is unconditionally denied (`allow read, write: if false;`).
2. **Verified Identity Gate**: Every write operation across all collections strictly mandates `request.auth != null && request.auth.token.email_verified == true`.
3. **PII Split-Collection Isolation**: Customer PII (`email`, `phone`, `shippingAddress`, `shippingCity`, `postalCode`) lives exclusively in `/users/{userId}/private/info` and is readable/writable strictly by `request.auth.uid == userId`.
4. **Master Identity Gate (Relational Sync)**:
   - `/users/{userId}/cart/{productId}` requires the parent `/users/{userId}/public/profile` document to exist and match `request.auth.uid`.
   - `/orders/{orderId}` creation requires `/users/{request.auth.uid}/public/profile` to exist (`exists()`).
   - `/orders/{orderId}/items/{itemId}` `get` verifies `get(/databases/$(database)/documents/orders/$(orderId)).data.customerId == request.auth.uid`.
5. **Atomic Order Creation (`existsAfter` / `getAfter`)**:
   - An `/orders/{orderId}` header cannot be created unless at least `/orders/{orderId}/items/item_0` is created in the same atomic `writeBatch` (`existsAfter`).
   - An `/orders/{orderId}/items/{itemId}` document can only be created in the exact atomic batch that creates `/orders/{orderId}` (`!exists(...) && getAfter(...)`) and is strictly immutable afterward (`allow update, delete: if false`).
6. **Terminal State Locking & Action-Based Updates**:
   - Orders are created solely in `'confirmed'` state.
   - Customers may only transition their own order from `'confirmed'` to `'cancelled'` via `affectedKeys().hasOnly(['status', 'updatedAt'])`.
   - Once an order reaches `'cancelled'` or `'delivered'`, all further updates are locked.
7. **Strict Temporal & Financial Integrity**:
   - All `createdAt` and `updatedAt` timestamps must equal `request.time`.
   - Financial totals satisfy `totalCents == subtotalCents + shippingCents`, positive integer bounds, and `lineTotalCents == unitPriceCents * quantity`.
8. **Secure List Queries**:
   - `allow list` is omitted on `/users/{userId}/public` and `/users/{userId}/private`.
   - On `/users/{userId}/cart`, `/orders`, and `/orders/{orderId}/items`, `allow list` explicitly evaluates `resource.data.customerId == request.auth.uid` with zero `get()`/`exists()` calls inside `list`.

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 — Shadow Field Injection on Public Profile (`isAdmin: true`)**:
   ```json
   {
     "path": "/users/alice_123/public/profile",
     "auth": { "uid": "alice_123", "email_verified": true },
     "op": "create",
     "data": { "uid": "alice_123", "displayName": "Alice", "isAdmin": true, "createdAt": "SERVER_TIME", "updatedAt": "SERVER_TIME" }
   }
   ```
2. **Payload 2 — Unverified Email Write Spoof (`email_verified: false`)**:
   ```json
   {
     "path": "/users/alice_123/public/profile",
     "auth": { "uid": "alice_123", "email_verified": false },
     "op": "create",
     "data": { "uid": "alice_123", "displayName": "Alice", "createdAt": "SERVER_TIME", "updatedAt": "SERVER_TIME" }
   }
   ```
3. **Payload 3 — Cross-User PII Read Attempt**:
   ```json
   {
     "path": "/users/alice_123/private/info",
     "auth": { "uid": "mallory_999", "email_verified": true },
     "op": "get"
   }
   ```
4. **Payload 4 — Identity Spoofing on Order Creation (`customerId != auth.uid`)**:
   ```json
   {
     "path": "/orders/ord_1001",
     "auth": { "uid": "mallory_999", "email_verified": true },
     "op": "create",
     "data": { "orderNumber": "HSD-2026-0001", "customerId": "alice_123", "status": "confirmed" }
   }
   ```
5. **Payload 5 — Orphaned Header-Only Order Without Atomic Line Item (`existsAfter` Bypass)**:
   ```json
   {
     "path": "/orders/ord_empty",
     "auth": { "uid": "alice_123", "email_verified": true },
     "op": "create_without_items",
     "data": { "orderNumber": "HSD-2026-0002", "customerId": "alice_123", "customerName": "Alice", "shippingAddress": "12 Solar Way", "shippingCity": "Austin", "shippingPhone": "+15550100", "postalCode": "78701", "paymentMethod": "cod", "subtotalCents": 89900, "shippingCents": 0, "totalCents": 89900, "itemCount": 1, "status": "confirmed", "createdAt": "SERVER_TIME", "updatedAt": "SERVER_TIME" }
   }
   ```
6. **Payload 6 — State Shortcutting on Order Creation (`status: "delivered"`)**:
   ```json
   {
     "path": "/orders/ord_shortcut",
     "auth": { "uid": "alice_123", "email_verified": true },
     "op": "create",
     "data": { "orderNumber": "HSD-2026-0003", "customerId": "alice_123", "status": "delivered" }
   }
   ```
7. **Payload 7 — Terminal State Mutation (`cancelled` -> `confirmed`)**:
   ```json
   {
     "path": "/orders/ord_cancelled",
     "auth": { "uid": "alice_123", "email_verified": true },
     "op": "update",
     "data": { "status": "confirmed", "updatedAt": "SERVER_TIME" }
   }
   ```
8. **Payload 8 — Price Manipulation During Order Update**:
   ```json
   {
     "path": "/orders/ord_active",
     "auth": { "uid": "alice_123", "email_verified": true },
     "op": "update",
     "data": { "status": "cancelled", "totalCents": 100, "updatedAt": "SERVER_TIME" }
   }
   ```
9. **Payload 9 — Value Poisoning on Whitelisted Update Field (`status` as integer/oversized string)**:
   ```json
   {
     "path": "/orders/ord_active",
     "auth": { "uid": "alice_123", "email_verified": true },
     "op": "update",
     "data": { "status": "cancelled_with_invalid_enum_value", "updatedAt": "SERVER_TIME" }
   }
   ```
10. **Payload 10 — Unscoped Scraping Query on Orders (`list` without `where('customerId', '==', uid)`)**:
    ```json
    {
      "path": "/orders",
      "auth": { "uid": "mallory_999", "email_verified": true },
      "op": "list_all"
    }
    ```
11. **Payload 11 — Forged Client Timestamp (`createdAt != request.time`)**:
    ```json
    {
      "path": "/users/alice_123/public/profile",
      "auth": { "uid": "alice_123", "email_verified": true },
      "op": "create",
      "data": { "uid": "alice_123", "displayName": "Alice", "createdAt": "2020-01-01T00:00:00Z", "updatedAt": "2020-01-01T00:00:00Z" }
    }
    ```
12. **Payload 12 — Path Variable ID Poisoning (Invalid Characters / >128 chars)**:
    ```json
    {
      "path": "/users/alice_123/cart/bad$id!with*spaces",
      "auth": { "uid": "alice_123", "email_verified": true },
      "op": "create",
      "data": { "customerId": "alice_123", "productId": "bad$id!with*spaces", "productName": "450W Panel", "category": "solar-panel", "unitPriceCents": 21000, "quantity": 1, "createdAt": "SERVER_TIME", "updatedAt": "SERVER_TIME" }
    }
    ```
