export interface ParsedTime {
  seconds: number | null;
  anomalousPrefix: string | null; // e.g. "X" — present but stripped, worth logging
}

const NON_TIME_STATUSES = new Set(['DNF', 'DQ', 'DNS', 'SCR']);

// Matches "37.21" or "6:37.39" or "20:03.41" — mm:ss.ss or ss.ss
const TIME_PATTERN = /(\d+:)?\d+\.\d+$/;

export function parseTime(rawTime: string): ParsedTime {
  const trimmed = rawTime.trim();

  if (NON_TIME_STATUSES.has(trimmed.toUpperCase())) {
    return { seconds: null, anomalousPrefix: null };
  }

  const match = trimmed.match(TIME_PATTERN);
  if (!match) {
    // Genuinely unparseable — not a known status, not a time shape
    return { seconds: null, anomalousPrefix: null };
  }

  const timePart = match[0];
  const prefix = trimmed.slice(0, trimmed.length - timePart.length);
  const anomalousPrefix = prefix.length > 0 ? prefix : null;

  let seconds: number;
  if (timePart.includes(':')) {
    const [minutesStr, secondsStr] = timePart.split(':');
    seconds = parseInt(minutesStr, 10) * 60 + parseFloat(secondsStr);
  } else {
    seconds = parseFloat(timePart);
  }

  return { seconds, anomalousPrefix };
}

export function parseTimeToSeconds(rawTime: string): number | null {
  return parseTime(rawTime).seconds;
}