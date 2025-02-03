"use client";

import { useEffect, useRef, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useAuth } from "@/contexts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
// import html2canvas from "html2canvas";
// import jsPDF from "jspdf";
// import { saveAs } from "file-saver";

// Format date as YYYY-MM-DD
// const formatDate = (date: Date) => date.toISOString().split("T")[0];

interface ChartData {
  date: string;
  projected_inflow: number;
  actual_inflow: number;
  payments: number;
  closing: number;
}

const ChartsPage = () => {
  const { token } = useAuth();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
//   const [startDate, setStartDate] = useState<string>(formatDate(new Date()));
//   const [endDate, setEndDate] = useState<string>(formatDate(new Date()));

  // References for Exporting
  const chartRef = useRef<HTMLDivElement>(null);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/charts`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch chart data");

      const data = await res.json();
      setChartData(data.data);
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchChartData();
  }, [token]);

  // 🔹 EXPORT FUNCTIONALITY
//   const exportAsImage = async () => {
//     if (!chartRef.current) return;
//     const canvas = await html2canvas(chartRef.current);
//     canvas.toBlob((blob) => {
//       if (blob) saveAs(blob, "charts.png");
//     });
//   };

//   const exportAsPDF = async () => {
//     if (!chartRef.current) return;
//     const canvas = await html2canvas(chartRef.current);
//     const imgData = canvas.toDataURL("image/png");
//     const pdf = new jsPDF("landscape");
//     pdf.addImage(imgData, "PNG", 10, 10, 280, 150);
//     pdf.save("charts.pdf");
//   };

//   const exportAsCSV = () => {
//     const csvContent =
//       "Date,Projected Inflow,Actual Inflow,Payments,Closing\n" +
//       chartData
//         .map(
//           (row) =>
//             `${row.date},${row.projected_inflow},${row.actual_inflow},${row.payments},${row.closing}`
//         )
//         .join("\n");
//     const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//     saveAs(blob, "charts.csv");
//   };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-semibold flex items-center gap-2 mb-3">
        📊 Financial Dashboard
      </h2>

      {/* Filters */}
      {/* <div className="flex flex-wrap items-center justify-end gap-4 my-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium">Start Date:</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded px-4 py-2"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium">End Date:</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded px-4 py-2"
          />
        </div>

        <Button
          onClick={fetchChartData}
          className="bg-blue-600 text-white px-4 py-2 rounded mt-6"
        >
          Apply Filters
        </Button>
      </div> */}

      {/* Export Buttons */}
      {/* <div className="flex gap-4 my-4 items-center justify-center">
        <Button onClick={exportAsImage} className="bg-gray-600 text-white">
          📷 Export as Image
        </Button>
        <Button onClick={exportAsPDF} className="bg-red-500 text-white">
          📄 Export as PDF
        </Button>
        <Button onClick={exportAsCSV} className="bg-green-500 text-white">
          📊 Export as CSV
        </Button>
      </div> */}

      {/* Charts */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          <Skeleton className="w-full h-[350px] rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[300px] rounded-lg" />
            <Skeleton className="h-[300px] rounded-lg" />
          </div>
        </div>
      ) : (
        <div ref={chartRef} className="grid grid-cols-1 gap-6">
          {/* Full-width Cashflow Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Cashflow Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="closing"
                    stroke="#F59E0B"
                    name="Closing Balance"
                    strokeWidth={2}
                    dot={{ r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Two-column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Projected vs Actual Inflow */}
            <Card>
              <CardHeader>
                <CardTitle>Projected vs Actual Inflow</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="projected_inflow"
                      stroke="#4F46E5"
                      name="Projected Inflow"
                      strokeWidth={2}
                      dot={{ r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="actual_inflow"
                      stroke="#22C55E"
                      name="Actual Inflow"
                      strokeWidth={2}
                      dot={{ r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payments Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="payments"
                      fill="#F43F5E"
                      name="Payments"
                      barSize={30}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartsPage;
