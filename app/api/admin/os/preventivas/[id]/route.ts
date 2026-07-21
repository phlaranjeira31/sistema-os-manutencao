import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

type Props = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, { params }: Props) {
  try {
    const formData = await req.formData();

    const method = String(
      formData.get("_method") ?? ""
    ).toUpperCase();

    if (method !== "PATCH") {
      return NextResponse.json(
        { error: "Método não permitido." },
        { status: 405 }
      );
    }

    const { id } = await params;

    const titulo = String(
      formData.get("titulo") ?? ""
    ).trim();

    const descricao = String(
      formData.get("descricao") ?? ""
    ).trim();

    const setorId = String(
      formData.get("setorId") ?? ""
    ).trim();

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

    const preventivaAtual =
      await prisma.ordemPreventiva.findUnique({
        where: {
          id,
        },

        select: {
          id: true,

          responsaveis: {
            select: {
              userId: true,
            },
          },
        },
      });

    if (!preventivaAtual) {
      return NextResponse.json(
        { error: "Preventiva não encontrada." },
        { status: 404 }
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
      const responsaveisAtuaisIds =
        preventivaAtual.responsaveis.map(
          (responsavel) => responsavel.userId
        );

      const usuariosValidos = await prisma.user.findMany({
        where: {
          id: {
            in: responsavelIds,
          },

          OR: [
            {
              ativo: true,
            },

            {
              id: {
                in: responsaveisAtuaisIds,
              },
            },
          ],
        },

        select: {
          id: true,
        },
      });

      if (usuariosValidos.length !== responsavelIds.length) {
        return NextResponse.json(
          {
            error:
              "Um ou mais colaboradores selecionados não foram encontrados ou estão inativos.",
          },
          { status: 400 }
        );
      }
    }

    await prisma.ordemPreventiva.update({
      where: {
        id,
      },

      data: {
        titulo,
        descricao,
        setorId,
        maquinaId: maquinaId || null,
        prioridade: prioridade as any,

        dataAgendada: new Date(
          `${dataAgendadaTexto}T00:00:00`
        ),

        diasAntesAviso,
        notificado: false,

        responsaveis: {
          deleteMany: {},

          create: responsavelIds.map((userId) => ({
            userId,
          })),
        },
      },
    });

    return NextResponse.redirect(
      new URL("/admin/os/preventivas/lista", req.url)
    );
  } catch (error) {
    console.error("Erro ao editar preventiva:", error);

    return NextResponse.json(
      { error: "Erro ao editar preventiva." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: Props
) {
  try {
    const { id } = await params;

    await prisma.ordemPreventiva.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("Erro ao excluir preventiva:", error);

    return NextResponse.json(
      { error: "Erro ao excluir preventiva." },
      { status: 500 }
    );
  }
}