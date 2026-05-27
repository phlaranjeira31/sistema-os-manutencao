import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json([]);
  }

  const notificacoes = await prisma.responsavelOS.findMany({
    where: {
      userId,
      os: {
        registroFinal: null,
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      os: {
        include: {
          setor: true,
        },
      },
    },
  });

  return NextResponse.json(
    notificacoes.map((item) => ({
      id: item.id,
      enviadaEm: item.createdAt,
      osId: item.os.id,
      numero: item.os.numero,
      titulo: item.os.titulo,
      descricao: item.os.descricao,
      setor: item.os.setor?.nome ?? "Sem setor",
    }))
  );
}