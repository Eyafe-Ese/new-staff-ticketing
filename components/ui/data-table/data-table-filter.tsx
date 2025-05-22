'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface DataTableFilterProps {
  title: string;
  options: { label: string; value: string }[];
  onChange: (values: string[]) => void;
}

export function DataTableFilter({
  title,
  options,
  onChange,
}: DataTableFilterProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  // Reset selected values when options change significantly
  useEffect(() => {
    // Only reset if we had selected values that are no longer in the options
    if (selectedValues.length > 0) {
      const optionValues = new Set(options.map(opt => opt.value));
      const hasInvalidSelection = selectedValues.some(val => !optionValues.has(val));
      
      if (hasInvalidSelection) {
        setSelectedValues([]);
        onChange([]);
      }
    }
  }, [options, selectedValues, onChange]);

  const handleSelect = useCallback((value: string) => {
    setSelectedValues(prev => {
      const newSelectedValues = prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value];
      
      onChange(newSelectedValues);
      return newSelectedValues;
    });
  }, [onChange]);

  const clearFilters = useCallback(() => {
    setSelectedValues([]);
    onChange([]);
    setIsOpen(false);
  }, [onChange]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn(
            "h-8 border-dashed",
            selectedValues.length > 0 && "border-primary"
          )}
        >
          <Filter className="mr-2 h-3.5 w-3.5" />
          {title}
          {selectedValues.length > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-2 rounded-sm px-1 font-normal lg:hidden"
            >
              {selectedValues.length}
            </Badge>
          )}
          {selectedValues.length > 0 && (
            <div className="hidden space-x-1 lg:flex">
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge 
                variant="secondary" 
                className="rounded-sm px-1 font-normal"
              >
                {selectedValues.length}
              </Badge>
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="p-2">
          <div className="text-sm font-medium py-1.5">
            Filter by {title}
          </div>
          <Separator className="my-1" />
          <div className="space-y-2 py-2">
            {options.map((option) => (
              <div 
                key={option.value} 
                className="flex items-center space-x-2 px-1 py-1 rounded hover:bg-muted cursor-pointer"
                onClick={() => handleSelect(option.value)}
              >
                <div className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                  selectedValues.includes(option.value) 
                    ? "bg-primary text-primary-foreground" 
                    : "opacity-50"
                )}>
                  {selectedValues.includes(option.value) && (
                    <Check className="h-3 w-3" />
                  )}
                </div>
                <span className="text-sm">{option.label}</span>
              </div>
            ))}
          </div>
          {selectedValues.length > 0 && (
            <>
              <Separator className="my-1" />
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-xs"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
} 