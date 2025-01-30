"use client";

import { Edit2Icon } from "lucide-react";
import Banner from "@/components/reusable/banner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts";
import CreateInflowDialog from "@/components/dialogs/projected-inflows/create";
import EditInflowDialog from "@/components/dialogs/projected-inflows/update";
import { FetchWrapper } from "@/utils";
import toast from "react-hot-toast";
import { formatReadableDate } from "@/lib/utils";
import { ProjectedInflow } from "@/types";

const ProjectedInflowPage = () => {
  const { token } = useAuth();
  const fetchWrapper = useMemo(() => new FetchWrapper(() => token), [token]);

  const [inflows, setInflows] = useState<ProjectedInflow[]>([]);
  const [filteredInflows, setFilteredInflows] = useState<ProjectedInflow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedInflow, setSelectedInflow] = useState<ProjectedInflow | null>(
    null
  );
  const [month, setMonth] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>("");

  // Function to fetch inflows for a given month
  const fetchInflowsForMonth = useCallback(
    async (selectedMonth: string) => {
      try {
        const response = await fetchWrapper.get<ProjectedInflow[]>(
          `/projected-inflow?month=${selectedMonth}`
        );

        if (!response || response.length === 0) {
          setInflows([]);
          setFilteredInflows([]);
          toast.error("No inflows available for the selected month.");
          return false;
        }

        setInflows(response);
        setFilteredInflows(response);

        if (response.length > 0) {
          const allColumns = Object.keys(response[0]);
          const filteredColumns = allColumns.filter(
            (key) => key !== "date" && key !== "id" && key !== "total_amount"
          );

          filteredColumns.sort();
          setColumns(filteredColumns);
        }

        return true;
      } catch (error) {
        console.error("Error fetching inflows for the month:", error);
        toast.error("Failed to fetch inflows for the selected month.");
        return false;
      }
    },
    [fetchWrapper]
  );

  // Filter inflows based on selected date
  useEffect(() => {
    if (filterDate) {
      const filtered = inflows.filter((inflow) => inflow.date === filterDate);
      setFilteredInflows(filtered);
    } else {
      setFilteredInflows(inflows);
    }
  }, [filterDate, inflows]);

  // Calculate total amount for a row
  const calculateTotalAmount = (row: ProjectedInflow) => {
    return columns.reduce((total, column) => {
      const value = row[column as keyof ProjectedInflow];
      return total + (typeof value === "number" ? value : Number(value) || 0);
    }, 0);
  };

  // Handle loading inflows for the current month on page load
  useEffect(() => {
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}`;

    setMonth(currentMonth);
    fetchInflowsForMonth(currentMonth);
  }, [fetchInflowsForMonth]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Banner
        title="Projected Inflows"
        action={
          <div className="flex space-x-4 items-center">
            <label htmlFor="month">Select a month</label>
            <input
              name="month"
              type="month"
              value={month}
              onChange={(e) => {
                const selectedMonth = e.target.value;
                setMonth(selectedMonth);
                fetchInflowsForMonth(selectedMonth);
              }}
              className="border rounded px-3 py-2"
            />
            <span>OR</span>
            <CreateInflowDialog />
          </div>
        }
      />

      <div className="mt-6">
        <div className="flex justify-end items-center space-x-4 mb-4">
          <label htmlFor="filter-date" className="font-medium text-gray-700">
            Filter by Date:
          </label>
          <input
            name="filter-date"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <button
            onClick={() => setFilterDate("")}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear Filter
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white shadow rounded-lg mt-6">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="text-left px-6 py-4">Date</TableHead>
              {columns.map((column, index) => (
                <TableHead key={index} className="text-left px-6 py-4">
                  {column}
                </TableHead>
              ))}
              <TableHead className="text-left px-6 py-4">
                Total Amount
              </TableHead>
              <TableHead className="text-left px-6 py-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInflows.length > 0 ? (
              filteredInflows.map((row, index) => (
                <TableRow key={index} className="hover:bg-gray-50">
                  <TableCell className="px-6 py-4">
                    {formatReadableDate(row.date)}
                  </TableCell>
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex} className="px-6 py-4">
                      ₹{row[column as keyof ProjectedInflow] || "0.00"}
                    </TableCell>
                  ))}
                  <TableCell className="px-6 py-4 font-bold">
                    ₹{calculateTotalAmount(row).toFixed(2)}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <button
                      onClick={() => setSelectedInflow(row)}
                      className="text-blue-500 underline"
                    >
                      <Edit2Icon className="size-6 rounded-sm" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 3}
                  className="text-center text-gray-600 py-4"
                >
                  No inflows available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedInflow && (
        <EditInflowDialog
          inflow={selectedInflow}
          onClose={() => setSelectedInflow(null)}
          onSuccess={() => fetchInflowsForMonth(month)}
        />
      )}
    </div>
  );
};

export default ProjectedInflowPage;
