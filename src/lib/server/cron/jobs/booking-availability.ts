import type { DailyCronJob } from "../runner";
import { refreshAllEnabledBookingAvailability } from "@/lib/server/booking/refresh-availability";

export const bookingAvailabilityJob: DailyCronJob = {
  id: "booking_availability",
  batchLimit: 500,
  async run(db, { now }) {
    const result = await refreshAllEnabledBookingAvailability(db, now);
    return { processed: result.refreshed, cursor: null, details: result };
  },
};
