import React, { useMemo } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { CATEGORY_FILTERS, SOLAR_CATALOG } from '../data/solarCatalog';
import { SolarCategorySlug, SolarProduct } from '../types';
import { formatUsd } from '../validation';
import { SolarImage } from './SolarImage';

export type CatalogSortOption = 'featured' | 'price-asc' | 'price-desc' | 'wattage-desc';

interface CatalogSectionProps {
  selectedCategory: 'all' | SolarCategorySlug;
  onSelectCategory: (cat: 'all' | SolarCategorySlug) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: CatalogSortOption;
  onSortChange: (sort: CatalogSortOption) => void;
  onInspectProduct: (product: SolarProduct) => void;
  onNotify: (message: string) => void;
}

export function CatalogSection({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  onInspectProduct,
  onNotify,
}: CatalogSectionProps) {
  const { addToCart } = useCart();

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const base = SOLAR_CATALOG.filter((product) => {
      const matchesCat = selectedCategory === 'all' || product.category === selectedCategory;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        product.name.toLowerCase().includes(q) ||
        product.categoryLabel.toLowerCase().includes(q) ||
        product.shortSpec.toLowerCase().includes(q) ||
        product.summary.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q)
      );
    });

    if (sortBy === 'price-asc') {
      return [...base].sort((a, b) => a.priceCents - b.priceCents);
    }
    if (sortBy === 'price-desc') {
      return [...base].sort((a, b) => b.priceCents - a.priceCents);
    }
    if (sortBy === 'wattage-desc') {
      return [...base].sort((a, b) => b.wattageRating - a.wattageRating);
    }
    return base;
  }, [searchQuery, selectedCategory, sortBy]);

  const handleQuickAdd = async (e: React.MouseEvent, product: SolarProduct) => {
    e.stopPropagation();
    await addToCart(product, 1);
    onNotify(`Added ${product.name} to cart.`);
  };

  return (
    <section id="catalog" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Solar Hardware Inventory
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Select a category or filter by wattage, chemistry, and voltage specification.
            </p>
          </div>
          <p className="text-xs text-slate-500 font-mono tabular-nums">
            Showing {filteredProducts.length} of {SOLAR_CATALOG.length} catalog units
          </p>
        </div>

        {/* Workspace Filter & Search Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-10">
          {/* Interactive Segmented Category Filter Controls */}
          <div
            role="tablist"
            aria-label="Solar Equipment Categories"
            className="flex items-center gap-1 p-1 bg-slate-200/75 rounded-lg overflow-x-auto"
          >
            {CATEGORY_FILTERS.map((cat) => {
              const isActive = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.slug}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => onSelectCategory(cat.slug)}
                  className={`px-3.5 py-2 min-h-[40px] text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search wattage, LiFePO4, MPPT..."
                aria-label="Search solar catalog"
                className="w-full min-h-[40px] pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-700"
              />
            </div>

            <div className="relative flex items-center">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as CatalogSortOption)}
                aria-label="Sort products"
                className="min-h-[40px] pl-8 pr-8 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-emerald-700 cursor-pointer"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="wattage-desc">Power Rating: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3-Column Uniform Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <p className="text-base font-semibold text-slate-900 mb-1">
              No matching solar equipment found
            </p>
            <p className="text-sm text-slate-500 mb-5">
              Try clearing your search query or switching back to All Equipment.
            </p>
            <button
              type="button"
              onClick={() => {
                onSelectCategory('all');
                onSearchChange('');
              }}
              className="px-4 py-2 min-h-[40px] text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Reset Catalog Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                onClick={() => onInspectProduct(product)}
                className="group bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col cursor-pointer transition-transform duration-150 ease-out hover:-translate-y-0.5"
              >
                {/* 4:3 Studio Product Photography */}
                <div className="aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                  <SolarImage
                    src={product.image}
                    alt={product.name}
                    fallbackLabel={product.name}
                    className="w-full h-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.02]"
                  />
                </div>

                {/* Card Content — Identical Field Order & Unboxed Metadata */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                    <span>{product.categoryLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{product.shortSpec}</span>
                  </div>

                  <h3 className="text-base font-semibold text-slate-900 leading-snug mb-2 group-hover:text-emerald-800 transition-colors">
                    {product.name}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-6 flex-1">
                    {product.summary}
                  </p>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4 mt-auto">
                    <div>
                      <p className="font-mono tabular-nums text-[15px] font-semibold text-slate-900">
                        {formatUsd(product.priceCents)}
                      </p>
                      <p className="text-xs text-slate-500 font-mono tabular-nums">
                        {product.stockCount} in stock · {product.warrantyYears}-yr warranty
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => void handleQuickAdd(e, product)}
                      className="px-4 py-2 min-h-[40px] text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
