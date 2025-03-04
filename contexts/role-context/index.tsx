"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "@/contexts/auth-context";
import { FetchWrapper } from "@/utils";

interface Role {
  id:number;
  role_name: string;
}

interface RolesContextType {
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  fetchRoles: () => Promise<void>;
}

const RolesContext = createContext<RolesContextType | undefined>(undefined);

export const RolesProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);

  const fetchWrapper = new FetchWrapper(() => token);

  const fetchRoles = async () => {
    if (!token) {
      console.error("Authorization token is missing.");
      return;
    }

    try {
      const data = await fetchWrapper.get<Role[]>("/roles", {
        includeAuth: true,
      });
      const sortedRoles = data.sort((a, b) => a.role_name.localeCompare(b.role_name));
      setRoles(sortedRoles);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  // Fetch roles on initial load
  useEffect(() => {
    if (token) fetchRoles();
  }, [token]);

  return (
    <RolesContext.Provider
      value={{
        roles,
        setRoles,
        fetchRoles,
      }}
    >
      {children}
    </RolesContext.Provider>
  );
};

export const useRoles = () => {
  const context = useContext(RolesContext);
  if (!context) {
    throw new Error("useRoles must be used within a RolesProvider");
  }
  return context;
};
