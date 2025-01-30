"use client";

// Local Imports
import SummaryCard from "@/components/reusable/summary-card";
import PaymentRequestTable  from "@/components/reusable/payment-request-table"
import { CheckCircleIcon, ClockIcon, DollarSignIcon, X } from "lucide-react"; // Example icons from Heroicons
import Banner from "@/components/reusable/banner";
import { useAuth, useRequests } from "@/contexts";

const UserDashboardPage = () => {
  const { user } = useAuth();
  const {counts} = useRequests();

  if (user?.role !== "User") {
    return <div>You have to be a user to view this page</div>;
  }

  // Summary card data with icons
  const summaryCards = [
    {
      title: "Pending Requests",
      count: counts.pendingPayments,
      color: "bg-blue-100",
      icon: <ClockIcon className="h-6 w-6 text-blue-600" />,
    },
    {
      title: "Transfer Pending",
      count: counts.transferPending,
      color: "bg-yellow-100",
      icon: <DollarSignIcon className="h-6 w-6 text-yellow-600" />,
    },
    {
      title: "Transfer Completed",
      count: counts.approvedPayments,
      color: "bg-green-100",
      icon: <CheckCircleIcon className="h-6 w-6 text-green-600" />,
    },
    {
      title: "Rejected Payments",
      count: counts.rejectedPayments,
      color: "bg-red-100",
      icon: <X className="h-6 w-6 text-red-600" />,
    },
  ];

  const tableData = [
    {
      title: "Pending Requests",
      filter: "Pending",
    },
    {
      title: "Transfer Pending Requests",
      filter: "Transfer Pending",
    },
    {
      title: "Transfer Completed Requests",
      filter: "Transfer Completed",
    },
    {
      title: "Payment Rejected",
      filter: "Rejected",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Banner title="User Dashboard" />
      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {summaryCards.map((card, index) => (
            <SummaryCard
              key={index}
              title={card.title}
              count={card.count}
              color={card.color}
              icon={card.icon}
            />
          ))}
        </div>

        {/* Tables Section */}
        <div className="space-y-8">
          {tableData.map((table, index) => (
            <div key={index}>
              <h2 className="text-lg font-semibold mb-4 text-gray-700">
                {table.title}
              </h2>
              <PaymentRequestTable role="User" filter={table.filter} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserDashboardPage;
