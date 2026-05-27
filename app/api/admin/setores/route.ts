import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  try {
    const setores = await prisma.setor.findMany({
      where: {
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
      },
      orderBy: {
        nome: "asc",
      },
    });

    return NextResponse.json(setores);
  } catch (error) {
    console.error("Erro ao buscar setores:", error);

    return NextResponse.json(
      { error: "Erro interno ao buscar setores." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const nome = String(body?.nome ?? "").trim();

    if (!nome) {
      return NextResponse.json(
        { error: "O nome do setor é obrigatório." },
        { status: 400 }
      );
    }

    const existe = await prisma.setor.findUnique({
      where: { nome },
    });

    if (existe) {
      return NextResponse.json(
        { error: "Já existe um setor com esse nome." },
        { status: 400 }
      );
    }

    const setor = await prisma.setor.create({
      data: {
        nome,
        ativo: true,
      },
    });

    return NextResponse.json(setor);
  } catch (error) {
    console.error("Erro ao criar setor:", error);

    return NextResponse.json(
      { error: "Erro interno ao criar setor." },
      { status: 500 }
    );
  }
}