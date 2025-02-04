import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Priority = 'Low' | 'Medium' | 'High';

interface PriorityOption {
  value: Priority;
  label: string;
  color: string;
}

interface PrioritySelectorProps {
  value?: Priority;
  onChange?: (value: Priority) => void;
  disabled?: boolean;
}

const PrioritySelector = React.forwardRef<HTMLDivElement, PrioritySelectorProps>(
  ({ value = 'medium', onChange, disabled }, ref) => {
    const priorities: PriorityOption[] = [
      { value: 'Low', label: 'Low', color:'bg-[#FCA5A5] text-white' },
      { value: 'Medium', label: 'Medium' , color:'bg-[#EF4444] text-white'},
      { value: 'High', label: 'High' , color:'bg-[#991B1B] text-white'}
    ];

    return (
      <div ref={ref} className="w-full">
        <div className="flex items-center gap-2 bg-secondary/20 rounded-lg">
          {priorities.map((priority) => (
            <Button 
              key={priority.value}
              onClick={() => onChange?.(priority.value)}
              className={cn(
                "flex-1 transition-all duration-200",
                value === priority.value 
                  ? ` ${priority.color}`
                  : "hover:bg-secondary"
              )}
              variant="ghost"
              type="button"
              disabled={disabled}
            >
              {priority.label}
            </Button>
          ))}
        </div>
      </div>
    );
  }
);

PrioritySelector.displayName = 'PrioritySelector';

export default PrioritySelector;