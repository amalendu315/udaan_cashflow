// "use client";

// import { useAuth, useRequests } from "@/contexts";
// import { PaymentRequest } from "@/types";
// import { ColumnDef } from "@tanstack/react-table";
// import { useEffect, useState } from "react";
// import { Button } from "../ui/button";
// import { DataTable } from "../ui/data-table";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
// import { FetchWrapper } from "@/utils";

// interface PaymentRequestTableProps {
//   role: "Admin" | "Sub-Admin" | "User";
//   filter?: "Pending" | "Transfer Pending" | "Transfer Completed" | string;
// }

// const PaymentRequestTable: React.FC<PaymentRequestTableProps> = ({
//   role,
//   filter,
// }) => {
//   const { token } = useAuth();
//   const { fetchRequests, requests } = useRequests();
//   const [filteredRequests, setFilteredRequests] = useState<PaymentRequest[]>(
//     []
//   );
//   const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(
//     null
//   );
//   const [remarks, setRemarks] = useState<string>("");
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [newStatus, setNewStatus] = useState<string>("");

//   const fetchWrapper = new FetchWrapper(() => token); // Initialize FetchWrapper

//   // Filter requests based on the `filter` prop
//   useEffect(() => {
//     if (filter) {
//       const filtered = requests.filter((request) => request.status === filter);
//       setFilteredRequests(filtered);
//     } else {
//       setFilteredRequests(requests);
//     }
//   }, [filter, requests]);

//   const handleActionClick = (request: PaymentRequest, status: string) => {
//     setSelectedRequest(request);
//     setIsDialogOpen(true);
//     setRemarks(""); // Clear remarks for a new dialog
//     setNewStatus(status); // Set the new status
//   };

//   const handleSubmit = async () => {
//     if (!selectedRequest) return;

//     try {
//       // Use FetchWrapper to update the request status
//       await fetchWrapper.post(`/payment-requests/${selectedRequest.id}`, {
//         status: newStatus,
//         remarks:
//           role === "Admin" || newStatus === "Transfer Completed" ? remarks : "",
//       });
//       fetchRequests(); // Refresh the list
//       setIsDialogOpen(false); // Close the dialog
//     } catch (error) {
//       console.error("Error updating payment request:", error);
//     }
//   };

//   const columns: ColumnDef<PaymentRequest>[] = [
//     { accessorKey: "id", header: "ID" },
//     { accessorKey: "hotel_name", header: "Hotel Name" },
//     {
//       accessorKey: "date",
//       header: "Entry Date",
//       cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString(),
//     },
//     { accessorKey: "vendor_name", header: "Vendor Name" },
//     { accessorKey: "department_name", header: "Department Name" },
//     { accessorKey: "ledger", header: "Ledger Name" },
//     { accessorKey: "payment_group_name", header: "Payment Group" },
//     { accessorKey: "amount", header: "Amount" },
//     {
//       accessorKey: "due_date",
//       header: "Due Date",
//       cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString(),
//     },
//     { accessorKey: "approval_by", header: "Approval By" },
//     { accessorKey: "remarks", header: "Remarks" },
//     {
//       accessorKey: "status",
//       header: "Status",
//       cell: ({ getValue }) => {
//         const status = getValue<string>();

//         const getStatusStyle = (status: string) => {
//           switch (status) {
//             case "Transfer Completed":
//               return "bg-green-500";
//             case "Rejected":
//               return "bg-red-500";
//             case "Transfer Pending":
//               return "bg-blue-500";
//             case "Pending":
//               return "bg-yellow-500";
//             default:
//               return "bg-gray-500";
//           }
//         };

//         return (
//           <span
//             className={`inline-block px-4 py-1 rounded-full text-sm text-white ${getStatusStyle(
//               status
//             )}`}
//             style={{
//               whiteSpace: "nowrap",
//               overflow: "hidden",
//               textOverflow: "ellipsis",
//             }} // Prevent text wrapping
//             title={status} // Tooltip with the full status text
//           >
//             {status}
//           </span>
//         );
//       },
//     },
//     {
//       id: "actions",
//       header: "Actions",
//       cell: ({ row }) => (
//         <div className="flex space-x-2">
//           {row.original.status === "Pending" ? (
//             <>
//               <Button
//                 onClick={() =>
//                   handleActionClick(row.original, "Transfer Pending")
//                 }
//                 className="bg-green-500 text-white"
//               >
//                 Approve
//               </Button>
//               <Button
//                 onClick={() => handleActionClick(row.original, "Rejected")}
//                 className="bg-red-500 text-white"
//               >
//                 Reject
//               </Button>
//             </>
//           ) : row.original.status === "Transfer Pending" ? (
//             <Button
//               onClick={() =>
//                 handleActionClick(row.original, "Transfer Completed")
//               }
//               className="bg-blue-500 text-white"
//             >
//               Mark as Done
//             </Button>
//           ) : null}
//         </div>
//       ),
//     },
//   ];

//   return (
//     <div className="bg-white p-6 rounded shadow space-y-8">
//       <DataTable
//         columns={columns}
//         data={filteredRequests}
//         title="Payment Requests"
//       />

//       {/* Approve/Reject Dialog */}
//       {isDialogOpen && selectedRequest && (
//         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>
//                 {newStatus === "Transfer Pending"
//                   ? "Approve Payment"
//                   : newStatus === "Rejected"
//                   ? "Reject Payment"
//                   : "Mark as Transfer Completed"}
//               </DialogTitle>
//             </DialogHeader>
//             <div className="space-y-4">
//               {/* Remarks field for Admins or for Transfer Completed */}
//               {(role === "Admin" || newStatus === "Transfer Completed") && (
//                 <div>
//                   <label className="block font-medium mb-2">Remarks</label>
//                   <textarea
//                     className="w-full border px-3 py-2 rounded"
//                     value={remarks}
//                     onChange={(e) => setRemarks(e.target.value)}
//                     placeholder={
//                       newStatus === "Transfer Completed"
//                         ? "Enter transaction details"
//                         : "Add remarks for this action"
//                     }
//                   ></textarea>
//                 </div>
//               )}

//               <div className="flex space-x-4 justify-end">
//                 <Button
//                   onClick={handleSubmit}
//                   className={`${
//                     newStatus === "Rejected"
//                       ? "bg-red-500 hover:bg-red-600"
//                       : "bg-green-500 hover:bg-green-600"
//                   } text-white`}
//                 >
//                   Confirm
//                 </Button>
//                 <Button
//                   onClick={() => setIsDialogOpen(false)}
//                   className="bg-gray-500 hover:bg-gray-600 text-white"
//                 >
//                   Cancel
//                 </Button>
//               </div>
//             </div>
//           </DialogContent>
//         </Dialog>
//       )}
//     </div>
//   );
// };

// export default PaymentRequestTable;

"use client";

import { useAuth, useRequests } from "@/contexts";
import { ApprovePaymentRequestInterface, PaymentRequest } from "@/types";
import { ColumnDef, Row } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { DataTable } from "../ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { formatCurrency } from "@/utils";
import { formatReadableDate } from "@/lib/utils";
import DateRangeFilter from "./date-range-filter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import toast from "react-hot-toast";

interface PaymentRequestTableProps {
  role: "System-Admin"|"Admin" | "Sub-Admin" | "User";
  filter?: "Pending" | "Transfer Pending" | "Transfer Completed" | "Rejected" | string;
  dueDateFilter?: string; // Single date input for filtering by due_date
}

const PaymentRequestTable: React.FC<PaymentRequestTableProps> = ({
  role,
  filter,
}) => {
  const { token } = useAuth();
  const { fetchRequests, requests } = useRequests();
  const [filteredRequests, setFilteredRequests] = useState<PaymentRequest[]>(
    []
  );
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(
    null
  );
  const [remarks, setRemarks] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  // 🔹 Date Range Filter State
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  // const fetchWrapper = new FetchWrapper(() => token);

  // Filter requests based on the `filter` and `localDueDateFilter` props
useEffect(() => {
  let filtered = [...requests]; // Clone the array before filtering

  if (filter) {
    filtered = filtered.filter((request) => request.status === filter);
  }

  if (startDate && endDate) {
    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(endDate).setHours(23, 59, 59, 999);

    filtered = filtered.filter((request) => {
      const dueDate = new Date(request.due_date).setHours(0, 0, 0, 0);
      return dueDate >= start && dueDate <= end;
    });
  }

  setFilteredRequests(filtered);
}, [filter, startDate, endDate, requests]);


 const handleActionClick = (request: PaymentRequest, status: string) => {
   setSelectedRequest(request);
   setIsDialogOpen(true);
   setRemarks("");
   setPaymentMethod("");
   setAttachment(null);
   setNewStatus(status);
 };
 const handleSubmit = async () => {
   if (!selectedRequest) return;

   const formData = new FormData();
   formData.append("status", newStatus);
   formData.append("payment_method", paymentMethod);
   if (remarks && (role === "Admin" || role === "System-Admin")) {
     formData.append("remarks", remarks);
   }
   if (attachment) {
     formData.append("attachment", attachment);
   }

   try {
     const response = await fetch(
       `/api/payment-requests/${selectedRequest.id}`,
       {
         method: "POST",
         headers:{
          Authorization: `Bearer ${token}`
         },
         body: formData, // ✅ NO NEED TO SET HEADERS (Browser auto-sets Content-Type)
       }
     );

     const data:ApprovePaymentRequestInterface = await response.json();
     console.log("Response Data:", data);

     if (!response.ok) {
      toast.error(data.message);
      // throw new Error(data.message || "Request failed");
     } else {
      toast.success(data.message);
      fetchRequests();
      setIsDialogOpen(false);
     };
     
   } catch (error) {
     console.error("Error updating payment request:", error);
   }
 };

  const columns: ColumnDef<PaymentRequest>[] = [
    {
      id: "serial_number",
      header: "Sl No.",
      cell: ({ row }) => row.index + 1, // Generate serial number dynamically
      meta: { className: "text-xs p-1 text-center" },
    },
    {
      accessorKey: "hotel_name",
      header: "Hotel Name",
      meta: { className: "text-xs p-1" },
    },
    // {
    //   accessorKey: "date",
    //   header: "Entry Date",
    //   cell: ({ row }) => (
    //     <div className="flex space-x-2">
    //       {formatReadableDate(row?.original?.date)}
    //     </div>
    //   ),
    //   meta: { className: "text-xs p-1 whitespace-nowrap" },
    // },
    {
      accessorKey: "vendor_name",
      header: "Vendor Name",
      meta: { className: "text-xs p-1" },
    },
    {
      accessorKey: "department_name",
      header: "Department Name",
      meta: { className: "text-xs p-1" },
    },
    {
      accessorKey: "ledger_name",
      header: "Ledger Name",
      meta: { className: "text-xs p-1" },
    },
    // {
    //   accessorKey: "payment_group_name",
    //   header: "Payment Group",
    //   meta: { className: "text-xs p-1" },
    // },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ getValue }) => formatCurrency(getValue<number>()),
      meta: { className: "text-xs p-1 text-right" },
    },
    {
      accessorKey: "due_date",
      header: "Due Date",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          {formatReadableDate(row?.original?.due_date)}
        </div>
      ),
      meta: { className: "text-xs p-1 whitespace-nowrap" },
    },
    {
      accessorKey: "created_by_name",
      header: "Created By",
      meta: { className: "text-xs p-1" },
    },
    {
      accessorKey: "approval_by",
      header: "Approval By",
      meta: { className: "text-xs p-1" },
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
      meta: { className: "text-xs p-1" },
    },
    {
      accessorKey: "attachments",
      header: "Attachments",
      cell: ({ row }) => {
        const attachments = [
          { url: row.original.attachment_1, label: "Attachment 1" },
          { url: row.original.attachment_2, label: "Attachment 2" },
          { url: row.original.attachment_3, label: "Attachment 3" },
          { url: row.original.attachment_4, label: "Attachment 4" },
        ].filter((att) => att.url); // Filter out null values

        return attachments.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {attachments.map((att, index) => (
              <a
                key={index}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                {att.label}
              </a>
            ))}
          </div>
        ) : (
          <span className="text-gray-500 text-sm">No Attachments</span>
        );
      },
      meta: { className: "text-xs p-1" },
    },
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
            className={`inline-block px-2 py-1 rounded-full text-sm text-white ${getStatusStyle(
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
      meta: { className: "text-xs p-1" },
    },
    ...(role === "Admin" || role === "Sub-Admin" || role === "System-Admin"
      ? [
          {
            id: "actions",
            header: "Actions",
            cell: ({ row }: { row: Row<PaymentRequest> }) => (
              <div className="flex space-x-2">
                {row.original.status === "Pending" ? (
                  <>
                    <Button
                      size={"sm"}
                      onClick={() =>
                        handleActionClick(row.original, "Transfer Pending")
                      }
                      className="bg-green-500 text-white"
                    >
                      Approve
                    </Button>
                    <Button
                      size={"sm"}
                      onClick={() =>
                        handleActionClick(row.original, "Rejected")
                      }
                      className="bg-red-500 text-white"
                    >
                      Reject
                    </Button>
                  </>
                ) : row.original.status === "Transfer Pending" ? (
                  <Button
                    size={"sm"}
                    onClick={() =>
                      handleActionClick(row.original, "Transfer Completed")
                    }
                    className="bg-blue-500 text-white"
                  >
                    Mark as Done
                  </Button>
                ) : null}
              </div>
            ),
            meta: { className: "text-xs p-1" },
          },
        ]
      : []),
  ];

  return (
    <div className="bg-white p-6 rounded shadow space-y-1">
      <DateRangeFilter
        onFilterChange={(start, end) => {
          console.log("Filtering from:", start, "to:", end); // Debugging Log
          setStartDate(start);
          setEndDate(end);
        }}
      />

      {/* Data Table */}
      <div className="overflow-x-auto w-full">
        <DataTable
          columns={columns}
          data={filteredRequests}
          title="Payment Requests"
        />
      </div>
      {/* Approve/Reject Dialog */}
      {isDialogOpen && selectedRequest && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {newStatus === "Transfer Pending"
                  ? "Approve Payment"
                  : newStatus === "Rejected"
                  ? "Reject Payment"
                  : "Mark as Transfer Completed"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {(role === "Admin" || newStatus === "Transfer Completed") && (
                <div>
                  <label className="block font-medium">Payment Method</label>
                  <Select
                    onValueChange={setPaymentMethod}
                    value={paymentMethod}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank Transfer">
                        Bank Transfer
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {paymentMethod && (
                    <div>
                      <label className="block font-medium">
                        Upload{" "}
                        {paymentMethod === "Cash"
                          ? "Bill"
                          : "Bank Transfer Screenshot"}
                      </label>
                      <Input
                        type="file"
                        accept="image/*, .pdf"
                        onChange={(e) =>
                          setAttachment(e.target.files?.[0] || null)
                        }
                      />
                    </div>
                  )}
                  <label className="block font-medium mb-2">Remarks</label>
                  <textarea
                    className="w-full border px-3 py-2 rounded"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder={
                      newStatus === "Transfer Completed"
                        ? "Enter transaction details"
                        : "Add remarks for this action"
                    }
                  ></textarea>
                </div>
              )}

              <div className="flex space-x-4 justify-end">
                <Button
                  onClick={handleSubmit}
                  className={`${
                    newStatus === "Rejected"
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-green-500 hover:bg-green-600"
                  } text-white`}
                >
                  Confirm
                </Button>
                <Button
                  onClick={() => setIsDialogOpen(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PaymentRequestTable;