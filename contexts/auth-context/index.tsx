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

interface User {
  Id: number;
  email: string;
  hotel_id: number;
  hotel_name: string;
  role_id: string;
  role: string;
  username: string;
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
  const [user, setUser] = useState<User | null>(null);

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

  const login = (token: string, user: User) => {
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
