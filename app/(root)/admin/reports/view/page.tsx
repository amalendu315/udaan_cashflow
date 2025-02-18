"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useReports } from "@/contexts/report-context";

export default function ReportsView() {
  const { reportData } = useReports();
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  if (!reportData) {
    router.push("/admin/reports"); // ✅ Redirect if no report data
    return; // Exit early
  }
}, [reportData, router]);

  

  if (!reportData) return <p>Loading report...</p>;

  const cashBalance = (reportData?.netCashInHand - reportData?.bankBalance).toFixed(2);
 
  const handlePrint = () => {
    if (reportRef.current) {
      const printWindow = window.open("", "_blank");
      printWindow?.document.write(`
        <html>
          <head>
            <title>Print Report</title>
            <style>
              body { font-family: Arial, sans-serif; }
              h2, h3 { text-align: center; }
              table { width: 60%; margin: 20px auto; border-collapse: collapse; border: 1px solid #000; }
              th, td { border: 1px solid #000; padding: 10px; text-align: left; }
              th { background-color: #024059; color: #fff; font-weight: bold; }
              .right { text-align: right; }
            </style>
          </head>
          <body>
            ${reportRef.current.innerHTML}
          </body>
        </html>
      `);
      printWindow?.document.close();
      printWindow?.print();
    }
  };

  return (
    <div className="p-6 flex flex-col items-center ">
      <div
        ref={reportRef}
        className="w-full max-w-7xl bg-white p-6 rounded shadow"
      >
        <h2 className="text-center text-xl font-bold">
          Udaan Hotels and Resorts Pvt Ltd
        </h2>
        <h3 className="text-center text-lg font-semibold">
          Cash Flow Statement ({reportData.month})
        </h3>

        {/* Opening Balance */}
        <table
          style={{
            width: "100%",
            margin: "20px auto",
            borderCollapse: "collapse",
            border: "1px solid #000",
          }}
        >
          <tr
            style={{
              backgroundColor: "#024059",
              color: "#fff",
              fontWeight: "bold",
              textAlign: "left",
            }}
          >
            <th
              colSpan={2}
              style={{
                border: "1px solid #000",
                padding: "10px",
                textAlign: "left",
              }}
            >
              Opening Balance
            </th>
          </tr>
          <tr>
            <td
              style={{
                border: "1px solid #000",
                padding: "10px",
                textAlign: "left",
              }}
            >
              Cash Balance
            </td>
            <td
              //   className="right"
              style={{
                border: "1px solid #000",
                padding: "10px",
                textAlign: "left",
              }}
            >
              {reportData.cashBalance.toFixed(2)}
            </td>
          </tr>
          <tr>
            <td
              style={{
                border: "1px solid #000",
                padding: "10px",
                textAlign: "left",
              }}
            >
              Bank Balance
            </td>
            <td
              //   className="right"
              style={{
                border: "1px solid #000",
                padding: "10px",
                textAlign: "left",
              }}
            >
              {reportData.bankBalance.toFixed(2)}
            </td>
          </tr>
          <tr>
            <th
              style={{
                border: "1px solid #000",
                padding: "10px",
                textAlign: "left",
                backgroundColor: "#024059",
                color: "#fff",
              }}
            >
              Total Opening Balance
            </th>
            <th className="right">
              {(reportData.cashBalance + reportData.bankBalance).toFixed(2)}
            </th>
          </tr>
        </table>

        {/* Cash In-Flow */}
        <table
          style={{
            width: "100%",
            margin: "20px auto",
            borderCollapse: "collapse",
            border: "1px solid #000",
          }}
        >
          <tr
            style={{
              backgroundColor: "#024059",
              color: "#fff",
              fontWeight: "bold",
              textAlign: "left",
            }}
          >
            <th
              colSpan={2}
              style={{
                border: "1px solid #000",
                padding: "10px",
                textAlign: "left",
              }}
            >
              Cash In-Flow
            </th>
          </tr>
          {reportData.inflows.length > 0 ? (
            reportData.inflows.map((inflow, index) => (
              <tr key={index}>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "10px",
                    textAlign: "left",
                  }}
                >
                  {inflow.ledger_name}
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "10px",
                    textAlign: "left",
                  }}
                >
                  {inflow.total_amount.toFixed(2)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={2}
                style={{
                  border: "1px solid #000",
                  padding: "10px",
                  textAlign: "left",
                }}
              >
                No Cash In-Flow
              </td>
            </tr>
          )}
          <tr>
            <th
              style={{
                border: "1px solid #000",
                padding: "10px",
                textAlign: "left",
                backgroundColor: "#024059",
                color: "#fff",
              }}
            >
              Total Cash In-Flow
            </th>
            <th className="right">{reportData.totalCashInflow.toFixed(2)}</th>
          </tr>
        </table>

        {/* Cash Out-Flow */}
        <table
          style={{
            width: "100%",
            margin: "20px auto",
            borderCollapse: "collapse",
            border: "1px solid #000",
          }}
        >
          <tr
            style={{
              backgroundColor: "#024059",
              color: "#fff",
              fontWeight: "bold",
              textAlign: "left",
            }}
          >
            <th
              colSpan={2}
              style={{
                border: "1px solid #000",
                padding: "10px",
                textAlign: "left",
              }}
            >
              Cash Out-Flow
            </th>
          </tr>
          {reportData.expenses.length > 0 ? (
            reportData.expenses.map((expense, index) => (
              <tr key={index}>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "10px",
                    textAlign: "left",
                  }}
                >
                  {expense.payment_group}
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "10px",
                    textAlign: "left",
                  }}
                >
                  {expense.total_amount.toFixed(2)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={2}
                style={{
                  border: "1px solid #000",
                  padding: "10px",
                  textAlign: "left",
                }}
              >
                No Cash Out-Flow
              </td>
            </tr>
          )}
          <tr>
            <td
              style={{
                border: "1px solid #000",
                padding: "10px",
                textAlign: "left",
              }}
            >
              Other Payments (Scheduled & Monthly)
            </td>
            <td
              //   className="right"
              style={{
                border: "1px solid #000",
                padding: "10px",
                textAlign: "left",
              }}
            >
              {reportData.otherPayments.toFixed(2)}
            </td>
          </tr>
          <tr>
            <th
              style={{
                border: "1px solid #000",
                padding: "10px",
                textAlign: "left",
                backgroundColor: "#024059",
                color: "#fff",
              }}
            >
              Total Cash Out-Flow
            </th>
            <th className="right">{reportData.totalExpenses.toFixed(2)}</th>
          </tr>
        </table>

        {/* Net Cash in Hand */}
        <table
          style={{
            width: "100%",
            margin: "20px auto",
            borderCollapse: "collapse",
            border: "1px solid #000",
          }}
        >
          <tr
            style={{
              backgroundColor: "#024059",
              color: "#fff",
              fontWeight: "bold",
              textAlign: "left",
            }}
          >
            <th
              style={{
                border: "1px solid #000",
                padding: "10px",
                textAlign: "left",
              }}
            >
              Net Cash in Hand
            </th>
            <th className="right text-center">
              {reportData.netCashInHand.toFixed(2)}
            </th>
          </tr>
          <tr>
            <td
              style={{
                border: "1px solid #000",
                padding: "10px",
                textAlign: "left",
              }}
            >
              Cash Balance
            </td>
            <td
              style={{
                border: "1px solid #000",
                padding: "10px",
                textAlign: "left",
              }}
            >
              {cashBalance}
            </td>
          </tr>
          <tr>
            <td
              style={{
                border: "1px solid #000",
                padding: "10px",
                textAlign: "left",
              }}
            >
              Bank Balance
            </td>
            <td
              //   className="right"
              style={{
                border: "1px solid #000",
                padding: "10px",
                textAlign: "left",
              }}
            >
              {reportData.bankBalance.toFixed(2)}
            </td>
          </tr>
          <tr>
            <th
              style={{
                border: "1px solid #000",
                padding: "10px",
                textAlign: "left",
                backgroundColor: "#024059",
                color: "#fff",
              }}
            >
              Total Cash in Hand
            </th>
            <th className="right">{reportData?.netCashInHand.toFixed(2)}</th>
          </tr>
        </table>
      </div>

      {/* Print Button */}
      <button
        onClick={handlePrint}
        className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
      >
        Print Report
      </button>
    </div>
  );
}
