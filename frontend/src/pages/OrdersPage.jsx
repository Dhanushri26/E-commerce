import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  RefreshCw,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

/** Map Lambda orderStatus values to display config */
function getOrderStatus(status) {
  const map = {
    PENDING_PAYMENT: { label: 'Pending Payment', color: 'bg-amber-100 text-amber-700', icon: Clock },
    PENDING_MANAGEMENT_APPROVAL: { label: 'Awaiting Approval', color: 'bg-blue-100 text-blue-700', icon: Clock },
    CONFIRMED: { label: 'Confirmed', color: 'bg-sky-100 text-sky-700', icon: CheckCircle2 },
    PROCESSING: { label: 'Processing', color: 'bg-indigo-100 text-indigo-700', icon: RotateCcw },
    SHIPPED: { label: 'Shipped', color: 'bg-purple-100 text-purple-700', icon: Truck },
    DELIVERED: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
  };
  return map[status] || { label: status || 'Unknown', color: 'bg-slate-100 text-slate-600', icon: Package };
}

function getPaymentStatus(status) {
  const map = {
    PENDING: { label: 'Payment Pending', color: 'bg-amber-100 text-amber-700' },
    PAID: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700' },
    FAILED: { label: 'Failed', color: 'bg-red-100 text-red-700' },
    REFUNDED: { label: 'Refunded', color: 'bg-blue-100 text-blue-700' },
  };
  return map[status] || { label: status || 'Unknown', color: 'bg-slate-100 text-slate-600' };
}

// Simple timeline steps for visual progress
const TIMELINE_STEPS = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

function OrderTimeline({ currentStatus }) {
  const currentIdx = TIMELINE_STEPS.indexOf(currentStatus);
  const isCancelled = currentStatus === 'CANCELLED';
  return (
    <div className="mt-4 flex items-center gap-0">
      {TIMELINE_STEPS.map((step, idx) => {
        const done = !isCancelled && currentIdx >= idx;
        const active = currentIdx === idx && !isCancelled;
        return (
          <div key={step} className="flex flex-1 items-center">
            <div
              className={`h-2.5 w-2.5 rounded-full transition-all ${
                isCancelled ? 'bg-slate-200' : done ? 'bg-indigo-600 ring-2 ring-indigo-100' : 'bg-slate-200'
              } ${active ? 'scale-125' : ''}`}
            />
            {idx < TIMELINE_STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 ${done && currentIdx > idx ? 'bg-indigo-600' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function OrdersPage() {
  const { orders, ordersLoading, loadOrders } = useAppContext();

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 page-enter">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 lg:text-3xl">My Orders</h1>
          <p className="mt-1 text-sm text-slate-500">
            {ordersLoading ? 'Loading…' : `${orders.length} order${orders.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
        <button
          onClick={loadOrders}
          disabled={ordersLoading}
          id="orders-refresh-btn"
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
        >
          <RefreshCw size={14} className={ordersLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Loading skeleton */}
      {ordersLoading && orders.length === 0 && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <div className="h-4 w-40 rounded-full bg-slate-200" />
                <div className="h-6 w-24 rounded-full bg-slate-100" />
              </div>
              <div className="mt-4 h-2.5 rounded-full bg-slate-100" />
              <div className="mt-4 flex justify-between">
                <div className="h-3 w-28 rounded-full bg-slate-100" />
                <div className="h-3 w-20 rounded-full bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!ordersLoading && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <div className="rounded-full bg-indigo-50 p-6">
            <ShoppingBag className="text-indigo-400" size={40} />
          </div>
          <h2 className="mt-5 text-xl font-bold text-slate-800">No orders yet</h2>
          <p className="mt-2 max-w-xs text-sm text-slate-400">
            You haven't placed any orders yet. Start browsing our products!
          </p>
          <Link
            to="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition"
          >
            Browse Products <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Order list */}
      {orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => {
            const oStatus = getOrderStatus(order.orderStatus);
            const pStatus = getPaymentStatus(order.paymentStatus);
            const StatusIcon = oStatus.icon;
            const dateStr = order.createdAt
              ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '—';
            const itemCount = Array.isArray(order.items) ? order.items.length : '—';
            const itemNames = Array.isArray(order.items)
              ? order.items
                  .slice(0, 2)
                  .map((i) => i.title || i.name || 'Product')
                  .join(', ')
              : '';

            return (
              <div
                key={order.orderId}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                id={`order-${order.orderId}`}
              >
                {/* Top row */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-xl p-2 ${oStatus.color}`}>
                      <StatusIcon size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400">
                        ORDER #{order.orderId?.substring(0, 8).toUpperCase()}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-700">{dateStr}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${pStatus.color}`}
                    >
                      {pStatus.label}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${oStatus.color}`}
                    >
                      {oStatus.label}
                    </span>
                  </div>
                </div>

                {/* Progress timeline */}
                <div className="mt-4 px-1">
                  <div className="mb-1.5 flex justify-between text-[10px] font-medium text-slate-400">
                    {TIMELINE_STEPS.map((s) => (
                      <span key={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</span>
                    ))}
                  </div>
                  <OrderTimeline currentStatus={order.orderStatus} />
                </div>

                {/* Bottom row */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-sm">
                  <div className="text-slate-500">
                    <span className="font-medium text-slate-700">
                      {itemCount} item{itemCount !== 1 ? 's' : ''}
                    </span>
                    {itemNames && (
                      <span className="ml-2 text-slate-400 text-xs">
                        ({itemNames}
                        {Array.isArray(order.items) && order.items.length > 2 ? '…' : ''})
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-slate-900">
                    ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
