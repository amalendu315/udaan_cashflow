"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { FetchWrapper } from "@/utils";
import { useAuth } from "@/contexts";
import { ProjectedInflow } from "@/types";

interface PIContextType {
  inflows: ProjectedInflow[];
  fetchInflows: () => Promise<void>;
}

const PIContext = createContext<PIContextType | undefined>(undefined);

export const PIProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth(); // Get token from AuthContext
  const [inflows, setInflows] = useState<ProjectedInflow[]>([]);

  // Initialize FetchWrapper
  const fetchWrapper = new FetchWrapper(() => token);

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  };

  const fetchInflows = async () => {
    if (!token) {
      console.warn("Authorization token is not yet available.");
      return;
    }

    const currentMonth = getCurrentMonth();
    try {
      const data = await fetchWrapper.get<ProjectedInflow[]>(
        `/projected-inflow?month=${currentMonth}`,
        {
          includeAuth: true,
        }
      );
      setInflows(data);
    } catch (error) {
      console.error("Error fetching projected inflows:", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchInflows(); // Only fetch if token is available
    }
  }, [token]); // Re-fetch inflows when token changes

  return (
    <PIContext.Provider value={{ inflows, fetchInflows }}>
      {children}
    </PIContext.Provider>
  );
};

export const useInflows = () => {
  const context = useContext(PIContext);
  if (context === undefined) {
    throw new Error("useInflows must be used within a PIProvider");
  }
  return context;
};
