"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { useReports } from "@/contexts/report-context";

const ReportForm = () => {
  const router = useRouter();
  const [month, setMonth] = useState("");
  const [cashBalance, setCashBalance] = useState("");
  const [bankBalance, setBankBalance] = useState("");
  const { setReportData } = useReports();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!month || !cashBalance || !bankBalance) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      // Send report request
      const res = await fetch("/api/cashflow/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          cashBalance: parseFloat(cashBalance),
          bankBalance: parseFloat(bankBalance),
        }),
      });
      if (!res.ok) throw new Error("Failed to generate report");

      const data = await res.json();
      setReportData(data); // ✅ Store in Context

      toast.success("Report generated successfully!");
      router.push("/admin/reports/view"); // ✅ Redirect to view page
    } catch (error) {
      toast.error(`Error generating report.${(error as Error)?.message}`);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">Generate Cash Flow Report</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Select Month</label>
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-medium">Cash Balance</label>
          <Input
            type="number"
            value={cashBalance}
            onChange={(e) => setCashBalance(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-medium">Bank Balance</label>
          <Input
            type="number"
            value={bankBalance}
            onChange={(e) => setBankBalance(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full bg-blue-500 text-white">
          Generate Report
        </Button>
      </form>
    </div>
  );
};

export default ReportForm;
