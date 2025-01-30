"use client"
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/auth-context";


export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login"); // Redirect to login if not authenticated
    } else if (user) {
      // Redirect based on user role
      switch (user.role) {
        case "System-Admin":
          router.push("/system-admin");
          break;
        case "Admin":
          router.push("/admin");
          break;
        case "Sub-Admin":
          router.push("/subadmin");
          break;
        default:
          router.push("/user");
          break;
      }
    }
  }, [isAuthenticated, user, router]);

  return null; // Render nothing
}
