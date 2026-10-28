/**
 * Firestore Security Rules Adversarial Test Suite ("Dirty Dozen" Verification)
 * Verifies all 12 adversarial payloads in security_spec.md return PERMISSION_DENIED.
 */

export interface SimulatedAuth {
  uid: string;
  email: string;
  email_verified: boolean;
}

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: SimulatedAuth | null;
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_CASES: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Shadow Field Injection on Public Profile (isAdmin: true)',
    collectionPath: '/users/alice_123/public/profile',
    operation: 'create',
    auth: { uid: 'alice_123', email: 'alice@example.com', email_verified: true },
    payload: {
      uid: 'alice_123',
      displayName: 'Alice',
      isAdmin: true,
      createdAt: 'REQUEST_TIME',
      updatedAt: 'REQUEST_TIME',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Email Write Spoof (email_verified: false)',
    collectionPath: '/users/alice_123/public/profile',
    operation: 'create',
    auth: { uid: 'alice_123', email: 'alice@example.com', email_verified: false },
    payload: {
      uid: 'alice_123',
      displayName: 'Alice',
      createdAt: 'REQUEST_TIME',
      updatedAt: 'REQUEST_TIME',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Cross-User PII Read Attempt',
    collectionPath: '/users/alice_123/private/info',
    operation: 'get',
    auth: { uid: 'mallory_999', email: 'mallory@example.com', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Identity Spoofing on Order Creation',
    collectionPath: '/orders/ord_1001',
    operation: 'create',
    auth: { uid: 'mallory_999', email: 'mallory@example.com', email_verified: true },
    payload: {
      orderNumber: 'HSD-2026-0001',
      customerId: 'alice_123',
      status: 'confirmed',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Orphaned Header-Only Order Without Atomic Line Item',
    collectionPath: '/orders/ord_empty',
    operation: 'create',
    auth: { uid: 'alice_123', email: 'alice@example.com', email_verified: true },
    payload: {
      orderNumber: 'HSD-2026-0002',
      customerId: 'alice_123',
      customerName: 'Alice',
      shippingAddress: '12 Solar Way',
      shippingCity: 'Austin',
      shippingPhone: '+15550100',
      postalCode: '78701',
      paymentMethod: 'cod',
      subtotalCents: 89900,
      shippingCents: 0,
      totalCents: 89900,
      itemCount: 1,
      status: 'confirmed',
      createdAt: 'REQUEST_TIME',
      updatedAt: 'REQUEST_TIME',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'State Shortcutting on Order Creation (status: delivered)',
    collectionPath: '/orders/ord_shortcut',
    operation: 'create',
    auth: { uid: 'alice_123', email: 'alice@example.com', email_verified: true },
    payload: {
      orderNumber: 'HSD-2026-0003',
      customerId: 'alice_123',
      status: 'delivered',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Terminal State Mutation (cancelled -> confirmed)',
    collectionPath: '/orders/ord_cancelled',
    operation: 'update',
    auth: { uid: 'alice_123', email: 'alice@example.com', email_verified: true },
    payload: {
      status: 'confirmed',
      updatedAt: 'REQUEST_TIME',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Price Manipulation During Order Update',
    collectionPath: '/orders/ord_active',
    operation: 'update',
    auth: { uid: 'alice_123', email: 'alice@example.com', email_verified: true },
    payload: {
      status: 'cancelled',
      totalCents: 100,
      updatedAt: 'REQUEST_TIME',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Value Poisoning on Whitelisted Update Field',
    collectionPath: '/orders/ord_active',
    operation: 'update',
    auth: { uid: 'alice_123', email: 'alice@example.com', email_verified: true },
    payload: {
      status: 'cancelled_with_invalid_enum_value',
      updatedAt: 'REQUEST_TIME',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Unscoped Scraping Query on Orders',
    collectionPath: '/orders',
    operation: 'list',
    auth: { uid: 'mallory_999', email: 'mallory@example.com', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Forged Client Timestamp',
    collectionPath: '/users/alice_123/public/profile',
    operation: 'create',
    auth: { uid: 'alice_123', email: 'alice@example.com', email_verified: true },
    payload: {
      uid: 'alice_123',
      displayName: 'Alice',
      createdAt: '2020-01-01T00:00:00Z',
      updatedAt: '2020-01-01T00:00:00Z',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Path Variable ID Poisoning',
    collectionPath: '/users/alice_123/cart/bad$id!with*spaces',
    operation: 'create',
    auth: { uid: 'alice_123', email: 'alice@example.com', email_verified: true },
    payload: {
      customerId: 'alice_123',
      productId: 'bad$id!with*spaces',
      productName: '450W Panel',
      category: 'solar-panel',
      unitPriceCents: 21000,
      quantity: 1,
      createdAt: 'REQUEST_TIME',
      updatedAt: 'REQUEST_TIME',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
];
