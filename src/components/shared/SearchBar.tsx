import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function SearchBar({ 
  value, 
  onChange, 
  placeholder = 'Buscar...', 
  debounceMs = 300,
  className
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, onChange, debounceMs]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className={cn("relative flex-1 max-w-md", className)}>
      <Search className={cn(
        "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
        "text-muted-foreground transition-colors duration-200",
        localValue && "text-primary"
      )} />
      <Input
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "pl-9 pr-9",
          "transition-all duration-200",
          "focus:ring-2 focus:ring-primary/20",
          "focus:border-primary"
        )}
      />
      {localValue && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className={cn(
            "absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7",
            "animate-in fade-in-0 zoom-in-75 duration-200"
          )}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
