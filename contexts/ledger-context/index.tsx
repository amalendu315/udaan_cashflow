"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { FetchWrapper } from "@/utils";
import { Ledger } from "@/components/table-columns/ledger";
import { useAuth } from "../auth-context";

interface LedgersContextType {
  ledgers: Ledger[];
  fetchLedgers: () => Promise<void>;
  setLedgers: React.Dispatch<React.SetStateAction<Ledger[]>>;
}

const LedgersContext = createContext<LedgersContextType | undefined>(undefined);

export const LedgersProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth(); // Get the token from AuthContext
  const [ledgers, setLedgers] = useState<Ledger[]>([]);

  // Initialize FetchWrapper
  const fetchWrapper = new FetchWrapper(() => token);

  const fetchLedgers = async () => {
    if (!token) {
      console.warn("Authorization token is not yet available.");
      return;
    }

    try {
      const data = await fetchWrapper.get<Ledger[]>("/ledgers", {
        includeAuth: true,
      });
      setLedgers(data);
    } catch (error) {
      console.error("Error fetching ledgers:", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLedgers(); // Fetch ledgers when token becomes available
    }
  }, [token]);

  return (
    <LedgersContext.Provider value={{ ledgers, fetchLedgers, setLedgers }}>
      {children}
    </LedgersContext.Provider>
  );
};

export const useLedgers = () => {
  const context = useContext(LedgersContext);
  if (!context) {
    throw new Error("useLedgers must be used within a LedgersProvider");
  }
  return context;
};
