import { sql } from "drizzle-orm";
import { db } from "@/config/db";

let hasEnsuredUsersTableSchema = false;

export async function ensureUsersTableSchema() {
  if (hasEnsuredUsersTableSchema) {
    return;
  }

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        "imageUrl" varchar(255) NOT NULL,
        name varchar(255) NOT NULL,
        email varchar(255) NOT NULL UNIQUE,
        "phoneNumber" varchar(30),
        address text,
        credits integer NOT NULL DEFAULT 4,
        "creditsUpdatedAt" timestamptz NOT NULL DEFAULT now()
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS "phoneNumber" varchar(30);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS address text;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS credits integer DEFAULT 4;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS "creditsUpdatedAt" timestamptz DEFAULT now();
    `);
    hasEnsuredUsersTableSchema = true;
  } catch (error) {
    console.warn("User table schema check warning:", error);
    hasEnsuredUsersTableSchema = true;
  }
}