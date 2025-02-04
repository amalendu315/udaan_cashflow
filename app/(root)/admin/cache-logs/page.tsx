"use client";
// Dependencies
import { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";

// Local Imports
import { DataTable } from "@/components/ui/data-table";
import Banner from "@/components/reusable/banner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts";
import { formatReadableDate } from "@/lib/utils";
import GlobalSearch from "@/components/reusable/globalSearch";

interface CacheLog {
  id: number;
  created_at: string;
  user_id: number;
  user_name: string;
  user_email: string;
  role: string;
  table_name: string;
  action: string;
  details: string;
}

const CacheLogsTable = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<CacheLog[]>([]);
  // const [globalFilter, setGlobalFilter] = useState<string>(""); // Global filter state
  // const [filteredLogs, setFilteredLogs] = useState<CacheLog[]>([]); // Filtered logs

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const logsPerPage = 20; // Number of logs per page

  const [searchQuery, setSearchQuery] = useState("");

  // Fetch logs from API
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/cache-logs", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setLogs(data);
      } catch (error) {
        console.error("Error fetching cache logs:", error);
      }
    };

    fetchLogs();
  }, [token]);

  // Filter vendors based on search query
  const filteredLogs = logs.filter((log) =>
    Object.values(log).some(
      (value) =>
        typeof value === "string" &&
        value.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Calculate paginated data
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );

  const columns: ColumnDef<CacheLog>[] = [
    {
      id: "serial_number",
      header: "Sl No.",
      cell: ({ row }) => row.index + 1, // Generate serial number dynamically
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
    { accessorKey: "user_name", header: "User Name" },
    { accessorKey: "user_email", header: "User Email" },
    { accessorKey: "role", header: "Role" },
    { accessorKey: "table_name", header: "Table Name" },
    { accessorKey: "action", header: "Action" },
    { accessorKey: "details", header: "Details" },
  ];

  return (
    <div className="p-6">
      <Banner title="Cache Logs" />
      <div className="mb-4 flex justify-end">
        <GlobalSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          placeholder="Search logs..."
        />
      </div>
      <DataTable columns={columns} data={paginatedLogs} />
      <div className="flex justify-between items-center mt-4">
        <Button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <Button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default CacheLogsTable;
