"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "../auth-context";
import { FetchWrapper } from "@/utils";

export interface PaymentGroup {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

interface PaymentGroupsContextType {
  paymentGroups: PaymentGroup[];
  setPaymentGroups: React.Dispatch<React.SetStateAction<PaymentGroup[]>>;
  fetchPaymentGroups: () => Promise<void>;
}

const PaymentGroupsContext = createContext<
  PaymentGroupsContextType | undefined
>(undefined);

export const PaymentGroupsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { token } = useAuth(); // Get token from AuthContext
  const [paymentGroups, setPaymentGroups] = useState<PaymentGroup[]>([]);

  // Create an instance of FetchWrapper
  const fetchWrapper = new FetchWrapper(() => token);

  const fetchPaymentGroups = async () => {
    if (!token) {
      console.warn("Authorization token is missing.");
      return;
    }

    try {
      const data = await fetchWrapper.get<PaymentGroup[]>("/payment-groups", {
        includeAuth: true,
      });
      const sortedPaymentGroups = data.sort((a, b) => a.name.localeCompare(b.name));
      setPaymentGroups(sortedPaymentGroups);
    } catch (error) {
      console.error("Error fetching payment groups:", (error as Error).message);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPaymentGroups();
    }
  }, [token]);

  return (
    <PaymentGroupsContext.Provider
      value={{ paymentGroups, setPaymentGroups, fetchPaymentGroups }}
    >
      {children}
    </PaymentGroupsContext.Provider>
  );
};

export const usePaymentGroups = () => {
  const context = useContext(PaymentGroupsContext);
  if (!context) {
    throw new Error(
      "usePaymentGroups must be used within a PaymentGroupsProvider"
    );
  }
  return context;
};
