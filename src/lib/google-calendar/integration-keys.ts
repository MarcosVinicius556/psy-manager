export function userIntegrationKey(uid: string) {
  return uid;
}

export function locationIntegrationKey(locationId: string) {
  return `loc_${locationId}`;
}

export function isLocationIntegrationKey(key: string) {
  return key.startsWith("loc_");
}

export function locationIdFromIntegrationKey(key: string) {
  return isLocationIntegrationKey(key) ? key.slice(4) : null;
}
