import { getTicket } from "./store";
import { isSupportStaffUid } from "./roles";

export async function authorizeSupportTicketMedia(ticketId: string, requesterUid: string) {
  const ticket = await getTicket(ticketId);
  if (!ticket) return false;
  if (ticket.openedBy.uid === requesterUid) return true;
  return isSupportStaffUid(requesterUid);
}
