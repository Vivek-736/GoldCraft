import { sql } from "drizzle-orm";
import { db } from "@/config/db";

let hasEnsuredUsersTableSchema = false;

export async function ensureUsersTableSchema() {
  if (hasEnsuredUsersTableSchema) {
    return;
  }

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "imageUrl" varchar(255) NOT NULL,
      name varchar(255) NOT NULL,
      email varchar(255) NOT NULL UNIQUE,
      "phoneNumber" varchar(30),
      address text
    )
  `);

  await db.execute(
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "phoneNumber" varchar(30)`,
  );
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS address text`);

  hasEnsuredUsersTableSchema = true;
}