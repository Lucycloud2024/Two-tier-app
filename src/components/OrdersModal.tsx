import React, { useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { ChevronDown, ChevronUp, PackageCheck, X, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError } from '../firebase';
import { OperationType, OrderItemRecord, OrderRecord } from '../types';
import { formatUsd } from '../validation';

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: (tab: 'login' | 'register') => void;
  onNotify: (message: string) => void;
}

export function OrdersModal({ isOpen, onClose, onOpenAuth, onNotify }: OrdersModalProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderItemsMap, setOrderItemsMap] = useState<Record<string, OrderItemRecord[]>>({});
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !user) {
      setOrders([]);
      return;
    }

    setLoading(true);
    const ordersPath = 'orders';
    const q = query(collection(db, 'orders'), where('customerId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: OrderRecord[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: docSnap.id,
            orderNumber: d.orderNumber,
            customerId: d.customerId,
            customerName: d.customerName,
            shippingAddress: d.shippingAddress,
            shippingCity: d.shippingCity,
            shippingPhone: d.shippingPhone,
            postalCode: d.postalCode,
            paymentMethod: d.paymentMethod,
            subtotalCents: d.subtotalCents,
            shippingCents: d.shippingCents,
            totalCents: d.totalCents,
            itemCount: d.itemCount,
            status: d.status,
            createdAt: d.createdAt || null,
            updatedAt: d.updatedAt || null,
          });
        });

        list.sort((a, b) => {
          const tA = a.createdAt?.toMillis() ?? 0;
          const tB = b.createdAt?.toMillis() ?? 0;
          return tB - tA;
        });

        setOrders(list);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        handleFirestoreError(err, OperationType.LIST, ordersPath);
      }
    );

    return () => unsubscribe();
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleExpandOrder = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    if (orderItemsMap[orderId] || !user) return;

    const itemsPath = `orders/${orderId}/items`;
    try {
      const q = query(
        collection(db, 'orders', orderId, 'items'),
        where('customerId', '==', user.uid)
      );
      const snap = await getDocs(q);
      const lineItems: OrderItemRecord[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        lineItems.push({
          id: docSnap.id,
          orderId: d.orderId,
          customerId: d.customerId,
          productId: d.productId,
          productName: d.productName,
          category: d.category,
          unitPriceCents: d.unitPriceCents,
          quantity: d.quantity,
          lineTotalCents: d.lineTotalCents,
          createdAt: d.createdAt || null,
        });
      });
      setOrderItemsMap((prev) => ({ ...prev, [orderId]: lineItems }));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, itemsPath);
    }
  };

  const handleCancelOrder = async (order: OrderRecord) => {
    if (!user || order.status !== 'confirmed') return;
    setCancellingId(order.id);
    const orderPath = `orders/${order.id}`;
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });
      onNotify(`Order ${order.orderNumber} cancelled.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, orderPath);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="orders-modal-heading"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[88vh] flex flex-col"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 id="orders-modal-heading" className="text-lg font-bold text-slate-900">
              Solar Equipment Orders
            </h2>
            <p className="text-xs text-slate-500">
              Real-time dispatch history &amp; itemized receipts
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close orders modal"
            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!user ? (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-slate-900 mb-2">
                Sign in to view your solar equipment orders
              </p>
              <p className="text-xs text-slate-500 mb-6">
                Orders are securely scoped to your verified customer account.
              </p>
              <div className="inline-flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth('login');
                  }}
                  className="px-4 py-2.5 min-h-[40px] bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth('register');
                  }}
                  className="px-4 py-2.5 min-h-[40px] border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Loading your order records...
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-slate-900 mb-1">No orders placed yet</p>
              <p className="text-xs text-slate-500">
                Completed solar equipment orders and warranty manifests will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const lineItems = orderItemsMap[order.id] || [];
                const dateStr = order.createdAt
                  ? order.createdAt.toDate().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Just now';

                return (
                  <div key={order.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                          <span className="font-mono tabular-nums font-semibold text-slate-900">
                            {order.orderNumber}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{dateStr}</span>
                          <span aria-hidden="true">·</span>
                          {order.status === 'cancelled' ? (
                            <span className="inline-flex items-center gap-1 text-red-700 font-medium">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancelled</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-800 font-medium">
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span className="capitalize">{order.status}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600">
                          {order.itemCount} unit(s) · {order.shippingAddress}, {order.shippingCity}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="font-mono tabular-nums text-sm font-bold text-slate-900">
                          {formatUsd(order.totalCents)}
                        </span>
                        <button
                          type="button"
                          onClick={() => void toggleExpandOrder(order.id)}
                          className="inline-flex items-center gap-1 px-3 py-2 min-h-[38px] border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <span>Details</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 sm:px-5 py-4 bg-slate-50 border-t border-slate-200 text-xs">
                        <ul className="divide-y divide-slate-200/70 mb-4">
                          {lineItems.map((li) => (
                            <li
                              key={li.id}
                              className="py-2 flex items-baseline justify-between gap-4"
                            >
                              <span className="text-slate-800 font-medium">
                                {li.quantity}x {li.productName}
                              </span>
                              <span className="font-mono tabular-nums text-slate-900 shrink-0">
                                {formatUsd(li.lineTotalCents)}
                              </span>
                            </li>
                          ))}
                        </ul>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                          <span className="text-slate-500">
                            Recipient: {order.customerName} ({order.shippingPhone})
                          </span>

                          {order.status === 'confirmed' && (
                            <button
                              type="button"
                              disabled={cancellingId === order.id}
                              onClick={() => void handleCancelOrder(order)}
                              className="px-3 py-1.5 min-h-[36px] border border-red-200 bg-white text-red-700 font-semibold rounded-lg hover:bg-red-50 cursor-pointer disabled:opacity-60"
                            >
                              {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
