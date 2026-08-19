import Link from "next/link";

import {
  ArrowLeft,
  CircleAlert,
  Pencil,
} from "lucide-react";

import { prisma } from "@/src/lib/prisma";

import EditarPlanoPreventivoForm from "@/components/EditarPlanoPreventivoForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function dataInput(
  data: Date | null | undefined
) {
  if (!data) {
    return null;
  }

  return data
    .toISOString()
    .slice(0, 10);
}

export default async function EditarPlanoPreventivoPage({
  params,
}: PageProps) {
  const { id } = await params;

  /*
   * Primeiro procura normalmente pelo ID do plano.
   *
   * Como segurança adicional, também procura caso
   * tenha chegado por engano o ID de uma execução
   * pertencente ao plano.
   */
  const plano = await prisma.planoPreventivo.findFirst({
    where: {
      OR: [
        {
          id,
        },

        {
          execucoes: {
            some: {
              id,
            },
          },
        },
      ],
    },

    include: {
      responsaveis: {
        select: {
          userId: true,
        },
      },
    },
  });

  /*
   * NÃO usamos notFound() aqui.
   *
   * Se o ID não existir no banco atualmente conectado,
   * mostramos uma tela clara para sabermos exatamente
   * o que aconteceu.
   */
  if (!plano) {
    console.error(
      "PLANO PREVENTIVO NÃO ENCONTRADO PARA EDIÇÃO:",
      {
        idRecebido: id,
      }
    );

    return (
      <main className="min-h-screen bg-[#050816] px-4 py-8 text-white md:px-10">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-red-400/20 bg-red-500/[0.06] p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-red-400/30 bg-red-500/10 text-red-300">
                <CircleAlert size={28} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-widest text-red-300">
                  Plano não encontrado
                </p>

                <h1 className="mt-1 text-2xl font-black text-white md:text-3xl">
                  Não foi possível abrir este plano para edição
                </h1>

                <p className="mt-3 text-slate-400">
                  O registro que o card está tentando abrir não foi
                  encontrado como plano preventivo no banco atualmente
                  conectado ao sistema.
                </p>

                <div className="mt-5 rounded-2xl border border-white/10 bg-[#050816] p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                    ID recebido
                  </p>

                  <p className="mt-2 break-all font-mono text-sm text-red-200">
                    {id}
                  </p>
                </div>

                <Link
                  href="/admin/os/preventivas/lista"
                  className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 font-black text-slate-950 transition hover:scale-[1.02]"
                >
                  <ArrowLeft size={17} />
                  Voltar para preventivas
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /*
   * Agora que sabemos qual é o plano correto,
   * buscamos os dados necessários para o formulário.
   */
  const [
    setoresBanco,
    colaboradoresBanco,
  ] = await Promise.all([
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
        ativo: true,

        perfil: "COLABORADOR",
      },

      select: {
        id: true,
        nome: true,
        email: true,
      },

      orderBy: {
        nome: "asc",
      },
    }),
  ]);

  const setores = setoresBanco.map(
    (setor) => ({
      id: setor.id,

      nome: setor.nome,

      maquinas: setor.maquinas.map(
        (maquina) => ({
          id: maquina.id,

          nome: maquina.nome,
        })
      ),
    })
  );

  const colaboradores =
    colaboradoresBanco.map(
      (colaborador) => ({
        id: colaborador.id,

        nome: colaborador.nome,

        email: colaborador.email,
      })
    );

  const planoFormulario = {
    id: plano.id,

    titulo: plano.titulo,

    descricao: plano.descricao,

    prioridade: plano.prioridade,

    setorId: plano.setorId,

    maquinaId: plano.maquinaId,

    frequencia: plano.frequencia,

    intervaloPersonalizadoDias:
      plano.intervaloPersonalizadoDias,

    dataInicio:
      dataInput(
        plano.dataInicio
      )!,

    dataFim:
      dataInput(
        plano.dataFim
      ),

    diasAntesAviso:
      plano.diasAntesAviso,

    duracaoEstimadaMinutos:
      plano.duracaoEstimadaMinutos,

    gerarAutomaticamente:
      plano.gerarAutomaticamente,

    ativo:
      plano.ativo,

    responsavelIds:
      plano.responsaveis.map(
        (item) =>
          item.userId
      ),
  };

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-8 text-white md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
              <Pencil size={30} />
            </div>

            <div>
              <p className="text-sm font-black uppercase tracking-widest text-cyan-400">
                Preventivas
              </p>

              <h1 className="text-3xl font-black md:text-4xl">
                Editar plano
              </h1>

              <p className="mt-1 text-slate-400">
                {plano.titulo}
              </p>
            </div>
          </div>

          <Link
            href="/admin/os/preventivas/lista"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 font-black text-slate-950 transition hover:scale-[1.02]"
          >
            <ArrowLeft size={17} />

            Voltar
          </Link>
        </header>

        <EditarPlanoPreventivoForm
          plano={planoFormulario}
          setores={setores}
          colaboradores={colaboradores}
        />
      </div>
    </main>
  );
}