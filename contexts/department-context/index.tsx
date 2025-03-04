"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { FetchWrapper } from "@/utils";
import { useAuth } from "../auth-context";

interface Department {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

interface DepartmentsContextType {
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>; // Add setDepartments
  fetchDepartments: () => Promise<void>;
}

const DepartmentsContext = createContext<DepartmentsContextType | undefined>(
  undefined
);

export const DepartmentsProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);

  const fetchWrapper = new FetchWrapper(() => token);

  const fetchDepartments = async () => {
    if (!token) return;

    try {
      const data = await fetchWrapper.get<Department[]>("/departments", {
        includeAuth: true,
      });
      const sortedDepartments = data.sort((a, b) => a.name.localeCompare(b.name));
      setDepartments(sortedDepartments);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  useEffect(() => {
    if (token) fetchDepartments();
  }, [token]);

  return (
    <DepartmentsContext.Provider
      value={{ departments, setDepartments, fetchDepartments }}
    >
      {children}
    </DepartmentsContext.Provider>
  );
};

export const useDepartments = () => {
  const context = useContext(DepartmentsContext);
  if (!context) {
    throw new Error("useDepartments must be used within a DepartmentsProvider");
  }
  return context;
};
