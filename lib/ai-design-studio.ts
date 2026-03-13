import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/config/db";
import { aiDesignCartItemsTable } from "@/config/schema";

export type AIDesignMode = "upload" | "design";

type SaveAIDesignInput = {
  userEmail: string;
  mode: AIDesignMode;
  prompt?: string | null;
  sketchUrl?: string | null;
  outputUrl: string;
};

let hasEnsuredAIDesignCartItemsTable = false;

export async function ensureAIDesignCartItemsTable() {
  if (hasEnsuredAIDesignCartItemsTable) {
    return;
  }

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ai_design_cart_items (
      id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "userEmail" varchar(255) NOT NULL,
      mode varchar(20) NOT NULL,
      prompt text,
      "sketchUrl" text,
      "outputUrl" text NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now()
    )
  `);

  hasEnsuredAIDesignCartItemsTable = true;
}

export async function saveAIDesignToCart(input: SaveAIDesignInput) {
  await ensureAIDesignCartItemsTable();

  const inserted = await db
    .insert(aiDesignCartItemsTable)
    .values({
      userEmail: input.userEmail,
      mode: input.mode,
      prompt: input.prompt ?? null,
      sketchUrl: input.sketchUrl ?? null,
      outputUrl: input.outputUrl,
    })
    .returning();

  return inserted[0] ?? null;
}

export async function listAIDesignCartItems(userEmail: string) {
  await ensureAIDesignCartItemsTable();

  return db
    .select()
    .from(aiDesignCartItemsTable)
    .where(eq(aiDesignCartItemsTable.userEmail, userEmail))
    .orderBy(desc(aiDesignCartItemsTable.createdAt));
}