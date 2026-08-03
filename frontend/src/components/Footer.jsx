import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { BRAND, CATEGORIES } from '../constants/brand';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      {/* Newsletter */}
      <div className="border-b border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-12 lg:flex-row lg:px-8">
          <div>
            <h3 className="text-xl font-bold text-white">Stay in the loop</h3>
            <p className="mt-2 text-sm text-slate-400">
              Get exclusive deals, new arrivals, and shopping tips delivered to your inbox.
            </p>
          </div>
          <form className="flex w-full max-w-md gap-2" onSubmit={(e) => e.preventDefault()}>
            <Input
              type="email"
              placeholder="Enter your email"
              className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
              containerClassName="flex-1"
            />
            <Button type="submit" className="shrink-0">
              Subscribe
            </Button>
          </form>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {/* Brand */}
        <div>
          <p className="text-xl font-bold text-white">
            <span className="text-indigo-400">Shop</span>Sphere
          </p>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            {BRAND.tagline} Discover quality products across every category, with fast delivery and hassle-free returns.
          </p>
          <div className="mt-6 flex gap-3">
            {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="rounded-lg bg-slate-800 p-2 text-slate-400 transition hover:bg-indigo-600 hover:text-white"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        {/* Shop */}
        <div>
          <h3 className="font-semibold text-white">Shop</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {CATEGORIES.slice(0, 5).map((cat) => (
              <li key={cat.label}>
                <Link to={cat.path} className="text-slate-400 transition hover:text-white">
                  {cat.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/offers" className="text-slate-400 transition hover:text-white">
                Today&apos;s Deals
              </Link>
            </li>
          </ul>
        </div>

        {/* Customer Care */}
        <div>
          <h3 className="font-semibold text-white">Customer Care</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
            <li>
              <Link to="/orders" className="transition hover:text-white">
                Track Order
              </Link>
            </li>
            <li>
              <Link to="/contact" className="transition hover:text-white">
                Help Center
              </Link>
            </li>
            <li>Free Shipping</li>
            <li>Easy Returns</li>
            <li>Secure Payments</li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="font-semibold text-white">Contact</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
            <li>{BRAND.address}</li>
            <li>{BRAND.email}</li>
            <li>{BRAND.phone}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 px-4 py-6 text-center text-xs text-slate-500 lg:px-8">
        © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
      </div>
    </footer>
  );
}
