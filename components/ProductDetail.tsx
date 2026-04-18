"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Clock, Star, X } from "lucide-react";
import type { MenuItem } from "@/lib/menu";

type ProductDetailProps = {
  item: MenuItem | null;
  onClose: () => void;
};

const ProductDetail: React.FC<ProductDetailProps> = ({ item, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
      />

      {/* Content Card */}
      <div
        className={`
          relative w-full md:max-w-lg bg-white dark:bg-zinc-900 
          rounded-t-[32px] md:rounded-[32px] overflow-hidden shadow-2xl 
          transform transition-transform duration-300 ease-out
          ${
            isClosing
              ? "translate-y-full md:translate-y-10 md:opacity-0"
              : "translate-y-0"
          }
          max-h-[90vh] flex flex-col
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full backdrop-blur-md transition-all"
        >
          <X size={20} />
        </button>

        {/* Image Header */}
        <div className="relative h-72 md:h-80 w-full shrink-0 bg-zinc-800">
          {item.image?.trim() ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="w-full h-full object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm"
              aria-hidden
            >
              No photo
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent opacity-80" />

          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm">
                {item.category}
              </span>
              <div className="flex items-center gap-1 text-amber-300 text-xs font-medium bg-black/30 backdrop-blur-md px-2 py-1 rounded-md">
                <Star size={12} fill="currentColor" /> {item.rating}
              </div>
            </div>
            <h2 className="text-3xl font-serif font-bold leading-tight shadow-sm">
              {item.name}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm">
              <Clock size={16} />
              <span>Prep: {item.time}</span>
            </div>
            <span className="text-2xl font-bold text-zinc-900 dark:text-white font-sans">
              {item.price}
            </span>
          </div>

          <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed text-base">
            {item.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

