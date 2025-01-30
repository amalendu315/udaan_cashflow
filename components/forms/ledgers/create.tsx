"use client";

import { useState } from "react";
import { FetchWrapper } from "@/utils";
import { useAuth } from "@/contexts";
import { useLedgers } from "@/contexts/ledger-context";
import toast from "react-hot-toast";

const CreateLedgerForm = () => {
  const { token } = useAuth();
  const {fetchLedgers} = useLedgers();
  const [ledgerName, setLedgerName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false)

  // Initialize FetchWrapper with the token
  const fetchWrapper = new FetchWrapper(() => token);

  const handleSubmit = async (e: React.FormEvent) => {
    setIsLoading(true);
    e.preventDefault();

    try {
      // Use FetchWrapper to make the POST request
      await fetchWrapper.post(
        "/ledgers",
        { name: ledgerName },
        {
          includeAuth: true,
        }
      );

      toast.success("Ledger created successfully!");
      fetchLedgers();
      setLedgerName(""); // Clear the form
    } catch (error) {
      toast.error("Error creating ledger. Please try again.");
      console.error("Error creating ledger:", (error as Error).message || error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium">Ledegr Name</label>
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
        className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
        disabled={isLoading}
      >
        Create Ledger
      </button>
    </form>
  );
};

export default CreateLedgerForm;
