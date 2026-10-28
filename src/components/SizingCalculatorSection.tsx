import React, { useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { LOAD_APPLIANCE_PRESETS, SOLAR_CATALOG } from '../data/solarCatalog';
import { SolarProduct } from '../types';
import { formatUsd } from '../validation';

interface SizingCalculatorSectionProps {
  onNotify: (message: string) => void;
  onInspectProduct: (product: SolarProduct) => void;
}

const AUTONOMY_OPTIONS = [4, 8, 12, 24] as const;

export function SizingCalculatorSection({
  onNotify,
  onInspectProduct,
}: SizingCalculatorSectionProps) {
  const { addBundleToCart } = useCart();
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const item of LOAD_APPLIANCE_PRESETS) {
      initial[item.id] = item.defaultCount;
    }
    return initial;
  });
  const [backupHours, setBackupHours] = useState<number>(8);

  const sizing = useMemo(() => {
    const continuousWatts = LOAD_APPLIANCE_PRESETS.reduce(
      (sum, item) => sum + item.watts * (counts[item.id] || 0),
      0
    );
    // 1.35x safety headroom for surge & power factor
    const recommendedInverterWatts = Math.max(500, Math.ceil((continuousWatts * 1.35) / 100) * 100);
    // Usable energy with 80% LiFePO4 DoD & 92% inverter efficiency
    const requiredStorageWh = Math.max(
      512,
      Math.ceil((continuousWatts * backupHours) / (0.8 * 0.92))
    );
    // Solar array sized for ~4.5 peak sun hours recharge
    const recommendedPvWatts = Math.max(200, Math.ceil((requiredStorageWh / 4.5) / 50) * 50);

    // Match catalog hardware bundle
    const bundle: { product: SolarProduct; quantity: number }[] = [];

    if (continuousWatts <= 900 && requiredStorageWh <= 2200) {
      const gen =
        SOLAR_CATALOG.find(
          (p) =>
            p.id === (requiredStorageWh <= 1100 ? 'gen_nomad_1000' : 'gen_titan_2000')
        ) || SOLAR_CATALOG[0];
      const panel = SOLAR_CATALOG.find((p) => p.id === 'pnl_vertex_450w')!;
      const panelQty = Math.max(1, Math.min(4, Math.ceil(recommendedPvWatts / 450)));
      bundle.push({ product: gen, quantity: 1 });
      bundle.push({ product: panel, quantity: panelQty });
    } else {
      const inverter = SOLAR_CATALOG.find(
        (p) => p.id === (recommendedInverterWatts <= 5000 ? 'inv_hybrid_5kva' : 'inv_hybrid_8kva')
      )!;
      const battery = SOLAR_CATALOG.find((p) => p.id === 'bat_vault_48v100')!;
      const panel = SOLAR_CATALOG.find((p) => p.id === 'pnl_bifacial_550w')!;
      const batteryQty = Math.max(1, Math.min(8, Math.ceil(requiredStorageWh / 5120)));
      const panelQty = Math.max(2, Math.min(16, Math.ceil(recommendedPvWatts / 550)));
      bundle.push({ product: inverter, quantity: 1 });
      bundle.push({ product: battery, quantity: batteryQty });
      bundle.push({ product: panel, quantity: panelQty });
    }

    if ((counts.solar_fan || 0) > 0) {
      const fan = SOLAR_CATALOG.find((p) => p.id === 'fan_breeze_16dc');
      if (fan) {
        bundle.push({ product: fan, quantity: counts.solar_fan });
      }
    }

    const bundleTotalCents = bundle.reduce(
      (sum, entry) => sum + entry.product.priceCents * entry.quantity,
      0
    );

    return {
      continuousWatts,
      recommendedInverterWatts,
      requiredStorageWh,
      recommendedPvWatts,
      bundle,
      bundleTotalCents,
    };
  }, [backupHours, counts]);

  const adjustCount = (id: string, delta: number) => {
    setCounts((prev) => ({
      ...prev,
      [id]: Math.max(0, Math.min(20, (prev[id] || 0) + delta)),
    }));
  };

  const handleAddSystem = async () => {
    await addBundleToCart(sizing.bundle);
    onNotify('Added recommended solar system bundle to cart.');
  };

  return (
    <section id="sizing-guide" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="max-w-2xl mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight [text-wrap:balance]">
            Off-Grid Load &amp; Solar Sizing Calculator
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Configure your active appliances and target backup autonomy to calculate required
            inverter wattage, LiFePO4 battery storage, and solar panel array capacity.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left: Appliance Load Selector */}
          <div className="lg:col-span-7 border border-slate-200 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-200">
              <div>
                <h3 className="text-base font-semibold text-slate-900">1. Active Electrical Loads</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Adjust appliance quantities running simultaneously
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {AUTONOMY_OPTIONS.map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setBackupHours(hrs)}
                    className={`px-3 py-1.5 min-h-[36px] text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer font-mono tabular-nums ${
                      backupHours === hrs
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {hrs}h Backup
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {LOAD_APPLIANCE_PRESETS.map((item) => {
                const qty = counts[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className="py-3.5 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500 font-mono tabular-nums">
                        {item.watts}W rated draw · {item.watts * qty}W total
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => adjustCount(item.id, -1)}
                        aria-label={`Decrease ${item.name}`}
                        className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-mono tabular-nums text-sm font-semibold text-slate-900">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => adjustCount(item.id, 1)}
                        aria-label={`Increase ${item.name}`}
                        className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Calculated Engineering Spec & Matched Hardware Bundle */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4">
              2. Calculated System Requirements
            </h3>

            <dl className="grid grid-cols-2 gap-4 pb-6 mb-6 border-b border-slate-200">
              <div>
                <dt className="text-xs text-slate-500">Continuous Load</dt>
                <dd className="font-mono tabular-nums text-lg font-semibold text-slate-900 mt-0.5">
                  {sizing.continuousWatts.toLocaleString()} W
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Min Inverter Rating</dt>
                <dd className="font-mono tabular-nums text-lg font-semibold text-slate-900 mt-0.5">
                  {sizing.recommendedInverterWatts.toLocaleString()} W
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">LiFePO4 Storage ({backupHours}h)</dt>
                <dd className="font-mono tabular-nums text-lg font-semibold text-slate-900 mt-0.5">
                  {(sizing.requiredStorageWh / 1000).toFixed(2)} kWh
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Recommended PV Array</dt>
                <dd className="font-mono tabular-nums text-lg font-semibold text-slate-900 mt-0.5">
                  {sizing.recommendedPvWatts.toLocaleString()} W
                </dd>
              </div>
            </dl>

            <h4 className="text-xs font-semibold text-slate-700 mb-3">
              Matched Catalog Configuration
            </h4>

            <ul className="space-y-2.5 mb-6">
              {sizing.bundle.map((entry) => (
                <li
                  key={entry.product.id}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <button
                    type="button"
                    onClick={() => onInspectProduct(entry.product)}
                    className="text-left text-slate-800 hover:text-emerald-800 hover:underline underline-offset-2 font-medium cursor-pointer"
                  >
                    {entry.quantity}x {entry.product.name}
                  </button>
                  <span className="font-mono tabular-nums text-slate-700 shrink-0">
                    {formatUsd(entry.product.priceCents * entry.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-900">Estimated System Total</span>
              <span className="font-mono tabular-nums text-base font-bold text-slate-900">
                {formatUsd(sizing.bundleTotalCents)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => void handleAddSystem()}
              className="w-full py-3 px-4 min-h-[44px] bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer"
            >
              Add Recommended System to Cart
            </button>
          </div>
        </div>

        {/* Claim-to-Proof Adjacent Attributable Engineering Case Study */}
        <div className="mt-12 pt-10 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8">
            <blockquote className="text-base text-slate-700 leading-relaxed">
              &ldquo;Replacing our diesel standby generator with a HeliosGrid 8kVA split-phase
              inverter, two 5.12kWh HeliosVault LiFePO4 wall banks, and eight 550W bifacial panels
              eliminated 420 liters of monthly fuel spend and maintained 100% cold-chain uptime
              across 14 months of grid outages.&rdquo;
            </blockquote>
            <p className="text-xs text-slate-500 mt-3">
              Dr. Samuel Adeyemi · Director of Operations · Meridian Diagnostic Clinic, Lagos
            </p>
          </div>
          <div className="lg:col-span-4 flex lg:justify-end">
            <div className="text-left lg:text-right">
              <p className="font-mono tabular-nums text-2xl font-bold text-slate-900">
                -94% Fuel OpEx
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Verified over 14 months continuous clinical operation
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
