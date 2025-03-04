"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  DollarSign,
  Calendar,
  BarChart,
  Home,
  User,
  List,
  FileArchiveIcon,
  IndianRupeeIcon,
  ShoppingBag,
  DatabaseIcon,
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";

interface SubmenuLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarLink {
  label: string;
  icon: React.ReactNode;
  href?: string;
  isSubmenu?: boolean;
  submenu?: SubmenuLink[];
}

const Sidebar = ({ isOpen }: { isOpen: boolean }) => {
  const { user } = useAuth();
  const pathname = usePathname();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const links: Record<string, SidebarLink[]> = {
    Admin: [
      {
        label: "Users & Hotels",
        isSubmenu: true,
        icon: <Home />,
        submenu: [
          { href: "/admin/users", label: "Users", icon: <User /> },
          { href: "/admin/roles", label: "Roles", icon: <List /> },
          {
            href: "/admin/hotels",
            label: "Hotels",
            icon: <Home />,
          },
          {
            href: "/admin/departments",
            label: "Departments",
            icon: <Home />,
          },
          {
            href: "/admin/ledgers",
            label: "Inflow Ledgers",
            icon: <DatabaseIcon />,
          },
          {
            href: "/admin/mp-ledgers",
            label: "Payment Ledgers",
            icon: <DatabaseIcon />,
          },
          {
            href: "/admin/vendors",
            label: "Vendors",
            icon: <ShoppingBag />,
          },
        ],
      },
      {
        label: "Financial Management",
        isSubmenu: true,
        icon: <IndianRupeeIcon />,
        submenu: [
          {
            href: "/admin/payment-groups",
            label: "Payment Groups",
            icon: <IndianRupeeIcon />,
          },
          {
            href: "/admin/payment-requests",
            label: "Payment Requests",
            icon: <FileText />,
          },
          {
            href: "/admin/projected-inflow",
            label: "Projected Inflow",
            icon: <BarChart />,
          },
          {
            href: "/admin/monthly-payments",
            label: "Monthly Payments",
            icon: <Calendar />,
          },
          {
            href: "/admin/scheduled-payments",
            label: "Scheduled Payments",
            icon: <Calendar />,
          },
          {
            href: "/admin/cashflow",
            label: "Cashflow",
            icon: <DollarSign />,
          },
          // {
          //   href: "/admin/charts",
          //   label: "Charts",
          //   icon: <ChartBar />,
          // },
          {
            href: "/admin/reports",
            label: "Reports",
            icon: <Calendar />,
          },
        ],
      },
      {
        href: "/admin/cache-logs",
        label: "All Logs",
        icon: <FileArchiveIcon />,
      },
    ],
    "System-Admin": [
      {
        label: "Users & Hotels",
        isSubmenu: true,
        icon: <Home />,
        submenu: [
          { href: "/system-admin/users", label: "Users", icon: <User /> },
          { href: "/system-admin/roles", label: "Roles", icon: <List /> },
          {
            href: "/system-admin/hotels",
            label: "Hotels",
            icon: <Home />,
          },
          {
            href: "/system-admin/departments",
            label: "Departments",
            icon: <Home />,
          },
          {
            href: "/system-admin/ledgers",
            label: "Inflow Ledgers",
            icon: <DatabaseIcon />,
          },
          {
            href: "/system-admin/mp-ledgers",
            label: "Payment Ledgers",
            icon: <DatabaseIcon />,
          },
          {
            href: "/system-admin/vendors",
            label: "Vendors",
            icon: <ShoppingBag />,
          },
        ],
      },
      {
        label: "Financial Management",
        isSubmenu: true,
        icon: <IndianRupeeIcon />,
        submenu: [
          {
            href: "/system-admin/payment-groups",
            label: "Payment Groups",
            icon: <IndianRupeeIcon />,
          },
          {
            href: "/system-admin/payment-requests",
            label: "Payment Requests",
            icon: <FileText />,
          },
          {
            href: "/system-admin/projected-inflow",
            label: "Projected Inflow",
            icon: <BarChart />,
          },
          {
            href: "/system-admin/monthly-payments",
            label: "Monthly Payments",
            icon: <Calendar />,
          },
          {
            href: "/system-admin/scheduled-payments",
            label: "Scheduled Payments",
            icon: <Calendar />,
          },
          {
            href: "/system-admin/cashflow",
            label: "Cashflow",
            icon: <DollarSign />,
          },
          // {
          //   href: "/system-admin/charts",
          //   label: "Charts",
          //   icon: <ChartBar />,
          // },
          {
            href: "/system-admin/reports",
            label: "Reports",
            icon: <Calendar />,
          },
        ],
      },
      {
        href: "/system-admin/cache-logs",
        label: "All Logs",
        icon: <FileArchiveIcon />,
      },
    ],
    "Sub-Admin": [
      {
        label: "Financial Management",
        isSubmenu: true,
        icon: <DollarSign />,
        submenu: [
          {
            href: "/subadmin/payment-requests",
            label: "Payment Requests",
            icon: <FileText />,
          },
          {
            href: "/subadmin/cashflow",
            label: "Cashflow",
            icon: <DollarSign />,
          },
        ],
      },
    ],
    User: [
      {
        label: "Financial Management",
        isSubmenu: true,
        icon: <DollarSign />,
        submenu: [
          {
            href: "/user/payment-requests",
            label: "Payment Requests",
            icon: <FileText />,
          },
        ],
      },
    ],
  };

  const roleLinks: SidebarLink[] = links[user?.role ?? "Admin"] || [];

  return (
    <div
      className={`bg-white text-gray-800 transition-all duration-300 h-screen ${
        isOpen ? "w-75" : "w-22"
      } border-r border-gray-200`}
    >
      <aside className="flex flex-col h-full">
        {/* Logo Section */}
        <div
          className={`flex items-center justify-center border-b border-gray-300 ${
            isOpen ? "h-20" : "h-16"
          }`}
        >
          {isOpen ? (
            <Image
              src="/assets/UDAAN_PBG.webp"
              alt="Logo"
              className="max-w-[88%]"
              width={100}
              height={100}
            />
          ) : (
            <Image
              src="/assets/UDaan_2.jpg"
              alt="Logo"
              className="max-w-[88%]"
              width={40}
              height={40}
            />
          )}
        </div>

        {/* Navigation Links */}
        <nav className="mt-4 flex-1 overflow-y-auto">
          <ul className="space-y-2 px-2">
            {roleLinks.map((link) =>
              link.submenu ? (
                <li key={link.label}>
                  <button
                    onClick={() => toggleSubmenu(link.label)}
                    className={`flex items-center justify-between w-full px-2 py-2 text-left rounded-lg ${
                      isOpen ? "hover:bg-gray-100" : "justify-center"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {link.icon}
                      {isOpen && (
                        <span className="text-sm font-medium">
                          {link.label}
                        </span>
                      )}
                    </div>
                    {isOpen &&
                      (openSubmenus[link.label] ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      ))}
                  </button>
                  {openSubmenus[link.label] && isOpen && (
                    <ul className="mt-2 space-y-2 pl-3">
                      {link.submenu.map((subLink) => (
                        <li key={subLink.label}>
                          <Link
                            href={subLink.href}
                            className={`flex items-center gap-4 px-2 py-2 rounded-lg ${
                              pathname === subLink.href
                                ? "bg-blue-50 border-l-4 border-blue-500"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            {subLink.icon}
                            {isOpen && (
                              <span className="text-sm font-medium">
                                {subLink.label}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ) : (
                <li key={link.label}>
                  <Link
                    href={link.href || "#"}
                    className={`flex items-center gap-3 px-2 py-2 rounded-lg ${
                      isOpen ? "hover:bg-gray-100" : "justify-center"
                    } ${
                      pathname === link.href
                        ? "bg-blue-50 border-l-4 border-blue-500"
                        : ""
                    }`}
                  >
                    {link.icon}
                    {isOpen && (
                      <span className="text-sm font-medium">{link.label}</span>
                    )}
                  </Link>
                </li>
              )
            )}
          </ul>
        </nav>
      </aside>
    </div>
  );
};

export default Sidebar;
