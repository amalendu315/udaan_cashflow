"use client";

// Dependencies
import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/contexts";
import { ColumnDef } from "@tanstack/react-table";

interface Cashflow {
  date: string;
  projected_inflow: number;
  actual_inflow: number;
  payment: number;
  closing: number;
}

interface PaymentRequest {
  id: number;
  hotel_name: string;
  amount: number;
  vendor_name: string;
  department: string;
  ledger: string;
  due_date: string;
  approval_by: string;
  remarks: string;
  status: string;
  created_by: string;
  created_at: string;
}

interface MonthlyPayment {
  id: number;
  hotel_name: string;
  amount: number;
  ledger_id: number;
  day_of_month: number;
  payment_date: string;
  created_by: string;
  created_at: string;
}

interface ScheduledPayment {
  id: number;
  hotel_name: string;
  amount: number;
  payment_term: string;
  EMI: number;
  ledger_id: number;
  payment_date: string;
  created_by: string;
  created_at: string;
}

interface PaymentBreakdown {
  paymentRequests: PaymentRequest[];
  monthlyPayments: MonthlyPayment[];
  scheduledPayments: ScheduledPayment[];
}

interface CashflowTableProps {
  readOnly: boolean; // Determines if the table is editable
  itemsPerPage?: number; // Number of items to display per page
}

// const isCurrentMonth = (
//   date: string,
//   currentMonth: number,
//   currentYear: number
// ) => {
//   const targetDate = new Date(date);
//   return (
//     targetDate.getMonth() + 1 === currentMonth &&
//     targetDate.getFullYear() === currentYear
//   );
// };

function formatReadableDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();

  // Add suffix to the day
  const daySuffix = (n: number) => {
    if (n >= 11 && n <= 13) return `${n}th`;
    switch (n % 10) {
      case 1:
        return `${n}st`;
      case 2:
        return `${n}nd`;
      case 3:
        return `${n}rd`;
      default:
        return `${n}th`;
    }
  };

  return `${daySuffix(day)} ${month} ${year}`;
}


const CashflowTable: React.FC<CashflowTableProps> = ({
  readOnly,
  itemsPerPage = 10, // Default to 10 if not provided
}) => {
  const { token } = useAuth();
  const [cashflowData, setCashflowData] = useState<Cashflow[]>([]);
  const [filteredData, setFilteredData] = useState<Cashflow[]>([]);
  const [dialogData, setDialogData] = useState<PaymentBreakdown | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);

  //  const currentDate = new Date();
  //  const currentMonth = currentDate.getMonth() + 1;
  //  const currentYear = currentDate.getFullYear();

  // Fetch cashflow data
  const fetchCashflowData = useCallback(async () => {
    try {
      const res = await fetch(`/api/cashflow`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch cashflow data");

      const data = await res.json();
      //  const filteredByMonth = data.filter((row: Cashflow) =>
      //    isCurrentMonth(row.date, currentMonth, currentYear)
      //  );

       setCashflowData(data);
       setFilteredData(data);
    } catch (error) {
      console.error("Error fetching cashflow data:", error);
    }
  },[token]);

  // Filter data by selected date
  const handleDateFilter = (date: string) => {
    setSelectedDate(date);
    if (date) {
      const filtered = cashflowData.filter(
        (row) => new Date(row.date).toISOString().split("T")[0] === date
      );
      setFilteredData(filtered);
      setCurrentPage(1);
    } else {
      setFilteredData(cashflowData);
    }
  };

  // Handle pagination
  const currentPageData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Fetch breakdown for a specific date
  const fetchPaymentBreakdown = async (date: string) => {
    try {
      const res = await fetch(`/api/cashflow/breakdown?date=${date}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch payment breakdown");

      const data: PaymentBreakdown = await res.json();
      setDialogData(data);
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Error fetching payment breakdown:", error);
    }
  };

  useEffect(() => {
    fetchCashflowData();
  }, [fetchCashflowData]);

  // Column Definitions
  const paymentRequestColumns: ColumnDef<PaymentRequest>[] = [
    {
      id: "serial_number",
      header: "Sl No.",
      cell: ({ row }) => row.index + 1, // Generate serial number dynamically
    },
    { accessorKey: "hotel_name", header: "Hotel Name" },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => `₹${row.original.amount.toFixed(2)}`,
    },
    { accessorKey: "vendor_name", header: "Vendor Name" },
    { accessorKey: "department_name", header: "Department" },
    { accessorKey: "ledger_name", header: "Ledger" },
    {
      accessorKey: "due_date",
      header: "Due Date",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          {formatReadableDate(row?.original?.due_date)}
        </div>
      ),
    },
    { accessorKey: "approval_by", header: "Approved By" },
    { accessorKey: "remarks", header: "Remarks" },
    { accessorKey: "status", header: "Status" },
    { accessorKey: "created_by", header: "Created By" },
    { accessorKey: "created_at", header: "Created At" },
  ];

  const monthlyPaymentColumns: ColumnDef<MonthlyPayment>[] = [
    {
      id: "serial_number",
      header: "Sl No.",
      cell: ({ row }) => row.index + 1, // Generate serial number dynamically
    },
    { accessorKey: "hotel_name", header: "Hotel Name" },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => `₹${row.original.amount.toFixed(2)}`,
    },
    { accessorKey: "ledger_name", header: "Ledger Name" },
    { accessorKey: "day_of_month", header: "Day of Month" },
    {
      accessorKey: "payment_date",
      header: "End Date",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          {formatReadableDate(row?.original?.payment_date)}
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          {formatReadableDate(row?.original?.created_at)}
        </div>
      ),
    },
  ];

  const scheduledPaymentColumns: ColumnDef<ScheduledPayment>[] = [
    {
      id: "serial_number",
      header: "Sl No.",
      cell: ({ row }) => row.index + 1, // Generate serial number dynamically
    },
    { accessorKey: "hotel_name", header: "Hotel Name" },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => `₹${row.original.amount.toFixed(2)}`,
    },
    { accessorKey: "payment_term", header: "Payment Term" },
    {
      accessorKey: "EMI",
      header: "EMI",
      cell: ({ row }) => `₹${row.original.EMI.toFixed(2)}`,
    },
    { accessorKey: "ledger_name", header: "Ledger Name" },
    {
      accessorKey: "payment_date",
      header: "Payment Date",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          {formatReadableDate(row?.original?.payment_date)}
        </div>
      ),
    },
    { accessorKey: "created_at", header: "Created At" },
  ];

  const payment_date =
    dialogData?.monthlyPayments[0]?.payment_date ||
    dialogData?.paymentRequests[0]?.due_date ||
    dialogData?.scheduledPayments[0]?.payment_date ||
    "";

  return (
    <div className="bg-white shadow rounded-lg p-6 overflow-x-auto">
      {/* Date Filter */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Cashflow</h2>
        <div className="flex items-center gap-4">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateFilter(e.target.value)}
            className="border rounded px-4 py-2"
          />
          <Button
            onClick={() => handleDateFilter("")}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Clear Filter
          </Button>
        </div>
      </div>

      {/* Cashflow Table */}
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-50 text-gray-600 uppercase text-sm leading-normal">
            <th className="py-3 px-6 text-left">Date</th>
            <th className="py-3 px-6 text-right">Projected Inflow</th>
            <th className="py-3 px-6 text-right">Actual Inflow</th>
            <th className="py-3 px-6 text-right">Payment</th>
            <th className="py-3 px-6 text-right">Closing</th>
          </tr>
        </thead>
        <tbody className="text-gray-700 text-sm divide-y divide-gray-200">
          {currentPageData.length > 0 ? (
            currentPageData.map((row) => (
              <tr key={row.date} className="hover:bg-gray-100">
                <td className="py-3 px-6 text-left whitespace-nowrap">
                  {formatReadableDate(row.date)}
                </td>
                <td className="py-3 px-6 text-right">
                  ₹{row.projected_inflow.toFixed(2)}
                </td>
                <td className="py-3 px-6 text-right">
                  ₹{row.actual_inflow.toFixed(2)}
                </td>
                <td className="py-3 px-6 text-right">
                  <Button
                    variant="secondary"
                    onClick={() => fetchPaymentBreakdown(row.date)}
                    disabled={readOnly}
                  >
                    ₹{row.payment.toFixed(2)}
                  </Button>
                </td>
                <td
                  className={`py-3 px-6 text-right ${
                    row.closing >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  ₹{row.closing.toFixed(2)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-center text-gray-500 py-3 px-6">
                No data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <Button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            Previous
          </Button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <Button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Payment Breakdown Dialog */}
      {isDialogOpen && dialogData && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-6xl w-full max-h-[80vh] overflow-hidden">
            <DialogTitle className="text-xl font-bold">
              Payment Breakdown for {payment_date}
            </DialogTitle>
            <div className="space-y-8">
              {dialogData.paymentRequests.length > 0 && (
                <DataTable
                  columns={paymentRequestColumns}
                  data={dialogData.paymentRequests}
                  title="Payment Requests"
                />
              )}

              {dialogData.monthlyPayments.length > 0 && (
                <DataTable
                  columns={monthlyPaymentColumns}
                  data={dialogData.monthlyPayments}
                  title="Monthly Payments"
                />
              )}

              {dialogData.scheduledPayments.length > 0 && (
                <DataTable
                  columns={scheduledPaymentColumns}
                  data={dialogData.scheduledPayments}
                  title="Scheduled Payments"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CashflowTable;
