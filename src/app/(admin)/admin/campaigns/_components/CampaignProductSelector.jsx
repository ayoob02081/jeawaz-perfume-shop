"use client";

import { useEffect, useState } from "react";
import AppImage from "@/components/AppImage";

function CampaignProductSelector({
  products = [],
  selectedIds = [],
  onChange,
  search,
  onSearchChange,
  isLoading = false,
}) {
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    setSelectedProducts((current) => {
      const existing = new Map(
        current.map((product) => [Number(product.id), product]),
      );

      products.forEach((product) => {
        const id = Number(product.id);

        if (selectedIds.includes(id)) {
          existing.set(id, product);
        }
      });

      return Array.from(existing.values()).filter((product) =>
        selectedIds.includes(Number(product.id)),
      );
    });
  }, [products, selectedIds]);

  const toggleProduct = (product) => {
    const id = Number(product.id);

    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));

      setSelectedProducts((current) =>
        current.filter((item) => Number(item.id) !== id),
      );

      return;
    }

    onChange([...selectedIds, id]);

    setSelectedProducts((current) => [...current, product]);
  };

  return (
    <div className="space-y-4">
      {/* SEARCH */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="جستجوی محصول..."
          className="w-full border border-stroke-300 rounded-xl px-4 py-3 outline-none focus:border-primary"
        />
      </div>

      {/* SELECTED COUNT */}
      <div className="flex items-center justify-between">
        <p className="font-bold">{selectedIds.length} محصول انتخاب شده</p>

        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => {
              onChange([]);
              setSelectedProducts([]);
            }}
            className="text-sm text-red-500"
          >
            حذف همه
          </button>
        )}
      </div>

      {/* PRODUCT LIST */}
      <div className="border border-stroke-300 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-stroke-500">
            در حال دریافت محصولات...
          </div>
        ) : products.length === 0 ? (
          <div className="p-6 text-center text-stroke-500">محصولی پیدا نشد</div>
        ) : (
          <div className="divide-y divide-stroke-200 max-h-125 overflow-y-auto">
            {products.map((product) => {
              const id = Number(product.id);
              const checked = selectedIds.includes(id);

              return (
                <label
                  key={id}
                  className={`flex items-center gap-4 p-4 cursor-pointer transition ${
                    checked ? "bg-primary/5" : "hover:bg-stroke-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleProduct(product)}
                    className="size-5 accent-primary shrink-0"
                  />

                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg">
                    <AppImage
                      src={product.images?.[0]}
                      alt={product.perTitle || product.enTitle}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold truncate">{product.perTitle}</p>

                    <p className="text-sm text-stroke-500 truncate">
                      {product.enTitle}
                    </p>

                    {product.brand?.title && (
                      <p className="text-xs text-stroke-400">
                        {product.brand.title}
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CampaignProductSelector;
