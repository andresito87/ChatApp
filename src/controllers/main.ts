import { Hono } from "hono";
import { showRoutes } from "hono/dev";
import { logger } from "hono/logger";
import { timing } from "hono/timing";
import type { ContextVariables } from "../constants";
import { API_PREFIX } from "../constants";
import { attachUserId, checkJWTAuth } from "../middlewares/auth";
import type {
  DBChat,
  DBCreateChat,
  DBCreateMessage,
  DBCreateUser,
  DBMessage,
  DBUser,
} from "../models/db";
import { SimpleInMemoryResource } from "../storage/in_memory";
import { AUTH_PREFIX, createAuthApp } from "./auth";
import { CHAT_PREFIX, createChatApp } from "./chat";
import { cors } from "hono/cors";
import { rateLimitMiddleware } from "../middlewares/rateLimiting";
import { cacheMiddleware } from "../middlewares/cacheMiddleware";
import { Pool } from "pg";
import {
  ChatSQLResource,
  MessageSQLResource,
  UserSQLResource,
} from "../storage/sql";

const corsOptions = {
  origin: [Bun.env.CORS_ORIGIN as string],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
};

export function createMainApp(
  authApp: Hono<ContextVariables>,
  chatApp: Hono<ContextVariables>
) {
  const app = new Hono<ContextVariables>().basePath(API_PREFIX);

  app.use("*", timing());
  app.use("*", logger());
  app.use("*", checkJWTAuth);
  app.use("*", attachUserId);
  app.use("*", cors(corsOptions));
  app.use("*", rateLimitMiddleware);
  app.use("*", cacheMiddleware());

  app.route(AUTH_PREFIX, authApp);
  app.route(CHAT_PREFIX, chatApp);
  showRoutes(app);

  return app;
}

// App implementation using in-memory storage
export function createInMemoryApp() {
  return createMainApp(
    createAuthApp(new SimpleInMemoryResource<DBUser, DBCreateUser>()),
    createChatApp(
      new SimpleInMemoryResource<DBChat, DBCreateChat>(),
      new SimpleInMemoryResource<DBMessage, DBCreateMessage>()
    )
  );
}

// App implementation using SQL storage
export function createSQLApp() {
  const pool = new Pool({
    connectionString: Bun.env.DATABASE_URL,
  });
  return createMainApp(
    createAuthApp(new UserSQLResource(pool)),
    createChatApp(new ChatSQLResource(pool), new MessageSQLResource(pool))
  );
}
