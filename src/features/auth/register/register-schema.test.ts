import { describe, expect, it } from "bun:test";
import { buildRegisterSchema } from "./schema";

describe("buildRegisterSchema", () => {
  it("menolak password di bawah minPasswordLength", () => {
    const schema = buildRegisterSchema({
      minPasswordLength: 10,
      maxPasswordLength: 64,
    });
    const result = schema.safeParse({
      name: "Amir",
      email: "amir@example.com",
      password: "short123",
    });
    expect(result.success).toBe(false);
  });

  it("menerima password sesuai batas", () => {
    const schema = buildRegisterSchema({
      minPasswordLength: 10,
      maxPasswordLength: 64,
    });
    const result = schema.safeParse({
      name: "Amir",
      email: "amir@example.com",
      password: "validpass12",
    });
    expect(result.success).toBe(true);
  });
});