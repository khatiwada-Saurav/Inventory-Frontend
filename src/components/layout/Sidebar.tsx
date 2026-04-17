'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getUser, isAdmin, isSuperAdmin } from '@/lib/auth';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Package, Tag, Truck, ShoppingCart,
  DollarSign, BarChart2, Settings, Users, User, Building2,
} from 'lucide-react';

const tenantNavItems = [
  {
    group: 'Main',
    items: [
      { href: '/dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
    ],
  },
  {
    group: 'Inventory',
    items: [
      { href: '/products',   label: 'Products',      icon: Package },
      { href: '/categories', label: 'Categories',    icon: Tag },
      { href: '/suppliers',  label: 'Suppliers',     icon: Truck },
    ],
  },
  {
    group: 'Transactions',
    items: [
      { href: '/purchases',  label: 'Purchases',     icon: ShoppingCart },
      { href: '/sales',      label: 'Sales / Billing', icon: DollarSign },
    ],
  },
  {
    group: 'Analytics',
    items: [
      { href: '/reports',    label: 'Reports',       icon: BarChart2 },
    ],
  },
  {
    group: 'System',
    items: [
      { href: '/settings',   label: 'Settings',      icon: Settings,  adminOnly: true },
      { href: '/users',      label: 'Team Members',  icon: Users,     adminOnly: true },
      { href: '/profile',    label: 'Profile',       icon: User },
    ],
  },
];

const superAdminNavItems = [
  {
    group: 'Administration',
    items: [
      { href: '/super-admin/tenants', label: 'Manage Tenants', icon: Building2 },
    ],
  },
  {
    group: 'System',
    items: [
      { href: '/profile', label: 'Profile', icon: User },
    ],
  },
];

export function Sidebar() {
  const pathname  = usePathname();
  const user      = getUser();
  const admin     = isAdmin();
  const baseItems = isSuperAdmin() ? superAdminNavItems : tenantNavItems;
  const navItems  = baseItems.map((group) => ({
    ...group,
    items: group.items.filter((item) => !('adminOnly' in item && item.adminOnly && !admin)),
  }));

  return (
    <aside className="w-60 min-h-screen bg-[#1E1B4B] flex flex-col fixed top-0 left-0 bottom-0 z-[100] overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
            <Package size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">
              {user?.tenant_name || 'InventoryPro'}
            </h1>
            <p className="text-indigo-300 text-[10px] mt-0.5">
              {isSuperAdmin() ? 'System Administrator' : 'Stock Management'}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        {navItems.map((group) => (
          <div key={group.group} className="mb-1">
            <p className="px-5 py-2 text-[10px] font-semibold text-indigo-400 uppercase tracking-widest">
              {group.group}
            </p>
            {group.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-[13px] font-medium transition-all duration-150',
                    isActive
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-indigo-200 hover:bg-white/8 hover:text-white',
                  )}
                >
                  <Icon size={15} className="flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-indigo-300 text-[10px] truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
