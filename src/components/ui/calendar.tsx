"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 sm:p-4 w-full", className)}
      classNames={{
        months: "flex flex-col space-y-4",
        month: "space-y-4 w-full",
        caption: "flex justify-center pt-1 relative items-center mb-4",
        caption_label: "text-sm font-black tracking-tight uppercase",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 sm:h-8 sm:w-8 bg-transparent p-0 opacity-50 hover:opacity-100 border-white/10 transition-all active:scale-90"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex w-full",
        head_cell:
          "text-muted-foreground rounded-md flex-1 font-bold text-[0.65rem] sm:text-[0.7rem] uppercase tracking-widest text-center py-2",
        row: "flex w-full mt-1",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 flex-1",
          "[&:has([aria-selected])]:bg-accent/50 first:[&:has([aria-selected])]:rounded-l-xl last:[&:has([aria-selected])]:rounded-r-xl"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-full p-0 font-bold aria-selected:opacity-100 rounded-xl transition-all active:scale-95 text-xs sm:text-sm"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-xl shadow-primary/20",
        day_today: "bg-secondary text-secondary-foreground ring-1 ring-primary/20",
        day_outside:
          "day-outside text-muted-foreground/20 aria-selected:bg-accent/30 aria-selected:text-muted-foreground/50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
