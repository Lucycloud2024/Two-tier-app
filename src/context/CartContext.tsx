import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  FREE_FREIGHT_THRESHOLD_CENTS,
  SOLAR_CATALOG,
  STANDARD_FREIGHT_CENTS,
} from '../data/solarCatalog';
import { db, handleFirestoreError } from '../firebase';
import { CartEntry, OperationType, PaymentMethod, SolarProduct } from '../types';
import { BOUNDS, CheckoutFormInput, validateCheckoutForm } from '../validation';
import { useAuth } from './AuthContext';

const GUEST_CART_STORAGE_KEY = 'helios_guest_cart_v1';

export interface PlacedOrderReceipt {
  orderId: string;
  orderNumber: string;
  customerName: string;
  shippingAddress: string;
  shippingCity: string;
  postalCode: string;
  paymentMethod: PaymentMethod;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  items: CartEntry[];
}

interface CartContextValue {
  items: CartEntry[];
  totalItemCount: number;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  addToCart: (product: SolarProduct, quantity?: number) => Promise<void>;
  addBundleToCart: (entries: { product: SolarProduct; quantity: number }[]) => Promise<void>;
  setItemQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  placeOrder: (
    formInput: CheckoutFormInput,
    paymentMethod: PaymentMethod
  ) => Promise<PlacedOrderReceipt>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function loadGuestCart(): CartEntry[] {
  try {
    const raw = localStorage.getItem(GUEST_CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { productId: string; quantity: number }[];
    if (!Array.isArray(parsed)) return [];
    const entries: CartEntry[] = [];
    for (const item of parsed) {
      const product = SOLAR_CATALOG.find((p) => p.id === item.productId);
      if (product && typeof item.quantity === 'number' && item.quantity >= 1) {
        entries.push({
          product,
          quantity: Math.min(BOUNDS.MAX_QUANTITY_PER_LINE, Math.floor(item.quantity)),
        });
      }
    }
    return entries;
  } catch {
    return [];
  }
}

function saveGuestCart(entries: CartEntry[]) {
  try {
    const serialized = entries.map((e) => ({
      productId: e.product.id,
      quantity: e.quantity,
    }));
    localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(serialized));
  } catch {
    // Ignore storage quota issues
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, profileReady, saveShippingProfile } = useAuth();
  const [items, setItems] = useState<CartEntry[]>(() => loadGuestCart());
  const syncedUidRef = useRef<string | null>(null);

  const isCloudCartActive = Boolean(user && user.emailVerified && profileReady);

  // Merge guest cart into Cloud Firestore cart when user signs in, then subscribe via onSnapshot
  useEffect(() => {
    if (!isCloudCartActive || !user) {
      syncedUidRef.current = null;
      setItems(loadGuestCart());
      return;
    }

    const uid = user.uid;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    const syncAndSubscribe = async () => {
      if (syncedUidRef.current !== uid) {
        const guestEntries = loadGuestCart();
        if (guestEntries.length > 0) {
          for (const entry of guestEntries) {
            const itemPath = `users/${uid}/cart/${entry.product.id}`;
            const itemRef = doc(db, 'users', uid, 'cart', entry.product.id);
            try {
              const snap = await getDoc(itemRef);
              if (!snap.exists()) {
                await setDoc(itemRef, {
                  customerId: uid,
                  productId: entry.product.id,
                  productName: entry.product.name.slice(0, BOUNDS.PRODUCT_NAME_MAX),
                  category: entry.product.category,
                  unitPriceCents: entry.product.priceCents,
                  quantity: Math.min(BOUNDS.MAX_QUANTITY_PER_LINE, entry.quantity),
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                });
              } else {
                const existingQty = Number(snap.data().quantity || 0);
                const mergedQty = Math.min(
                  BOUNDS.MAX_QUANTITY_PER_LINE,
                  existingQty + entry.quantity
                );
                await updateDoc(itemRef, {
                  quantity: mergedQty,
                  updatedAt: serverTimestamp(),
                });
              }
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, itemPath);
            }
          }
          localStorage.removeItem(GUEST_CART_STORAGE_KEY);
        }
        syncedUidRef.current = uid;
      }

      if (cancelled) return;

      const cartPath = `users/${uid}/cart`;
      const cartQuery = query(
        collection(db, 'users', uid, 'cart'),
        where('customerId', '==', uid)
      );

      unsubscribe = onSnapshot(
        cartQuery,
        (snapshot) => {
          const loaded: CartEntry[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const product = SOLAR_CATALOG.find((p) => p.id === data.productId);
            if (product && typeof data.quantity === 'number' && data.quantity >= 1) {
              loaded.push({
                product,
                quantity: data.quantity,
              });
            }
          });
          setItems(loaded);
        },
        (err) => {
          handleFirestoreError(err, OperationType.LIST, cartPath);
        }
      );
    };

    void syncAndSubscribe();

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [isCloudCartActive, user]);

  const upsertCloudCartItem = useCallback(
    async (uid: string, product: SolarProduct, deltaOrAbsolute: number, mode: 'add' | 'set') => {
      const itemPath = `users/${uid}/cart/${product.id}`;
      const itemRef = doc(db, 'users', uid, 'cart', product.id);
      let snapExists = false;
      let currentQty = 0;

      try {
        const snap = await getDoc(itemRef);
        snapExists = snap.exists();
        if (snapExists) {
          currentQty = Number(snap.data()?.quantity || 0);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, itemPath);
      }

      const nextQty = Math.min(
        BOUNDS.MAX_QUANTITY_PER_LINE,
        mode === 'add' ? currentQty + deltaOrAbsolute : deltaOrAbsolute
      );

      if (nextQty <= 0) {
        if (snapExists) {
          try {
            await deleteDoc(itemRef);
          } catch (err) {
            handleFirestoreError(err, OperationType.DELETE, itemPath);
          }
        }
        return;
      }

      if (!snapExists) {
        try {
          await setDoc(itemRef, {
            customerId: uid,
            productId: product.id,
            productName: product.name.slice(0, BOUNDS.PRODUCT_NAME_MAX),
            category: product.category,
            unitPriceCents: product.priceCents,
            quantity: nextQty,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, itemPath);
        }
      } else {
        try {
          await updateDoc(itemRef, {
            quantity: nextQty,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, itemPath);
        }
      }
    },
    []
  );

  const addToCart = useCallback(
    async (product: SolarProduct, quantity = 1) => {
      const cleanQty = Math.max(1, Math.min(BOUNDS.MAX_QUANTITY_PER_LINE, Math.floor(quantity)));
      if (isCloudCartActive && user) {
        await upsertCloudCartItem(user.uid, product, cleanQty, 'add');
      } else {
        setItems((prev) => {
          const idx = prev.findIndex((e) => e.product.id === product.id);
          let next: CartEntry[];
          if (idx >= 0) {
            next = prev.map((entry, i) =>
              i === idx
                ? {
                    ...entry,
                    quantity: Math.min(BOUNDS.MAX_QUANTITY_PER_LINE, entry.quantity + cleanQty),
                  }
                : entry
            );
          } else {
            next = [...prev, { product, quantity: cleanQty }];
          }
          saveGuestCart(next);
          return next;
        });
      }
    },
    [isCloudCartActive, upsertCloudCartItem, user]
  );

  const addBundleToCart = useCallback(
    async (entries: { product: SolarProduct; quantity: number }[]) => {
      for (const entry of entries) {
        await addToCart(entry.product, entry.quantity);
      }
    },
    [addToCart]
  );

  const setItemQuantity = useCallback(
    async (productId: string, quantity: number) => {
      const product = SOLAR_CATALOG.find((p) => p.id === productId);
      if (!product) return;
      const cleanQty = Math.floor(quantity);

      if (isCloudCartActive && user) {
        await upsertCloudCartItem(user.uid, product, cleanQty, 'set');
      } else {
        setItems((prev) => {
          const next =
            cleanQty <= 0
              ? prev.filter((e) => e.product.id !== productId)
              : prev.map((e) =>
                  e.product.id === productId
                    ? { ...e, quantity: Math.min(BOUNDS.MAX_QUANTITY_PER_LINE, cleanQty) }
                    : e
                );
          saveGuestCart(next);
          return next;
        });
      }
    },
    [isCloudCartActive, upsertCloudCartItem, user]
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      await setItemQuantity(productId, 0);
    },
    [setItemQuantity]
  );

  const totalItemCount = useMemo(
    () => items.reduce((sum, entry) => sum + entry.quantity, 0),
    [items]
  );

  const subtotalCents = useMemo(
    () => items.reduce((sum, entry) => sum + entry.product.priceCents * entry.quantity, 0),
    [items]
  );

  const shippingCents = useMemo(() => {
    if (items.length === 0) return 0;
    return subtotalCents >= FREE_FREIGHT_THRESHOLD_CENTS ? 0 : STANDARD_FREIGHT_CENTS;
  }, [items.length, subtotalCents]);

  const totalCents = subtotalCents + shippingCents;

  const placeOrder = useCallback(
    async (
      formInput: CheckoutFormInput,
      paymentMethod: PaymentMethod
    ): Promise<PlacedOrderReceipt> => {
      if (!user || !user.emailVerified || !profileReady) {
        throw new Error('Please sign in with a verified account to place your order.');
      }
      if (items.length === 0) {
        throw new Error('Your solar equipment cart is empty.');
      }

      const validationError = validateCheckoutForm(formInput);
      if (validationError) {
        throw new Error(validationError);
      }

      await saveShippingProfile({
        email: formInput.email,
        phone: formInput.phone,
        shippingAddress: formInput.shippingAddress,
        shippingCity: formInput.shippingCity,
        postalCode: formInput.postalCode,
      });

      const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const year = new Date().getFullYear();
      const randomDigits = Math.floor(100000 + Math.random() * 900000);
      const orderNumber = `HSD-${year}-${randomDigits}`;

      const cleanName = formInput.customerName.trim().slice(0, BOUNDS.CUSTOMER_NAME_MAX);
      const cleanAddress = formInput.shippingAddress.trim().slice(0, BOUNDS.ADDRESS_MAX);
      const cleanCity = formInput.shippingCity.trim().slice(0, BOUNDS.CITY_MAX);
      const cleanPhone = formInput.phone.trim().slice(0, BOUNDS.PHONE_MAX);
      const cleanPostal = formInput.postalCode.trim().slice(0, BOUNDS.POSTAL_MAX);

      const snapshotItems = [...items];
      const batch = writeBatch(db);

      const orderRef = doc(db, 'orders', orderId);
      batch.set(orderRef, {
        orderNumber,
        customerId: user.uid,
        customerName: cleanName,
        shippingAddress: cleanAddress,
        shippingCity: cleanCity,
        shippingPhone: cleanPhone,
        postalCode: cleanPostal,
        paymentMethod,
        subtotalCents,
        shippingCents,
        totalCents,
        itemCount: totalItemCount,
        status: 'confirmed',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      snapshotItems.forEach((entry, idx) => {
        const itemId = `item_${idx}`;
        const itemRef = doc(db, 'orders', orderId, 'items', itemId);
        batch.set(itemRef, {
          orderId,
          customerId: user.uid,
          productId: entry.product.id,
          productName: entry.product.name.slice(0, BOUNDS.PRODUCT_NAME_MAX),
          category: entry.product.category,
          unitPriceCents: entry.product.priceCents,
          quantity: entry.quantity,
          lineTotalCents: entry.product.priceCents * entry.quantity,
          createdAt: serverTimestamp(),
        });
      });

      try {
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `orders/${orderId}`);
      }

      // Clear cloud cart items
      for (const entry of snapshotItems) {
        const cartItemPath = `users/${user.uid}/cart/${entry.product.id}`;
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'cart', entry.product.id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, cartItemPath);
        }
      }

      return {
        orderId,
        orderNumber,
        customerName: cleanName,
        shippingAddress: cleanAddress,
        shippingCity: cleanCity,
        postalCode: cleanPostal,
        paymentMethod,
        subtotalCents,
        shippingCents,
        totalCents,
        items: snapshotItems,
      };
    },
    [
      items,
      profileReady,
      saveShippingProfile,
      shippingCents,
      subtotalCents,
      totalCents,
      totalItemCount,
      user,
    ]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        totalItemCount,
        subtotalCents,
        shippingCents,
        totalCents,
        addToCart,
        addBundleToCart,
        setItemQuantity,
        removeFromCart,
        placeOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return ctx;
}
