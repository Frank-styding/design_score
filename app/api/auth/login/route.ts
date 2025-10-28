import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { ManageAdminService } from "@/app/core/application/service/ManageAdminService";
import { AdminRepository } from "@/app/core/infrastructure/repositories/product/AdminRepository";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const manageAdminService = new ManageAdminService();
    manageAdminService.useRepository(new AdminRepository());

    const { admin, message } = await manageAdminService.login({
      email,
      password,
    });

    if (!admin) {
      return NextResponse.json({ message }, { status: 401 });
    }

    const payload = {
      adminId: admin.id,
      email: admin.email,
      userName: admin.name,
    };

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("5h") // Token expira en 1 hora
      .sign(secret);

    const syncCookies = await cookies();
    syncCookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Solo HTTPS en producción
      maxAge: 60 * 60, // 1 hora
      path: "/",
    });

    return NextResponse.json({ message: "Login exitoso" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
