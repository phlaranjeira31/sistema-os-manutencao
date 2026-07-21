import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const titulo = String(formData.get("titulo") ?? "").trim();
    const descricao = String(formData.get("descricao") ?? "").trim();
    const setorId = String(formData.get("setorId") ?? "").trim();

    const maquinaId = String(
      formData.get("maquinaId") ?? ""
    ).trim();

    const responsavelIds = Array.from(
      new Set(
        formData
          .getAll("responsavelIds")
          .map((valor) => String(valor).trim())
          .filter(Boolean)
      )
    );

    const prioridade = String(
      formData.get("prioridade") ?? "MEDIA"
    ).trim();

    const dataAgendadaTexto = String(
      formData.get("dataAgendada") ?? ""
    ).trim();

    const diasAntesAviso = Number(
      formData.get("diasAntesAviso") ?? 1
    );

    if (!titulo) {
      return NextResponse.json(
        { error: "Título obrigatório." },
        { status: 400 }
      );
    }

    if (!descricao) {
      return NextResponse.json(
        { error: "Descrição obrigatória." },
        { status: 400 }
      );
    }

    if (!setorId) {
      return NextResponse.json(
        { error: "Setor obrigatório." },
        { status: 400 }
      );
    }

    if (!dataAgendadaTexto) {
      return NextResponse.json(
        { error: "Data agendada obrigatória." },
        { status: 400 }
      );
    }

    if (maquinaId) {
      const maquina = await prisma.maquina.findFirst({
        where: {
          id: maquinaId,
          setorId,
          ativo: true,
        },
        select: {
          id: true,
        },
      });

      if (!maquina) {
        return NextResponse.json(
          {
            error:
              "A máquina selecionada não pertence ao setor informado ou está inativa.",
          },
          { status: 400 }
        );
      }
    }

    if (responsavelIds.length > 0) {
      const quantidadeUsuariosValidos = await prisma.user.count({
        where: {
          id: {
            in: responsavelIds,
          },
          ativo: true,
        },
      });

      if (quantidadeUsuariosValidos !== responsavelIds.length) {
        return NextResponse.json(
          {
            error:
              "Um ou mais colaboradores selecionados não foram encontrados ou estão inativos.",
          },
          { status: 400 }
        );
      }
    }

    await prisma.ordemPreventiva.create({
      data: {
        titulo,
        descricao,
        prioridade: prioridade as any,
        setorId,

        maquinaId: maquinaId || null,

        dataAgendada: new Date(
          `${dataAgendadaTexto}T00:00:00`
        ),

        diasAntesAviso,

        responsaveis:
          responsavelIds.length > 0
            ? {
                create: responsavelIds.map((userId) => ({
                  userId,
                })),
              }
            : undefined,
      },
    });

    return NextResponse.redirect(
      new URL("/admin/os/preventivas", req.url),
      303
    );
  } catch (error) {
    console.error("Erro ao criar OS preventiva:", error);

    return NextResponse.json(
      { error: "Erro ao criar OS preventiva." },
      { status: 500 }
    );
  }
}