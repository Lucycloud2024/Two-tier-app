import React, { useEffect, useState } from 'react';
import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { SolarProduct } from '../types';
import { formatUsd } from '../validation';
import { SolarImage } from './SolarImage';

interface ProductDetailModalProps {
  product: SolarProduct | null;
  onClose: () => void;
  onNotify: (message: string) => void;
}

export function ProductDetailModal({ product, onClose, onNotify }: ProductDetailModalProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setQuantity(1);
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, product]);

  if (!product) return null;

  const handleAdd = async () => {
    await addToCart(product, quantity);
    onNotify(`Added ${quantity}x ${product.name} to cart.`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{product.categoryLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{product.sku}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product specification"
            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: 4:3 Studio Gallery */}
          <div className="lg:col-span-6 lg:sticky lg:top-20">
            <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
              <SolarImage
                src={product.image}
                alt={product.name}
                fallbackLabel={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Factory-tested unit · {product.warrantyYears}-year manufacturer replacement warranty
            </p>
          </div>

          {/* Right: Contiguous Purchase Module & Datasheet */}
          <div className="lg:col-span-6 flex flex-col">
            <h2 id="pdp-title" className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {product.name}
            </h2>

            <div className="mt-3 flex items-baseline gap-4">
              <span className="font-mono tabular-nums text-2xl font-bold text-slate-900">
                {formatUsd(product.priceCents)}
              </span>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {product.stockCount} units ready for dispatch
              </span>
            </div>

            <p className="mt-4 text-sm text-slate-600 leading-relaxed">{product.summary}</p>

            {/* Contiguous Quantity + Add to Cart Controls */}
            <div className="mt-6 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center justify-between border border-slate-200 rounded-lg px-2 min-h-[44px]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-50 rounded-md cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-mono tabular-nums text-sm font-semibold text-slate-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  aria-label="Increase quantity"
                  className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-50 rounded-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => void handleAdd()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="font-mono tabular-nums">
                  Add to Cart · {formatUsd(product.priceCents * quantity)}
                </span>
              </button>
            </div>

            {/* Technical Specifications Datasheet */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h3 className="text-xs font-semibold text-slate-900 mb-3">
                Electrical &amp; Mechanical Specifications
              </h3>
              <dl className="divide-y divide-slate-100 border-t border-b border-slate-100">
                {product.specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="py-2.5 flex items-baseline justify-between gap-4 text-xs"
                  >
                    <dt className="text-slate-500">{spec.label}</dt>
                    <dd className="font-mono tabular-nums text-slate-900 text-right font-medium">
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
