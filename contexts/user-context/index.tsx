"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "../auth-context";
import { FetchWrapper } from "@/utils";

import { User } from "@/types";

interface UsersContextType {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>; // Added setUsers
  fetchUsers: () => Promise<void>;
  getUserById: (userId: number) => Promise<User | null>;
  updateUser: (userId: number, updatedData: Partial<User>) => Promise<void>;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

export const UsersProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);

  // Initialize FetchWrapper with token
  const fetchWrapper = new FetchWrapper(() => token);

  // Fetch all users
  const fetchUsers = async () => {
    if (!token) {
      console.error("Authorization token is missing.");
      return;
    }

    try {
      const data = await fetchWrapper.get<User[]>("/users", {
        includeAuth: true,
      });
      const sortedUsers = data.sort((a, b) => a.username.localeCompare(b.username));
      setUsers(sortedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Get user by ID
  const getUserById = async (userId: number): Promise<User | null> => {
    if (!token) {
      console.error("Authorization token is missing.");
      return null;
    }

    try {
      return await fetchWrapper.get<User>(`/users/${userId}`, {
        includeAuth: true,
      });
    } catch (error) {
      console.error(`Error fetching user with ID ${userId}:`, error);
      return null;
    }
  };

  // Update user by ID
  const updateUser = async (
    userId: number,
    updatedData: Partial<User>
  ): Promise<void> => {
    if (!token) {
      console.error("Authorization token is missing.");
      return;
    }

    try {
      await fetchWrapper.put(`/users/${userId}`, updatedData, {
        includeAuth: true,
      });
      await fetchUsers(); // Refresh user list after update
    } catch (error) {
      console.error(`Error updating user with ID ${userId}:`, error);
      throw error; // Let the caller handle the error if needed
    }
  };

  // Only fetch users when token is available
  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  return (
    <UsersContext.Provider
      value={{
        users,
        setUsers, // Added setUsers to context
        fetchUsers,
        getUserById,
        updateUser,
      }}
    >
      {children}
    </UsersContext.Provider>
  );
};

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (context === undefined) {
    throw new Error("useUsers must be used within a UsersProvider");
  }
  return context;
};
