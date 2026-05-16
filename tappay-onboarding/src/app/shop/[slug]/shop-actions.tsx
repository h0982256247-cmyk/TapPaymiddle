'use client'

import { useState } from 'react'
import { ShoppingCart, X } from 'lucide-react'

interface ShopActionsProps {
  productName: string
  productPrice: number
}

export function ShopActions({ productName, productPrice }: ShopActionsProps) {
  const [cartCount, setCartCount] = useState(0)
  const [cartOpen, setCartOpen] = useState(false)

  function handleAddToCart() {
    setCartCount((prev) => prev + 1)
  }

  return (
    <>
      {/* 底部按鈕列 */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 px-4 py-3 pb-safe">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={handleAddToCart}
            className="flex-1 h-11 rounded-xl border-2 border-gray-900 text-gray-900 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            加入購物車
          </button>
          <button
            className="flex-1 h-11 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            立即結帳
          </button>
        </div>
      </div>

      {/* 浮動購物車按鈕 */}
      <button
        onClick={() => setCartOpen((v) => !v)}
        className="fixed right-4 bottom-20 z-30 w-12 h-12 rounded-full bg-gray-900 text-white shadow-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
      >
        <ShoppingCart className="w-5 h-5" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {cartCount > 99 ? '99+' : cartCount}
          </span>
        )}
      </button>

      {/* 購物車小面板 */}
      {cartOpen && (
        <div className="fixed right-4 bottom-36 z-30 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">購物車</p>
            <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          {cartCount === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">購物車是空的</p>
          ) : (
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{productName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">NT$ {Number(productPrice).toLocaleString()} × {cartCount}</p>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">小計</p>
                <p className="text-sm font-bold text-gray-900">
                  NT$ {(Number(productPrice) * cartCount).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 底部按鈕的 spacer */}
      <div className="h-20" />
    </>
  )
}
