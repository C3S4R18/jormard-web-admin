import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = getAdminDb();

    await db.collection("notifications").add({
      ...body,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("notify error:", error);
    return NextResponse.json(
      { ok: false, error: "Error al guardar notificación" },
      { status: 500 }
    );
  }
}