"use client";

import { DataTable } from "@/components/ui/data-table";
import Banner from "@/components/reusable/banner";
import CreateRoleDialog from "@/components/dialogs/roles/create";
import { useRoles } from "@/contexts/role-context";
import { getRoleColumns } from "@/components/table-columns/role";
import { useAuth } from "@/contexts";

const RolesPage = () => {
  const { token, user } = useAuth();
  const { roles, fetchRoles } = useRoles();

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Banner
        title="Role Management"
        action={<CreateRoleDialog fetchRoles={fetchRoles} />}
      />
      <DataTable columns={getRoleColumns({fetchRoles, token:token!, userRole:user?.role})} data={roles} title="Roles" />
    </div>
  );
};

export default RolesPage;

