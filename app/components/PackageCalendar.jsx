"use client"

import * as React from "react"
import { format } from "date-fns"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/app/components/package/button"
import { Calendar } from "@/app/components/package/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/package/popover"

function startOfDay(date) {
  if (!date) return null;

  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);

  return copy;
}

export function PackageCalendar({value, onChange, minDate}) {
  const [open, setOpen] = React.useState(false);
  const normalizedMinDate = startOfDay(minDate);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild> 
        <Button type="button" variant="outline" data-empty={!value} className="mgh-date-btn">{value ? format(value, "PPP") : <span>Pick a date</span>}<ChevronDownIcon data-icon="inline-end" /></Button>
        </PopoverTrigger>
      <PopoverContent className="mgh-date-popover w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(selectedDate)=>{
            const normalizedSelectedDate = startOfDay(selectedDate);

            if (
              normalizedMinDate &&
              normalizedSelectedDate &&
              normalizedSelectedDate < normalizedMinDate
            ) {
              return;
            }

            onChange(selectedDate);
            setOpen(false);
          }}
          disabled={normalizedMinDate ? { before: normalizedMinDate } : undefined}
          defaultMonth={value ?? normalizedMinDate ?? undefined}
        />
      </PopoverContent>
    </Popover>
  )
}
