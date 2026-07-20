import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  UserRound, Heart, ShoppingBag, Settings, LogOut, Package,
  ArrowRight, Mail, Shield, ChevronRight
} from "lucide-react";
import { signOut } from "aws-amplify/auth";
import { useAppContext } from "../context/AppContext";

function statusColor(status) {
  const map = {
    DELIVERED: "bg-emerald-100 text-emerald-700",
    SHIPPED: "bg-purple-100 text-purple-700",
    PROCESSING: "bg-indigo-100 text-indigo-700",
    CONFIRMED: "bg-sky-100 text-sky-700",
    CANCELLED: "bg-red-100 text-red-700",
    PENDING_PAYMENT: "bg-amber-100 text-amber-700",
  };
  return map[status] ?? "bg-slate-100 text-slate-600";
}

export function ProfilePage() {
  const { user, orders, ordersLoading, loadOrders, wishlist, cart } = useAppContext();

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.reload();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const roleBadgeColor = {
    Admin: "bg-red-100 text-red-700",
    Business: "bg-blue-100 text-blue-700",
    Customer: "bg-emerald-100 text-emerald-700",
  }[user?.role] ?? "bg-slate-100 text-slate-600";

  const stats = [
    {
      icon: Package,
      title: "My Orders",
      value: ordersLoading ? "…" : orders.length,
      sub: `${orders.filter((o) => o.orderStatus === "DELIVERED").length} delivered`,
      link: "/orders",
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      icon: Heart,
      title: "Wishlist",
      value: wishlist.length,
      sub: `${wishlist.length} saved items`,
      link: "/wishlist",
      color: "bg-red-50 text-red-500",
    },
    {
      icon: ShoppingBag,
      title: "Cart",
      value: cart.length,
      sub: `${cart.reduce((s, i) => s + (i.quantity ?? 1), 0)} items total`,
      link: "/cart",
      color: "bg-amber-50 text-amber-600",
    },
    {
      icon: Settings,
      title: "Settings",
      value: "—",
      sub: "Preferences & alerts",
      link: "#",
      color: "bg-slate-50 text-slate-500",
    },
  ];

  // Avatar initials
  const initials = (user?.name || user?.email || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 page-enter">
      {/* Profile header card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 p-6 text-white shadow-lg lg:p-8">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-8 left-16 h-32 w-32 rounded-full bg-indigo-400/10 blur-xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold backdrop-blur-sm">
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-bold">Welcome back, {user?.name || "Guest"}!</h1>
              {user?.email && (
                <div className="mt-1 flex items-center gap-1.5 text-sm text-indigo-200">
                  <Mail size={13} />
                  <span>{user.email}</span>
                </div>
              )}
              <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleBadgeColor}`}>
                <Shield size={11} />
                {user?.role || "Customer"}
              </span>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            id="sign-out-btn"
            className="flex w-fit items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              to={item.link}
              id={`profile-${item.title.toLowerCase().replace(/\s/g, "-")}-card`}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={`inline-flex rounded-xl p-2.5 ${item.color}`}>
                <Icon size={20} />
              </div>
              <p className="mt-4 text-2xl font-bold text-slate-900">{item.value}</p>
              <p className="text-sm font-semibold text-slate-700">{item.title}</p>
              <p className="mt-0.5 text-xs text-slate-400">{item.sub}</p>
              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-indigo-600 opacity-0 transition group-hover:opacity-100">
                View <ArrowRight size={12} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent orders */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Recent Orders</h2>
          <Link
            to="/orders"
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
          >
            View all <ChevronRight size={14} />
          </Link>
        </div>

        {ordersLoading ? (
          <div className="mt-4 space-y-3">
            {[1, 2].map((n) => (
              <div key={n} className="animate-pulse flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <div className="h-4 w-40 rounded-full bg-slate-200" />
                <div className="h-4 w-20 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-6 text-center">
            <p className="text-sm text-slate-400">No orders yet.</p>
            <Link to="/products" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline">
              Start Shopping <ArrowRight size={12} />
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {orders.slice(0, 4).map((order) => (
              <div
                key={order.orderId}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Package size={15} className="text-slate-400" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      #{order.orderId?.substring(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-slate-400">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-800 text-sm">
                    ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusColor(order.orderStatus)}`}>
                    {order.orderStatus?.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account info */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-slate-900">Account Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: "Name", value: user?.name || "—" },
            { label: "Email", value: user?.email || "—" },
            { label: "Role", value: user?.role || "Customer" },
            { label: "Member Since", value: "2024" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
