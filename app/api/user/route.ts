import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import { ensureUsersTableSchema } from "@/lib/user-profile";

export async function POST(request: Request) {
    try {
        await ensureUsersTableSchema();

        const { email, name, imageUrl, phoneNumber, address } = await request.json();
        const normalizedAddress = String(address ?? "").trim() || null;

        const users = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email));

        if (users?.length == 0) {
            const result = await db.insert(usersTable).values({
                name: name,
                email: email,
                imageUrl: imageUrl,
                phoneNumber: phoneNumber ?? null,
                address: normalizedAddress,
            }).returning();

            return NextResponse.json(result[0]);
        }

        const updated = await db
            .update(usersTable)
            .set({
                name: name ?? users[0].name,
                imageUrl: imageUrl ?? users[0].imageUrl,
                phoneNumber: phoneNumber ?? users[0].phoneNumber,
                address: normalizedAddress ?? users[0].address,
            })
            .where(eq(usersTable.email, email))
            .returning();

        return NextResponse.json(updated[0] ?? users[0]);
    } catch (error) {
        console.log(error);
        
        return NextResponse.json({
            error: "An error occurred while creating the user."
        },{
            status: 500
        });
    }
}