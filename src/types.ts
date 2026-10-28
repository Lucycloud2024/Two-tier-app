import { Timestamp } from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export type SolarCategorySlug =
  | 'solar-generator'
  | 'solar-batteries'
  | 'solar-panel'
  | 'solar-fans'
  | 'solar-inverter';

export type PaymentMethod = 'cod' | 'bank_transfer' | 'card';

export type OrderStatus = 'confirmed' | 'cancelled' | 'delivered';

export interface ProductSpec {
  label: string;
  value: string;
}

export interface SolarProduct {
  id: string;
  sku: string;
  name: string;
  category: SolarCategorySlug;
  categoryLabel: string;
  shortSpec: string;
  priceCents: number;
  wattageRating: number;
  stockCount: number;
  warrantyYears: number;
  summary: string;
  image: string;
  specs: ProductSpec[];
}

export interface CartEntry {
  product: SolarProduct;
  quantity: number;
}

export interface CustomerShippingInfo {
  email: string;
  phone: string;
  shippingAddress: string;
  shippingCity: string;
  postalCode: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPhone: string;
  postalCode: string;
  paymentMethod: PaymentMethod;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  itemCount: number;
  status: OrderStatus;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface OrderItemRecord {
  id: string;
  orderId: string;
  customerId: string;
  productId: string;
  productName: string;
  category: SolarCategorySlug;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  createdAt: Timestamp | null;
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
