import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Clock, TrendingUp, Loader2 } from 'lucide-react'
import { Input } from './ui/Input'
import { cn } from '../lib/utils'

const RECENT_SEARCHES_KEY = 'shopsphere_recent_searches'

function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]')
  } catch {
    return []
  }
}

function saveRecentSearch(query) {
  if (!query.trim()) return
  const recent = getRecentSearches().filter((s) => s !== query)
  recent.unshift(query)
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, 5)))
}

export function SearchBar({ products = [], className, onNavigate }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState(getRecentSearches())
  const wrapperRef = useRef(null)
  const navigate = useNavigate()

  const suggestions = useMemo(() => {
    if (!query.trim() || products.length === 0) return []
    const q = query.toLowerCase()
    return products
      .filter(
        (p) =>
          `${p.name ?? p.title} ${p.category ?? ''} ${p.description ?? ''}`
            .toLowerCase()
            .includes(q)
      )
      .slice(0, 6)
  }, [query, products])

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (term) => {
    const q = term || query
    if (!q.trim()) return
    setLoading(true)
    saveRecentSearch(q.trim())
    setRecentSearches(getRecentSearches())
    setOpen(false)
    setQuery('')
    navigate(`/jewelry?search=${encodeURIComponent(q.trim())}`)
    onNavigate?.()
    setTimeout(() => setLoading(false), 300)
  }

  return (
    <div ref={wrapperRef} className={cn('relative w-full', className)}>
      <Input
        icon={loading ? Loader2 : Search}
        placeholder="Search products, brands, categories..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        clearable={!!query}
        onClear={() => setQuery('')}
        className={loading ? '[&_svg]:animate-spin' : ''}
      />

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          {query.trim() && suggestions.length > 0 && (
            <div className="border-b border-slate-100 p-2">
              <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Suggestions
              </p>
              {suggestions.map((product) => {
                const id = product.id ?? product.productId
                const name = product.name ?? product.title
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      navigate(`/products/${id}`)
                      onNavigate?.()
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-slate-50"
                  >
                    {product.image && (
                      <img
                        src={product.image}
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium text-slate-800">{name}</p>
                      <p className="text-xs text-slate-500">{product.category}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {query.trim() && suggestions.length === 0 && (
            <div className="p-6 text-center text-sm text-slate-500">
              No products found for &ldquo;{query}&rdquo;
            </div>
          )}

          {!query.trim() && recentSearches.length > 0 && (
            <div className="p-2">
              <p className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Clock size={12} /> Recent Searches
              </p>
              {recentSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleSearch(term)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <Clock size={14} className="text-slate-400" />
                  {term}
                </button>
              ))}
            </div>
          )}

          {!query.trim() && recentSearches.length === 0 && (
            <div className="p-4">
              <p className="flex items-center gap-1.5 px-1 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <TrendingUp size={12} /> Trending
              </p>
              {['Electronics', 'Fashion', 'Home Decor', 'Sports'].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleSearch(term)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  {term}
                </button>
              ))}
            </div>
          )}

          {query.trim() && (
            <button
              type="button"
              onClick={() => handleSearch()}
              className="w-full border-t border-slate-100 px-4 py-3 text-left text-sm font-medium text-indigo-600 hover:bg-indigo-50"
            >
              Search for &ldquo;{query}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  )
}
