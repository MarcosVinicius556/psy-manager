import type { CareLocation, ClinicMember, LocationInvite } from "./types";

export function memberWorkplaces(locations: CareLocation[], member?: ClinicMember | null, uid?: string | null) {
  return locations.filter(
    (location) =>
      (uid && (location.createdByUid === uid || location.memberUids.includes(uid))) ||
      Boolean(member && location.memberIds.includes(member.id))
  );
}

export function locationPeople(location: CareLocation, members: ClinicMember[], invites: LocationInvite[]) {
  const names = new Set<string>();
  const owner = members.find((member) => member.uid === location.createdByUid);
  if (owner) names.add(owner.nome);
  const inviter = invites.find((invite) => invite.locationId === location.id && invite.ownerUid === location.createdByUid);
  if (inviter?.inviterNome) names.add(inviter.inviterNome);
  for (const invite of invites) {
    if (invite.locationId === location.id && invite.status === "aceito" && invite.inviteeNome) names.add(invite.inviteeNome);
  }
  return [...names];
}

export function userBelongsToLocation(location: CareLocation, member?: ClinicMember | null, uid?: string | null) {
  if (uid && (location.createdByUid === uid || location.memberUids.includes(uid))) return true;
  return Boolean(member && location.memberIds.includes(member.id));
}

export function sharePersonName(id: string, members: ClinicMember[], invites: LocationInvite[]) {
  const member = members.find((item) => item.id === id || item.uid === id);
  if (member?.nome) return member.nome;
  const invited = invites.find((invite) => invite.inviteeUid === id && invite.inviteeNome);
  if (invited?.inviteeNome) return invited.inviteeNome;
  const host = invites.find((invite) => invite.ownerUid === id && invite.inviterNome);
  if (host?.inviterNome) return host.inviterNome;
  return "Profissional";
}

export function locationSharePeople(location: CareLocation, members: ClinicMember[], invites: LocationInvite[]) {
  const ids = new Set<string>();
  for (const uid of location.memberUids) if (uid) ids.add(uid);
  if (location.createdByUid) ids.add(location.createdByUid);
  for (const memberId of location.memberIds) {
    const member = members.find((item) => item.id === memberId);
    if (member?.uid) ids.add(member.uid);
    else if (member) ids.add(member.id);
  }
  for (const invite of invites) {
    if (invite.locationId !== location.id || invite.status !== "aceito") continue;
    if (invite.inviteeUid) ids.add(invite.inviteeUid);
    if (invite.ownerUid) ids.add(invite.ownerUid);
  }
  return [...ids].map((id) => ({ id, nome: sharePersonName(id, members, invites) }));
}

export function shareKeyForLocation(memberId: string, people: { id: string }[], members: ClinicMember[]) {
  if (people.some((person) => person.id === memberId)) return memberId;
  const member = members.find((item) => item.id === memberId);
  if (member?.uid && people.some((person) => person.id === member.uid)) return member.uid;
  return "";
}
