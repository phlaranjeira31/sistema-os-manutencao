import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/src/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email = String(body?.email ?? "").toLowerCase().trim();
    const senha = String(body?.senha ?? "").trim();

    if (!email || !senha) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 401 }
      );
    }

    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      return NextResponse.json(
        { error: "Senha inválida." },
        { status: 401 }
      );
    }

    // 👉 Aqui você pode depois usar sessão (NextAuth ou JWT)
    return NextResponse.json({
      id: user.id,
      nome: user.nome,
      email: user.email,
      perfil: user.perfil,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro interno no login." },
      { status: 500 }
    );
  }
}