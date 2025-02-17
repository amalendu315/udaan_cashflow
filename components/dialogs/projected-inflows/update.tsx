  "use client";

  import { useState, useEffect, useMemo } from "react";
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
  import { Input } from "@/components/ui/input";
  import { Button } from "@/components/ui/button";
  import { toast } from "react-hot-toast";
  import { useAuth } from "@/contexts";
  import { FetchWrapper } from "@/utils";

  interface ProjectedInflow {
    id: number;
    date: string;
    [key: string]: number | string; // Ledger names as dynamic properties
  }

  interface EditInflowDialogProps {
    inflow: ProjectedInflow;
    onClose: () => void;
    onSuccess: () => void;
  }

  interface LedgerOption {
    id: string;
    name: string;
  }

  const EditInflowDialog: React.FC<EditInflowDialogProps> = ({
    inflow,
    onClose,
    onSuccess,
  }) => {
    const { token } = useAuth();
    const fetchWrapper = useMemo(() => new FetchWrapper(() => token), [token]);

    const [updatedInflow, setUpdatedInflow] = useState<Record<string, number>>(
      Object.keys(inflow)
        .filter((key) => key !== "id" && key !== "date")
        .reduce((acc, key) => {
          const value = Number(inflow[key]); // Ensure numeric values
          return { ...acc, [key]: isNaN(value) ? 0 : value };
        }, {})
    );
    const [ledgerOptions, setLedgerOptions] = useState<LedgerOption[]>([]);

    useEffect(() => {
      // Fetch ledger options
      const fetchLedgers = async () => {
        try {
          const data = await fetchWrapper.get<LedgerOption[]>("/ledgers");
          setLedgerOptions(data);
        } catch (error) {
          console.error("Error fetching ledgers:", error);
          toast.error("Failed to fetch ledger options.");
        }
      };

      fetchLedgers();
    }, [fetchWrapper]);

    const handleFieldChange = (field: string, value: string) => {
      const parsedValue = parseFloat(value);
      setUpdatedInflow((prev) => ({
        ...prev,
        [field]: isNaN(parsedValue) ? 0 : parsedValue,
      }));
    };

    const handleSubmit = async () => {
      try {
        const payload = {
          ledgers: Object.keys(updatedInflow)
            .filter((key) => updatedInflow[key] >= 0) // Only include valid amounts
            .map((name) => {
              const ledger = ledgerOptions.find((option) => option.name === name);
              if (!ledger) {
                throw new Error(`Ledger not found for name: ${name}`);
              }
              return { ledger_id: ledger.id, amount: updatedInflow[name] };
            }),
        };

        console.log('payload', payload)

        if (!payload.ledgers.length) {
          toast.error("At least one valid ledger amount is required.");
          return;
        }

        const res = await fetch(`/api/projected-inflow/${inflow.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Failed to update inflow");

        // await fetch(`/api/cashflow/closing`, {
        //   method: "PUT",
        //   headers: {
        //     Authorization: `Bearer ${token}`,
        //   },
        // });

        toast.success("Projected inflow updated successfully!");
        onSuccess();
        onClose();
      } catch (error) {
        console.error("Error updating inflow:", error);
        toast.error("Failed to update projected inflow.");
      }
    };

    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Projected Inflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-2">Date</label>
              <Input value={inflow.date} disabled />
            </div>
            {Object.keys(updatedInflow).map((key, index) => (
              <div key={index}>
                <label className="block font-medium mb-2">{key}</label>
                <Input
                  type="number"
                  value={updatedInflow[key]}
                  onChange={(e) => handleFieldChange(key, e.target.value)}
                />
              </div>
            ))}
            <Button
              onClick={handleSubmit}
              className="bg-green-500 text-white w-full"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  export default EditInflowDialog;
