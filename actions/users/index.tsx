import { apiClient } from "@/utils/api-client";

export interface User {
  Id: number;
  username: string;
  email: string;
  hotel: string;
  role: string;
}

export const fetchUsersAPI = async () => {
  return await apiClient.get("/users",{
    includeAuth:true,
  });
};

export const createUserAPI = async (user: Partial<User>) => {
  return await apiClient.post("/users", user, {
    includeAuth: true,
  });
};

export const updateUserAPI = async (userId: number, user: Partial<User>) => {
  return await apiClient.put(`/users/${userId}`, user, {
    includeAuth: true,
  });
};

export const deleteUserAPI = async (userId: number) => {
  return await apiClient.delete(`/users/${userId}`, {
    includeAuth: true,
  });
};
