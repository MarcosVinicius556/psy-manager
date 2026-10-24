import { fetchFreeBusy, getValidAccessToken, listCalendarEvents } from "./google-api";
import { labelGoogleBusyBlock } from "./sync-routing";
import type { GoogleCalendarPrivateRecord } from "./types";
import { readIntegration } from "./store";
import { userIntegrationKey } from "./integration-keys";

export type BusyBlockOut = {
  date: string;
  startTime: string;
  endTime: string;
  label: string;
  masked: boolean;
  subjectUid: string;
};

function parseBlockTimes(start: string, end: string) {
  return {
    date: start.slice(0, 10),
    startTime: start.includes("T") ? start.split("T")[1]?.slice(0, 5) || "00:00" : "00:00",
    endTime: end.includes("T") ? end.split("T")[1]?.slice(0, 5) || "23:59" : "23:59",
  };
}

async function blocksForIntegration(
  integrationKey: string,
  integration: GoogleCalendarPrivateRecord,
  from: string,
  to: string,
  subjectUid: string,
  viewerUid: string
): Promise<BusyBlockOut[]> {
  if (!integration.calendarId || !integration.syncFromGoogle) return [];
  const accessToken = await getValidAccessToken(integrationKey);
  const timeMin = `${from}T00:00:00-03:00`;
  const timeMax = `${to}T23:59:59-03:00`;
  const isSelf = viewerUid === subjectUid;
  if (isSelf && integration.showGoogleEventTitles) {
    const events = await listCalendarEvents(accessToken, integration.calendarId, timeMin, timeMax);
    return events.map((event) => {
      const times = parseBlockTimes(event.start, event.end);
      const labeled = labelGoogleBusyBlock({
        viewerUid,
        subjectUid,
        showTitlesForSubject: true,
        rawTitle: event.summary,
      });
      return { ...times, label: labeled.label, masked: labeled.masked, subjectUid };
    });
  }
  const busy = await fetchFreeBusy(accessToken, integration.calendarId, timeMin, timeMax);
  return busy.map((item) => {
    const times = parseBlockTimes(item.start, item.end);
    const labeled = labelGoogleBusyBlock({
      viewerUid,
      subjectUid,
      showTitlesForSubject: false,
    });
    return { ...times, label: labeled.label, masked: labeled.masked, subjectUid };
  });
}

export async function busyBlocksForUid(
  subjectUid: string,
  viewerUid: string,
  from: string,
  to: string
): Promise<BusyBlockOut[]> {
  const integration = await readIntegration(userIntegrationKey(subjectUid));
  if (!integration?.refreshTokenEncrypted) return [];
  return blocksForIntegration(userIntegrationKey(subjectUid), integration, from, to, subjectUid, viewerUid);
}

export async function googleBusyBlocksForScheduling(
  professionalUid: string,
  from: string,
  to: string
): Promise<{ date: string; startTime: string; endTime: string }[]> {
  const integration = await readIntegration(userIntegrationKey(professionalUid));
  if (!integration?.refreshTokenEncrypted || !integration.blockGoogleBusy || !integration.calendarId) return [];
  const accessToken = await getValidAccessToken(userIntegrationKey(professionalUid));
  const busy = await fetchFreeBusy(
    accessToken,
    integration.calendarId,
    `${from}T00:00:00-03:00`,
    `${to}T23:59:59-03:00`
  );
  return busy.map((item) => parseBlockTimes(item.start, item.end));
}
