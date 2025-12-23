import React, { forwardRef, useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface DateTimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const DateTimePicker = forwardRef<HTMLDivElement, DateTimePickerProps>(
  ({ value, onChange, placeholder = "Select date and time", className, disabled }, ref) => {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value ? new Date(value) : undefined
  );
  const [selectedHour, setSelectedHour] = useState<string>(
    value ? new Date(value).getHours().toString().padStart(2, '0') : '12'
  );
  const [selectedMinute, setSelectedMinute] = useState<string>(
    value ? new Date(value).getMinutes().toString().padStart(2, '0') : '00'
  );

  // Update internal state when value prop changes
  React.useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDate(date);
      setSelectedHour(date.getHours().toString().padStart(2, '0'));
      setSelectedMinute(date.getMinutes().toString().padStart(2, '0'));
    }
  }, [value]);

  const updateDateTime = (date: Date, hour: string, minute: string) => {
    const newDate = new Date(date);
    newDate.setHours(parseInt(hour));
    newDate.setMinutes(parseInt(minute));
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    
    // Format as YYYY-MM-DDTHH:mm without timezone conversion
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const day = String(newDate.getDate()).padStart(2, '0');
    const hours = String(newDate.getHours()).padStart(2, '0');
    const minutes = String(newDate.getMinutes()).padStart(2, '0');
    
    onChange(`${year}-${month}-${day}T${hours}:${minutes}`);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      updateDateTime(date, selectedHour, selectedMinute);
    }
  };

  const handleTimeChange = (type: 'hour' | 'minute', val: string) => {
    if (!selectedDate) return;
    
    if (type === 'hour') {
      setSelectedHour(val);
      updateDateTime(selectedDate, val, selectedMinute);
    } else {
      setSelectedMinute(val);
      updateDateTime(selectedDate, selectedHour, val);
    }
  };

    // Generate hour options (00-23)
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    // Generate minute options (00, 15, 30, 45)
    const minutes = ['00', '15', '30', '45'];

    return (
      <div ref={ref} className="relative">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground",
                className
              )}
              disabled={disabled}
              type="button"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? (
                <span>{format(new Date(value), 'PPP p')}</span>
              ) : (
                <span>{placeholder}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
            <div className="p-3 space-y-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
                className="pointer-events-auto"
                classNames={{
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground font-semibold",
                }}
              />
              
              <div className="border-t pt-3 space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Time
                </Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedHour}
                    onValueChange={(val) => handleTimeChange('hour', val)}
                    disabled={!selectedDate}
                  >
                    <SelectTrigger className="w-[80px]">
                      <SelectValue placeholder="HH" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] bg-popover">
                      {hours.map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-lg font-medium">:</span>
                  <Select
                    value={selectedMinute}
                    onValueChange={(val) => handleTimeChange('minute', val)}
                    disabled={!selectedDate}
                  >
                    <SelectTrigger className="w-[80px]">
                      <SelectValue placeholder="MM" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {minutes.map((minute) => (
                        <SelectItem key={minute} value={minute}>
                          {minute}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button
                className="w-full"
                onClick={() => setOpen(false)}
                disabled={!selectedDate}
              >
                Confirm
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);

DateTimePicker.displayName = 'DateTimePicker';

export { DateTimePicker };