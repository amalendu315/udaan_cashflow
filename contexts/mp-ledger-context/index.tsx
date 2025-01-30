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

export interface Ledger {
  id: number;
  name: string;
}

interface MonthlyPaymentLedgersContextType {
  ledgers: Ledger[];
  fetchLedgers: () => Promise<void>;
  setLedgers: React.Dispatch<React.SetStateAction<Ledger[]>>;
}

const MonthlyPaymentLedgersContext = createContext<
  MonthlyPaymentLedgersContextType | undefined
>(undefined);

export const MonthlyPaymentLedgersProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { token } = useAuth();
  const [ledgers, setLedgers] = useState<Ledger[]>([]);

  const fetchWrapper = new FetchWrapper(() => token);

  const fetchLedgers = async () => {
    if (!token) {
      console.warn("Authorization token is not yet available.");
      return;
    }

    try {
      const data = await fetchWrapper.get<Ledger[]>("/mp-ledgers", {
        includeAuth: true,
      });
      setLedgers(data);
    } catch (error) {
      console.error("Error fetching ledgers:", error);
    }
  };

  useEffect(() => {
    if (token) fetchLedgers();
  }, [token]);

  return (
    <MonthlyPaymentLedgersContext.Provider
      value={{ ledgers, fetchLedgers, setLedgers }}
    >
      {children}
    </MonthlyPaymentLedgersContext.Provider>
  );
};

export const useMonthlyPaymentLedgers = () => {
  const context = useContext(MonthlyPaymentLedgersContext);
  if (context === undefined) {
    throw new Error(
      "useMonthlyPaymentLedgers must be used within a MonthlyPaymentLedgersProvider"
    );
  }
  return context;
};
