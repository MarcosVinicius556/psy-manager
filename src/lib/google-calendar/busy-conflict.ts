import { rangesOverlap } from "../admin/schedule";

export type TimeBlock = { date: string; startTime: string; endTime: string };

export function googleBusyConflicts(blocks: TimeBlock[], candidate: TimeBlock) {
  return blocks
    .filter((item) => item.date === candidate.date)
    .some((block) => rangesOverlap(candidate.startTime, candidate.endTime, block.startTime, block.endTime));
}
