"use client";

import { useState, useEffect, useMemo } from "react";
import { FetchWrapper } from "@/utils";
import { useAuth } from "@/contexts";
import { usePaymentGroups } from "@/contexts/payment-group-context";
import toast from "react-hot-toast";

interface UpdatePaymentGroupFormProps {
  groupId: number;
}

const UpdatePaymentGroupForm = ({ groupId }: UpdatePaymentGroupFormProps) => {
  const { token } = useAuth();
  const {fetchPaymentGroups} = usePaymentGroups();
  const [paymentGroupName, setPaymentGroupName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Initialize FetchWrapper with the token
  const fetchWrapper = useMemo(() => new FetchWrapper(() => token), [token]);

  useEffect(() => {
    const fetchPaymentGroup = async () => {
      setLoading(true);
      try {
        // Use FetchWrapper to fetch role details
        const group = await fetchWrapper.get<{ name: string }>(
          `/payment-groups/${groupId}`,
          { includeAuth: true }
        );
        setPaymentGroupName(group.name);
      } catch (error) {
        console.error("Failed to fetch payment_group:", error);
      } finally{
        setLoading(false);
      }
    };

    fetchPaymentGroup();
  }, [groupId, fetchWrapper]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Use FetchWrapper to update the role
      await fetchWrapper.put(
        `/payment-groups/${groupId}`,
        { name: paymentGroupName },
        { includeAuth: true }
      );

      toast.success("Payment Group updated successfully!");
      fetchPaymentGroups();
    } catch (error) {
      toast.error("Error updating Payment Group. Please try again.");
      console.error("Error updating payment_group:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!loading && (
        <>
          <div>
            <label className="block font-medium">Payment Group Name</label>
            <input
              type="text"
              name="name"
              value={paymentGroupName}
              onChange={(e) => setPaymentGroupName(e.target.value)}
              required
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            disabled={loading}
          >
            Update Payment Group
          </button>
        </>
      )}
    </form>
  );
};

export default UpdatePaymentGroupForm;
