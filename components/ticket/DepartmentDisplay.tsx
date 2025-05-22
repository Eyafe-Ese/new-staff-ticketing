"use client";

import { useDepartments } from "@/hooks/useDepartments";

interface DepartmentDisplayProps {
  departmentId: string;
  className?: string;
  showLoading?: boolean;
}

export function DepartmentDisplay({ 
  departmentId, 
  className,
  showLoading = true
}: DepartmentDisplayProps) {
  const { departments, isLoading: departmentsLoading } = useDepartments();
  const department = departments.find(d => d.id === departmentId);
  
  if (departmentsLoading && showLoading) {
    return <span className={className}>Loading...</span>;
  }
  
  return (
    <span className={className}>
      {department?.name || departmentId}
    </span>
  );
} 