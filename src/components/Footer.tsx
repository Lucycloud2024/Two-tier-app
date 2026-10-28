import React from 'react';
import { CATEGORY_FILTERS } from '../data/solarCatalog';
import { SolarCategorySlug } from '../types';

interface FooterProps {
  onSelectCategory: (cat: 'all' | SolarCategorySlug) => void;
  onOpenAuth: (tab: 'login' | 'register' | 'account') => void;
  onOpenOrders: () => void;
}

export function Footer({ onSelectCategory, onOpenAuth, onOpenOrders }: FooterProps) {
  const handleCategoryClick = (slug: 'all' | SolarCategorySlug) => {
    onSelectCategory(slug);
    const el = document.getElementById('catalog');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-slate-200">
          <div className="md:col-span-5">
            <p className="font-display text-lg font-bold text-slate-900 tracking-tight mb-2">
              Helios Solar
            </p>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
              Direct commercial and residential solar energy hardware: portable LiFePO4 generators,
              deep-cycle storage banks, N-Type monocrystalline panels, brushless DC rechargeable
              fans, and hybrid MPPT inverters.
            </p>
          </div>

          <div className="md:col-span-4">
            <h3 className="text-xs font-semibold text-slate-900 mb-3">Equipment Categories</h3>
            <ul className="space-y-2 text-xs text-slate-600">
              {CATEGORY_FILTERS.filter((c) => c.slug !== 'all').map((cat) => (
                <li key={cat.slug}>
                  <button
                    type="button"
                    onClick={() => handleCategoryClick(cat.slug)}
                    className="hover:text-slate-900 hover:underline underline-offset-4 cursor-pointer"
                  >
                    {cat.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h3 className="text-xs font-semibold text-slate-900 mb-3">Customer Portal</h3>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="hover:text-slate-900 hover:underline underline-offset-4 cursor-pointer"
                >
                  Sign In
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenAuth('register')}
                  className="hover:text-slate-900 hover:underline underline-offset-4 cursor-pointer"
                >
                  Create Account
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenOrders}
                  className="hover:text-slate-900 hover:underline underline-offset-4 cursor-pointer"
                >
                  Order Tracking
                </button>
              </li>
              <li>
                <a
                  href="#sizing-guide"
                  className="hover:text-slate-900 hover:underline underline-offset-4"
                >
                  Off-Grid Load Calculator
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} Helios Solar Direct. All rights reserved.</p>
          <p>UL1973 · IEC 61215 · Pure Sine Wave Certified Hardware</p>
        </div>
      </div>
    </footer>
  );
}
