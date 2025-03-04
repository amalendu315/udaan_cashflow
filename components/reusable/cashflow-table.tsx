"use client";

// Dependencies
import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/contexts";
import { ColumnDef, Row } from "@tanstack/react-table";
import { formatCurrency } from "@/utils";
import toast from "react-hot-toast";
import { usePathname, useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { CheckSquare, Edit, Trash2 } from "lucide-react";
import DateRangeFilter from "./date-range-filter";

interface Cashflow {
  date: string;
  projected_inflow: number;
  actual_inflow: number;
  total_payments: number;
  closing: number;
  actual_inflow_id?: number;
  ledgers?: { id: number; name: string; amount: number }[]; // ✅ Add ledgers property
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
  payment_status: string;
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
  payment_status: string;
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
  const pathname = usePathname();
  const router = useRouter();
  const { token, user } = useAuth();
  const role = user?.role;
  const [cashflowData, setCashflowData] = useState<Cashflow[]>([]);
  const [filteredData, setFilteredData] = useState<Cashflow[]>([]);
  const [selectedActualInflow, setSelectedActualInflow] =
    useState<Cashflow | null>(null);
  const [isActualInflowDialogOpen, setIsActualInflowDialogOpen] =
    useState(false);
  // const [editedActualInflow, setEditedActualInflow] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogData, setDialogData] = useState<PaymentBreakdown | null>(null);
   const [, setStartDate] = useState<string>("");
   const [, setEndDate] = useState<string>("");

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
      setFilteredData(filterLast10Days(data)); // ✅ Apply default 10-day filter
    } catch (error) {
      console.error("Error fetching cashflow data:", error);
    }
  }, [token]);

   const filterLast10Days = (data: Cashflow[]) => {
     const today = new Date();
     today.setHours(0, 0, 0, 0);

     const start = new Date(today);
     start.setDate(today.getDate() - 5);

     const end = new Date(today);
     end.setDate(today.getDate() + 4);

     return data.filter((row) => {
       const rowDate = new Date(row.date);
       rowDate.setHours(0, 0, 0, 0);
       return rowDate >= start && rowDate <= end;
     });
   };

   /** Apply user-selected date range filter */
   const filterByDateRange = (start: string, end: string) => {
     if (!start || !end) {
       setFilteredData(filterLast10Days(cashflowData));
       return;
     }

     const startTimestamp = new Date(start).getTime();
     const endTimestamp = new Date(end).getTime();

     setFilteredData(
       cashflowData.filter((row) => {
         const rowDate = new Date(row.date).getTime();
         return rowDate >= startTimestamp && rowDate <= endTimestamp;
       })
     );
   };

  // Open Actual Inflow Edit Dialog
const handleEditActualInflow = async (row: Cashflow) => {
  try {
    const res = await fetch(`/api/actual-inflow?date=${row.date}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      toast.error("Failed to fetch actual inflow data.");
      throw new Error("Failed to fetch actual inflow data.");
    }

    const data = await res.json();

    setSelectedActualInflow({
      ...row,
      ledgers: data.ledgers || [], // Ensure ledgers array exists
    });

    setIsActualInflowDialogOpen(true);
  } catch (error) {
    console.error("Error fetching actual inflow:", error);
  }
};


  // Update Actual Inflow API Call
  const updateActualInflow = async () => {
    if (!selectedActualInflow) return;

    try {
      const res = await fetch(`/api/actual-inflow`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: selectedActualInflow.date,
          ledgers: selectedActualInflow?.ledgers?.map((ledger) => ({
            actual_inflow_id: selectedActualInflow.actual_inflow_id,
            id: ledger.id,
            amount: ledger.amount,
          })),
        }),
      });

      if (!res.ok) {
        toast.error("Failed to update actual inflow");
        throw new Error("Failed to update actual inflow");
      }

      toast.success("Actual inflow updated successfully");

      setIsActualInflowDialogOpen(false);
      fetchCashflowData();
    } catch (error) {
      console.error("Error updating actual inflow:", error);
    }
  };


  const isBeforeAllowedEditDate = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    const rowDate = new Date(dateString);
    rowDate.setHours(0, 0, 0, 0); // Normalize to start of day

    const diffInTime = today.getTime() - rowDate.getTime();
    const diffInDays = diffInTime / (1000 * 3600 * 24);

    return diffInDays > 2; // 🚨 If more than 2 days old, return true (disable editing)
  };

  const handlePRActionClick = () => {
    if(user?.role === "System-Admin"){
      router.push('/system-admin/payment-requests')
    } else if (user?.role === "Admin"){
      router.push("/admin/payment-requests");
    } else {
      alert('Your are not authorized!')
    }
  };

   const handleMPActionClick = () => {
     if (user?.role === "System-Admin") {
       router.push("/system-admin/monthly-payments");
     } else if (user?.role === "Admin") {
       router.push("/admin/monthly-payments");
     } else {
       alert("Your are not authorized!");
     }
   };

   const handleSPActionClick = () => {
     if (user?.role === "System-Admin") {
       router.push("/system-admin/scheduled-payments");
     } else if (user?.role === "Admin") {
       router.push("/admin/scheduled-payments");
     } else {
       alert("Your are not authorized!");
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
      cell: ({ getValue }) => formatCurrency(getValue<number>()),
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
    ...(pathname.includes("/cashflow")
      ? []
      : [
          { accessorKey: "approval_by", header: "Approved By" },
          { accessorKey: "remarks", header: "Remarks" },
        ]),

    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const status = getValue<string>();

        const getStatusStyle = (status: string) => {
          switch (status) {
            case "Transfer Completed":
              return "bg-green-500";
            case "Rejected":
              return "bg-red-500";
            case "Transfer Pending":
              return "bg-blue-500";
            case "Pending":
              return "bg-yellow-500";
            default:
              return "bg-gray-500";
          }
        };

        return (
          <span
            className={`inline-block w-full px-4 py-1 rounded-full text-sm text-white ${getStatusStyle(
              status
            )}`}
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={status}
          >
            {status}
          </span>
        );
      },
    },
    ...(pathname.includes("/cashflow") &&
    (role === "Admin" || role === "Sub-Admin" || role === "System-Admin")
      ? [
          {
            id: "actions",
            header: "Actions",
            cell: ({ row }: { row: Row<PaymentRequest> }) => {
              return(
              <div className="flex space-x-2">
                {row.original.status === "Pending" ? (
                  <>
                    <Button
                      onClick={() =>
                        handlePRActionClick()
                      }
                      className="bg-green-500 text-white"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() =>
                        handlePRActionClick()
                      }
                      className="bg-red-500 text-white"
                    >
                      Reject
                    </Button>
                  </>
                ) : row.original.status === "Transfer Pending" ? (
                  <Button
                    onClick={() =>
                      handlePRActionClick()
                    }
                    className="bg-blue-500 text-white"
                  >
                    Mark as Done
                  </Button>
                ) : null}
              </div>
            )},
          },
        ]
      : []),
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
      cell: ({ getValue }) => formatCurrency(getValue<number>()),
    },
    { accessorKey: "ledger_name", header: "Ledger Name" },
    { accessorKey: "day_of_month", header: "Day of Month" },
    {
      accessorKey: "payment_date",
      header: "Payment Date",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          {formatReadableDate(row?.original?.payment_date)}
        </div>
      ),
    },
    {
      accessorKey: "payment_status",
      header: "Payment Status",
      cell: ({ getValue }) => {
        const status = getValue<string>();

        const getStatusStyle = (status: string) => {
          switch (status) {
            case "Completed":
              return "bg-green-500";
            case "Pending":
              return "bg-yellow-500";
            default:
              return "bg-gray-500";
          }
        };

        return (
          <span
            className={`inline-block px-4 py-1 rounded-full text-sm text-white ${getStatusStyle(
              status
            )}`}
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={status}
          >
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }: { row: Row<MonthlyPayment> }) => (
        <div className="flex gap-2">
          {row?.original?.payment_status === "Completed" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="default"
                    size={"sm"}
                    onClick={() => handleMPActionClick()}
                    className="bg-blue-500"
                  >
                    <Edit className="h-5 w-5 object-contain" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit Payment</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {row?.original?.payment_status === "Pending" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="default"
                    size={"sm"}
                    onClick={() => handleMPActionClick()}
                    className="bg-green-500"
                  >
                    <CheckSquare className="h-5 w-5 object-contain" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mark Payment Status as Completed</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleMPActionClick()}
                  className="bg-red-500 text-white hover:bg-red-600"
                >
                  <Trash2 className="h-5 w-5 object-contain" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete Payment</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
      cell: ({ getValue }) => formatCurrency(getValue<number>()),
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
    {
      accessorKey: "payment_status",
      header: "Payment Status",
      cell: ({ getValue }) => {
        const status = getValue<string>();

        const getStatusStyle = (status: string) => {
          switch (status) {
            case "Completed":
              return "bg-green-500";
            case "Pending":
              return "bg-yellow-500";
            default:
              return "bg-gray-500";
          }
        };

        return (
          <span
            className={`inline-block px-4 py-1 rounded-full text-sm text-white ${getStatusStyle(
              status
            )}`}
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={status}
          >
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }: { row: Row<ScheduledPayment> }) => (
        <div className="flex gap-2">
          {row?.original?.payment_status === "Completed" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="default"
                    size={"sm"}
                    onClick={() => handleSPActionClick()}
                    className="bg-blue-500"
                  >
                    <Edit className="h-5 w-5 object-contain" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit Payment</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {row?.original?.payment_status === "Pending" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="default"
                    size={"sm"}
                    onClick={() => handleSPActionClick()}
                    className="bg-green-500"
                  >
                    <CheckSquare className="h-5 w-5 object-contain" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mark Payment Status as Completed</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleSPActionClick()}
                  className="bg-red-500 text-white hover:bg-red-600"
                >
                  <Trash2 className="h-5 w-5 object-contain" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete Payment</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ),
    },
  ];

  const payment_date =
    dialogData?.monthlyPayments[0]?.payment_date ||
    dialogData?.paymentRequests[0]?.due_date ||
    dialogData?.scheduledPayments[0]?.payment_date ||
    "";

  return (
    <div className="bg-white shadow rounded-lg p-2 overflow-x-auto">
      {/* Date Filter */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold">Cashflow</h2>
        <DateRangeFilter
          onFilterChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
            filterByDateRange(start, end);
          }}
        />
      </div>

      {/* Cashflow Table */}
      <table className="w-full table-fixed border-collapse">
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
            currentPageData.map((row) => {
              const isDisabled = isBeforeAllowedEditDate(row?.date);
              return (
                <tr key={row.date} className="hover:bg-gray-100">
                  <td className="py-1 px-4 text-left whitespace-nowrap">
                    {formatReadableDate(row.date)}
                  </td>
                  <td className="py-1 px-4 text-right">
                    <Button
                      variant="secondary"
                      onClick={() =>
                        user?.role === "System-Admin"
                          ? router.push(`/system-admin/projected-inflow`)
                          : router.push(`/admin/projected-inflow`)
                      }
                      disabled={readOnly || isDisabled}
                    >
                      {formatCurrency(row.projected_inflow)}
                    </Button>
                  </td>
                  <td className="py-3 px-6 text-right">
                    <Button
                      variant="secondary"
                      onClick={() => handleEditActualInflow(row)}
                      disabled={readOnly || isDisabled}
                    >
                      {formatCurrency(row.actual_inflow)}
                    </Button>
                  </td>
                  <td className="py-3 px-6 text-right">
                    <Button
                      variant="secondary"
                      onClick={() => fetchPaymentBreakdown(row.date)}
                      disabled={readOnly || isDisabled}
                    >
                      {formatCurrency(row.total_payments)}
                    </Button>
                  </td>
                  <td
                    className={`py-3 px-6 text-right ${
                      row.closing >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {formatCurrency(row.closing)}
                  </td>
                </tr>
              );
            })
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

      {isActualInflowDialogOpen && selectedActualInflow && (
        <Dialog
          open={isActualInflowDialogOpen}
          onOpenChange={setIsActualInflowDialogOpen}
        >
          <DialogContent className="max-w-lg w-full overflow-auto">
            <DialogTitle className="text-lg font-semibold">
              Edit Actual Inflow
            </DialogTitle>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <Input type="text" value={selectedActualInflow.date} disabled />
              </div>
              {selectedActualInflow.ledgers?.map((ledger, index) => (
                <div key={ledger.id}>
                  <label className="block text-sm font-medium text-gray-700">
                    {ledger.name}
                  </label>
                  <Input
                    type="number"
                    value={ledger.amount}
                    onChange={(e) => {
                      const newLedgers = [...selectedActualInflow.ledgers!];
                      newLedgers[index].amount = Number(e.target.value);
                      setSelectedActualInflow((prev) => ({
                        ...prev!,
                        ledgers: newLedgers,
                      }));
                    }}
                  />
                </div>
              ))}
              <Button
                onClick={updateActualInflow}
                className="w-full bg-blue-500 text-white py-2 rounded"
              >
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Payment Breakdown Dialog */}
      {isDialogOpen && dialogData && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-7xl w-full max-h-[80vh] overflow-y-scroll">
            <DialogTitle className="text-lg font-semibold">
              Payment Breakdown for {payment_date}
            </DialogTitle>
            <div className="space-y-4 scroll-auto">
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
