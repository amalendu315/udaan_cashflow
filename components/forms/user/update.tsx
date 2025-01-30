"use client";

import Spinner from "@/components/reusable/loading";
import { useAuth, useHotels } from "@/contexts";
import { User } from "@/types";
import { FetchWrapper } from "@/utils";
import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";

interface Role {
  id: number;
  role_name: string;
}

interface UpdateUserFormProps {
  userId: number; // ID of the user to update
  fetchUsers:()=>void;
}

const UpdateUserForm: React.FC<UpdateUserFormProps> = ({ userId, fetchUsers }) => {
  const { token } = useAuth();
  const { hotels } = useHotels();

  const [roles, setRoles] = useState<Role[]>([]);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role_id: "",
    hotel_id: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Initialize FetchWrapper with token
  const fetchWrapper = useMemo(() => new FetchWrapper(() => token), [token]);

  // Fetch user details and roles when the form loads
  useEffect(() => {
    const fetchUserAndRoles = async () => {
      setIsLoading(true);
      try {
        // Fetch user and roles data
        const [user, rolesData]: [User, Role[]] = await Promise.all([
          fetchWrapper.get<User>(`/users/${userId}`, {
            includeAuth: true,
          }),
          fetchWrapper.get<Role[]>(`/roles`, {
            includeAuth: true,
          }),
        ]);

        setRoles(rolesData as Role[]);
        setFormData({
          username: user.username,
          email: user.email,
          role_id: user.role_id?.toString(),
          hotel_id: user.hotel_id?.toString(),
        });
      } catch (error) {
        toast.error("Error fetching user details or roles");
        console.error("Error fetching user details or roles:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndRoles();
  }, [userId, fetchWrapper]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Update user API call
      await fetchWrapper.put(`/users/${userId}`, {
        username: formData.username,
        email: formData.email,
        role_id: parseInt(formData.role_id, 10),
        hotel_id: parseInt(formData.hotel_id, 10),
      },{
        includeAuth:true
      });

      toast.success("User updated successfully!");
      fetchUsers(); // Refresh the users list in context
    } catch (error) {
      toast.error("Error updating user. Please try again.");
      console.error("Error updating user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Spinner size={40} className="mx-auto d-block" />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="username" className="block font-medium mb-1">
          Username
        </label>
        <input
          type="text"
          name="username"
          id="username"
          value={formData.username}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2 rounded focus:ring focus:ring-blue-300"
        />
      </div>
      <div>
        <label htmlFor="email" className="block font-medium mb-1">
          Email
        </label>
        <input
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2 rounded focus:ring focus:ring-blue-300"
        />
      </div>
      <div>
        <label htmlFor="role_id" className="block font-medium mb-1">
          Role
        </label>
        <select
          name="role_id"
          id="role_id"
          value={formData.role_id}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2 rounded focus:ring focus:ring-blue-300"
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
        <label htmlFor="hotel_id" className="block font-medium mb-1">
          Hotel
        </label>
        <select
          name="hotel_id"
          id="hotel_id"
          value={formData.hotel_id}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2 rounded focus:ring focus:ring-blue-300"
        >
          <option value="" disabled>
            Select Hotel
          </option>
          {hotels.map((hotel) => (
            <option key={hotel.Id} value={hotel.Id}>
              {hotel.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition focus:ring focus:ring-blue-300 disabled:opacity-50"
      >
        Update User
      </button>
    </form>
  );
};

export default UpdateUserForm;
