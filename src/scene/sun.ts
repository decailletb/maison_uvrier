/**
 * Solar position for the villa (Uvrier, Valais) from a month, day and local hour.
 * NOAA-style approximation, accurate to about half a degree, enough for lighting.
 * Orientation assumption (DECISIONS.md): plan sheet "up" is north, so scene -Z is
 * north, +X is east.
 */
export const SITE = { latitude: 46.24, longitude: 7.41 } as const;

/** Local civil hour to UTC: CET in winter, CEST (UTC+2) from late March to late October. */
function utcOffsetHours(month: number): number {
  return month >= 4 && month <= 10 ? 2 : 1;
}

export interface SunPosition {
  /** Degrees above the horizon (negative at night). */
  elevation: number;
  /** Degrees clockwise from north. */
  azimuth: number;
}

function dayOfYear(month: number, day: number): number {
  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let n = day;
  for (let m = 0; m < month - 1; m++) n += days[m];
  return n;
}

export function sunPosition(month: number, day: number, localHour: number, site = SITE): SunPosition {
  const rad = Math.PI / 180;
  const n = dayOfYear(month, day);
  const utcHour = localHour - utcOffsetHours(month);
  const gamma = ((2 * Math.PI) / 365) * (n - 1 + (utcHour - 12) / 24);
  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);
  const timeOffset = eqTime + 4 * site.longitude;
  const trueSolarMinutes = utcHour * 60 + timeOffset;
  const hourAngle = (trueSolarMinutes / 4 - 180) * rad;
  const lat = site.latitude * rad;
  const cosZenith = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(hourAngle);
  const zenith = Math.acos(Math.max(-1, Math.min(1, cosZenith)));
  const elevation = 90 - zenith / rad;
  let azimuth =
    Math.acos(
      Math.max(-1, Math.min(1, (Math.sin(lat) * Math.cos(zenith) - Math.sin(decl)) / (Math.cos(lat) * Math.sin(zenith)))),
    ) / rad;
  if (hourAngle > 0) azimuth = 360 - azimuth;
  azimuth = (180 - azimuth + 360) % 360;
  return { elevation, azimuth };
}

/** Unit direction from the scene origin toward the sun. */
export function sunDirection(sun: SunPosition): [number, number, number] {
  const rad = Math.PI / 180;
  const el = sun.elevation * rad;
  const az = sun.azimuth * rad;
  return [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)];
}
