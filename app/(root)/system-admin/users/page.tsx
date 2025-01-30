"use client";

import { useAuth, useUsers } from "@/contexts";
import { getUserColumns } from "@/components/table-columns/user";
import Banner from "@/components/reusable/banner";
import { DataTable } from "@/components/ui/data-table";
import CreateUserDialog from "@/components/dialogs/user/create";

const UsersPage = () => {
  const { token, user } = useAuth();
  const { users, fetchUsers } = useUsers(); // `setUsers` for manual updates


  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Banner
        title="User Management"
        action={<CreateUserDialog fetchUsers={fetchUsers} />}
      />
      <DataTable columns={getUserColumns({fetchUsers, token:token!, userRole:user?.role})} data={users} title={"Users"} />
    </div>
  );
};

export default UsersPage;
