import {
  BarChart3,
  Boxes,
  CreditCard,
  LayoutDashboard,
  Settings,
  ShoppingBag,
  Users,
} from "lucide-react";

const NAV_ITEMS = [
  "Dashboard",
  "Products",
  "Inventory",
  "Orders",
  "Payments",
  "Customers",
  "Analytics",
  "Settings",
];

const NAV_ICONS = {
  Dashboard: LayoutDashboard,
  Products: Boxes,
  Inventory: Boxes,
  Orders: ShoppingBag,
  Payments: CreditCard,
  Customers: Users,
  Analytics: BarChart3,
  Settings: Settings,
};

export default function AdminSidebar({
  user,
  activeNav,
  setActiveNav,
}) {
  return (
    <aside className="w-full rounded-[1.5rem] border border-slate-800 bg-slate-900 p-6 lg:w-72">
      <h1 className="text-xl font-bold tracking-wider text-white">
        <span className="text-indigo-400">Shop</span>Sphere Admin
      </h1>

      {user && (
        <div className="mt-3 border-b border-slate-800 pb-4">
          <p className="text-sm font-medium text-white">
            {user.name}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {user.email}
          </p>

          <span className="mt-3 inline-flex rounded-full bg-indigo-600/20 px-3 py-1 text-xs font-semibold text-indigo-400">
            {user.role}
          </span>
        </div>
      )}

      <nav className="mt-8 space-y-2 text-sm">
        {NAV_ITEMS.map((item) => {
          const Icon = NAV_ICONS[item];

          const active = activeNav === item;

          return (
            <button
              key={item}
              onClick={() => setActiveNav(item)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 font-medium transition-all ${
                active
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={18} />

              <span>{item}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}