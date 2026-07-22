import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Plus,
} from "lucide-react";
import { Prisma } from "@prisma/client";

import { prisma } from "@/src/lib/prisma";
import AgendaManutencao, {
  type AgendaEvento,
} from "@/components/AgendaManutencao";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    mes?: string;
    setor?: string;
    maquina?: string;
    colaborador?: string;
    tipo?: string;
  }>;
};

function obterMesAtual() {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const ano = partes.find(
    (parte) => parte.type === "year"
  )?.value;

  const mes = partes.find(
    (parte) => parte.type === "month"
  )?.value;

  return `${ano}-${mes}`;
}

function obterLimitesMes(mesSelecionado: string) {
  const [ano, mes] = mesSelecionado
    .split("-")
    .map(Number);

  const proximoMes =
    mes === 12
      ? {
          ano: ano + 1,
          mes: 1,
        }
      : {
          ano,
          mes: mes + 1,
        };

  const mesTexto = String(mes).padStart(2, "0");

  const proximoMesTexto = String(
    proximoMes.mes
  ).padStart(2, "0");

  const inicio = new Date(
    `${ano}-${mesTexto}-01T00:00:00-03:00`
  );

  const fim = new Date(
    `${proximoMes.ano}-${proximoMesTexto}-01T00:00:00-03:00`
  );

  return {
    inicio,
    fim,
  };
}

function estaDentroDoMes(
  data: Date | string | null | undefined,
  inicio: Date,
  fim: Date
) {
  if (!data) return false;

  const valor = new Date(data).getTime();

  return (
    valor >= inicio.getTime() &&
    valor < fim.getTime()
  );
}

function nomesResponsaveis(
  responsaveis: Array<{
    user: {
      nome: string;
    };
  }>
) {
  if (responsaveis.length === 0) {
    return [];
  }

  return responsaveis.map(
    (responsavel) => responsavel.user.nome
  );
}

export default async function AgendaManutencaoPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const mesRecebido = String(
    params?.mes ?? ""
  ).trim();

  const mesSelecionado = /^\d{4}-\d{2}$/.test(
    mesRecebido
  )
    ? mesRecebido
    : obterMesAtual();

  const setorFiltro = String(
    params?.setor ?? ""
  ).trim();

  const maquinaFiltro = String(
    params?.maquina ?? ""
  ).trim();

  const colaboradorFiltro = String(
    params?.colaborador ?? ""
  ).trim();

  const tipoFiltro = String(
    params?.tipo ?? ""
  ).trim();

  const { inicio, fim } =
    obterLimitesMes(mesSelecionado);

  const whereOS: Prisma.OrdemServicoWhereInput = {
    ...(setorFiltro
      ? {
          setorId: setorFiltro,
        }
      : {}),

    ...(maquinaFiltro
      ? {
          maquinaId: maquinaFiltro,
        }
      : {}),

    ...(colaboradorFiltro
      ? {
          responsaveis: {
            some: {
              userId: colaboradorFiltro,
            },
          },
        }
      : {}),

    OR: [
      {
        createdAt: {
          gte: inicio,
          lt: fim,
        },
      },
      {
        dataInicio: {
          gte: inicio,
          lt: fim,
        },
      },
      {
        dataPrevista: {
          gte: inicio,
          lt: fim,
        },
      },
      {
        dataConclusao: {
          gte: inicio,
          lt: fim,
        },
      },
      {
        dataParada: {
          gte: inicio,
          lt: fim,
        },
      },
    ],
  };

  const wherePreventiva: Prisma.OrdemPreventivaWhereInput =
    {
      dataAgendada: {
        gte: inicio,
        lt: fim,
      },

      ...(setorFiltro
        ? {
            setorId: setorFiltro,
          }
        : {}),

      ...(maquinaFiltro
        ? {
            maquinaId: maquinaFiltro,
          }
        : {}),

      ...(colaboradorFiltro
        ? {
            responsaveis: {
              some: {
                userId: colaboradorFiltro,
              },
            },
          }
        : {}),
    };

  const [
    setores,
    maquinas,
    colaboradores,
    ordens,
    preventivas,
  ] = await Promise.all([
    prisma.setor.findMany({
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
    }),

    prisma.maquina.findMany({
      where: {
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        setorId: true,
      },
      orderBy: [
        {
          setor: {
            nome: "asc",
          },
        },
        {
          nome: "asc",
        },
      ],
    }),

    prisma.user.findMany({
      where: {
        ativo: true,
        perfil: "COLABORADOR",
      },
      select: {
        id: true,
        nome: true,
      },
      orderBy: {
        nome: "asc",
      },
    }),

    tipoFiltro === "PREVENTIVA"
      ? Promise.resolve([])
      : prisma.ordemServico.findMany({
          where: whereOS,

          include: {
            setor: true,
            maquina: true,

            responsaveis: {
              include: {
                user: {
                  select: {
                    nome: true,
                  },
                },
              },
            },
          },

          orderBy: {
            createdAt: "asc",
          },
        }),

    tipoFiltro === "OS"
      ? Promise.resolve([])
      : prisma.ordemPreventiva.findMany({
          where: wherePreventiva,

          include: {
            setor: true,
            maquina: true,

            responsaveis: {
              include: {
                user: {
                  select: {
                    nome: true,
                  },
                },
              },
            },
          },

          orderBy: {
            dataAgendada: "asc",
          },
        }),
  ]);

  const eventos: AgendaEvento[] = [];

  for (const os of ordens) {
    const responsaveisOS = nomesResponsaveis(
      os.responsaveis
    );

    const dadosComuns = {
      origem: "OS" as const,
      osId: os.id,
      numeroOS: os.numero,
      setor: os.setor?.nome ?? "Sem setor",
      maquina: os.maquina?.nome ?? "Sem máquina",
      responsaveis: responsaveisOS,
      prioridade: os.prioridade,
      status: os.status,
      href: `/admin/os/${os.id}`,
    };

    if (
      estaDentroDoMes(
        os.createdAt,
        inicio,
        fim
      )
    ) {
      eventos.push({
        ...dadosComuns,
        id: `os-${os.id}-criada`,
        tipo: "OS_CRIADA",
        data: os.createdAt.toISOString(),
        diaTodo: false,
        titulo: `OS #${os.numero} criada`,
        subtitulo: os.titulo,
        descricao:
          os.descricao ||
          "Sem descrição cadastrada.",
      });
    }

    if (
      estaDentroDoMes(
        os.dataParada,
        inicio,
        fim
      )
    ) {
      eventos.push({
        ...dadosComuns,
        id: `os-${os.id}-parada`,
        tipo: "MAQUINA_PARADA",
        data: os.dataParada!.toISOString(),
        diaTodo: false,
        titulo: `Máquina parada — OS #${os.numero}`,
        subtitulo: os.titulo,
        descricao:
          "Horário de parada da máquina registrado para esta ordem de serviço.",
      });
    }

    if (
      estaDentroDoMes(
        os.dataInicio,
        inicio,
        fim
      )
    ) {
      eventos.push({
        ...dadosComuns,
        id: `os-${os.id}-inicio`,
        tipo: "SERVICO_INICIADO",
        data: os.dataInicio!.toISOString(),
        diaTodo: false,
        titulo: `Serviço iniciado — OS #${os.numero}`,
        subtitulo: os.titulo,
        descricao:
          os.descricao ||
          "Início da manutenção registrado.",
      });
    }

    if (
      estaDentroDoMes(
        os.dataPrevista,
        inicio,
        fim
      )
    ) {
      eventos.push({
        ...dadosComuns,
        id: `os-${os.id}-prevista`,
        tipo: "DATA_PREVISTA",
        data: os.dataPrevista!.toISOString(),
        diaTodo: true,
        titulo: `Previsão da OS #${os.numero}`,
        subtitulo: os.titulo,
        descricao:
          "Data prevista para realização ou conclusão da ordem de serviço.",
      });
    }

    if (
      estaDentroDoMes(
        os.dataConclusao,
        inicio,
        fim
      )
    ) {
      eventos.push({
        ...dadosComuns,
        id: `os-${os.id}-conclusao`,
        tipo: "OS_CONCLUIDA",
        data: os.dataConclusao!.toISOString(),
        diaTodo: false,
        titulo: `OS #${os.numero} concluída`,
        subtitulo: os.titulo,
        descricao:
          os.registroFinal ||
          os.descricao ||
          "Ordem de serviço concluída.",
        resultado: os.registroFinal || null,
      });
    }
  }

  for (const preventiva of preventivas) {
    eventos.push({
      id: `preventiva-${preventiva.id}`,
      origem: "PREVENTIVA",
      tipo: "PREVENTIVA",
      data: preventiva.dataAgendada.toISOString(),
      diaTodo: true,
      titulo: `Preventiva: ${preventiva.titulo}`,
      subtitulo:
        preventiva.maquina?.nome ??
        preventiva.setor?.nome ??
        "Preventiva agendada",
      descricao:
        preventiva.descricao ||
        "Sem descrição cadastrada.",
      setor:
        preventiva.setor?.nome ?? "Sem setor",
      maquina:
        preventiva.maquina?.nome ??
        "Sem máquina definida",
      responsaveis: nomesResponsaveis(
        preventiva.responsaveis
      ),
      prioridade: preventiva.prioridade,
      status: preventiva.status,
      href: `/admin/os/preventivas/${preventiva.id}/editar`,
    });
  }

  eventos.sort(
    (eventoA, eventoB) =>
      new Date(eventoA.data).getTime() -
      new Date(eventoB.data).getTime()
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] px-3 py-6 text-white sm:px-4 md:px-8">
      <div className="mx-auto w-full max-w-[1700px] space-y-6">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
              <CalendarDays size={28} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-black uppercase tracking-widest text-cyan-400">
                Planejamento
              </p>

              <h1 className="break-words text-3xl font-black md:text-4xl">
                Agenda da Manutenção
              </h1>

              <p className="mt-1 break-words text-sm text-slate-400 md:text-base">
                Acompanhe OS, paradas, conclusões e
                preventivas em uma linha do tempo.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/admin/os"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-black text-white transition hover:bg-white/10"
            >
              <ClipboardList size={17} />
              Ver todas as OS
            </Link>

            <Link
              href="/admin/os/nova"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-5 text-sm font-black text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950"
            >
              <Plus size={17} />
              Nova OS
            </Link>

            <Link
              href="/admin"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-slate-950 transition hover:scale-[1.02]"
            >
              <ArrowLeft size={17} />
              Voltar
            </Link>
          </div>
        </header>

        <AgendaManutencao
          mes={mesSelecionado}
          eventos={eventos}
          setores={setores}
          maquinas={maquinas}
          colaboradores={colaboradores}
          filtros={{
            setor: setorFiltro,
            maquina: maquinaFiltro,
            colaborador: colaboradorFiltro,
            tipo: tipoFiltro,
          }}
        />
      </div>
    </main>
  );
}