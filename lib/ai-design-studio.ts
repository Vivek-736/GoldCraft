import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/config/db";
import { aiDesignCartItemsTable } from "@/config/schema";

export type AIDesignMode = "upload" | "custom";

type SaveAIDesignInput = {
  userEmail: string;
  mode: AIDesignMode;
  prompt?: string | null;
  sketchUrl?: string | null;
  outputUrl: string;
};

type SaveAIDesignEstimateInput = {
  id: number;
  userEmail: string;
  estimatedCostInr: number;
  estimatedWeightGrams: string;
  estimateMeta: string;
};

type MarkAIDesignItemsOrderedInput = {
  userEmail: string;
  itemIds: number[];
  razorpayOrderId: string;
  razorpayPaymentId: string;
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
      "estimatedCostInr" integer,
      "estimatedWeightGrams" varchar(40),
      "estimateMeta" text,
      "estimatedAt" timestamptz,
      "orderPlaced" boolean NOT NULL DEFAULT false,
      "orderPlacedAt" timestamptz,
      "razorpayOrderId" varchar(100),
      "razorpayPaymentId" varchar(100),
      "createdAt" timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.execute(
    sql`ALTER TABLE ai_design_cart_items ADD COLUMN IF NOT EXISTS "estimatedCostInr" integer`,
  );
  await db.execute(
    sql`ALTER TABLE ai_design_cart_items ADD COLUMN IF NOT EXISTS "estimatedWeightGrams" varchar(40)`,
  );
  await db.execute(
    sql`ALTER TABLE ai_design_cart_items ADD COLUMN IF NOT EXISTS "estimateMeta" text`,
  );
  await db.execute(
    sql`ALTER TABLE ai_design_cart_items ADD COLUMN IF NOT EXISTS "estimatedAt" timestamptz`,
  );
  await db.execute(
    sql`ALTER TABLE ai_design_cart_items ADD COLUMN IF NOT EXISTS "orderPlaced" boolean`,
  );
  await db.execute(
    sql`ALTER TABLE ai_design_cart_items ALTER COLUMN "orderPlaced" SET DEFAULT false`,
  );
  await db.execute(
    sql`UPDATE ai_design_cart_items SET "orderPlaced" = false WHERE "orderPlaced" IS NULL`,
  );
  await db.execute(
    sql`ALTER TABLE ai_design_cart_items ALTER COLUMN "orderPlaced" SET NOT NULL`,
  );
  await db.execute(
    sql`ALTER TABLE ai_design_cart_items ADD COLUMN IF NOT EXISTS "orderPlacedAt" timestamptz`,
  );
  await db.execute(
    sql`ALTER TABLE ai_design_cart_items ADD COLUMN IF NOT EXISTS "razorpayOrderId" varchar(100)`,
  );
  await db.execute(
    sql`ALTER TABLE ai_design_cart_items ADD COLUMN IF NOT EXISTS "razorpayPaymentId" varchar(100)`,
  );

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

export async function saveAIDesignEstimate(input: SaveAIDesignEstimateInput) {
  await ensureAIDesignCartItemsTable();

  const updated = await db
    .update(aiDesignCartItemsTable)
    .set({
      estimatedCostInr: input.estimatedCostInr,
      estimatedWeightGrams: input.estimatedWeightGrams,
      estimateMeta: input.estimateMeta,
      estimatedAt: new Date(),
    })
    .where(
      and(
        eq(aiDesignCartItemsTable.id, input.id),
        eq(aiDesignCartItemsTable.userEmail, input.userEmail),
      ),
    )
    .returning();

  return updated[0] ?? null;
}

export async function markAIDesignItemsOrdered(input: MarkAIDesignItemsOrderedInput) {
  await ensureAIDesignCartItemsTable();

  if (!input.itemIds.length) {
    return [];
  }

  const updated = await db
    .update(aiDesignCartItemsTable)
    .set({
      orderPlaced: true,
      orderPlacedAt: new Date(),
      razorpayOrderId: input.razorpayOrderId,
      razorpayPaymentId: input.razorpayPaymentId,
    })
    .where(
      and(
        eq(aiDesignCartItemsTable.userEmail, input.userEmail),
        inArray(aiDesignCartItemsTable.id, input.itemIds),
      ),
    )
    .returning();

  return updated;
}