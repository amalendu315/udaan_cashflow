"use client";
import { AuthContextProps } from "@/types";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {jwtDecode} from "jwt-decode";

interface lser {
  id: number;
  username: string;
  email: string;
  created_at: string; // or Date if you want to parse it
  updated_at: string; // or Date
  role: string;
  role_id: string;
  hotel_ids: number[]; // Array of hotel ids
  hotel_names: string[]; // Array of hotel ids
}

interface DecodedToken {
  exp: number; // Expiration time in UNIX timestamp
  id: number;
  role: string;
  hotelId: number;
  username: string;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<lser | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");

    if (storedToken && storedUser) {
      const decoded: DecodedToken = jwtDecode(storedToken);

      // 🕒 Check if token is expired
      const currentTime = Date.now() / 1000; // Convert to seconds
      if (decoded.exp < currentTime) {
        logout(); // 🔴 If expired, logout user
      } else {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // ✅ Auto logout when token expires
        const timeUntilExpiry = (decoded.exp - currentTime) * 1000;
        setTimeout(() => {
          logout();
        }, timeUntilExpiry);
      }
    }
  }, []);

  const login = (token: string, user: lser) => {
    setToken(token);
    setUser(user);
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", JSON.stringify(user));
    router.push("/");
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    router.push("/login");
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider
      value={{ token, user, login, logout, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
