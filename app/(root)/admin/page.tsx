"use client";

// Dependencies
import { useState, useEffect } from "react";
import { DollarSign, Calendar, FileText } from "lucide-react";

// Local Imports
import SummaryCard from "@/components/reusable/summary-card";
import Banner from "@/components/reusable/banner";
import { useAuth } from "@/contexts";
import CashflowTable from "@/components/reusable/cashflow-table";

const DashboardPage = () => {
  const { user } = useAuth();
  const [counts, setCounts] = useState({
    scheduledPaymentsCount: 0,
    monthlyPaymentsCount: 0,
    paymentRequestsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch payment summary counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch("/api/payment-summary");
        if (!res.ok) throw new Error("Failed to fetch payment summary data");
        const data = await res.json();
        setCounts(data);
      } catch (error) {
        console.error("Error fetching payment summary data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  // Show access restriction for non-admins
  if (user?.role !== "Admin") {
    return <div className="p-6">You must be an admin to view this page.</div>;
  }

  const summaryCardsData = [
    {
      title: "Scheduled Payments",
      count: counts.scheduledPaymentsCount,
      color: "bg-blue-500",
      icon: <Calendar />,
      route: "/admin/scheduled-payments",
    },
    {
      title: "Monthly Payments",
      count: counts.monthlyPaymentsCount,
      color: "bg-green-500",
      icon: <DollarSign />,
      route: "/admin/monthly-payments",
    },
    {
      title: "Payment Requests",
      count: counts.paymentRequestsCount,
      color: "bg-red-500",
      icon: <FileText />,
      route: "/admin/payment-requests",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <Banner title="Admin Dashboard" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array(3)
              .fill(null)
              .map((_, index) => (
                <div key={index} className="col-span-1 animate-pulse">
                  <div className="h-20 bg-gray-200 rounded-md"></div>
                </div>
              ))
          : summaryCardsData.map((card, index) => (
              <div key={index} className="col-span-1">
                <SummaryCard
                  title={card.title}
                  count={card.count}
                  color={card.color}
                  icon={card.icon}
                  route={card.route}
                />
              </div>
            ))}
      </div>

      {/* Cashflow Table */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Cashflow</h2>
        <CashflowTable readOnly={false} itemsPerPage={10}/>
      </div>
    </div>
  );
};

export default DashboardPage;
