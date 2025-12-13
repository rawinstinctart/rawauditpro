import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

let poolInstance: pg.Pool | undefined;
let dbInstance: ReturnType<typeof drizzle> | undefined;

if (databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);

    if (parsed.hostname && parsed.hostname !== "base") {
      poolInstance = new Pool({ connectionString: databaseUrl });
      dbInstance = drizzle(poolInstance, { schema });
    } else {
      console.warn(
        `DATABASE_URL hostname "${parsed.hostname}" is not valid. Skipping database setup.`,
      );
    }
  } catch (error) {
    console.warn("Invalid DATABASE_URL provided. Skipping database setup.", error);
  }
} else {
  console.warn("DATABASE_URL not set. Database-backed features are disabled.");
}

export const isDatabaseConfigured = Boolean(dbInstance);
export const pool = poolInstance;
export const db = dbInstance;
