import { describe, it, expect } from 'vitest';
import { parseTime, parseTimeToSeconds } from './parse-time';

describe('parseTimeToSeconds', () => {
  it('parses seconds-only format', () => {
    // Event 7 Men 25-29 50m Freestyle — Karthik Narayan L
    expect(parseTimeToSeconds('27.01')).toBeCloseTo(27.01);
  });

  it('parses mm:ss.ss format', () => {
    // Event 1 Men 40-44 400m Freestyle — Ashwin V
    expect(parseTimeToSeconds('6:37.39')).toBeCloseTo(397.39);
  });

  it('parses double-digit minutes', () => {
    // Event 1 Men 55-59 400m Freestyle — Rajakamteerava S B
    expect(parseTimeToSeconds('20:03.41')).toBeCloseTo(1203.41);
  });

  it('returns null for DNF', () => {
    // Event 1 Men 25-29 400m Freestyle — Prateek Giriraddi
    expect(parseTimeToSeconds('DNF')).toBeNull();
  });

  it('returns null for DQ', () => {
    // Event 2 Women 40-44 400m Freestyle — Monica Kamath
    expect(parseTimeToSeconds('DQ')).toBeNull();
  });

  it('strips an anomalous "X" prefix and still parses the time', () => {
    // Event 19 Women 25-29 50m Backstroke — Vishaka Bhat K: "X44.90"
    const result = parseTime('X44.90');
    expect(result.seconds).toBeCloseTo(44.9);
    expect(result.anomalousPrefix).toBe('X');
  });

  it('flags no anomaly for a clean time', () => {
    const result = parseTime('27.01');
    expect(result.anomalousPrefix).toBeNull();
  });
});