/**
 * Drizzle ORM Database Connection
 * 
 * Establishes connection to Neon PostgreSQL database with Drizzle ORM.
 * Exports: pool, db instances configured with schema
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

let dbInstance: any = null;
let poolInstance: any = null;

if (process.env.DATABASE_URL) {
  try {
    poolInstance = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 15000,
      connectionTimeoutMillis: 5000,
      ssl: false,
    });
    dbInstance = drizzle({ client: poolInstance, schema });
    console.log("✅ Database connection established");
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
  }
} else {
  console.warn("⚠️ DATABASE_URL not set. Running in memory mode.");
}

export const pool = poolInstance;
export const db = dbInstance;