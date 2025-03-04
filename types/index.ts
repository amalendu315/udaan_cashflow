export type CreateRoleRequest = {
    role_name: string;
};

export type CreateLedgerRequest = {
  name: string;
};

export type CreateHotelRequest = {
    name: string;
    location: string;
    description?: string;
};

export type CreateUserRequest = {
  username: string;
  password: string;
  email: string;
  role_id: number;
  hotels: number[]; // ✅ Expecting an array of hotel IDs
  approvers: number[]; // ✅ Expecting an array of user IDs
};

export type CreateVendorRequest = {
  name: string;
  email: string;
  phone: string;
  location:string;
  description:string;
}

export type UserPayload = {
  id: number;
  username: string;
  role: string;
  hotel_id?: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string; // or Date if you want to parse it
  updated_at: string; // or Date
  role: string;
  role_id: string;
  hotels: UserHotels[]; // Array of hotel names
  approvers: UserApprovers[];
}

export interface UserHotels {
  Id: number;
  name: string;
}

export interface UserApprovers {
  id: number;
  name: string;
}

interface lser {
  id: number;
  username: string;
  email: string;
  created_at: string; // or Date if you want to parse it
  updated_at: string; // or Date
  role: string;
  role_id: string;
  hotel_ids: number[]; // Array of hotel ids
  hotel_names: string[]; // Array of hotel ids
}

export interface AuthContextProps {
  token: string | null;
  user: lser | null;
  login: (token: string, user: lser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export interface CreatePaymentGroupRequest {
  name: string;
}

export interface PaymentGroup {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentRequest {
  id:number
  hotel_name:string;
  date:string;
  vendor_name:string;
  department_name:string;
  ledger:string;
  amount:number;
  due_date:string;
  payment_group_name:string;
  remarks:string;
  attachment_1:string;
  attachment_2:string;
  attachment_3:string;
  attachment_4:string;
  status:string;
  payment_method:string;
  created_by_name:string;
  updated_by_name:string;
  approval_by:string;
}

export interface ProjectedInflow {
  id: number;
  date: string;
  [key: string]: number | string;
}

export interface ApprovePaymentRequestInterface {
  message: string;
  status: number;
}