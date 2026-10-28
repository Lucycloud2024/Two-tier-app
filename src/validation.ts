/**
 * Validation constants synced verbatim with firebase-blueprint.json and firestore.rules.
 * Enforces structural & volumetric bounds on every outgoing mutation.
 */

export const ID_PATTERN = /^[a-zA-Z0-9_\-]+$/;
export const ORDER_NUMBER_PATTERN = /^HSD-[A-Z0-9\-]+$/;
export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const BOUNDS = {
  UID_MAX: 128,
  PRODUCT_ID_MAX: 64,
  DISPLAY_NAME_MIN: 1,
  DISPLAY_NAME_MAX: 80,
  CUSTOMER_NAME_MIN: 2,
  CUSTOMER_NAME_MAX: 80,
  EMAIL_MIN: 3,
  EMAIL_MAX: 160,
  PHONE_MIN: 5,
  PHONE_MAX: 30,
  ADDRESS_MIN: 5,
  ADDRESS_MAX: 240,
  CITY_MIN: 2,
  CITY_MAX: 80,
  POSTAL_MIN: 2,
  POSTAL_MAX: 20,
  PRODUCT_NAME_MIN: 2,
  PRODUCT_NAME_MAX: 140,
  MAX_QUANTITY_PER_LINE: 99,
} as const;

export function sanitizeDisplayName(raw: string): string {
  const trimmed = raw.trim().slice(0, BOUNDS.DISPLAY_NAME_MAX);
  return trimmed.length >= BOUNDS.DISPLAY_NAME_MIN ? trimmed : 'Solar Customer';
}

export interface CheckoutFormInput {
  customerName: string;
  email: string;
  phone: string;
  shippingAddress: string;
  shippingCity: string;
  postalCode: string;
}

export function validateCheckoutForm(input: CheckoutFormInput): string | null {
  const name = input.customerName.trim();
  if (name.length < BOUNDS.CUSTOMER_NAME_MIN || name.length > BOUNDS.CUSTOMER_NAME_MAX) {
    return `Full name must be between ${BOUNDS.CUSTOMER_NAME_MIN} and ${BOUNDS.CUSTOMER_NAME_MAX} characters.`;
  }

  const email = input.email.trim();
  if (
    email.length < BOUNDS.EMAIL_MIN ||
    email.length > BOUNDS.EMAIL_MAX ||
    !EMAIL_PATTERN.test(email)
  ) {
    return 'Enter a valid email address.';
  }

  const phone = input.phone.trim();
  if (phone.length < BOUNDS.PHONE_MIN || phone.length > BOUNDS.PHONE_MAX) {
    return `Phone number must be between ${BOUNDS.PHONE_MIN} and ${BOUNDS.PHONE_MAX} characters.`;
  }

  const address = input.shippingAddress.trim();
  if (address.length < BOUNDS.ADDRESS_MIN || address.length > BOUNDS.ADDRESS_MAX) {
    return `Street delivery address must be between ${BOUNDS.ADDRESS_MIN} and ${BOUNDS.ADDRESS_MAX} characters.`;
  }

  const city = input.shippingCity.trim();
  if (city.length < BOUNDS.CITY_MIN || city.length > BOUNDS.CITY_MAX) {
    return `City or state must be between ${BOUNDS.CITY_MIN} and ${BOUNDS.CITY_MAX} characters.`;
  }

  const postal = input.postalCode.trim();
  if (postal.length < BOUNDS.POSTAL_MIN || postal.length > BOUNDS.POSTAL_MAX) {
    return `Postal code must be between ${BOUNDS.POSTAL_MIN} and ${BOUNDS.POSTAL_MAX} characters.`;
  }

  return null;
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
