import { ColumnDef } from "@tanstack/react-table";
import { PaymentRequest } from "@/types";
import { formatReadableDate } from "@/lib/utils";

export const columns: ColumnDef<PaymentRequest>[] = [
  {
    id: "serial_number",
    header: "Sl No.",
    cell: ({ row }) => row.index + 1, // Generate serial number dynamically
  },
  {
    accessorKey: "hotel_name",
    header: "Hotel Name",
  },
  {
    accessorKey: "date",
    header: "Entry Date",
    cell: ({ row }) => (
      <div className="flex space-x-2">
        {formatReadableDate(row?.original?.date)}
      </div>
    ),
  },
  {
    accessorKey: "vendor_name",
    header: "Vendor Name",
  },
  {
    accessorKey: "department_name",
    header: "Department Name",
  },
  {
    accessorKey: "ledger",
    header: "Ledger Name",
  },
  {
    accessorKey: "payment_group_name",
    header: "Payment Group",
  },
  {
    accessorKey: "amount",
    header: "Amount",
  },
  {
    accessorKey: "due_date",
    header: "Due Date",
    cell: ({ row }) => (
      <div className="flex space-x-2">
        {formatReadableDate(row?.original?.due_date)}
      </div>
    ),
  },
  {
    accessorKey: "remarks",
    header: "Remarks",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "attachment",
    header: "Attachments",
    cell: ({ row }) => {
      const attachments = [
        row.original.attachment_1,
        row.original.attachment_2,
        row.original.attachment_3,
      ].filter(Boolean);

      return attachments.length > 0 ? (
        <ul className="list-disc pl-4">
          {attachments.map((attachment, index) => (
            <li key={index}>
              <a
                href={attachment as string}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                Attachment {index + 1}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <span className="text-gray-500">No Attachments</span>
      );
    },
  },
  // {
  //   id: "actions",
  //   header: "Actions",
  //   cell: ({ row }) => (
  //     <div className="flex space-x-2">
  //       {/* <UpdatePaymentGroupDialog groupId={row.original.id} /> */}
  //     </div>
  //   ),
  // },
];
