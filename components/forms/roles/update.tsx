"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { FetchWrapper } from "@/utils";
import { useAuth } from "@/contexts";
import toast from "react-hot-toast";

interface UpdateRoleFormProps {
  roleId: number;
  fetchRoles: () => void;
}

const UpdateRoleForm: React.FC<UpdateRoleFormProps> = ({
  roleId,
  fetchRoles,
}) => {
  const { token } = useAuth();
  const [roleName, setRoleName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Memoize fetchWrapper to prevent unnecessary re-creations
  const fetchWrapper = useMemo(() => new FetchWrapper(() => token), [token]);

  // Memoized function to fetch role details
  const fetchRole = useCallback(async () => {
    setIsLoading(true);
    try {
      const role = await fetchWrapper.get<{ role_name: string }>(
        `/roles/${roleId}`,
        { includeAuth: true }
      );
      setRoleName(role.role_name);
    } catch (error) {
      console.error("Failed to fetch role:", error);
      toast.error((error as Error)?.message || "Failed to fetch role");
    } finally {
      setIsLoading(false);
    }
  }, [roleId, fetchWrapper]); // Dependencies: roleId, fetchWrapper

  // Fetch role details when roleId changes
  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    setIsLoading(true);
    e.preventDefault();

    try {
      await fetchWrapper.put(
        `/roles/${roleId}`,
        { role_name: roleName },
        { includeAuth: true }
      );
      toast.success("Role updated successfully!");
      fetchRoles();
    } catch (error) {
      toast.error((error as Error)?.message || "Error updating role");
      console.error("Error updating role:", error);
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
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        disabled={isLoading}
      >
        {isLoading ? "Updating..." : "Update Role"}
      </button>
    </form>
  );
};

export default UpdateRoleForm;
