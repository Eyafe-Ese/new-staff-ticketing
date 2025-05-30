"use client";

import { useComplaintCategories } from "@/hooks/useComplaintCategories";

interface CategoryDisplayProps {
  categoryId: string;
  className?: string;
  showLoading?: boolean;
}

export function CategoryDisplay({ 
  categoryId, 
  className,
  showLoading = true
}: CategoryDisplayProps) {
  const { complaintCategories, isLoading: categoriesLoading } = useComplaintCategories();
  const category = complaintCategories.find(c => c.id === categoryId);
  
  if (categoriesLoading && showLoading) {
    return <span className={className}>Loading...</span>;
  }
  
  return (
    <span className={className}>
      {category?.type ? category.type.toUpperCase() : categoryId}
    </span>
  );
} 