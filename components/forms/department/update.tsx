"use client";

import { useState, useEffect, useMemo } from "react";
import { FetchWrapper } from "@/utils";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts";

interface UpdateDepartmentFormProps {
  departmentId: number;
}

const UpdateDepartmentForm = ({ departmentId }: UpdateDepartmentFormProps) => {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [departmentName, setDepartmentName] = useState<string>("");

  // Initialize FetchWrapper
  const fetchWrapper = useMemo(() => new FetchWrapper(() => token), [token]);

  useEffect(() => {
    setIsLoading(true);
    const fetchDepartment = async () => {
      try {
        // Fetch the department details
        const department = await fetchWrapper.get<{ name: string }>(
          `/departments/${departmentId}`,
          {
            includeAuth: true,
          }
        );
        setDepartmentName(department.name);
      } catch (error) {
        console.error("Failed to fetch department:", error);
        toast.error("Failed to fetch department. Please try again.");
      } finally{
        setIsLoading(false)
      }
    };

    fetchDepartment();
  }, [departmentId, fetchWrapper]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Update the department
      await fetchWrapper.put(
        `/departments/${departmentId}`,
        { name: departmentName },
        { includeAuth: true }
      );

      toast.success("Department updated successfully!");
    } catch (error) {
      console.error("Error updating department:", error);
      toast.error("Error updating department. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isLoading && (
        <>
          <div>
            <label className="block font-medium">Department Name</label>
            <input
              type="text"
              name="department_name"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              required
              className="w-full border px-3 py-2 rounded focus:ring focus:ring-blue-300"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition focus:ring focus:ring-blue-300"
            disabled={isLoading}
          >
            Update Department
          </button>
        </>
      )}
      {isLoading && (
        <div className="text-center">
          <h4>Loading ....</h4>
        </div>
      )}
    </form>
  );
};

export default UpdateDepartmentForm;
