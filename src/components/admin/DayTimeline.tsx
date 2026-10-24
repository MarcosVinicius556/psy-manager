"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Appointment } from "@/lib/admin/types";
import { isBookableStart, rangesOverlap, timelineSlots, toMinutes, SLOT_STEP, fromMinutes } from "@/lib/admin/schedule";

const PAGE_SIZE = 7;

export default function DayTimeline({
  date,
  appointments,
  patientName,
  memberName,
  locationName,
  showLocation = false,
  viewLocationId = null,
  professionalId = null,
  onPick,
  onPickOnline,
  ranges,
}: {
  date: string;
  appointments: Appointment[];
  patientName: (id: string) => string;
  memberName: (id: string | null) => string;
  locationName?: (id: string | null) => string;
  showLocation?: boolean;
  viewLocationId?: string | null;
  professionalId?: string | null;
  onPick: (startTime: string) => void;
  onPickOnline?: (startTime: string) => void;
  ranges?: { startTime: string; endTime: string }[];
}) {
  const [now, setNow] = useState(() => new Date());
  const openedDate = useRef("");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const slots = useMemo(() => {
    return timelineSlots(ranges).filter((slot) => {
      if (isBookableStart(date, slot, now)) return true;
      const slotEnd = fromMinutes(toMinutes(slot) + SLOT_STEP);
      return appointments.some((item) => rangesOverlap(slot, slotEnd, item.startTime, item.endTime));
    });
  }, [appointments, date, now, ranges]);
  const pageCount = Math.ceil(slots.length / PAGE_SIZE);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (openedDate.current === date) return;
    openedDate.current = date;
    const openIndex = slots.findIndex((slot) => isBookableStart(date, slot, now));
    if (openIndex >= 0) {
      setPage(Math.floor(openIndex / PAGE_SIZE));
      return;
    }
    setPage(0);
  }, [date, now, slots]);

  const safePage = Math.min(page, Math.max(0, pageCount - 1));
  const visible = slots.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const rangeLabel = visible.length ? `${visible[0]} – ${visible[visible.length - 1]}` : "";

  if (slots.length === 0) {
    const hadHours = timelineSlots(ranges).length > 0;
    return (
      <p className="rounded-md bg-paper px-4 py-3 text-sm text-muted">
        {hadHours ? "Os horários deste dia já passaram." : "Não há horário de atendimento neste dia."}
      </p>
    );
  }

  return (
    <div>
      <div className="grid">
      {visible.map((slot) => {
        const slotEnd = fromMinutes(toMinutes(slot) + SLOT_STEP);
        const covering = appointments.filter((item) =>
          rangesOverlap(slot, slotEnd, item.startTime, item.endTime)
        );
        const startsHere = covering.filter((item) => item.startTime >= slot && item.startTime < slotEnd);
        const professionalBusy = covering.some((item) => professionalId && item.professionalId === professionalId);
        const locationBusy = covering.some((item) => viewLocationId && item.locationId === viewLocationId);
        const onlineOnly = !professionalBusy && locationBusy && Boolean(onPickOnline) && isBookableStart(date, slot, now);

        return (
          <div key={slot} className="grid grid-cols-[3.5rem_1fr] gap-2 border-b border-[#e7eee8] py-1.5 sm:grid-cols-[4rem_1fr] sm:gap-3">
            <span className="pt-3 text-sm font-medium text-muted">{slot}</span>
            {covering.length === 0 ? (
              <button
                type="button"
                onClick={() => onPick(slot)}
                className="min-h-11 rounded-md px-3 py-2.5 text-left text-base text-muted hover:bg-sky-soft sm:text-sm"
              >
                Livre — agendar
              </button>
            ) : (
              <div className="grid gap-1">
                {startsHere.map((item) => {
                  const place = item.locationId && locationName ? locationName(item.locationId) : "";
                  const elsewhere = Boolean(viewLocationId && item.locationId !== viewLocationId);
                  return (
                    <Link
                      key={item.id}
                      href={`/admin/atendimentos/${item.id}`}
                      className="block min-h-11 rounded-md bg-sky-soft px-3 py-2.5 text-sm"
                    >
                      <strong>
                        {item.startTime}–{item.endTime}
                      </strong>{" "}
                      {patientName(item.patientId)}
                      <span className="mt-0.5 block text-muted">
                        {memberName(item.professionalId)}
                        {item.modality === "online" ? " · Online" : ""}
                        {showLocation && place ? ` · ${place}` : ""}
                        {elsewhere && item.modality !== "online" && !place ? " · Outro local" : ""}
                      </span>
                    </Link>
                  );
                })}
                {startsHere.length === 0 && (
                  <p className="rounded-md bg-paper px-3 py-2 text-sm text-muted">Ocupado até {covering[0].endTime}</p>
                )}
                {onlineOnly && (
                  <button
                    type="button"
                    onClick={() => onPickOnline?.(slot)}
                    className="min-h-11 rounded-md px-3 py-2.5 text-left text-sm text-teal hover:bg-sky-soft"
                  >
                    Disponível para online
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
      </div>
      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <button type="button" className="btn-text" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
            Anteriores
          </button>
          <span className="text-sm text-muted">{rangeLabel}</span>
          <button
            type="button"
            className="btn-text"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage(safePage + 1)}
          >
            Próximos
          </button>
        </div>
      )}
    </div>
  );
}
