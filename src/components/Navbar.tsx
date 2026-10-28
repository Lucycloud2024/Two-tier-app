import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface NavbarProps {
  onOpenAuth: (initialTab: 'login' | 'register' | 'account') => void;
  onOpenCart: () => void;
  onOpenOrders: () => void;
}

export function Navbar({ onOpenAuth, onOpenCart, onOpenOrders }: NavbarProps) {
  const { user, signOutUser } = useAuth();
  const { totalItemCount } = useCart();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700"
        >
          Helios Solar
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <a
            href="#catalog"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-2"
          >
            Catalog
          </a>
          <a
            href="#sizing-guide"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-2"
          >
            Sizing Guide
          </a>
          <button
            type="button"
            onClick={onOpenOrders}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-2 cursor-pointer"
          >
            Orders
          </button>
          {user ? (
            <>
              <button
                type="button"
                onClick={() => onOpenAuth('account')}
                className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-2 cursor-pointer"
              >
                Account
              </button>
              <button
                type="button"
                onClick={() => void signOutUser()}
                className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-2 cursor-pointer"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-2 cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-2 cursor-pointer"
              >
                Create Account
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span className="font-mono tabular-nums">Cart ({totalItemCount})</span>
          </button>
        </div>
      </div>
    </header>
  );
}
