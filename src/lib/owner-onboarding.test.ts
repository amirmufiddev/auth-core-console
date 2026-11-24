import { describe, expect, it } from "bun:test";
import {
  needsOwnerOnboarding,
  shouldRedirectToOwnerOnboarding,
} from "./owner-onboarding";

describe("owner onboarding", () => {
  it("hanya berlaku untuk pemilik tanpa tenant_id", () => {
    expect(needsOwnerOnboarding({ role: "user", tenantId: null })).toBe(true);
    expect(needsOwnerOnboarding({ role: "super_admin", tenantId: null })).toBe(
      false,
    );
    expect(needsOwnerOnboarding({ role: null, tenantId: "ten_1" })).toBe(
      false,
    );
  });

  it("redirect bila count tenant nol", () => {
    expect(
      shouldRedirectToOwnerOnboarding(
        { role: "user", tenantId: null },
        0,
      ),
    ).toBe(true);
    expect(
      shouldRedirectToOwnerOnboarding(
        { role: "user", tenantId: null },
        1,
      ),
    ).toBe(false);
  });
});