import { describe, it, expect } from "vitest";
import { calcMinutes, formatMinutes } from "@/lib/utils";
import type { WorkEntry } from "@/lib/types";

function makeEntry(
  overrides: Partial<WorkEntry> = {}
): WorkEntry {
  return {
    day: "monday",
    work_description: "",
    work_type: "",
    date: "",
    evaluation: "",
    signature: "",
    observations: "",
    start_time: "",
    end_time: "",
    ...overrides,
  };
}

describe("calcMinutes", () => {
  it("returns 0 for empty entries", () => {
    expect(calcMinutes([])).toBe(0);
  });

  it("returns 0 when no times are set", () => {
    expect(calcMinutes([makeEntry()])).toBe(0);
  });

  it("calculates single entry correctly", () => {
    const entries: WorkEntry[] = [
      makeEntry({ start_time: "08:00", end_time: "12:00" }),
    ];
    expect(calcMinutes(entries)).toBe(240);
  });

  it("calculates across hour boundaries", () => {
    const entries: WorkEntry[] = [
      makeEntry({ start_time: "08:30", end_time: "17:00" }),
    ];
    expect(calcMinutes(entries)).toBe(510);
  });

  it("sums multiple entries", () => {
    const entries: WorkEntry[] = [
      makeEntry({ day: "monday", start_time: "08:00", end_time: "12:00" }),
      makeEntry({ day: "tuesday", start_time: "09:00", end_time: "13:00" }),
      makeEntry({ day: "wednesday", start_time: "08:00", end_time: "16:30" }),
    ];
    expect(calcMinutes(entries)).toBe(240 + 240 + 510);
  });

  it("ignores entries with only start_time", () => {
    const entries: WorkEntry[] = [
      makeEntry({ start_time: "08:00" }),
      makeEntry({ start_time: "08:00", end_time: "12:00" }),
    ];
    expect(calcMinutes(entries)).toBe(240);
  });

  it("ignores entries with only end_time", () => {
    const entries: WorkEntry[] = [
      makeEntry({ end_time: "12:00" }),
      makeEntry({ start_time: "08:00", end_time: "12:00" }),
    ];
    expect(calcMinutes(entries)).toBe(240);
  });
});

describe("formatMinutes", () => {
  it('formats whole hours as "Xh"', () => {
    expect(formatMinutes(60)).toBe("1h");
    expect(formatMinutes(480)).toBe("8h");
    expect(formatMinutes(0)).toBe("0h");
  });

  it('formats with minutes as "Xh Ym"', () => {
    expect(formatMinutes(90)).toBe("1h 30m");
    expect(formatMinutes(510)).toBe("8h 30m");
    expect(formatMinutes(1)).toBe("0h 1m");
  });
});
