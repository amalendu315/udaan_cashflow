"use client";

import { useState } from "react";
import { FetchWrapper } from "@/utils";
import toast from "react-hot-toast";
import { useAuth, useDepartments } from "@/contexts";

const CreateDepartmentForm = () => {
  const { token } = useAuth(); // Get the token from AuthContext
  const { fetchDepartments } = useDepartments(); // Fetch departments from context
  const [departmentName, setDepartmentName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Initialize FetchWrapper
  const fetchWrapper = new FetchWrapper(() => token);

  const handleSubmit = async (e: React.FormEvent) => {
    setIsLoading(true);
    e.preventDefault();

    try {
      // Use FetchWrapper to make API call
      await fetchWrapper.post(
        "/departments",
        { name: departmentName },
        { includeAuth: true }
      );

      toast.success("Department created successfully!");
      setDepartmentName(""); // Clear input field
      fetchDepartments(); // Refresh department list
    } catch (error) {
      console.error("Error creating department:", error);
      toast.error("Error creating department. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium">Department Name</label>
        <input
          type="text"
          name="department_name"
          value={departmentName}
          onChange={(e) => setDepartmentName(e.target.value)}
          required
          className="w-full border px-3 py-2 rounded focus:ring focus:ring-green-300"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition focus:ring focus:ring-green-300"
        disabled={isLoading}
      >
        Create Department
      </button>
    </form>
  );
};

export default CreateDepartmentForm;
