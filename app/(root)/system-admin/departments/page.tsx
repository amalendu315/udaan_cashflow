"use client";

import { DataTable } from "@/components/ui/data-table";
import Banner from "@/components/reusable/banner";
import CreateDepartmentDialog from "@/components/dialogs/departments/create";
import { useDepartments } from "@/contexts/department-context";
import { getDepartmentColumns } from "@/components/table-columns/department";
import { useAuth } from "@/contexts";

const DepartmentsPage = () => {
  const {token, user} = useAuth();
  const { departments, fetchDepartments } = useDepartments();


  return (
    <div className="bg-gray-100 min-h-screen">
      <Banner
        title="Department Management"
        action={<CreateDepartmentDialog />}
      />
      <DataTable columns={getDepartmentColumns({fetchDepartments, token:token!, userRole:user?.role})} data={departments} title="Departments" />
    </div>
  );
};

export default DepartmentsPage;
