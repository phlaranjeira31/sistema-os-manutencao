import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
} from "lucide-react";

import { prisma } from "@/src/lib/prisma";
import FormularioEditarPreventiva from "@/components/FormularioEditarPreventiva";

type Props = {
  params: Promise<{ id: string }>;
};

function formatInputDate(
  date: Date | string | null | undefined
) {
  if (!date) return "";

  return new Date(date).toISOString().split("T")[0];
}

export default async function EditarPreventivaPage({
  params,
}: Props) {
  const { id } = await params;

  const preventiva = await prisma.ordemPreventiva.findUnique({
    where: {
      id,
    },

    include: {
      setor: true,
      maquina: true,

      responsaveis: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!preventiva) {
    return notFound();
  }

  const responsaveisAtuaisIds = preventiva.responsaveis.map(
    (responsavel) => responsavel.userId
  );

  const [setoresBanco, colaboradoresBanco] =
    await Promise.all([
      prisma.setor.findMany({
        where: {
          ativo: true,
        },

        select: {
          id: true,
          nome: true,

          maquinas: {
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
          },
        },

        orderBy: {
          nome: "asc",
        },
      }),

      prisma.user.findMany({
        where: {
          perfil: "COLABORADOR",

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
          nome: true,
          email: true,
          ativo: true,
        },

        orderBy: {
          nome: "asc",
        },
      }),
    ]);

  const setores = setoresBanco.map((setor) => ({
    id: setor.id,
    nome: setor.nome,

    maquinas: setor.maquinas.map((maquina) => ({
      id: maquina.id,
      nome: maquina.nome,
    })),
  }));

  const colaboradores = colaboradoresBanco.map(
    (colaborador) => ({
      id: colaborador.id,
      nome: colaborador.nome,
      email: colaborador.email,
      ativo: colaborador.ativo,
    })
  );

  const dadosPreventiva = {
    id: preventiva.id,
    titulo: preventiva.titulo,
    descricao: preventiva.descricao,
    setorId: preventiva.setorId,
    maquinaId: preventiva.maquinaId ?? "",
    prioridade: preventiva.prioridade,
    dataAgendada: formatInputDate(
      preventiva.dataAgendada
    ),
    diasAntesAviso: preventiva.diasAntesAviso,
    responsavelIds: responsaveisAtuaisIds,
  };

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-8 text-white md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10">
              <CalendarClock
                className="text-cyan-300"
                size={32}
              />
            </div>

            <div>
              <span className="text-sm font-black uppercase tracking-widest text-cyan-400">
                Preventivas
              </span>

              <h1 className="text-4xl font-black">
                Editar preventiva
              </h1>

              <p className="mt-1 text-slate-400">
                Atualize os dados da OS preventiva.
              </p>
            </div>
          </div>

          <Link
            href="/admin/os/preventivas/lista"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-white px-6 font-black text-slate-950 transition hover:scale-[1.02]"
          >
            <ArrowLeft size={18} />
            Voltar
          </Link>
        </div>

        <FormularioEditarPreventiva
          preventiva={dadosPreventiva}
          setores={setores}
          colaboradores={colaboradores}
        />
      </div>
    </main>
  );
}