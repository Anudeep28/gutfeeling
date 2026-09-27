import { describe, expect, it, beforeAll } from "vitest";
import { createSession, verifySession } from "./session";

describe("session", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret-must-be-at-least-thirty-two-characters-long";
  });

  it("creates and verifies a session token", () => {
    const user = { id: 1, email: "test@example.com", role: "user" as const };
    const token = createSession(user);
    const payload = verifySession(token);
    expect(payload).toMatchObject({ id: 1, email: "test@example.com", role: "user" });
  });

  it("returns null for an invalid token", () => {
    expect(verifySession("not-a-token")).toBeNull();
  });
});
