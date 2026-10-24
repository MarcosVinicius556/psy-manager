export type GoogleCalendarEventTitleMode = "generic" | "first_name";

export type GoogleCalendarIntegrationSettings = {
  enabled: boolean;
  googleEmail: string | null;
  calendarId: string | null;
  calendarSummary: string | null;
  syncToGoogle: boolean;
  syncFromGoogle: boolean;
  blockGoogleBusy: boolean;
  showGoogleEventTitles: boolean;
  eventTitleMode: GoogleCalendarEventTitleMode;
  connectedAt: string | null;
  kind?: "user" | "location";
  locationId?: string | null;
};

export type GoogleCalendarBusyBlock = {
  date: string;
  startTime: string;
  endTime: string;
};

export type GoogleCalendarPrivateRecord = {
  kind?: "user" | "location";
  locationId?: string | null;
  ownerUid?: string | null;
  refreshTokenEncrypted: string;
  accessTokenEncrypted?: string;
  accessTokenExpiresAt?: number;
  googleEmail: string;
  calendarId: string | null;
  calendarSummary: string | null;
  syncToGoogle: boolean;
  syncFromGoogle: boolean;
  blockGoogleBusy: boolean;
  showGoogleEventTitles: boolean;
  eventTitleMode: GoogleCalendarEventTitleMode;
  connectedAt: string;
  oauthStateNonce?: string;
};
