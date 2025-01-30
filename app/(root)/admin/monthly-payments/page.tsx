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
import { formatReadableDate } from "@/lib/utils";

interface MonthlyPayment {
  id?: number;
  day_of_month: number;
  ledger_id: number;
  ledger_name?: string;
  hotel_id: number;
  hotel_name?: string;
  amount: number;
  end_date: string;
}

interface Ledger {
  id: number;
  name: string;
}

const MonthlyPaymentsTable = () => {
  const { token } = useAuth();
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
           ...payment,
           end_date: new Date(payment.end_date).toISOString().split("T")[0],
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
      alert("Please fill all required fields.");
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

      if (!res.ok) throw new Error("Failed to save payment");

      const updatedPayment = await res.json();
      setPayments((prev) =>
        isEditMode
          ? prev.map((p) => (p.id === updatedPayment.id ? updatedPayment : p))
          : [...prev, updatedPayment]
      );

      setModalData(null);
      setIsDialogOpen(false);
      fetchPayments();
    } catch (error) {
      console.error("Error saving payment:", error);
    }
  };

  // Delete Payment
  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/monthly-payments/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
      end_date: "",
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
      end_date: payment.end_date,
    });
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const columns: ColumnDef<MonthlyPayment>[] = [
    { accessorKey: "day_of_month", header: "Day of Month" },
    { accessorKey: "ledger_name", header: "Ledger Name" },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ getValue }) => `₹${getValue<number>()?.toFixed(2)}`,
    },
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
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }: { row: Row<MonthlyPayment> }) => (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openEditModal(row.original)}>
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleDelete(row.original.id!)} // `id!` ensures TypeScript knows it's not undefined
          >
            Delete
          </Button>
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
        <div key={hotelName} className="mb-8">
          <div className="flex justify-between items-center mb-4">
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
                  End Date
                </label>
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
