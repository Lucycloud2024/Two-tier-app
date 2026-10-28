/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { AuthModal } from './components/AuthModal';
import { CartDrawer } from './components/CartDrawer';
import { CatalogSection, CatalogSortOption } from './components/CatalogSection';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { Navbar } from './components/Navbar';
import { OrdersModal } from './components/OrdersModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { SizingCalculatorSection } from './components/SizingCalculatorSection';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SolarCategorySlug, SolarProduct } from './types';

function StorefrontContent() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | SolarCategorySlug>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<CatalogSortOption>('featured');
  const [inspectedProduct, setInspectedProduct] = useState<SolarProduct | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'account'>('login');
  const [cartOpen, setCartOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const handleOpenAuth = useCallback((mode: 'login' | 'register' | 'account') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        onOpenAuth={handleOpenAuth}
        onOpenCart={() => setCartOpen(true)}
        onOpenOrders={() => setOrdersOpen(true)}
      />

      <main className="flex-1">
        <HeroSection onOpenAuth={handleOpenAuth} onOpenOrders={() => setOrdersOpen(true)} />

        <CatalogSection
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onInspectProduct={setInspectedProduct}
          onNotify={showToast}
        />

        <SizingCalculatorSection onNotify={showToast} onInspectProduct={setInspectedProduct} />
      </main>

      <Footer
        onSelectCategory={setSelectedCategory}
        onOpenAuth={handleOpenAuth}
        onOpenOrders={() => setOrdersOpen(true)}
      />

      <ProductDetailModal
        product={inspectedProduct}
        onClose={() => setInspectedProduct(null)}
        onNotify={showToast}
      />

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onOpenOrders={() => setOrdersOpen(true)}
        onNotify={showToast}
      />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onOpenAuth={handleOpenAuth}
        onOpenOrders={() => setOrdersOpen(true)}
        onNotify={showToast}
      />

      <OrdersModal
        isOpen={ordersOpen}
        onClose={() => setOrdersOpen(false)}
        onOpenAuth={(tab) => handleOpenAuth(tab)}
        onNotify={showToast}
      />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-40 max-w-sm bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-lg shadow-lg"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <StorefrontContent />
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
