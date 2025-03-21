"use client";

// Dependencies
import { useState, useEffect, useCallback } from "react";
import { ColumnDef, Row } from "@tanstack/react-table";

// Local Imports
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useAuth, useHotels } from "@/contexts";
import { formatReadableDate } from "@/lib/utils";
import { CheckSquare, Edit } from "lucide-react";
import { formatCurrency } from "@/utils";
import DateRangeFilter from "@/components/reusable/date-range-filter";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ApprovePaymentRequestInterface } from "@/types";
import toast from "react-hot-toast";

interface ScheduledPayment {
  id?: number;
  date: string;
  ledger_id: number;
  ledger_name?: string;
  hotel_id: number;
  hotel_name?: string;
  total_amount: number;
  EMI: number;
  payment_term: string;
  end_date: string;
  payment_status: string;
}

interface Ledger {
  id: number;
  name: string;
}

const ScheduledPaymentsTable = () => {
  const { token, user } = useAuth();
  const { hotels } = useHotels();
  const [payments, setPayments] = useState<ScheduledPayment[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [modalData, setModalData] = useState<Partial<ScheduledPayment> | null>(
    null
  );
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filters] = useState<Record<string, string>>({}); // Filters by date for each hotel

  // Fetch Scheduled Payments
  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch("/api/scheduled-payments");
      if (!res.ok) throw new Error("Failed to fetch scheduled payments");
      const data = await res.json();
      setPayments(
        data.map((payment: ScheduledPayment) => ({
          ...payment,
          date: new Date(payment.date).toISOString().split("T")[0],
          end_date: new Date(payment.end_date).toISOString().split("T")[0],
        }))
      );
    } catch (error) {
      console.error("Error fetching scheduled payments:", error);
    }
  }, []);
  const calculateEMI = (totalAmount: number, paymentTerm: string) => {
    switch (paymentTerm.toLowerCase()) {
      case "monthly":
        return totalAmount / 12;
      case "quarterly":
        return totalAmount / 4;
      case "half yearly":
        return totalAmount / 2;
      default:
        return totalAmount;
    }
  };

  // Fetch Ledgers
  const fetchLedgers = useCallback(async () => {
    try {
      const res = await fetch("/api/mp-ledgers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch ledgers");
      const data = await res.json();
      setLedgers(data);
    } catch (error) {
      console.error("Error fetching ledgers:", error);
    }
  }, [token]);

  useEffect(() => {
    fetchPayments();
    fetchLedgers();
  }, [fetchPayments, fetchLedgers]);


  const groupedPayments = payments.reduce(
    (acc: Record<string, ScheduledPayment[]>, payment) => {
      if (!payment.hotel_name) return acc;
      if (!acc[payment.hotel_name]) acc[payment.hotel_name] = [];
      acc[payment.hotel_name].push(payment);
      return acc;
    },
    {}
  );

  const normalizeDate = (dateString: string) => {
    return new Date(dateString).toISOString().split("T")[0]; // Convert to YYYY-MM-DD
  };
  // Group payments by hotel name and apply filters
const getFilteredPayments = (hotelName: string) => {
  const filterDate = filters[hotelName]; // Single date filter
  let groupedPayments = payments.filter(
    (payment) => payment.hotel_name?.trim() === hotelName.trim()
  );

  // Apply Date Range Filtering
  if (startDate && endDate) {
    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(endDate).setHours(23, 59, 59, 999);

    groupedPayments = groupedPayments.filter((payment) => {
      const paymentDate = new Date(payment.date).setHours(0, 0, 0, 0);
      return paymentDate >= start && paymentDate <= end;
    });
  }

  if (filterDate) {
    return groupedPayments.filter(
      (payment) => normalizeDate(payment.date) === normalizeDate(filterDate)
    );
  }

  return groupedPayments;
};

  // Handle filter change for each hotel

  const handleCreateOrUpdate = async () => {
    const method = isEditMode ? "PUT" : "POST";
    const url = "/api/scheduled-payments";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modalData),
      });
      const resClone = res.clone();
      const response: ApprovePaymentRequestInterface = await resClone.json();
      if (!resClone.ok) {
        toast.error(response?.message || "Failed to save scheduled payment");
        setModalData(null);
        setIsDialogOpen(false);
      } else {
        const updatedPayment = await resClone.json();

        setPayments((prev) =>
          isEditMode
            ? prev.map((p) => (p.id === updatedPayment.id ? updatedPayment : p))
            : [...prev, updatedPayment]
        );
        toast.success(
          response?.message || "Scheduled Payment Saved Successfully"
        );
        setModalData(null);
        setIsDialogOpen(false);
        fetchPayments();
      }
    } catch (error) {
      console.error("Error saving scheduled payment:", error);
    }
  };

  // const handleDelete = async (id: number) => {
  //   try {
  //     const res = await fetch("/api/scheduled-payments", {
  //       method: "DELETE",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ id }),
  //     });

  //     if (!res.ok) throw new Error("Failed to delete scheduled payment");
  //     await fetch("/api/cashflow/closing", {
  //       method: "PUT",
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });
  //     setPayments((prev) => prev.filter((p) => p.id !== id));
  //   } catch (error) {
  //     console.error("Error deleting scheduled payment:", error);
  //   }
  // };

  const openCreateModal = () => {
    setModalData({
      date: "",
      ledger_id: 0,
      hotel_id: 0,
      total_amount: 0,
      payment_term: "full payment",
      payment_status: "Pending",
      EMI: 0,
      end_date: "",
    });
    setIsEditMode(false);
    setIsDialogOpen(true);
  };

  const openEditModal = (payment: ScheduledPayment) => {
    // Find corresponding Ledger and Hotel IDs
    const foundLedger = ledgers.find(
      (ledger) => ledger.name === payment.ledger_name
    );
    const foundHotel = hotels.find(
      (hotel) => hotel.name === payment.hotel_name
    );

    setModalData({
      id: payment.id,
      date: payment.date,
      ledger_id: foundLedger ? foundLedger.id : 0, // Ensure ledger_id is set
      ledger_name: payment.ledger_name,
      hotel_id: foundHotel ? foundHotel.Id : 0, // Ensure hotel_id is set
      hotel_name: payment.hotel_name,
      total_amount: payment.total_amount,
      EMI: payment.EMI,
      payment_term: payment.payment_term,
      payment_status: payment.payment_status,
      end_date: payment.end_date,
    });

    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handlePaymentStatusButtonClick = async (
    payment: ScheduledPayment,
    newStatus: string
  ) => {
    if (!payment.id) {
      console.error("Error: Payment ID is missing!");
      return;
    }

    try {
      const res = await fetch("/api/scheduled-payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: payment.id, // ✅ Always use `payment.id` (guaranteed to be present)
          date: payment.date,
          ledger_id: payment.ledger_id,
          hotel_id: payment.hotel_id,
          total_amount: payment.total_amount,
          EMI: payment.EMI,
          payment_term: payment.payment_term,
          end_date: payment.end_date,
          payment_status: newStatus, // ✅ Directly update status
        }),
      });

      if (!res.ok) throw new Error("Failed to save scheduled payment");

      const updatedPayment = await res.json();

      // ✅ Update state properly
      setPayments((prev) =>
        prev.map((p) => (p.id === updatedPayment.id ? updatedPayment : p))
      );

      fetchPayments(); // ✅ Refresh payments after update
    } catch (error) {
      console.error("Error updating scheduled payment:", error);
    }
  };

  const columns: ColumnDef<ScheduledPayment>[] = [
    {
      id: "serial_number",
      header: "Sl No.",
      cell: ({ row }) => row.index + 1, // Generate serial number dynamically
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        console.log("row.original", row.original);
        return (
          <div className="flex space-x-2">
            {formatReadableDate(row?.original?.date)}
          </div>
        );
      },
    },
    { accessorKey: "ledger_name", header: "Ledger Name" },
    { accessorKey: "hotel_name", header: "Hotel Name" },
    {
      accessorKey: "total_amount",
      header: "Total Amount",
      cell: ({ getValue }) => `${formatCurrency(getValue<number>())}`,
    },
    {
      accessorKey: "EMI",
      header: "EMI",
      cell: ({ getValue }) => `${formatCurrency(getValue<number>())}`,
    },
    { accessorKey: "payment_term", header: "Payment Term" },
    {
      accessorKey: "end_date",
      header: "End Date",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          {formatReadableDate(row?.original?.end_date)}
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
                    onClick={() => openEditModal(row.original)}
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
                    onClick={() =>
                      handlePaymentStatusButtonClick(row.original, "Completed")
                    }
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
          {/* <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(row?.original?.id as number)}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            <Trash2 className="h-5 w-5 object-contain" />
          </Button> */}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-blue-50 p-6 rounded shadow-md">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">Scheduled Payments</h2>
        <Button onClick={openCreateModal}>Create New</Button>
      </div>

      {Object.keys(groupedPayments).map((hotelName) => (
        <div key={hotelName} className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold">{hotelName}</h3>
            {/* <div className="flex items-center gap-2">
              <label
                htmlFor={`filter-${hotelName}`}
                className="font-medium whitespace-nowrap"
              >
                Filter by Date:
              </label>
              <Input
                type="date"
                id={`filter-${hotelName}`}
                value={filters[hotelName] || ""}
                onChange={(e) => handleFilterChange(hotelName, e.target.value)}
                className="border rounded px-3 py-2"
              />
              <Button variant="outline" onClick={() => clearFilter(hotelName)}>
                Clear Filter
              </Button>
            </div> */}
            <DateRangeFilter
              onFilterChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
            />
          </div>
          <DataTable columns={columns} data={getFilteredPayments(hotelName)} />
        </div>
      ))}

      {isDialogOpen && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditMode
                  ? "Edit Scheduled Payment"
                  : "Create Scheduled Payment"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                type="date"
                value={modalData?.date || ""}
                onChange={(e) =>
                  setModalData((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
              />
              <Select
                onValueChange={(value) =>
                  setModalData((prev) => ({
                    ...prev,
                    ledger_id: parseInt(value, 10),
                  }))
                }
                value={modalData?.ledger_id?.toString() || ""}
              >
                <SelectTrigger>
                  <SelectValue>
                    {ledgers.find(
                      (ledger) => ledger.id === modalData?.ledger_id
                    )?.name || "Select Ledger"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ledgers.map((ledger) => (
                    <SelectItem key={ledger.id} value={ledger.id.toString()}>
                      {ledger.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                onValueChange={(value) =>
                  setModalData((prev) => ({
                    ...prev,
                    hotel_id: parseInt(value, 10),
                  }))
                }
                value={modalData?.hotel_id?.toString() || ""}
              >
                <SelectTrigger>
                  <SelectValue>
                    {hotels.find((hotel) => hotel.Id === modalData?.hotel_id)
                      ?.name || "Select Hotel"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {hotels.map((hotel) => (
                    <SelectItem key={hotel.Id} value={hotel.Id.toString()}>
                      {hotel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={modalData?.total_amount?.toString() || ""}
                onChange={(e) =>
                  setModalData((prev) => {
                    const newTotalAmount = parseFloat(e.target.value);
                    return {
                      ...prev,
                      total_amount: newTotalAmount,
                      EMI: calculateEMI(
                        newTotalAmount,
                        modalData?.payment_term || "full payment"
                      ),
                    };
                  })
                }
              />
              <Select
                onValueChange={(value) =>
                  setModalData((prev) => ({
                    ...prev,
                    payment_term: value,
                  }))
                }
                value={modalData?.payment_term || "full payment"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Payment Term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="half yearly">Half Yearly</SelectItem>
                  <SelectItem value="full payment">Full Payment</SelectItem>
                </SelectContent>
              </Select>
              <Select
                onValueChange={(value) =>
                  setModalData((prev) => ({
                    ...prev,
                    payment_status: value,
                  }))
                }
                value={modalData?.payment_status || "Pending"}
                disabled={user?.role === "User" || !isEditMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={modalData?.end_date || ""}
                onChange={(e) =>
                  setModalData((prev) => ({
                    ...prev,
                    end_date: e.target.value,
                  }))
                }
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrUpdate}>
                {isEditMode ? "Save Changes" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ScheduledPaymentsTable;
