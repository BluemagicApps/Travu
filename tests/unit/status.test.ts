import { describe, it, expect } from "vitest";
import { statusFor } from "@/lib/booking/status";

const departIso = "2026-08-15T10:00:00";
const arriveIso = "2026-08-15T17:00:00";

describe("statusFor", () => {
  it("is confirmed more than 24h before depart", () => {
    expect(statusFor(departIso, arriveIso, new Date("2026-08-13T00:00:00Z")).phase).toBe(
      "confirmed",
    );
  });

  it("is check_in_open within 24h of depart", () => {
    expect(statusFor(departIso, arriveIso, new Date("2026-08-15T00:00:00Z")).phase).toBe(
      "check_in_open",
    );
  });

  it("is boarding within 45 minutes of depart", () => {
    expect(statusFor(departIso, arriveIso, new Date("2026-08-15T09:30:00Z")).phase).toBe(
      "boarding",
    );
  });

  it("is in_flight between depart and arrive", () => {
    expect(statusFor(departIso, arriveIso, new Date("2026-08-15T13:00:00Z")).phase).toBe(
      "in_flight",
    );
  });

  it("is arrived shortly after arrive", () => {
    expect(statusFor(departIso, arriveIso, new Date("2026-08-15T18:00:00Z")).phase).toBe(
      "arrived",
    );
  });

  it("is completed more than 2h after arrive", () => {
    expect(statusFor(departIso, arriveIso, new Date("2026-08-15T20:00:00Z")).phase).toBe(
      "completed",
    );
  });
});
