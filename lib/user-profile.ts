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
      address text,
      credits integer NOT NULL DEFAULT 4,
      "creditsUpdatedAt" timestamptz NOT NULL DEFAULT now()
    )
  `);

  await db.execute(
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "phoneNumber" varchar(30)`,
  );
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS address text`);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS credits integer`);
  await db.execute(sql`UPDATE users SET credits = 4 WHERE credits IS NULL`);
  await db.execute(sql`ALTER TABLE users ALTER COLUMN credits SET NOT NULL`);
  await db.execute(sql`ALTER TABLE users ALTER COLUMN credits SET DEFAULT 4`);
  await db.execute(
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "creditsUpdatedAt" timestamptz`,
  );
  await db.execute(
    sql`UPDATE users SET "creditsUpdatedAt" = now() WHERE "creditsUpdatedAt" IS NULL`,
  );
  await db.execute(
    sql`ALTER TABLE users ALTER COLUMN "creditsUpdatedAt" SET NOT NULL`,
  );
  await db.execute(
    sql`ALTER TABLE users ALTER COLUMN "creditsUpdatedAt" SET DEFAULT now()`,
  );

  hasEnsuredUsersTableSchema = true;
}