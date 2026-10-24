"use client";

import CalendarPanel from "@/components/admin/CalendarPanel";

type MonthCalendarProps = {
  month: string;
  selected: string;
  marks: Record<string, number>;
  onMonth: (month: string) => void;
  onSelect: (date: string) => void;
};

export default function MonthCalendar({ month, selected, marks, onMonth, onSelect }: MonthCalendarProps) {
  return <CalendarPanel month={month} onMonth={onMonth} selected={selected} marks={marks} onSelect={onSelect} />;
}
