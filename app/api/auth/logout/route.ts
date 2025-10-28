import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    // Borrar la cookie
    const syncCookies = await cookies();
    syncCookies.delete("token");
    return NextResponse.json({ message: "Logout exitoso" }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Error al cerrar sesión" },
      { status: 500 }
    );
  }
}
