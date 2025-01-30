"use client";

import Spinner from "@/components/reusable/loading";
import { useAuth } from "@/contexts";
import { FetchWrapper } from "@/utils";
// Dependencies
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

const CreateUserForm = ({fetchUsers}:{fetchUsers:()=>void}) => {
  const { token } = useAuth(); // Auth hook to get the token
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role_id: "",
    hotel_id: "",
  });
  // const [message, setMessage] = useState("");
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchInitialData = async () => {
        const getToken = () => (token);
      const fetchWrapper = new FetchWrapper(getToken); // Initialize dynamically
      try {
        const [hotelsData, rolesData] = await Promise.all([
          fetchWrapper.get<Hotel[]>("/hotels", {
            includeAuth: true,
          }),
          fetchWrapper.get<Role[]>("/roles", {
            includeAuth: true,
          }),
        ]);
        setHotels(hotelsData);
        setRoles(rolesData);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    fetchInitialData();
  }, [token]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    setIsLoading(true);
    e.preventDefault();
    // setMessage("");

    if (!token) {
      toast.error("Authorization is missing!")
      // setMessage("Authorization token is missing.");
      return;
    }

    const fetchWrapper = new FetchWrapper(() => token); // Initialize dynamically
    try {
      await fetchWrapper.post("/users", formData,{
        includeAuth:true
      });
      // setMessage("User created successfully!");
      toast.success("User created successfully");
      setFormData({
        username: "",
        email: "",
        password: "",
        role_id: "",
        hotel_id: "",
      });
      fetchUsers();
    } catch (error) {
      // setMessage(error.message || "Failed to create user");
      toast.error((error as Error).message || "Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* {message && (
        <p
          className={`text-${
            message.includes("successfully") ? "green" : "red"
          }-500`}
        >
          {message}
        </p>
      )} */}
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
        <label className="block font-medium">Hotel</label>
        <select
          name="hotel_id"
          value={formData.hotel_id}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2 rounded"
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
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
      >
        {isLoading ? (
          <Spinner size={20} color="text-white" className="mr-2" />
        ) : (
          "Create User"
        )}
      </button>
    </form>
  );
};

export default CreateUserForm;
