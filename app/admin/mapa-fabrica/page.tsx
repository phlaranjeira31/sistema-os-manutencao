import Link from "next/link";
import {
  ArrowLeft,
  ClipboardList,
  Map as MapIcon,
  Plus,
} from "lucide-react";

import MapaFabricaInterativo from "@/components/MapaFabricaInterativo";
import { prisma } from "@/src/lib/prisma";

export const dynamic = "force-dynamic";

const DIA_MS = 86_400_000;

function inicioDoDiaSaoPaulo(data: Date) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(data);

  const ano =
    partes.find((parte) => parte.type === "year")
      ?.value ?? "1970";

  const mes =
    partes.find((parte) => parte.type === "month")
      ?.value ?? "01";

  const dia =
    partes.find((parte) => parte.type === "day")
      ?.value ?? "01";

  return new Date(
    `${ano}-${mes}-${dia}T00:00:00-03:00`
  );
}

export default async function MapaFabricaPage() {
  const agora = new Date();
  const inicioHoje = inicioDoDiaSaoPaulo(agora);
  const limite90Dias = new Date(
    agora.getTime() - 90 * DIA_MS
  );
  const limitePreventivaPassado = new Date(
    agora.getTime() - 30 * DIA_MS
  );
  const limitePreventivaFuturo = new Date(
    agora.getTime() + 30 * DIA_MS
  );

  const empresaSequoia =
    await prisma.empresa.findFirst({
      where: {
        sigla: "SEQ",
      },
      select: {
        id: true,
        nome: true,
        sigla: true,
      },
    });

  const setores = await prisma.setor.findMany({
    where: {
      ativo: true,
      ...(empresaSequoia
        ? {
            empresaId: empresaSequoia.id,
          }
        : {}),
    },

    select: {
      id: true,
      nome: true,
      empresaId: true,

      empresa: {
        select: {
          nome: true,
          sigla: true,
        },
      },

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
  });

  const setorIds = setores.map(
    (setor) => setor.id
  );

  const [ordens, preventivas] =
    await Promise.all([
      prisma.ordemServico.findMany({
        where: {
          setorId: {
            in: setorIds,
          },

          status: {
            not: "CANCELADA",
          },

          OR: [
            {
              status: {
                in: [
                  "NAO_INICIADA",
                  "EM_ANDAMENTO",
                ],
              },
            },
            {
              createdAt: {
                gte: limite90Dias,
              },
            },
            {
              dataConclusao: {
                gte: limite90Dias,
              },
            },
          ],
        },

        select: {
          id: true,
          numero: true,
          titulo: true,
          descricao: true,
          status: true,
          prioridade: true,
          createdAt: true,
          dataPrevista: true,
          dataConclusao: true,
          dataParada: true,
          setorId: true,

          maquina: {
            select: {
              id: true,
              nome: true,
            },
          },

          responsaveis: {
            select: {
              user: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 1200,
      }),

      prisma.execucaoPreventiva.findMany({
        where: {
          plano: {
            setorId: {
              in: setorIds,
            },
          },

          OR: [
            {
              dataProgramada: {
                gte: limitePreventivaPassado,
                lte: limitePreventivaFuturo,
              },
            },
            {
              dataProgramada: {
                lt: inicioHoje,
              },

              status: {
                in: [
                  "PROGRAMADA",
                  "PENDENTE",
                  "EM_EXECUCAO",
                ],
              },
            },
          ],
        },

        select: {
          id: true,
          status: true,
          dataProgramada: true,
          dataConclusao: true,

          plano: {
            select: {
              id: true,
              titulo: true,
              prioridade: true,
              setorId: true,

              maquina: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
        },

        orderBy: {
          dataProgramada: "asc",
        },

        take: 1000,
      }),
    ]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020617] px-3 py-6 text-white sm:px-4 md:px-8">
      <div className="mx-auto w-full max-w-[1900px] space-y-6">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-[0_0_28px_rgba(34,211,238,0.15)]">
              <MapIcon size={28} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
                Visão operacional da planta
              </p>

              <h1 className="break-words text-3xl font-black tracking-tight sm:text-4xl">
                Mapa da Fábrica
              </h1>

              <p className="mt-1 max-w-3xl text-sm text-slate-400 sm:text-base">
                Navegue pela planta, selecione um setor e acompanhe OS,
                máquinas, prioridades e preventivas em tempo real.
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
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-50"
            >
              <ArrowLeft size={17} />
              Voltar
            </Link>
          </div>
        </header>

        <MapaFabricaInterativo
          empresaLabel={
            empresaSequoia
              ? `${empresaSequoia.nome} — ${empresaSequoia.sigla}`
              : "Sequoia"
          }
          agoraISO={agora.toISOString()}
          setores={setores.map((setor) => ({
            id: setor.id,
            nome: setor.nome,
            empresaId: setor.empresaId,
            empresaNome:
              setor.empresa?.nome ?? null,
            empresaSigla:
              setor.empresa?.sigla ?? null,
            maquinas: setor.maquinas,
          }))}
          ordens={ordens.map((os) => ({
            id: os.id,
            numero: os.numero,
            titulo: os.titulo,
            descricao: os.descricao,
            status: os.status,
            prioridade: os.prioridade,
            createdAt: os.createdAt.toISOString(),
            dataPrevista:
              os.dataPrevista?.toISOString() ??
              null,
            dataConclusao:
              os.dataConclusao?.toISOString() ??
              null,
            dataParada:
              os.dataParada?.toISOString() ?? null,
            setorId: os.setorId,
            maquina: os.maquina,
            responsaveis:
              os.responsaveis.map(
                (responsavel) => ({
                  id: responsavel.user.id,
                  nome: responsavel.user.nome,
                })
              ),
          }))}
          preventivas={preventivas.map(
            (preventiva) => ({
              id: preventiva.id,
              status: preventiva.status,
              dataProgramada:
                preventiva.dataProgramada.toISOString(),
              dataConclusao:
                preventiva.dataConclusao?.toISOString() ??
                null,
              plano: {
                id: preventiva.plano.id,
                titulo:
                  preventiva.plano.titulo,
                prioridade:
                  preventiva.plano.prioridade,
                setorId:
                  preventiva.plano.setorId,
                maquina:
                  preventiva.plano.maquina,
              },
            })
          )}
        />
      </div>
    </main>
  );
}
