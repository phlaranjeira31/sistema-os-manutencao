import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUp,
  CalendarDays,
  ClipboardList,
  Clock3,
  FileText,
  Info,
  UserRound,
} from "lucide-react";

import { prisma } from "@/src/lib/prisma";
import AtualizarStatusOS from "@/components/AtualizarStatusOS";
import GaleriaArquivosOS from "@/components/GaleriaArquivosOS";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(
  date: Date | string | null | undefined
) {
  if (!date) return "-";

  const valor = new Date(date);

  if (Number.isNaN(valor.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(valor);
}

function formatDateTime(
  date: Date | string | null | undefined
) {
  if (!date) return "-";

  const valor = new Date(date);

  if (Number.isNaN(valor.getTime())) {
    return "-";
  }

  const dataFormatada = new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "America/Sao_Paulo",
    }
  ).format(valor);

  const horarioFormatado = new Intl.DateTimeFormat(
    "pt-BR",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/Sao_Paulo",
    }
  ).format(valor);

  return `${dataFormatada} às ${horarioFormatado}`;
}

function prioridadeLabel(
  prioridade: string | null | undefined
) {
  const labels: Record<string, string> = {
    BAIXA: "Baixa",
    MEDIA: "Média",
    ALTA: "Alta",
    URGENTE: "Urgente",
  };

  return (
    labels[prioridade ?? ""] ??
    prioridade ??
    "-"
  );
}

function prioridadeClasses(
  prioridade: string | null | undefined
) {
  const classes: Record<string, string> = {
    BAIXA:
      "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
    MEDIA:
      "border-yellow-400/30 bg-yellow-500/10 text-yellow-300",
    ALTA:
      "border-orange-400/30 bg-orange-500/10 text-orange-300",
    URGENTE:
      "border-red-400/30 bg-red-500/10 text-red-300",
  };

  return (
    classes[prioridade ?? ""] ??
    "border-white/10 bg-white/5 text-white"
  );
}

export const dynamic = "force-dynamic";

export default async function OSDetalhePage({
  params,
}: PageProps) {
  const { id } = await params;

  const os =
    await prisma.ordemServico.findUnique({
      where: {
        id,
      },

      include: {
        fotos: true,
        setor: true,

        responsaveis: {
          include: {
            user: true,
          },
        },

        criadoPor: true,
      },
    });

  if (!os) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.10),_transparent_32%),linear-gradient(180deg,_#020617_0%,_#030817_100%)] px-4 py-4 text-white sm:px-5 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-400/10 text-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.15)]">
              <ClipboardList size={23} />
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                OS #{os.numero}
              </h1>

              <p className="mt-0.5 truncate text-xs font-black uppercase tracking-[0.08em] text-cyan-300 sm:text-sm">
                {os.titulo}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {!os.registroFinal && (
              <Link
                href={`/admin/relatorios/${os.id}`}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 text-sm font-black text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.10)] transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-400/15 sm:w-auto"
              >
                <FileText size={16} />
                Escrever relatório
              </Link>
            )}

            <Link
              href="/admin/os"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 sm:w-auto"
            >
              <ArrowLeft size={16} />
              Voltar
            </Link>
          </div>
        </header>

        <section className="relative overflow-visible rounded-3xl border border-white/10 bg-[#071022]/80 p-4 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-5">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
              <Info size={18} />
            </div>

            <div>
              <h2 className="text-lg font-black text-white sm:text-xl">
                Informações da Ordem de Serviço
              </h2>

              <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                Dados completos e situação atual da OS
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <InfoCard
              label="Título"
              value={os.titulo}
            />

            <InfoCard
              label="Setor"
              value={os.setor?.nome ?? "-"}
            />

            <div className="relative z-40 rounded-2xl border border-white/10 bg-[#050b1a]/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
              <p className="text-xs font-bold text-slate-400">
                Status
              </p>

              <div className="mt-2">
                <AtualizarStatusOS
                  osId={os.id}
                  statusAtual={os.status}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#050b1a]/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
              <p className="text-xs font-bold text-slate-400">
                Prioridade
              </p>

              <div className="mt-2">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-black ${prioridadeClasses(
                    os.prioridade
                  )}`}
                >
                  <ArrowUp size={15} />
                  {prioridadeLabel(os.prioridade)}
                </span>
              </div>
            </div>

            <InfoCard
              label="Criada em"
              icon={
                <CalendarDays
                  size={17}
                  className="shrink-0 text-cyan-300"
                />
              }
              value={formatDateTime(os.createdAt)}
            />

            <InfoCard
              label="Criada por"
              icon={
                <UserRound
                  size={17}
                  className="shrink-0 text-cyan-300"
                />
              }
              value={
                <span className="text-cyan-300">
                  {os.criadoPor?.nome ?? "-"}
                </span>
              }
            />

            <InfoCard
              label="Máquina parada desde"
              icon={
                <Clock3
                  size={17}
                  className="shrink-0 text-orange-300"
                />
              }
              value={
                <span className="text-orange-300">
                  {formatDateTime(os.dataParada)}
                </span>
              }
            />

            <InfoCard
              label="Atualizada em"
              icon={
                <CalendarDays
                  size={17}
                  className="shrink-0 text-cyan-300"
                />
              }
              value={formatDate(os.updatedAt)}
            />
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-[#050b1a]/90 p-4">
            <p className="text-xs font-bold text-slate-400">
              Descrição
            </p>

            <div className="mt-2 flex gap-3">
              <div className="w-1 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.55)]" />

              <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-slate-200">
                {os.descricao || "-"}
              </p>
            </div>
          </div>

          {os.fotos.length > 0 && (
            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-white sm:text-base">
                    Fotos e vídeos da OS
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                    Arquivos adicionados durante a
                    abertura da ordem
                  </p>
                </div>

                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 px-2.5 text-xs font-black text-slate-300">
                  {os.fotos.length}
                </span>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#050b1a]/70 p-3">
                <GaleriaArquivosOS
                  arquivos={os.fotos}
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#050b1a]/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] transition hover:border-white/15">
      <p className="text-xs font-bold text-slate-400">
        {label}
      </p>

      <div className="mt-2 flex items-center gap-2 break-words text-sm font-black text-white sm:text-base">
        {icon}
        {value}
      </div>
    </div>
  );
}