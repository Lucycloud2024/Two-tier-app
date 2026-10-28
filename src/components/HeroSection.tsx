import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { HERO_SOLAR_IMAGE } from '../data/solarCatalog';
import { SolarImage } from './SolarImage';

interface HeroSectionProps {
  onOpenAuth: (initialTab: 'login' | 'register' | 'account') => void;
  onOpenOrders: () => void;
}

export function HeroSection({ onOpenAuth, onOpenOrders }: HeroSectionProps) {
  const { user, displayName } = useAuth();

  return (
    <section id="top" className="border-b border-slate-200 bg-white">
      <div className="max-w-[1200px] mx-auto px-6 py-12 lg:py-16">
        {/* Mobile quick auth links (visible below md breakpoint since header nav collapses cleanly) */}
        <div className="flex md:hidden items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200 text-xs font-medium text-slate-700">
          <div className="flex items-center gap-4">
            <a href="#catalog" className="whitespace-nowrap">
              Catalog
            </a>
            <a href="#sizing-guide" className="whitespace-nowrap">
              Sizing Guide
            </a>
            <button type="button" onClick={onOpenOrders} className="whitespace-nowrap cursor-pointer">
              Orders
            </button>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <button
                type="button"
                onClick={() => onOpenAuth('account')}
                className="text-emerald-700 font-semibold whitespace-nowrap cursor-pointer"
              >
                Account
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="whitespace-nowrap cursor-pointer"
                >
                  Sign In
                </button>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <button
                  type="button"
                  onClick={() => onOpenAuth('register')}
                  className="text-emerald-700 font-semibold whitespace-nowrap cursor-pointer"
                >
                  Create Account
                </button>
              </>
            )}
          </div>
        </div>

        {/* 2-Column Balanced Split Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-4">
              <span>Direct Off-Grid Hardware</span>
              <span aria-hidden="true">·</span>
              <span>UL1973 & IEC 61215 Tested</span>
              <span aria-hidden="true">·</span>
              <span>Free Freight Over $1,000</span>
            </div>

            <h1 className="text-slate-900 font-bold tracking-tight text-[clamp(2.25rem,3.6vw,3.35rem)] leading-[1.1] [text-wrap:balance] mb-5">
              Engineered Solar Power for Uninterrupted Independence
            </h1>

            <p className="text-slate-600 text-base leading-relaxed max-w-[60ch] mb-8">
              Equip homes, clinics, and commercial sites with high-cycle LiFePO4 solar batteries,
              hybrid MPPT inverters, N-Type monocrystalline panels, portable generators, and
              brushless DC rechargeable fans.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#catalog"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0"
              >
                <span>Shop Solar Equipment</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              {user ? (
                <button
                  type="button"
                  onClick={onOpenOrders}
                  className="inline-flex items-center justify-center px-5 py-3 min-h-[44px] border border-slate-300 text-slate-800 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  View Orders ({displayName || 'Customer'})
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenAuth('register')}
                  className="inline-flex items-center justify-center px-5 py-3 min-h-[44px] border border-slate-300 text-slate-800 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Create Customer Account
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-6 relative rounded-xl overflow-hidden bg-slate-100 min-h-[300px] lg:min-h-[420px]">
            <SolarImage
              src={HERO_SOLAR_IMAGE}
              alt="Modern off-grid architectural residence powered by monocrystalline rooftop solar array and indoor lithium battery storage"
              fallbackLabel="Off-Grid Architectural Solar System"
              className="w-full h-full lg:h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5">
              <p className="text-xs text-slate-200 font-medium">
                Residential 8kVA Hybrid Inverter + 10.24kWh LiFePO4 Wall Bank + 3.6kW N-Type Array
              </p>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Quantitative Technical Proof Strip */}
        <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          <div>
            <p className="font-mono tabular-nums text-2xl font-semibold text-slate-900">
              6,000+ Cycles
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Prismatic LiFePO4 storage life rated to 80% depth of discharge
            </p>
          </div>
          <div>
            <p className="font-mono tabular-nums text-2xl font-semibold text-slate-900">
              22.4% Yield
            </p>
            <p className="text-xs text-slate-500 mt-1">
              N-Type TOPCon half-cut silicon cells for low-light generation
            </p>
          </div>
          <div>
            <p className="font-mono tabular-nums text-2xl font-semibold text-slate-900">
              &lt; 10 ms UPS
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Seamless grid-to-battery switchover for servers and appliances
            </p>
          </div>
          <div>
            <p className="font-mono tabular-nums text-2xl font-semibold text-slate-900">
              Up to 25 Yrs
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Linear power output warranty on photovoltaic modules
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
