"use client";

import { useAuth, useUsers } from "@/contexts";
import { getUserColumns } from "@/components/table-columns/user";
import Banner from "@/components/reusable/banner";
import { DataTable } from "@/components/ui/data-table";
import CreateUserDialog from "@/components/dialogs/user/create";
import { useState } from "react";
import GlobalSearch from "@/components/reusable/globalSearch";

const UsersPage = () => {
  const { token, user } = useAuth();
  const { users, fetchUsers } = useUsers(); // `setUsers` for manual updates
  const [searchQuery, setSearchQuery] = useState("");
  
    // Filter vendors based on search query
   const filteredUsers = users.map((user) => ({
     ...user,
     hotels: Array.isArray(user.hotels)
       ? user.hotels.map((hotel) =>
           typeof hotel === "string" ? { Id: 0, name: hotel } : hotel
         ) // ✅ Ensure hotels contain `id` and `name`
       : [],
     approvers: Array.isArray(user?.approvers)
       ? user?.approvers?.map((approver) =>
           typeof approver === "string" ? { id: 0, name: approver } : approver
         )
       : [],
   }));



  return (
    <div className="bg-gray-100 min-h-screen">
      <Banner
        title="User Management"
        action={<CreateUserDialog fetchUsers={fetchUsers} />}
      />
      {/* Global Search Component */}
      <div className="mb-2 flex justify-end mt-0">
        <GlobalSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          placeholder="Search users..."
        />
      </div>
      <DataTable
        columns={getUserColumns({
          fetchUsers,
          token: token!,
          userRole: user?.role,
        })}
        data={filteredUsers}
        title={"Users"}
      />
    </div>
  );
};

export default UsersPage;
