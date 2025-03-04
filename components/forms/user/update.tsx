import { useEffect, useState } from "react";
import UserForm from "@/components/reusable/user-form";
import { FetchWrapper } from "@/utils";
import { useAuth } from "@/contexts";
import toast from "react-hot-toast";

interface UserRecord {
  id: number;
  username: string;
  password: string;
  email: string;
  role_id: number | string;
  hotels: number[]; // Array of hotel IDs
  approvers?: number[]; // Array of approver IDs
}

const UpdateUserForm = ({
  userId,
  fetchUsers,
}: {
  userId: number;
  fetchUsers: () => void;
}) => {
  const { token } = useAuth();
  const [initialData, setInitialData] = useState<UserRecord | null>(null);
  const fetchWrapper = new FetchWrapper(() => token);
  useEffect(() => {
    fetchWrapper
      .get(`/users/${userId}`, { includeAuth: true })
      .then((data) => setInitialData((data as unknown) as UserRecord))
      .catch(() => toast.error("Failed to load user data"));
  }, [token, userId]);

  return initialData ? (
    <UserForm
      fetchUsers={fetchUsers}
      onSubmit={(formData) =>
        fetchWrapper.put(`/users/${userId}`, formData, { includeAuth: true })
      }
      initialData={initialData}
      isUpdating
    />
  ) : null;
};

export default UpdateUserForm;
