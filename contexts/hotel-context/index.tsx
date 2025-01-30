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

interface Hotel {
  Id: number;
  name: string;
  location: string;
  description: string;
  created_at: string;
}

interface HotelsContextType {
  hotels: Hotel[];
  setHotels: React.Dispatch<React.SetStateAction<Hotel[]>>; // Add setHotels
  fetchHotels: () => Promise<void>;
}

const HotelsContext = createContext<HotelsContextType | undefined>(undefined);

export const HotelsProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const fetchWrapper = new FetchWrapper(() => token);

  const fetchHotels = async () => {
    if (!token) return;

    try {
      const data = await fetchWrapper.get<Hotel[]>("/hotels", {
        includeAuth: true,
      });
      setHotels(data);
    } catch (error) {
      console.error("Error fetching hotels:", error);
    }
  };

  useEffect(() => {
    if (token) fetchHotels();
  }, [token]);

  return (
    <HotelsContext.Provider value={{ hotels, setHotels, fetchHotels }}>
      {children}
    </HotelsContext.Provider>
  );
};

export const useHotels = () => {
  const context = useContext(HotelsContext);
  if (!context) {
    throw new Error("useHotels must be used within a HotelsProvider");
  }
  return context;
};
