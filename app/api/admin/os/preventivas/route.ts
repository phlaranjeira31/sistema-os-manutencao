import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const titulo = String(formData.get("titulo") ?? "").trim();
    const descricao = String(formData.get("descricao") ?? "").trim();
    const setorId = String(formData.get("setorId") ?? "").trim();
    const prioridade = String(formData.get("prioridade") ?? "MEDIA").trim();
    const dataAgendadaTexto = String(formData.get("dataAgendada") ?? "").trim();
    const diasAntesAviso = Number(formData.get("diasAntesAviso") ?? 1);

    if (!titulo) {
      return NextResponse.json({ error: "Título obrigatório." }, { status: 400 });
    }

    if (!descricao) {
      return NextResponse.json({ error: "Descrição obrigatória." }, { status: 400 });
    }

    if (!setorId) {
      return NextResponse.json({ error: "Setor obrigatório." }, { status: 400 });
    }

    if (!dataAgendadaTexto) {
      return NextResponse.json({ error: "Data agendada obrigatória." }, { status: 400 });
    }

    const preventiva = await prisma.ordemPreventiva.create({
      data: {
        titulo,
        descricao,
        prioridade: prioridade as any,
        setorId,
        dataAgendada: new Date(`${dataAgendadaTexto}T00:00:00`),
        diasAntesAviso,
      },
    });

    return NextResponse.redirect(new URL("/admin/os/preventivas", req.url));
  } catch (error) {
    console.error("Erro ao criar OS preventiva:", error);

    return NextResponse.json(
      { error: "Erro ao criar OS preventiva." },
      { status: 500 }
    );
  }
}