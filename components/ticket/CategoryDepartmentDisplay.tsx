"use client";

import { useComplaintCategories } from "@/hooks/useComplaintCategories";
import { useDepartments } from "@/hooks/useDepartments";

interface CategoryDepartmentDisplayProps {
  categoryId: string;
  departmentId: string;
  labelClassName?: string;
  valueClassName?: string;
}

export function CategoryDepartmentDisplay({ 
  categoryId, 
  departmentId, 
  labelClassName = "text-xs text-muted-foreground",
  valueClassName = "font-medium" 
}: CategoryDepartmentDisplayProps) {
  const { complaintCategories, isLoading: categoriesLoading } = useComplaintCategories();
  const { departments, isLoading: departmentsLoading } = useDepartments();

  const category = complaintCategories.find(c => c.id === categoryId);
  const department = departments.find(d => d.id === departmentId);

  return (
    <span className="flex items-center gap-1">
      <span className={labelClassName}>Category:</span> 
      <span className={valueClassName}>
        {categoriesLoading ? "Loading..." : category?.name || categoryId}
      </span>
      <span className="mx-2">•</span>
      <span className={labelClassName}>Dept:</span> 
      <span className={valueClassName}>
        {departmentsLoading ? "Loading..." : department?.name || departmentId}
      </span>
    </span>
  );
} 