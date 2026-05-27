import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/src/lib/prisma";

type Props = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, { params }: Props) {
  try {
    const { id } = await params;
    const body = await req.json();

    const senha = String(body?.senha ?? "").trim();

    if (!senha) {
      return NextResponse.json(
        { error: "Informe a senha." },
        { status: 400 }
      );
    }

    const colaborador = await prisma.user.findUnique({
      where: { id },
    });

    if (!colaborador) {
      return NextResponse.json(
        { error: "Colaborador não encontrado." },
        { status: 404 }
      );
    }

    const senhaCorreta = await bcrypt.compare(senha, colaborador.senha);

    if (!senhaCorreta) {
      return NextResponse.json(
        { error: "Senha incorreta." },
        { status: 401 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao verificar senha:", error);

    return NextResponse.json(
      { error: "Erro interno ao verificar senha." },
      { status: 500 }
    );
  }
}