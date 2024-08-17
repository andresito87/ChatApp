import { Hono } from "hono";
import { env } from "hono/adapter";
import { sign } from "hono/jwt";
import type { ContextVariables } from "../constants";
import type { DBCreateUser, DBUser, Email } from "../models/db";
import type { IDatabaseResource } from "../storage/types";
import { APIUser } from "../models/api";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const AUTH_PREFIX = "/auth/";
export const authApp = new Hono<ContextVariables>();
export const LOGIN_ROUTE = "login/";
export const REGISTER_ROUTE = "register/";
export const ERROR_USER_ALREADY_EXIST = "USER_ALREADY_EXIST";
export const ERROR_INVALID_CREDENTIALS = "INVALID_CREDENTIALS";

// This is a zod validation schema  for the register route
const registerSchema = z.object({
  email: z
    .string()
    .email()
    .transform((x) => x as Email),
  password: z.string().min(1),
  name: z.string().min(1),
});

// This is a zod validation schema validation for the login route
const loginSchema = z.object({
  email: z
    .string()
    .email()
    .transform((x) => x as Email),
  password: z.string().min(1),
});

export function createAuthApp(
  userResource: IDatabaseResource<DBUser, DBCreateUser>
) {
  authApp.post(
    REGISTER_ROUTE,
    zValidator("json", registerSchema),
    async (c) => {
      const { email, password, name } = c.req.valid("json");
      if (await userResource.find({ email })) {
        return c.json({ error: ERROR_USER_ALREADY_EXIST }, 400);
      }
      const hashedPassword = await Bun.password.hash(password, {
        algorithm: "bcrypt",
      });
      await userResource.create({ name, email, password: hashedPassword });
      return c.json({ success: true }, 201);
    }
  );

  authApp.post(LOGIN_ROUTE, zValidator("json", loginSchema), async (c) => {
    const { email, password } = c.req.valid("json");
    const fulluser = await userResource.find({ email });
    if (
      !fulluser ||
      !(await Bun.password.verify(password, fulluser.password))
    ) {
      return c.json({ error: ERROR_INVALID_CREDENTIALS }, 401);
    }
    const { JWT_SECRET } = env<{ JWT_SECRET: string }, typeof c>(c);
    const apiUser: APIUser = { ...fulluser }; // Omit the password
    const token = await sign({ apiUser }, JWT_SECRET);
    return c.json({ token });
  });
  return authApp;
}
