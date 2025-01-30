"use client";
import CreatePaymentRequestDialog from "@/components/dialogs/payment-request/create";
import Banner from "@/components/reusable/banner";
import PaymentRequestTable from "@/components/reusable/payment-request-table";
import SummaryCard from "@/components/reusable/summary-card";
import { useRequests } from "@/contexts";
import { CheckCircleIcon, ClockIcon, DollarSignIcon, X } from "lucide-react";
;

const PaymentRequestsPage = () => {
const {counts} = useRequests();


  const summaryCards = [
    {
      title: "Approval Pending",
      count: counts.pendingPayments,
      color: "bg-blue-100",
      icon: <ClockIcon className="h-6 w-6 text-blue-600" />,
    },
    {
      title: "Payment Pending",
      count: counts.transferPending,
      color: "bg-yellow-100",
      icon: <DollarSignIcon className="h-6 w-6 text-yellow-600" />,
    },
    {
      title: "Payment Completed",
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
      title: "Approval Pending",
      filter: "Pending",
    },
    {
      title: "Payment Pending",
      filter: "Transfer Pending",
    },
    {
      title: "Payment Done",
      filter: "Transfer Completed",
    },
    {
      title: "Payment Rejected",
      filter: "Rejected",
    },
  ];



  return (
    <div className="min-h-screen bg-gray-100">
      <Banner
        title="Payment Requests"
        action={<CreatePaymentRequestDialog />}
      />
      <div className="container mx-auto px-6 py-6">
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
        <div className="space-y-8">
          {tableData.map((table, index) => (
            <div key={index}>
              <h2 className="text-lg font-semibold mb-4 text-gray-700">
                {table.title}
              </h2>
              <PaymentRequestTable
                role="Admin"
                filter={table.filter}
                // dateFilter={dateFilters[table.title]} // Pass the date filter
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentRequestsPage;
