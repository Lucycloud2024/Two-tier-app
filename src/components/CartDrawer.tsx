import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Minus, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PlacedOrderReceipt, useCart } from '../context/CartContext';
import { FREE_FREIGHT_THRESHOLD_CENTS } from '../data/solarCatalog';
import { PaymentMethod } from '../types';
import { BOUNDS, formatUsd } from '../validation';
import { SolarImage } from './SolarImage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: (tab: 'login' | 'register' | 'account') => void;
  onOpenOrders: () => void;
  onNotify: (message: string) => void;
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cod: 'Cash on Delivery (Inspect on Arrival)',
  bank_transfer: 'Commercial Bank Wire Transfer',
  card: 'Credit / Debit Card Settlement',
};

export function CartDrawer({
  isOpen,
  onClose,
  onOpenAuth,
  onOpenOrders,
  onNotify,
}: CartDrawerProps) {
  const { user, displayName, savedShipping } = useAuth();
  const {
    items,
    subtotalCents,
    shippingCents,
    totalCents,
    setItemQuantity,
    removeFromCart,
    placeOrder,
  } = useCart();

  const [step, setStep] = useState<'cart' | 'checkout' | 'receipt'>('cart');
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PlacedOrderReceipt | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (step === 'receipt') {
        setStep('cart');
        setReceipt(null);
      }
      setCheckoutError(null);
    }
  }, [isOpen, step]);

  useEffect(() => {
    if (user) {
      setCustomerName((prev) => prev || displayName || '');
      setEmail(savedShipping?.email || user.email || '');
      if (savedShipping) {
        setPhone((prev) => prev || savedShipping.phone);
        setShippingAddress((prev) => prev || savedShipping.shippingAddress);
        setShippingCity((prev) => prev || savedShipping.shippingCity);
        setPostalCode((prev) => prev || savedShipping.postalCode);
      }
    }
  }, [displayName, savedShipping, user]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const remainingForFreeFreight = Math.max(0, FREE_FREIGHT_THRESHOLD_CENTS - subtotalCents);

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);
    setSubmitting(true);
    try {
      const confirmed = await placeOrder(
        {
          customerName,
          email,
          phone,
          shippingAddress,
          shippingCity,
          postalCode,
        },
        paymentMethod
      );
      setReceipt(confirmed);
      setStep('receipt');
      onNotify(`Order ${confirmed.orderNumber} confirmed.`);
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Checkout failed.';
      try {
        const parsed = JSON.parse(msg);
        if (parsed && parsed.error) msg = parsed.error;
      } catch {
        // Plain error text
      }
      setCheckoutError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-md h-full flex flex-col border-l border-slate-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {step === 'checkout' && (
              <button
                type="button"
                onClick={() => setStep('cart')}
                aria-label="Back to cart"
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 id="cart-drawer-title" className="text-base font-bold text-slate-900">
              {step === 'cart' && 'Solar Equipment Cart'}
              {step === 'checkout' && 'Freight Delivery & Settlement'}
              {step === 'receipt' && 'Order Confirmation'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart drawer"
            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        {step === 'receipt' && receipt ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6">
              <div className="flex items-center gap-2.5 text-emerald-900 font-semibold text-sm mb-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>Order {receipt.orderNumber} Confirmed — Preparing Dispatch</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Your solar hardware order has been recorded in Cloud Firestore and queued for
                warehouse palletization.
              </p>
            </div>

            <div className="space-y-4 text-xs text-slate-600 border-b border-slate-200 pb-5 mb-5">
              <div>
                <p className="font-semibold text-slate-900 mb-0.5">Recipient &amp; Destination</p>
                <p>{receipt.customerName}</p>
                <p>{receipt.shippingAddress}</p>
                <p>
                  {receipt.shippingCity} · {receipt.postalCode}
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 mb-0.5">Settlement Method</p>
                <p>{PAYMENT_LABELS[receipt.paymentMethod]}</p>
              </div>
            </div>

            <h3 className="text-xs font-semibold text-slate-900 mb-3">Itemized Hardware Receipt</h3>
            <ul className="divide-y divide-slate-100 border-t border-b border-slate-100 mb-6">
              {receipt.items.map((entry) => (
                <li
                  key={entry.product.id}
                  className="py-3 flex items-baseline justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-medium text-slate-900">{entry.product.name}</p>
                    <p className="text-slate-500 font-mono tabular-nums">
                      Qty {entry.quantity} × {formatUsd(entry.product.priceCents)}
                    </p>
                  </div>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 shrink-0">
                    {formatUsd(entry.product.priceCents * entry.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="space-y-2 text-xs mb-6">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">{formatUsd(receipt.subtotalCents)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Heavy-Freight Delivery</span>
                <span className="font-mono tabular-nums">
                  {receipt.shippingCents === 0 ? 'Free' : formatUsd(receipt.shippingCents)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount</span>
                <span className="font-mono tabular-nums">{formatUsd(receipt.totalCents)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenOrders();
                }}
                className="w-full py-3 px-4 min-h-[44px] bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 cursor-pointer"
              >
                Track in Order History
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 min-h-[42px] border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        ) : step === 'cart' ? (
          <>
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm font-semibold text-slate-900 mb-1">Your cart is empty</p>
                  <p className="text-xs text-slate-500 mb-6">
                    Add solar generators, LiFePO4 batteries, panels, fans, or inverters to begin.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 min-h-[40px] bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 cursor-pointer"
                  >
                    Browse Solar Catalog
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-5 pb-4 border-b border-slate-200 text-xs text-slate-600">
                    {remainingForFreeFreight === 0 ? (
                      <span className="text-emerald-800 font-medium">
                        Qualifies for complimentary palletized freight delivery.
                      </span>
                    ) : (
                      <span>
                        Add{' '}
                        <span className="font-mono tabular-nums font-semibold text-slate-900">
                          {formatUsd(remainingForFreeFreight)}
                        </span>{' '}
                        more for complimentary freight delivery (orders over $1,000).
                      </span>
                    )}
                  </div>

                  <ul className="divide-y divide-slate-200">
                    {items.map((entry) => (
                      <li key={entry.product.id} className="py-4 flex gap-4">
                        <div className="w-20 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          <SolarImage
                            src={entry.product.image}
                            alt={entry.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-500">{entry.product.categoryLabel}</p>
                          <h3 className="text-sm font-semibold text-slate-900 truncate">
                            {entry.product.name}
                          </h3>
                          <p className="font-mono tabular-nums text-xs font-medium text-slate-700 mt-0.5">
                            {formatUsd(entry.product.priceCents)} each
                          </p>

                          <div className="mt-3 flex items-center justify-between gap-2">
                            <div className="inline-flex items-center border border-slate-200 rounded-lg">
                              <button
                                type="button"
                                onClick={() =>
                                  void setItemQuantity(entry.product.id, entry.quantity - 1)
                                }
                                aria-label={`Decrease quantity of ${entry.product.name}`}
                                className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-50 cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-8 text-center font-mono tabular-nums text-xs font-semibold text-slate-900">
                                {entry.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  void setItemQuantity(entry.product.id, entry.quantity + 1)
                                }
                                aria-label={`Increase quantity of ${entry.product.name}`}
                                className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-50 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => void removeFromCart(entry.product.id)}
                              aria-label={`Remove ${entry.product.name}`}
                              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-700 cursor-pointer py-1 px-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-slate-200 bg-slate-50">
                <div className="space-y-2 text-xs mb-4">
                  <div className="flex justify-between text-slate-600">
                    <span>Equipment Subtotal</span>
                    <span className="font-mono tabular-nums font-medium text-slate-900">
                      {formatUsd(subtotalCents)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Palletized Freight</span>
                    <span className="font-mono tabular-nums font-medium text-slate-900">
                      {shippingCents === 0 ? 'Free' : formatUsd(shippingCents)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Estimated Total</span>
                    <span className="font-mono tabular-nums">{formatUsd(totalCents)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="w-full py-3 px-4 min-h-[44px] bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            {!user ? (
              <div className="border border-slate-200 rounded-xl p-6 text-center">
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Sign In or Create Account to Complete Order
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  Your {items.length} selected solar item(s) are preserved. Authenticate to attach
                  warranty registration and delivery tracking to your account.
                </p>
                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => onOpenAuth('login')}
                    className="w-full py-2.5 px-4 min-h-[42px] bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 cursor-pointer"
                  >
                    Sign In to Existing Account
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenAuth('register')}
                    className="w-full py-2.5 px-4 min-h-[42px] border border-slate-300 text-slate-900 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    Create New Customer Account
                  </button>
                </div>
              </div>
            ) : !user.emailVerified ? (
              <div className="border border-amber-200 bg-amber-50 rounded-xl p-5">
                <p className="text-sm font-semibold text-amber-900 mb-1">
                  Verify Your Email Before Placing Order
                </p>
                <p className="text-xs text-amber-800 leading-relaxed mb-4">
                  Security rules require a verified email address ({user.email}) before dispatching
                  equipment orders.
                </p>
                <button
                  type="button"
                  onClick={() => onOpenAuth('account')}
                  className="px-4 py-2 min-h-[40px] bg-amber-900 text-white text-xs font-semibold rounded-lg hover:bg-amber-950 cursor-pointer"
                >
                  Open Verification Settings
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => void handleConfirmOrder(e)} className="space-y-4">
                {checkoutError && (
                  <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                    {checkoutError}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="chkName"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Recipient Full Name
                  </label>
                  <input
                    id="chkName"
                    type="text"
                    required
                    maxLength={BOUNDS.CUSTOMER_NAME_MAX}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full name for delivery manifest"
                    className="w-full min-h-[42px] px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="chkEmail"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Receipt Email
                    </label>
                    <input
                      id="chkEmail"
                      type="email"
                      required
                      maxLength={BOUNDS.EMAIL_MAX}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="chkPhone"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Contact Phone
                    </label>
                    <input
                      id="chkPhone"
                      type="tel"
                      required
                      maxLength={BOUNDS.PHONE_MAX}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 555 234 5678"
                      className="w-full min-h-[42px] px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="chkAddress"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Street Delivery Address
                  </label>
                  <input
                    id="chkAddress"
                    type="text"
                    required
                    maxLength={BOUNDS.ADDRESS_MAX}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="420 Industrial Park Blvd, Suite 4"
                    className="w-full min-h-[42px] px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="chkCity"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      City &amp; State
                    </label>
                    <input
                      id="chkCity"
                      type="text"
                      required
                      maxLength={BOUNDS.CITY_MAX}
                      value={shippingCity}
                      onChange={(e) => setShippingCity(e.target.value)}
                      placeholder="Austin, TX"
                      className="w-full min-h-[42px] px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="chkPostal"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Postal Code
                    </label>
                    <input
                      id="chkPostal"
                      type="text"
                      required
                      maxLength={BOUNDS.POSTAL_MAX}
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="78701"
                      className="w-full min-h-[42px] px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <span className="block text-xs font-semibold text-slate-700 mb-2">
                    Settlement Method
                  </span>
                  <div className="space-y-2">
                    {(['cod', 'bank_transfer', 'card'] as PaymentMethod[]).map((method) => (
                      <label
                        key={method}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer text-xs ${
                          paymentMethod === method
                            ? 'border-emerald-700 bg-emerald-50/40 text-slate-900 font-semibold'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method}
                          checked={paymentMethod === method}
                          onChange={() => setPaymentMethod(method)}
                          className="accent-emerald-700"
                        />
                        <span>{PAYMENT_LABELS[method]}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal ({items.length} line items)</span>
                    <span className="font-mono tabular-nums">{formatUsd(subtotalCents)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Freight Delivery</span>
                    <span className="font-mono tabular-nums">
                      {shippingCents === 0 ? 'Free' : formatUsd(shippingCents)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Payable</span>
                    <span className="font-mono tabular-nums">{formatUsd(totalCents)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 min-h-[44px] bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {submitting
                    ? 'Recording Order...'
                    : `Confirm Solar Order · ${formatUsd(totalCents)}`}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
