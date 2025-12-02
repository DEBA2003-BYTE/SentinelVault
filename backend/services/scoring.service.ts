import type { IUser } from '../models/User';

// Haversine distance calculation (km)
const haversine = (lat1: number | null, lon1: number | null, lat2: number | null, lon2: number | null): number | null => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const toRad = (v: number) => v * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Weights
export const WEIGHTS = {
  failedAttempts: 50,
  gps: 15,
  typing: 12,
  timeOfDay: 8,
  velocity: 10,
  newDevice: 5
};

export function scoreFailedLogins(fails: number): number {
  if (!fails || fails <= 0) return 0;
  const ptsPer = 10;
  return Math.min(WEIGHTS.failedAttempts, fails * ptsPer);
}

export function scoreGPS(userLocations: Array<{ lat: number; lon: number }> = [], currentGps: { lat: number; lon: number } | null): number {
  if (!currentGps || currentGps.lat == null || currentGps.lon == null) return 0;
  const recent = userLocations.length ? userLocations[userLocations.length - 1] : null;
  if (!recent) return Math.round(WEIGHTS.gps * 0.8); // unknown -> moderate
  const d = haversine(recent.lat, recent.lon, currentGps.lat, currentGps.lon);
  if (d === null) return 0;
  if (d <= 50) return 0;
  if (d <= 500) return Math.round(WEIGHTS.gps * 0.33); // ~5
  if (d <= 2000) return Math.round(WEIGHTS.gps * 0.66); // ~10
  return WEIGHTS.gps; // 15
}

export function scoreTyping(baseline: { meanIKI?: number; stdIKI?: number; samples?: number } = {}, sample: { meanIKI?: number } = {}): number {
  if (!baseline || !baseline.samples || baseline.samples < 3) return Math.round(WEIGHTS.typing * 0.15);
  if (!sample || sample.meanIKI == null) return 0;
  const z = Math.abs(sample.meanIKI - (baseline.meanIKI || 0)) / (baseline.stdIKI || 1);
  if (z < 1) return 0;
  if (z < 2) return Math.round(WEIGHTS.typing * 0.45); // ~5
  if (z < 3) return Math.round(WEIGHTS.typing * 0.8);  // ~10
  return WEIGHTS.typing; // 12
}

export function scoreTimeOfDay(activityHours: { start: number; end: number; tz: string } = { start: 8, end: 20, tz: 'Asia/Kolkata' }, loginTimestamp: string | Date): number {
  if (!loginTimestamp) return 0;
  
  // Convert to IST
  const date = new Date(loginTimestamp);
  const istOffset = 5.5 * 60; // IST is UTC+5:30
  const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
  const istTime = new Date(utcTime + (istOffset * 60000));
  const hour = istTime.getHours(); // 0..23 in IST
  
  const { start, end } = activityHours;
  if (hour >= start && hour < end) return 0;
  
  // within 2 hours of edges -> mild anomaly ~60% weight
  if ((hour >= (start - 2) && hour < start) || (hour >= end && hour < end + 2)) {
    return Math.round(WEIGHTS.timeOfDay * 0.6); // ~5
  }
  return WEIGHTS.timeOfDay; // 8
}

export function scoreVelocity(lastLogin: { timestamp: Date; gps?: { lat: number; lon: number } } | null, nowTs: string | Date, currentGps: { lat: number; lon: number } | null): number {
  if (!lastLogin || !lastLogin.gps || !lastLogin.timestamp || !currentGps || !nowTs) return 0;
  const distanceKm = haversine(lastLogin.gps.lat, lastLogin.gps.lon, currentGps.lat, currentGps.lon);
  if (distanceKm === null) return 0;
  const hours = Math.max((Math.abs(new Date(nowTs).getTime() - new Date(lastLogin.timestamp).getTime()) / 3600000), 0.0001);
  const speed = distanceKm / hours;
  if (speed > 500) return WEIGHTS.velocity; // impossible
  if (speed > 200) return Math.round(WEIGHTS.velocity * 0.6); // suspicious
  return 0;
}

export function scoreNewDevice(knownDevices: Array<{ deviceIdHash: string }> = [], deviceId: string | null): number {
  if (!deviceId) return 0;
  const seen = knownDevices.find(d => d.deviceIdHash === deviceId);
  return seen ? 0 : WEIGHTS.newDevice;
}

interface RiskEvent {
  failedCount?: number;
  gps?: { lat: number; lon: number } | null;
  keystrokeSample?: { meanIKI?: number };
  timestamp: string | Date;
  deviceId?: string | null;
}

export function computeRisk(user: IUser, event: RiskEvent): { total: number; breakdown: any } {
  const breakdown: any = {};
  
  breakdown.failedAttempts = scoreFailedLogins(event.failedCount || 0); // 0..50
  breakdown.gps = scoreGPS(user.locationHistory || [], event.gps || null); // 0..15
  breakdown.typing = scoreTyping(user.keystrokeBaseline || {}, event.keystrokeSample || {}); // 0..12
  breakdown.timeOfDay = scoreTimeOfDay(user.activityHours || { start: 8, end: 20, tz: 'Asia/Kolkata' }, event.timestamp); // 0..8
  breakdown.velocity = scoreVelocity(user.lastLoginDetails || null, event.timestamp, event.gps || null); // 0..10
  breakdown.newDevice = scoreNewDevice(user.knownDevices || [], event.deviceId || null); // 0..5

  const otherTotal = breakdown.gps + breakdown.typing + breakdown.timeOfDay + breakdown.velocity + breakdown.newDevice;
  const clampedOther = Math.min(50, otherTotal);
  const total = Math.min(100, Math.round(breakdown.failedAttempts + clampedOther));

  return { total, breakdown: { ...breakdown, otherTotal: clampedOther } };
}
