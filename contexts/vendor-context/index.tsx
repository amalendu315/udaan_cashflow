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
import toast from "react-hot-toast";

export interface Vendor {
  id: number;
  name: string;
  phone: string;
  email: string;
  location: string;
  description: string;
  created_at: string;
}

interface VendorContextType {
  vendors: Vendor[];
  fetchVendors: () => Promise<void>;
  setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>; // Allow manual updates
}

const VendorsContext = createContext<VendorContextType | undefined>(undefined);

export const VendorsProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth(); // Get token from AuthContext
  const [vendors, setVendors] = useState<Vendor[]>([]);

  // Create an instance of FetchWrapper
  const fetchWrapper = new FetchWrapper(() => token);

  // Fetch all vendors from the API
  const fetchVendors = async () => {
    if (!token) {
      console.warn("Authorization token is not yet available.");
      return;
    }

    try {
      const data = await fetchWrapper.get<Vendor[]>("/vendors", {
        includeAuth: true,
      });
      const sortedVendors = data.sort((a, b) => a.name.localeCompare(b.name));
      setVendors(sortedVendors);
    } catch (error) {
      console.error("Error fetching vendors:", (error as Error)?.message);
      toast.error("Failed to fetch vendors.");
    }
  };
  // Fetch vendors on initial load
  useEffect(() => {
    if (token) {
      fetchVendors();
    }
  }, [token]);

  return (
    <VendorsContext.Provider value={{ vendors, fetchVendors, setVendors }}>
      {children}
    </VendorsContext.Provider>
  );
};

export const useVendors = () => {
  const context = useContext(VendorsContext);
  if (context === undefined) {
    throw new Error("useVendors must be used within a VendorsProvider");
  }
  return context;
};
