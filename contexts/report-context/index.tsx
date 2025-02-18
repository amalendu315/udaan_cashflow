"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ReportData {
  month: string;
  cashBalance: number;
  bankBalance: number;
  openingBalance: number;
  totalCashInflow: number;
  otherPayments:number;
  totalExpenses: number;
  netCashInHand: number;
  inflows: { ledger_name: string; total_amount: number }[];
  expenses: { payment_group: string; total_amount: number }[];
}

interface ReportsContextProps {
  reportData: ReportData | null;
  setReportData: (data: ReportData) => void;
}

const ReportsContext = createContext<ReportsContextProps | undefined>(
  undefined
);

export const ReportsProvider = ({ children }: { children: ReactNode }) => {
  const [reportData, setReportData] = useState<ReportData | null>(null);

  return (
    <ReportsContext.Provider value={{ reportData, setReportData }}>
      {children}
    </ReportsContext.Provider>
  );
};

export const useReports = () => {
  const context = useContext(ReportsContext);
  if (!context) {
    throw new Error("useReports must be used within a ReportsProvider");
  }
  return context;
};
