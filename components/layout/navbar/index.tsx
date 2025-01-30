"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu as MenuIcon, LogOut, UserCircle } from "lucide-react";

import { useAuth } from "@/contexts";

const Navbar = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const { logout, user } = useAuth();
  const pathname = usePathname();

  // Generate breadcrumbs from the current path
  const paths = pathname.split("/").filter((path) => path);

  return (
    <header className="bg-white shadow-sm p-4 flex flex-col sm:flex-row justify-between items-center">
      <div className="flex items-center gap-4">
        {/* Sidebar Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-full hover:bg-gray-200"
        >
          <MenuIcon size={20} />
        </button>

        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-500 flex items-center">
          {paths.map((path, index) => {
            const href = "/" + paths.slice(0, index + 1).join("/");
            const isLast = index === paths.length - 1;

            return (
              <span key={href} className="flex items-center space-x-2">
                <Link
                  href={href}
                  className={`hover:text-blue-500 ${
                    isLast ? "text-gray-900 font-bold" : ""
                  }`}
                >
                  {path.charAt(0).toUpperCase() +
                    path.slice(1).replace("-", " ")}
                </Link>
                {!isLast && <span className="text-gray-400">/&nbsp;</span>}
              </span>
            );
          })}
        </nav>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4 mt-2 sm:mt-0">
        <div className="flex items-center gap-2">
          <UserCircle size={24} className="text-gray-700" />
          <span className="text-gray-700">{user?.username || "User"}</span>
        </div>
        <button
          onClick={logout}
          className="p-2 bg-red-500 text-white rounded-sm hover:bg-red-600 flex items-center gap-1"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
