"use client";

import { useState } from "react";
import { FetchWrapper } from "@/utils";
import { useAuth } from "@/contexts";
import toast from "react-hot-toast";

const CreateRoleForm = ({ fetchRoles }: { fetchRoles:() => void }) => {
  const { token } = useAuth();
  const [roleName, setRoleName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  // const [message, setMessage] = useState<string | null>(null);

  // Initialize FetchWrapper with the token
  const fetchWrapper = new FetchWrapper(() => token);

  const handleSubmit = async (e: React.FormEvent) => {
    setIsLoading(true);
    e.preventDefault();
    // setMessage(null);

    try {
      // Use FetchWrapper to make the POST request
      await fetchWrapper.post(
        "/roles",
        { role_name: roleName },
        {
          includeAuth: true,
        }
      );

      // setMessage("Role created successfully!");
      toast.success("Role created successfyully!")
      setRoleName(""); // Clear the form
      fetchRoles();
    } catch (error) {
      // setMessage("Error creating role. Please try again.");
      toast.error((error as Error)?.message || "Error creating role. Please try again.")
      console.error("Error creating role:", (error as Error).message || error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium">Role Name</label>
        <input
          type="text"
          name="role_name"
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          required
          className="w-full border px-3 py-2 rounded"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
        disabled={isLoading}
      >
        Create Role
      </button>
    </form>
  );
};

export default CreateRoleForm;
