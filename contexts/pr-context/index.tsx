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
import { PaymentRequest } from "@/types";

interface PRContextType {
  requests: PaymentRequest[];
  counts: {
    pendingPayments: number;
    transferPending: number;
    approvedPayments: number;
    rejectedPayments: number;
  };
  setRequests: React.Dispatch<React.SetStateAction<PaymentRequest[]>>;
  fetchRequests: () => Promise<void>;
  fetchCounts: () => Promise<void>; // Added fetchCounts function
}

const PRContext = createContext<PRContextType | undefined>(undefined);

export const PRProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [counts, setCounts] = useState({
    pendingPayments: 0,
    transferPending: 0,
    approvedPayments: 0,
    rejectedPayments: 0,
  });

  const fetchWrapper = new FetchWrapper(() => token);

  const fetchRequests = async () => {
    if (!token) return;
    try {
      const data = await fetchWrapper.get<PaymentRequest[]>(
        "/payment-requests",
        {
          includeAuth: true,
        }
      );
      setRequests(data);
    } catch (error) {
      console.error("Error fetching payment requests:", error);
    }
  };

  const fetchCounts = async () => {
    if (!token) return;
    try {
      const data = await fetchWrapper.get("/pr-summary", { includeAuth: true });
      setCounts(data as any);
    } catch (error) {
      console.error("Error fetching payment counts:", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRequests();
      fetchCounts();
    }
  }, [token]);

  return (
    <PRContext.Provider
      value={{ requests, counts, setRequests, fetchRequests, fetchCounts }}
    >
      {children}
    </PRContext.Provider>
  );
};

export const useRequests = () => {
  const context = useContext(PRContext);
  if (context === undefined) {
    throw new Error("useRequests must be used within a PRProvider");
  }
  return context;
};
