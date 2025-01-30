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
  hotel_id: number;
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
  Id: number;
  email: string;
  hotel_id: number;
  hotel_name: string;
  role_id: string;
  role: string;
  username: string;
}

export interface AuthContextProps {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
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
  status:string;
  created_by_name:string;
  updated_by_name:string;
  approval_by:string;
}

export interface ProjectedInflow {
  id: number;
  date: string;
  [key: string]: number | string;
}