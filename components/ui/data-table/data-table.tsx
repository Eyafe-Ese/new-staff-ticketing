"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { DataTableFilter } from "./data-table-filter";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";

interface DataTableProps<T> {
  data: T[];
  columns: {
    key: string;
    title: string;
    render?: (item: T) => React.ReactNode;
  }[];
  searchable?: boolean;
  searchKeys?: string[];
  filters?: {
    key: string;
    title: string;
    options: { label: string; value: string }[];
  }[];
  pageSize?: number;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

// Define a type for Record entries
type RecordEntry = string | number | boolean | null | undefined;

export function DataTable<T extends Record<string, RecordEntry | object>>({
  data,
  columns,
  searchable = false,
  searchKeys = [],
  filters = [],
  pageSize = 10,
  onRowClick,
  isLoading = false,
  pagination,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(pagination?.page || 1);
  const [currentPageSize, setCurrentPageSize] = useState(
    pagination?.limit || pageSize
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {}
  );
  const [filteredData, setFilteredData] = useState<T[]>(data);

  // State to trigger page reset when page size changes
  const [pageSizeChanged, setPageSizeChanged] = useState(false);

  // Effect to reset page when page size changes
  useEffect(() => {
    if (pageSizeChanged) {
      setCurrentPage(1);
      setPageSizeChanged(false);

      if (onPageChange) {
        onPageChange(1);
      }
    }
  }, [pageSizeChanged, onPageChange]);

  // Update current page when pagination changes
  useEffect(() => {
    if (pagination?.page && pagination.page !== currentPage) {
      setCurrentPage(pagination.page);
    }
  }, [pagination?.page, currentPage]);

  // Update page size when pagination limit changes
  useEffect(() => {
    if (pagination?.limit && pagination.limit !== currentPageSize) {
      setCurrentPageSize(pagination.limit);
    }
  }, [pagination?.limit, currentPageSize]);

  // Update filtered data when data, search or filters change
  useEffect(() => {
    // If server-side pagination is used, skip client-side filtering
    if (pagination) {
      setFilteredData(data);
      return;
    }

    let result = [...data];

    // Apply search
    if (searchable && searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();

      // If searchKeys are provided, only search in those keys
      if (searchKeys.length > 0) {
        result = result.filter((item) =>
          searchKeys.some((key) => {
            // Handle nested keys like 'category.name'
            const keys = key.split(".");
            let value: unknown = item;
            for (const k of keys) {
              if (value === null || value === undefined) return false;
              value = (value as Record<string, unknown>)[k];
            }
            return String(value).toLowerCase().includes(query);
          })
        );
      } else {
        // Otherwise search in all string/number fields
        result = result.filter((item) =>
          Object.entries(item).some((entry) => {
            const value = entry[1];
            if (typeof value === "string" || typeof value === "number") {
              return String(value).toLowerCase().includes(query);
            }
            return false;
          })
        );
      }
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([key, values]) => {
      if (values.length > 0) {
        result = result.filter((item) => {
          // Handle nested keys like 'category.name'
          const keys = key.split(".");
          let value: unknown = item;
          for (const k of keys) {
            if (value === null || value === undefined) return false;
            value = (value as Record<string, unknown>)[k];
          }
          return values.includes(String(value));
        });
      }
    });

    setFilteredData(result);
    // Reset to first page when filters change
    if (!pagination) {
      setCurrentPage(1);
    }
  }, [data, searchQuery, activeFilters, searchable, searchKeys, pagination]);

  // Calculate pagination
  const totalItems = pagination ? pagination.total : filteredData.length;
  const totalPages = pagination
    ? pagination.totalPages
    : Math.max(1, Math.ceil(totalItems / currentPageSize));

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      if (onPageChange) {
        onPageChange(page);
      }
    },
    [onPageChange]
  );

  // Handle page size change
  const handlePageSizeChange = useCallback(
    (size: string) => {
      const newSize = parseInt(size, 10);
      setCurrentPageSize(newSize);
      setPageSizeChanged(true);

      if (onPageSizeChange) {
        onPageSizeChange(newSize);
      }
    },
    [onPageSizeChange]
  );

  // Get current data to display
  const getCurrentData = useCallback(() => {
    if (pagination) {
      // Server-side pagination - use data as is
      return filteredData;
    } else {
      // Client-side pagination - slice the data
      const start = (currentPage - 1) * currentPageSize;
      const end = Math.min(start + currentPageSize, filteredData.length);
      return filteredData.slice(start, end);
    }
  }, [filteredData, currentPage, currentPageSize, pagination]);

  const currentData = getCurrentData();

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, values: string[]) => {
    setActiveFilters((prev) => ({
      ...prev,
      [key]: values,
    }));
  }, []);

  return (
    <div className="data-table-wrapper space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        {searchable && (
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <DataTableFilter
              key={filter.key}
              title={filter.title}
              options={filter.options}
              onChange={(values) => handleFilterChange(filter.key, values)}
            />
          ))}
        </div>
      </div>

      <div className="data-table-content rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>{column.title}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Loading data...
                </TableCell>
              </TableRow>
            ) : currentData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((item, index) => (
                <TableRow
                  key={index}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={onRowClick ? "cursor-pointer hover:bg-muted" : ""}
                >
                  {columns.map((column) => (
                    <TableCell key={`${index}-${column.key}`}>
                      {column.render
                        ? column.render(item)
                        : item[column.key] === null ||
                          item[column.key] === undefined
                        ? ""
                        : typeof item[column.key] === "object"
                        ? JSON.stringify(item[column.key])
                        : String(item[column.key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 || pageSizeOptions.length > 0 ? (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <div>Rows per page:</div>
            <Select
              value={String(currentPageSize)}
              onValueChange={handlePageSizeChange}
              defaultValue={String(currentPageSize)}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div>
              {totalItems > 0 && (
                <>
                  {(currentPage - 1) * currentPageSize + 1}-
                  {Math.min(currentPage * currentPageSize, totalItems)} of{" "}
                  {totalItems} items
                </>
              )}
            </div>
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
