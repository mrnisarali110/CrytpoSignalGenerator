import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import ws from "ws";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

neonConfig.webSocketConstructor = ws;

export const client = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(client, { schema });
