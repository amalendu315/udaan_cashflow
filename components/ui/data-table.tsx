"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  title?: string; // Dynamic title prop
}

export function DataTable<TData>({
  columns,
  data,
  title,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  // const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      // globalFilter,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4 bg-white dark:bg-gray-900 shadow rounded-lg p-6">
      {/* Title and Global Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-sm font-bold text-gray-800 dark:text-white">
          {title}
        </h1>
        {/* <input
          type="text"
          placeholder="Search..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        /> */}
      </div>

      {/* Table */}
      <Table className="table-auto min-w-full border border-gray-200 dark:border-gray-700">
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-gray-800">
            {table.getHeaderGroups().map((headerGroup) =>
              headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="px-2 py-1 text-left text-gray-600 dark:text-gray-300 text-xs font-semibold" // ✅ Reduce padding & font size
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="px-2 py-1 text-gray-700 dark:text-gray-300 text-xs whitespace-nowrap" // ✅ Reduce padding & force single line
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center text-gray-600 dark:text-gray-300 py-2 text-xs"
              >
                No data available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
