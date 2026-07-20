import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)
}

export function calcDiscountPercent(price, originalPrice) {
  if (!originalPrice || originalPrice <= price) return 0
  return Math.round(((originalPrice - price) / originalPrice) * 100)
}

export function getOriginalPrice(product) {
  const price = Number(product.price ?? product.msrp ?? 0)
  const discount = Number(product.discount ?? 0)
  if (discount > 0 && discount < 100) {
    return Math.round(price / (1 - discount / 100))
  }
  return product.originalPrice ?? null
}
