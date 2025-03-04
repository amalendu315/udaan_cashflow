"use client";

import Spinner from "@/components/reusable/loading";
import { useAuth } from "@/contexts";
import { FetchWrapper } from "@/utils";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

// Type Definitions
interface Hotel {
  Id: number;
  name: string;
}


interface Role {
  id: number;
  role_name: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  password?: string; // ✅ Password added for new users
  role_id: number | string;
  hotels: number[];
  approvers?: number[];
}


interface CreateUserFormData {
  username: string;
  password: string;
  email: string;
  role_id: number | string;
  hotels: number[]; // Array of hotel IDs
  approvers?: number[]; // Array of approver IDs
}
interface UserFormProps {
  initialData?: User;
  fetchUsers: () => void;
  onSubmit: (formData: CreateUserFormData) => Promise<void>;
  isUpdating?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({
  initialData,
  fetchUsers,
  onSubmit,
  isUpdating = false,
}) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    username: initialData?.username || "",
    email: initialData?.email || "",
    password: "", // ✅ Only required for new users
    role_id: initialData?.role_id?.toString() || "",
    hotels: initialData?.hotels ? [...initialData.hotels] : [], // ✅ Ensure array is populated
    approvers: initialData?.approvers ? [...initialData.approvers] : [], // ✅ Ensure array is populated
  });

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchInitialData = async () => {
      const fetchWrapper = new FetchWrapper(() => token);
      try {
        const [hotelsData, rolesData, usersData] = await Promise.all([
          fetchWrapper.get<Hotel[]>("/hotels", { includeAuth: true }),
          fetchWrapper.get<Role[]>("/roles", { includeAuth: true }),
          fetchWrapper.get<User[]>("/users", { includeAuth: true }),
        ]);
        setHotels(hotelsData);
        setRoles(rolesData);
        setUsers(usersData);
      } catch (error) {
        toast.error(`Error fetching data.${(error as Error).message}`);
      }
    };

    fetchInitialData();
  }, [token]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        username: initialData.username || "",
        email: initialData.email || "",
        password: "", // ✅ Do not auto-fill password for security reasons
        role_id: initialData.role_id?.toString() || "",
        hotels: initialData.hotels ? [...initialData.hotels] : [], // ✅ Ensure it's an array
        approvers: initialData.approvers ? [...initialData.approvers] : [], // ✅ Ensure it's an array
      });
    }
  }, [initialData]);


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle Multiple Hotel Selection
  const handleHotelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map((opt) =>
      Number(opt.value)
    );
    setFormData((prev) => ({ ...prev, hotels: selectedOptions }));
  };

  // ✅ Handle Multiple Approver Selection
  const handleApproverChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map((opt) =>
      Number(opt.value)
    );

    setFormData((prev) => ({
      ...prev,
      approvers: selectedOptions, // ✅ Ensure correct state update
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    

    try {
      await onSubmit(formData);
      toast.success(
        isUpdating ? "User updated successfully" : "User created successfully"
      );
      fetchUsers();
    } catch (error) {
      toast.error((error as Error).message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium">Username</label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2 rounded"
        />
      </div>
      <div>
        <label className="block font-medium">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2 rounded"
        />
      </div>
      {/* ✅ Show Password Field Only When Creating a User */}
      {!isUpdating && (
        <div>
          <label className="block font-medium">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
          />
        </div>
      )}
      <div>
        <label className="block font-medium">Role</label>
        <select
          name="role_id"
          value={formData.role_id}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2 rounded"
        >
          <option value="" disabled>
            Select Role
          </option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.role_name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block font-medium">Hotels</label>
        <select
          name="hotels"
          value={formData.hotels.map(String)} // ✅ Convert to string for React select
          onChange={handleHotelChange}
          multiple
          required
          className="w-full border px-3 py-2 rounded"
        >
          {hotels.map((hotel) => (
            <option key={hotel.Id} value={hotel.Id?.toString()}>
              {hotel.name}
            </option>
          ))}
        </select>
        <p className="text-sm text-gray-600">
          Hold Ctrl (Cmd on Mac) to select multiple hotels.
        </p>
      </div>
      <div>
        <label className="block font-medium">Approvers</label>
        <select
          name="approvers"
          value={formData.approvers.map(String)} // ✅ Convert to string for React select
          onChange={handleApproverChange}
          multiple
          required
          className="w-full border px-3 py-2 rounded"
        >
          {users.map((user) => (
            <option key={user.id} value={user.id?.toString()}>
              {user.username}
            </option>
          ))}
        </select>
        <p className="text-sm text-gray-600">Select approvers for this user.</p>
      </div>
      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        disabled={isLoading}
      >
        {isLoading ? (
          <Spinner size={20} color="text-white" className="mr-2" />
        ) : isUpdating ? (
          "Update User"
        ) : (
          "Create User"
        )}
      </button>
    </form>
  );
};

export default UserForm;
