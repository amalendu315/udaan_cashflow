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
    const filteredUsers = users.filter((user) =>
      Object.values(user).some(
        (value) =>
          typeof value === "string" &&
          value.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );


  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Banner
        title="User Management"
        action={<CreateUserDialog fetchUsers={fetchUsers} />}
      />
      {/* Global Search Component */}
      <div className="mb-4 flex justify-end">
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
