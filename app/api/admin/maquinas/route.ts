import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const setorId = String(searchParams.get("setorId") ?? "").trim();

    if (!setorId) {
      return NextResponse.json(
        { error: "Informe o setor." },
        { status: 400 }
      );
    }

    const maquinas = await prisma.maquina.findMany({
      where: {
        setorId,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        setorId: true,
      },
      orderBy: {
        nome: "asc",
      },
    });

    return NextResponse.json(maquinas);
  } catch (error) {
    console.error("Erro ao buscar máquinas:", error);

    return NextResponse.json(
      { error: "Erro interno ao buscar máquinas." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const nome = String(body?.nome ?? "").trim();
    const setorId = String(body?.setorId ?? "").trim();

    if (!nome) {
      return NextResponse.json(
        { error: "Informe o nome da máquina." },
        { status: 400 }
      );
    }

    if (!setorId) {
      return NextResponse.json(
        { error: "Informe o setor da máquina." },
        { status: 400 }
      );
    }

    const setor = await prisma.setor.findUnique({
      where: {
        id: setorId,
      },
    });

    if (!setor) {
      return NextResponse.json(
        { error: "Setor não encontrado." },
        { status: 404 }
      );
    }

    const existente = await prisma.maquina.findFirst({
      where: {
        setorId,
        nome: {
          equals: nome,
          mode: "insensitive",
        },
      },
    });

    if (existente) {
      return NextResponse.json(
        { error: "Já existe uma máquina com esse nome neste setor." },
        { status: 400 }
      );
    }

    const maquina = await prisma.maquina.create({
      data: {
        nome,
        setorId,
        ativo: true,
      },
    });

    return NextResponse.json(maquina, { status: 201 });
  } catch (error) {
    console.error("Erro ao cadastrar máquina:", error);

    return NextResponse.json(
      { error: "Erro interno ao cadastrar máquina." },
      { status: 500 }
    );
  }
}