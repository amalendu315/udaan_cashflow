"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FetchWrapper } from "@/utils";
import { useRouter } from "next/navigation";

const CreateProjectedInflow = () => {
  const router = useRouter();
  const { token } = useAuth();
  const fetchWrapper = new FetchWrapper(() => token);
  const [isLoading, setIsLoading] = useState(false);

  const [month, setMonth] = useState<string>(""); // For month selection

  const handleSubmit = async () => {
    setIsLoading(true);
    if (!month) {
      toast.error("Please select a valid month.");
      return;
    }

    try {
      const response = await fetchWrapper.post("/projected-inflow/bulk", {
        month,
      });

      if (response !== null) {
        toast.success("Projected inflows created successfully!");
        router.refresh();
      }
    } catch (error) {
      console.error("Error creating projected inflows:", error);
      toast.error("Failed to create projected inflows.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded shadow-md">
      <h2 className="text-2xl font-bold mb-4">Create Projected Inflows</h2>
      <div className="space-y-4">
        <Input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          placeholder="Select Month"
        />
        <Button
          onClick={handleSubmit}
          className="bg-green-500 text-white w-full"
          disabled={isLoading}
        >
          Submit
        </Button>
      </div>
    </div>
  );
};

export default CreateProjectedInflow;
