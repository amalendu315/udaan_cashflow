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
import { FetchWrapper, formatCurrency } from "@/utils";
import toast from "react-hot-toast";
import { formatReadableDate } from "@/lib/utils";
import { ProjectedInflow } from "@/types";
import DateRangeFilter from "@/components/reusable/date-range-filter";

const ProjectedInflowPage = () => {
  const { token } = useAuth();
  const fetchWrapper = useMemo(() => new FetchWrapper(() => token), [token]);

  const [inflows, setInflows] = useState<ProjectedInflow[]>([]);
  const [filteredInflows, setFilteredInflows] = useState<ProjectedInflow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedInflow, setSelectedInflow] = useState<ProjectedInflow | null>(
    null
  );
  const [, setStartDate] = useState<string>("");
  const [, setEndDate] = useState<string>("");

  const filterLast10Days = (inflows: ProjectedInflow[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setDate(today.getDate() - 5); // 5 days before today

    const end = new Date(today);
    end.setDate(today.getDate() + 4); // 4 days after today

    return inflows.filter((inflow) => {
      const inflowDate = new Date(inflow.date).getTime();
      return inflowDate >= start.getTime() && inflowDate <= end.getTime();
    });
  };

   const filterByDateRange = (
     inflows: ProjectedInflow[],
     start: string,
     end: string
   ) => {
     if (!start || !end) return filterLast10Days(inflows);

     const startTimestamp = new Date(start).getTime();
     const endTimestamp = new Date(end).getTime();

     return inflows.filter((inflow) => {
       const inflowDate = new Date(inflow.date).getTime();
       return inflowDate >= startTimestamp && inflowDate <= endTimestamp;
     });
   };

  // Function to fetch inflows for a given month
  const fetchInflowsForMonth = useCallback(
    async () => {
      try {
        const response = await fetchWrapper.get<ProjectedInflow[]>(
          `/projected-inflow`
        );

        if (!response || response.length === 0) {
          setInflows([]);
          setFilteredInflows([]);
          toast.error("No inflows available.");
          return;
        }

        setInflows(response);
        setFilteredInflows(filterLast10Days(response)); // Default to last 10 days view

        if (response.length > 0) {
          const allColumns = Object.keys(response[0]);
          const filteredColumns = allColumns.filter(
            (key) => key !== "date" && key !== "id" && key !== "total_amount"
          );
          filteredColumns.sort();
          setColumns(filteredColumns);
        }
      } catch (error) {
        console.error("Error fetching inflows for the month:", error);
        toast.error("Failed to fetch inflows for the selected month.");
      }
    },
    [fetchWrapper]
  );

  // Filter inflows based on selected date
  // useEffect(() => {
  //   if (filterDate) {
  //     const filtered = inflows.filter((inflow) => inflow.date === filterDate);
  //     setFilteredInflows(filtered);
  //   } else {
  //     setFilteredInflows(inflows);
  //   }
  // }, [filterDate, inflows]);

  // Calculate total amount for a row safely
  const calculateTotalAmount = (row: ProjectedInflow) => {
    return columns.reduce((total, column) => {
      const value = row[column as keyof ProjectedInflow];
      return total + (typeof value === "number" ? value : Number(value) || 0);
    }, 0);
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

  // Handle loading inflows for the current month on page load
   useEffect(() => {
     fetchInflowsForMonth();
   }, [fetchInflowsForMonth]);

  return (
    <div className="bg-gray-100 min-h-screen">
      <Banner
        title="Projected Inflows"
        action={
            <CreateInflowDialog />
        }
      />

      <div className="mt-2">
        <DateRangeFilter
          onFilterChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
            setFilteredInflows(filterByDateRange(inflows, start, end));
          }}
        />
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
                      {formatCurrency(
                        parseFloat(
                          row[column as keyof ProjectedInflow] as string
                        )
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="px-6 py-4 font-bold">
                    {formatCurrency(calculateTotalAmount(row))}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <button
                      onClick={() => setSelectedInflow(row)}
                      className="text-blue-500 underline h-5 w-5 disabled:cursor-not-allowed"
                      disabled={isBeforeAllowedEditDate(row?.date)}
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
          onSuccess={() => fetchInflowsForMonth()}
        />
      )}
    </div>
  );
};

export default ProjectedInflowPage;
