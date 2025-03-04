import UserForm from "@/components/reusable/user-form";
import { FetchWrapper } from "@/utils";
import { useAuth } from "@/contexts";

export interface CreateUserFormData {
  username: string;
  password: string;
  email: string;
  role_id: number | string;
  hotels: number[]; // Array of hotel IDs
  approvers?: number[]; // Array of approver IDs
}


const CreateUserForm = ({ fetchUsers }: { fetchUsers: () => void }) => {
  const { token } = useAuth();

  const handleCreateUser = async (formData: CreateUserFormData) => {
    if (!token) throw new Error("Authorization is missing!");
    const fetchWrapper = new FetchWrapper(() => token);
    await fetchWrapper.post("/users", formData, { includeAuth: true });
  };

  return <UserForm fetchUsers={fetchUsers} onSubmit={handleCreateUser} />;
};

export default CreateUserForm;
