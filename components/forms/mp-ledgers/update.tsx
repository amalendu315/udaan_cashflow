"use client";

import { useState, useEffect, useMemo } from "react";
import { FetchWrapper } from "@/utils";
import { useAuth } from "@/contexts";
import { useMonthlyPaymentLedgers } from "@/contexts/mp-ledger-context";
import toast from "react-hot-toast";

interface UpdateLedgerFormProps {
  ledgerId: number;
}

const UpdateLedgerForm = ({ ledgerId }: UpdateLedgerFormProps) => {
  const { token } = useAuth();
  const {fetchLedgers} = useMonthlyPaymentLedgers();
  const [ledgerName, setLedgerName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false)

  // Initialize FetchWrapper with the token
  const fetchWrapper = useMemo(() => new FetchWrapper(() => token), [token]);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        // Use FetchWrapper to fetch role details
        const ledger = await fetchWrapper.get<{ name: string }>(
          `/mp-ledgers/${ledgerId}`,
          { includeAuth: true }
        );
        setLedgerName(ledger.name);
      } catch (error) {
        console.error("Failed to fetch role:", error);
      }
    };

    fetchRole();
  }, [ledgerId, fetchWrapper]);

  const handleSubmit = async (e: React.FormEvent) => {
    setIsLoading(true);
    e.preventDefault();

    try {
      // Use FetchWrapper to update the role
      await fetchWrapper.put(
        `/mp-ledgers/${ledgerId}`,
        { name: ledgerName },
        { includeAuth: true }
      );

      // setMessage("Ledger updated successfully!");
      toast.success("Ledger updated successfully!");
      fetchLedgers();
    } catch (error) {
      toast.error("Error updating ledger. Please try again.");
      console.error("Error updating ledger:", error);
    }finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium">Ledger Name</label>
        <input
          type="text"
          name="name"
          value={ledgerName}
          onChange={(e) => setLedgerName(e.target.value)}
          required
          className="w-full border px-3 py-2 rounded"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        disabled={isLoading}
      >
        Update Ledger
      </button>
    </form>
  );
};

export default UpdateLedgerForm;
