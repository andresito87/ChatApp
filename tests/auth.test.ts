import { beforeEach, describe, expect, test } from "bun:test";
import { createInMemoryApp } from "../src/controllers/main";
import { Pool } from "pg";
import { createSQLApp } from "../src/controllers/main";
import { resetSQLDB } from "./utils";

describe("auth tests", () => {
  // Use in-memory database
  /*let app: ReturnType<typeof createInMemoryApp>;
  beforeEach(async () => {
    app = createInMemoryApp();
  });*/

  const app = createSQLApp();
  const pool = new Pool({
    connectionString: Bun.env.TEST_DATABASE_URL,
  });
  beforeEach(async () => {
    await resetSQLDB(pool);
  });

  /*********** REGISTER ***********/
  test("POST /register - normal case", async () => {
    const jsonBody = {
      email: "test@example.com",
      password: "password123",
      name: "Test User",
    };
    const response = await app.request("/api/v1/auth/register/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonBody),
    });
    expect(response.status).toBe(201);
  });

  test("POST /register - user already exists", async () => {
    await app.request("/api/v1/auth/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "existing@example.com",
        password: "password123",
        name: "Existing User",
      }),
    });
    const response = await app.request("/api/v1/auth/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "existing@example.com",
        password: "password123",
        name: "Existing User",
      }),
    });
    expect(response.status).toBe(400);
  });

  /*********** LOGIN ***********/
  test("POST /login - success", async () => {
    const res1 = await app.request("/api/v1/chat/", { method: "GET" });
    expect(res1.status).toBe(401);
    await app.request("/api/v1/auth/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "loginuser@example.com",
        password: "password123",
        name: "Login User",
      }),
    });
    const loginResponse = await app.request("/api/v1/auth/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "loginuser@example.com",
        password: "password123",
      }),
    });
    expect(loginResponse.status).toBe(200);
    const token = ((await loginResponse.json()) as any).token;
    expect(token).toBeTruthy();
    const res2 = await app.request("/api/v1/chat/", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res2.status).toBe(200);
  });

  test("POST /login - non-existing user", async () => {
    const response = await app.request("/api/v1/auth/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nonexisting@example.com",
        password: "password123",
      }),
    });
    expect(response.status).toBe(401);
  });

  /*********** ZOD VALIDATIONS ***********/
  test("POST /register - incorrect body", async () => {
    const jsonBody = {
      email: "example",
    };
    const response = await app.request("/api/v1/auth/register/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonBody),
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      error: {
        issues: [
          {
            validation: "email",
            code: "invalid_string",
            message: "Invalid email",
            path: ["email"],
          },
          {
            code: "invalid_type",
            expected: "string",
            received: "undefined",
            path: ["password"],
            message: "Required",
          },
          {
            code: "invalid_type",
            expected: "string",
            received: "undefined",
            path: ["name"],
            message: "Required",
          },
        ],
        name: "ZodError",
      },
    });
  });

  test("POST /login - incorrect body", async () => {
    const response = await app.request("/api/v1/auth/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "wrong",
      }),
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      error: {
        issues: [
          {
            validation: "email",
            code: "invalid_string",
            message: "Invalid email",
            path: ["email"],
          },
          {
            code: "invalid_type",
            expected: "string",
            received: "undefined",
            path: ["password"],
            message: "Required",
          },
        ],
        name: "ZodError",
      },
    });
  });
});
