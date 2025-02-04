"use client";

// Dependencies
import { useState, useEffect } from "react";

// Local Imports
import { useAuth, useHotels, useRequests } from "@/contexts";
import toast from "react-hot-toast";

// Type Definitions
interface Option {
  id: number;
  name: string;
}

interface Subadmin {
  id: number;
  username: string;
}

interface PaymentRequestForm {
  hotel_id: string;
  vendor_id: string;
  department_id: string;
  ledger_id: string;
  amount: string;
  date: string;
  due_date: string;
  remarks: string;
  approval_by: string;
  payment_group_id: string;
  attachment1: File | null;
  attachment2: File | null;
  attachment3: File | null;
}

const PaymentRequestPage = () => {
    const { hotels } = useHotels();
    const { token, user } = useAuth();
    const { fetchRequests } = useRequests();
     const [formData, setFormData] = useState<PaymentRequestForm>({
       hotel_id: "",
       vendor_id: "",
       department_id: "",
       ledger_id: "",
       amount: "",
       date: "",
       due_date: "",
       remarks: "",
       approval_by: "",
       payment_group_id: "",
       attachment1: null,
       attachment2: null,
       attachment3: null,
     });

     const [subadmins, setSubadmins] = useState<Subadmin[]>([]);
     const [departments, setDepartments] = useState<Option[]>([]);
     const [paymentGroups, setPaymentGroups] = useState<Option[]>([]);
     const [ledgers, setLedgers] = useState<Option[]>([]);
     const [vendors, setVendors] = useState<Option[]>([]);
     const [loading, setLoading] = useState(false);

    // Fetch data
     useEffect(() => {
       const fetchData = async () => {
         try {
           const [
             subadminsRes,
             departmentsRes,
             paymentGroupsRes,
             ledgersRes,
             vendorsRes,
           ] = await Promise.all([
             fetch("/api/subadmins").then((res) => res.json()),
             fetch("/api/departments", {
               headers: { Authorization: `Bearer ${token}` },
             }).then((res) => res.json()),
             fetch("/api/payment-groups", {
               headers: { Authorization: `Bearer ${token}` },
             }).then((res) => res.json()),
             fetch("/api/mp-ledgers", {
               headers: { Authorization: `Bearer ${token}` },
             }).then((res) => res.json()),
             fetch("/api/vendors", {
               headers: { Authorization: `Bearer ${token}` },
             }).then((res) => res.json()),
           ]);

           setSubadmins(subadminsRes);
           setDepartments(departmentsRes);
           setPaymentGroups(paymentGroupsRes);
           setLedgers(ledgersRes);
           setVendors(vendorsRes);
         } catch (error) {
           console.error("Error fetching data:", error);
           toast.error("Error fetching data!");
         }
       };

       fetchData();
     }, [token]);

     const handleChange = (
       e: React.ChangeEvent<
         HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
       >
     ) => {
       const { name, value } = e.target;

       setFormData((prev) => {
         const updatedFormData = { ...prev, [name]: value };

         if (name === "date") {
           const selectedDate = new Date(value);
           selectedDate.setDate(selectedDate.getDate() + 2);
           updatedFormData.due_date = selectedDate.toISOString().split("T")[0];
         }

         return updatedFormData;
       });
     };

     const handleFileChange = (
       e: React.ChangeEvent<HTMLInputElement>,
       fileKey: keyof PaymentRequestForm
     ) => {
       const file = e.target.files?.[0] || null;
       if (file && file.size > 5 * 1024 * 1024) {
         toast.error("File size must be less than 5 MB");
         return;
       }
       setFormData((prev) => ({ ...prev, [fileKey]: file }));
     };

     const handleSubmit = async (e: React.FormEvent) => {
       setLoading(true);
       e.preventDefault();

       const requestData = new FormData();
       Object.entries(formData).forEach(([key, value]) => {
         if (value) requestData.append(key, value as string | Blob);
       });

       try {
         const res = await fetch("/api/payment-requests", {
           method: "POST",
           headers: {
             Authorization: `Bearer ${token}`,
           },
           body: requestData,
         });

         if (!res.ok) throw new Error("Failed to create payment request");

         toast.success("Payment Request Created Successfully!");
         setFormData({
           hotel_id: "",
           vendor_id: "",
           department_id: "",
           ledger_id: "",
           amount: "",
           date: "",
           due_date: "",
           remarks: "",
           approval_by: "",
           payment_group_id: "",
           attachment1: null,
           attachment2: null,
           attachment3: null,
         });
         fetchRequests();
         if(user?.role === "Admin" || user?.role === "System-Admin") {
          await fetch(`/api/cashflow/closing`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
         }
         // Redirect user based on role
         const redirectRoutes: Record<string, string> = {
           Admin: "/admin/payment-requests",
           "System-Admin": "/system-admin/payment-requests",
           "Sub-Admin": "/subadmin/payment-requests",
           User: "/user",
         };

         window.location.href = redirectRoutes[user?.role || "User"];
       } catch (error) {
         toast.error(
           (error as Error)?.message || "Error creating payment request!"
         );
         console.error(
           "Error creating payment request:",
           (error as Error)?.message
         );
       } finally {
         setLoading(false);
       }
     };


  return (
    <div className="space-y-6">
      {/* <Banner title="Create Payment Request" /> */}
      <div className="p-6 bg-white rounded-lg shadow-md">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Hotel */}
          <div>
            <label className="block text-sm font-semibold mb-2">Hotel</label>
            <select
              name="hotel_id"
              value={formData.hotel_id}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>
                Select Hotel
              </option>
              {hotels.map((hotel) => (
                <option key={hotel.Id} value={hotel.Id}>
                  {hotel.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Group */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Payment Group
            </label>
            <select
              name="payment_group_id"
              value={formData.payment_group_id}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>
                Select Payment Group
              </option>
              {paymentGroups?.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {/* Vendor Name */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Vendor Name
            </label>
            <select
              name="vendor_id"
              value={formData.vendor_id}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>
                Select Vendor
              </option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Department
            </label>
            <select
              name="department_id"
              value={formData.department_id}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>
                Select Department
              </option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          {/* Ledger */}
          <div>
            <label className="block text-sm font-semibold mb-2">Ledger</label>
            <select
              name="ledger_id"
              value={formData.ledger_id}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>
                Select Ledger
              </option>
              {ledgers.map((ledger) => (
                <option key={ledger.id} value={ledger.id}>
                  {ledger.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold mb-2">Amount</label>
            <input
              type="number"
              name="amount"
              placeholder="Amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold mb-2">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-semibold mb-2">Due Date</label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              disabled
              className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
            />
          </div>

          {/* Approval By */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Approval By
            </label>
            <select
              name="approval_by"
              value={formData.approval_by}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={user?.role === "Admin" || user?.role === "System-Admin"}
            >
              <option value="" disabled>
                Select Approval By
              </option>
              {subadmins.map((subadmin) => (
                <option key={subadmin.id} value={subadmin.username}>
                  {subadmin.username}
                </option>
              ))}
            </select>
          </div>
          {/* Attachments */}
          {[1, 2, 3].map((index) => (
            <div key={index}>
              <label
                className="block text-sm font-semibold mb-2"
                htmlFor={`attachment${index}`}
              >
                Attachment {index}
              </label>
              <input
                type="file"
                id={`attachment${index}`}
                name={`attachment${index}`}
                onChange={(e) =>
                  handleFileChange(
                    e,
                    `attachment${index}` as keyof PaymentRequestForm
                  )
                }
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          {/* Remarks */}
          <div className="col-span-full">
            <label className="block text-sm font-semibold mb-2">Remarks</label>
            <textarea
              name="remarks"
              placeholder="Remarks"
              value={formData.remarks}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            ></textarea>
          </div>

          {/* Submit Button */}
          <div className="col-span-full">
            <button
              type="submit"
              className="w-full bg-blue-500 text-white font-semibold py-3 rounded-md hover:bg-blue-600 transition"
              disabled={loading}
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentRequestPage;
