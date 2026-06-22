import { describe, it, expect } from "vitest";
import { STATUS_LABELS, DAY_LABELS, WORK_TYPE_LABELS } from "@/lib/types";

describe("STATUS_LABELS", () => {
  it("has expected keys", () => {
    expect(STATUS_LABELS).toHaveProperty("draft");
    expect(STATUS_LABELS).toHaveProperty("submitted");
    expect(STATUS_LABELS).toHaveProperty("reviewed");
  });

  it('maps draft to "Rascunho"', () => {
    expect(STATUS_LABELS.draft).toBe("Rascunho");
  });

  it('maps submitted to "Submetida"', () => {
    expect(STATUS_LABELS.submitted).toBe("Submetida");
  });
});

describe("DAY_LABELS", () => {
  it("has all 6 days", () => {
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    for (const day of days) {
      expect(DAY_LABELS).toHaveProperty(day);
    }
  });
});

describe("WORK_TYPE_LABELS", () => {
  it("has expected work types", () => {
    expect(WORK_TYPE_LABELS).toHaveProperty("new_installation");
    expect(WORK_TYPE_LABELS).toHaveProperty("installation_continuation");
    expect(WORK_TYPE_LABELS).toHaveProperty("preventive_maintenance");
    expect(WORK_TYPE_LABELS).toHaveProperty("corrective_maintenance");
  });
});
