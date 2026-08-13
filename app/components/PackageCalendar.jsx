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

export function PackageCalendar({value, onChange}) {
  const [open, setOpen] = React.useState(false);

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
            onChange(selectedDate);
            setOpen(false);
          }}
          defaultMonth={value}
        />
      </PopoverContent>
    </Popover>
  )
}
