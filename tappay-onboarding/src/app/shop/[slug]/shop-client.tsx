'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ShoppingCart, X, Minus, Plus } from 'lucide-react'

interface ProductItem {
  product_name: string
  product_price: number
  product_description: string | null
  product_image_path: string | null
}

interface CartItem {
  idx: number
  name: string
  price: number
  qty: number
}

interface Props {
  products: ProductItem[]
  supabaseUrl: string
}

export function ShopClient({ products, supabaseUrl }: Props) {
  const [quantities, setQuantities] = useState<number[]>(products.map(() => 1))
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)

  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0)
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0)

  function updateQty(idx: number, delta: number) {
    setQuantities((prev) => prev.map((q, i) => (i === idx ? Math.max(1, q + delta) : q)))
  }

  function addToCart(idx: number) {
    const qty = quantities[idx]
    const product = products[idx]
    setCart((prev) => {
      const existing = prev.find((item) => item.idx === idx)
      if (existing) {
        return prev.map((item) => item.idx === idx ? { ...item, qty: item.qty + qty } : item)
      }
      return [...prev, { idx, name: product.product_name, price: product.product_price, qty }]
    })
    setQuantities((prev) => prev.map((q, i) => (i === idx ? 1 : q)))
  }

  return (
    <>
      {products.map((product, idx) => {
        const imageUrl = product.product_image_path
          ? `${supabaseUrl}/storage/v1/object/public/shop-images/${product.product_image_path}`
          : null
        return (
          <div key={idx} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {imageUrl ? (
              <div className="relative w-full aspect-video bg-gray-100">
                <Image src={imageUrl} alt={product.product_name} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <p className="text-gray-400 text-sm">尚未上傳商品圖片</p>
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold text-gray-900 flex-1">{product.product_name}</h2>
                <p className="text-lg font-bold text-gray-900 flex-shrink-0">
                  NT$ {Number(product.product_price).toLocaleString()}
                </p>
              </div>
              {product.product_description && (
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{product.product_description}</p>
              )}

              {/* 數量選擇 + 加入購物車 */}
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => updateQty(idx, -1)}
                    className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-9 text-sm font-semibold text-gray-900 text-center">
                    {quantities[idx]}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQty(idx, 1)}
                    className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => addToCart(idx)}
                  className="flex-1 h-9 rounded-xl border-2 border-gray-900 text-gray-900 text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  加入購物車
                </button>
              </div>
            </div>
          </div>
        )
      })}

      {/* 浮動購物車按鈕 */}
      <button
        onClick={() => setCartOpen((v) => !v)}
        className="fixed right-4 bottom-6 z-30 w-12 h-12 rounded-full bg-gray-900 text-white shadow-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
      >
        <ShoppingCart className="w-5 h-5" />
        {totalCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>

      {/* 購物車面板 */}
      {cartOpen && (
        <div className="fixed right-4 bottom-20 z-30 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">購物車</p>
            <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          {cart.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">購物車是空的</p>
          ) : (
            <div className="px-4 py-3 space-y-2">
              {cart.map((item) => (
                <div key={item.idx} className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      NT$ {Number(item.price).toLocaleString()} × {item.qty}
                    </p>
                  </div>
                  <p className="text-xs font-semibold text-gray-900 flex-shrink-0">
                    NT$ {(item.price * item.qty).toLocaleString()}
                  </p>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">合計</p>
                <p className="text-sm font-bold text-gray-900">NT$ {totalPrice.toLocaleString()}</p>
              </div>
              <button className="w-full h-10 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors">
                立即結帳
              </button>
            </div>
          )}
        </div>
      )}

      <div className="h-8" />
    </>
  )
}
