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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { useAuth, useHotels } from "@/contexts";
import { CheckSquare, Edit, Trash2 } from "lucide-react";
import { formatCurrency } from "@/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import toast from "react-hot-toast";
import { ApprovePaymentRequestInterface } from "@/types";

interface MonthlyPayment {
  id?: number;
  day_of_month: number;
  ledger_id: number;
  ledger_name?: string;
  hotel_id: number;
  hotel_name?: string;
  amount: number;
 payment_status:string;
}

interface Ledger {
  id: number;
  name: string;
}

const MonthlyPaymentsTable = () => {
  const { token, user } = useAuth();
  const { hotels } = useHotels();
  const [payments, setPayments] = useState<MonthlyPayment[]>([]);
  const [filters, setFilters] = useState<Record<string, number | null>>({});
  const [modalData, setModalData] = useState<Partial<MonthlyPayment> | null>(
    null
  );
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch Payments
     const fetchPayments = useCallback(async () => {
       try {
         const res = await fetch("/api/monthly-payments", {
           headers: { Authorization: `Bearer ${token}` },
         });
         if (!res.ok) throw new Error("Failed to fetch monthly payments");
  
         const paymentsData = await res.json();
         setPayments(
           paymentsData.map((payment: MonthlyPayment) => ({
             ...payment
           }))
         );
       } catch (error) {
         console.error("Error fetching monthly payments:", error);
       }
     }, [token]);
  
     // ✅ Fetch Ledgers - Wrapped in useCallback
     const fetchLedgers = useCallback(async () => {
       try {
         const res = await fetch("/api/mp-ledgers", {
           headers: { Authorization: `Bearer ${token}` },
         });
         if (!res.ok) throw new Error("Failed to fetch ledgers");
         const ledgersData = await res.json();
         setLedgers(ledgersData);
       } catch (error) {
         console.error("Error fetching ledgers:", error);
       }
     }, [token]);
  
  
    useEffect(() => {
      if (token) {
        fetchPayments();
        fetchLedgers();
      }
    }, [token, fetchLedgers, fetchPayments]);

  // Group payments by hotel name
  const groupedPayments = payments.reduce(
    (acc: Record<string, MonthlyPayment[]>, payment) => {
      if (!payment.hotel_name) return acc;
      if (!acc[payment.hotel_name]) acc[payment.hotel_name] = [];
      acc[payment.hotel_name].push(payment);
      return acc;
    },
    {}
  );

  // Get filtered or grouped payments for a hotel
  const getPaymentsToDisplay = (hotelName: string) => {
    const filterDay = filters[hotelName];
    const filteredPayments =
      filterDay !== null
        ? groupedPayments[hotelName]?.filter(
            (payment) => payment.day_of_month === filterDay
          )
        : groupedPayments[hotelName];
    return filteredPayments?.length
      ? filteredPayments
      : groupedPayments[hotelName];
  };

  // Handle filter change for a specific hotel
  const handleFilterChange = (hotelName: string, value: number | null) => {
    setFilters((prev) => ({
      ...prev,
      [hotelName]: value,
    }));
  };

  // Create or Update Payment
  const handleCreateOrUpdate = async () => {
    if (
      !modalData ||
      !modalData.day_of_month ||
      !modalData.ledger_id ||
      !modalData.hotel_id ||
      !modalData.amount
    ) {
      toast.error("Please fill all the fields");
      return;
    }

    try {
      const method = isEditMode ? "PUT" : "POST";
      const res = await fetch("/api/monthly-payments", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(modalData),
      });

      const updatedPayment:ApprovePaymentRequestInterface = await res.json();
      if (!res.ok) {
        toast.error(updatedPayment?.message || "Failed to save payment");
      } else {
        toast.success(updatedPayment?.message || "Payment saved successfully");
        setModalData(null);
        setIsDialogOpen(false);
        fetchPayments();
      };
    } catch (error) {
      console.error("Error saving payment:", error);
      toast.error("Failed to save payment");
    }
  };

  // Delete Payment
  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/monthly-payments`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Failed to delete payment");

      setPayments((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Error deleting payment:", error);
    }
  };

  const openCreateModal = () => {
    setModalData({
      day_of_month: 1,
      ledger_id: 0,
      hotel_id: 0,
      amount: 0,
      payment_status: "Pending",
    });
    setIsEditMode(false);
    setIsDialogOpen(true);
  };

  const openEditModal = (payment: MonthlyPayment) => {
    setModalData({
      id: payment.id,
      day_of_month: payment.day_of_month,
      ledger_id: payment.ledger_id,
      ledger_name: payment.ledger_name,
      hotel_id: payment.hotel_id,
      hotel_name: payment.hotel_name,
      amount: payment.amount,
      payment_status: payment.payment_status,
    });
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handlePaymentStatusButtonClick = async (
    payment: MonthlyPayment,
    newStatus: string
  ) => {
    if (!payment.id) {
      console.error("Error: Payment ID is missing!");
      return;
    }
    try {
      const res = await fetch("/api/monthly-payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" ,
          Authorization: `Bearer ${token}`
         },
        body: JSON.stringify({
          id: payment.id,
          day_of_month: payment.day_of_month,
          ledger_id: payment.ledger_id,
          hotel_id: payment.hotel_id,
          amount: payment.amount,
          payment_status: newStatus,
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

  const columns: ColumnDef<MonthlyPayment>[] = [
    {
      id: "serial_number",
      header: "Sl No.",
      cell: ({ row }) => row.index + 1, // Generate serial number dynamically
    },
    { accessorKey: "day_of_month", header: "Day of Month" },
    { accessorKey: "ledger_name", header: "Ledger Name" },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ getValue }) => `${formatCurrency(getValue<number>())}`,
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(row?.original?.id as number)}
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

  return (
    <div className="bg-blue-50 p-6 rounded shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Monthly Payments</h2>
        <Button onClick={openCreateModal}>Create New</Button>
      </div>

      {Object.keys(groupedPayments).map((hotelName) => (
        <div key={hotelName} className="mt-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-bold">{hotelName}</h3>
            <div className="flex items-center gap-2">
              <label
                htmlFor={`filter-${hotelName}`}
                className="font-medium whitespace-nowrap"
              >
                Filter by Day of Month:
              </label>
              <Input
                id={`filter-${hotelName}`}
                type="number"
                min={1}
                max={31}
                value={
                  filters[hotelName] !== null
                    ? filters[hotelName]?.toString()
                    : ""
                }
                onChange={(e) =>
                  handleFilterChange(
                    hotelName,
                    e.target.value ? parseInt(e.target.value, 10) : null
                  )
                }
                className="border rounded px-3 py-2 flex-grow"
              />
            </div>
          </div>
          <DataTable columns={columns} data={getPaymentsToDisplay(hotelName)} />
        </div>
      ))}

      {isDialogOpen && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Edit Payment" : "Create Payment"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Day of Month
                </label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={modalData?.day_of_month || ""}
                  onChange={(e) =>
                    setModalData((prev) => ({
                      ...prev,
                      day_of_month: parseInt(e.target.value, 10),
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ledger</label>
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
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Hotel</label>
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
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <Input
                  type="number"
                  value={modalData?.amount?.toString() || ""}
                  onChange={(e) =>
                    setModalData((prev) => ({
                      ...prev,
                      amount: parseFloat(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Payment Status
                </label>
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
              </div>
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

export default MonthlyPaymentsTable;
