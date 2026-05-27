import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList, FileText } from "lucide-react";
import { prisma } from "@/src/lib/prisma";
import AtualizarStatusOS from "@/components/AtualizarStatusOS";
import GaleriaArquivosOS from "@/components/GaleriaArquivosOS";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    NAO_INICIADA: "Não iniciada",
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDA: "Concluída",
    CANCELADA: "Cancelada",
  };

  return map[status] ?? status;
}

function prioridadeLabel(prioridade: string | null | undefined) {
  const map: Record<string, string> = {
    BAIXA: "Baixa",
    MEDIA: "Média",
    ALTA: "Alta",
    URGENTE: "Urgente",
  };

  return map[prioridade ?? ""] ?? prioridade ?? "-";
}

export default async function OSDetalhePage({ params }: PageProps) {
  const { id } = await params;

  const os = await prisma.ordemServico.findUnique({
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

  if (!os) return notFound();

  return (
    <main className="min-h-screen bg-[#020617] px-4 py-8 text-white md:px-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-white/5 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
              <ClipboardList size={24} />
            </div>

            <div>
              <h1 className="text-3xl font-black text-white">
                OS #{os.numero}
              </h1>
              <p className="text-slate-400">{os.titulo}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {!os.registroFinal && (
              <Link
                href={`/admin/relatorios/${os.id}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/20 px-4 py-3 text-sm font-bold text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.15)] transition hover:bg-cyan-400/20 sm:w-fit"
              >
                <FileText size={17} />
                Escrever relatório
              </Link>
            )}

            <Link
              href="/admin/os"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10 sm:w-fit"
            >
              <ArrowLeft size={17} />
              Voltar
            </Link>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_25px_rgba(34,211,238,0.08)] backdrop-blur-xl">
          <h2 className="text-xl font-black text-white">
            Informações da Ordem de Serviço
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Info label="Título" value={os.titulo} />
            <Info label="Setor" value={os.setor?.nome ?? "-"} />

            <Info
              label="Status"
              value={
                <AtualizarStatusOS osId={os.id} statusAtual={os.status} />
              }
            />

            <div className="rounded-2xl border border-white/10 bg-[#020617]/70 p-4 shadow-sm">
              <p className="text-sm font-bold text-slate-400">
                Prioridade
              </p>

              <div className="mt-3">
                <span
                  className={`
        inline-flex items-center rounded-full px-4 py-2 text-sm font-black border
        ${
          os.prioridade === "BAIXA"
            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
            : os.prioridade === "MEDIA"
            ? "border-yellow-500/30 bg-yellow-500/15 text-yellow-300"
            : os.prioridade === "ALTA"
            ? "border-orange-500/30 bg-orange-500/15 text-orange-300"
            : "border-red-500/30 bg-red-500/15 text-red-300"
        }
      `}
                >
                  {prioridadeLabel(os.prioridade)}
                </span>
              </div>
            </div>

            <Info label="Criada em" value={formatDate(os.createdAt)} />

<Info
  label="Criada por"
  value={
    <span className="text-cyan-300 font-black">
      {os.criadoPor?.nome ?? "-"}
    </span>
  }
/>

<Info label="Atualizada em" value={formatDate(os.updatedAt)} />
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm font-bold text-slate-400">
              Descrição
            </p>

            <div className="rounded-2xl border border-white/10 bg-[#020617]/70 p-4 text-slate-300">
              {os.descricao || "-"}
            </div>
          </div>

          {os.fotos.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-sm font-bold text-slate-400">
                Fotos e vídeos da OS
              </p>

              <GaleriaArquivosOS arquivos={os.fotos} />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#020617]/70 p-4 shadow-sm">
      <p className="text-sm font-bold text-slate-400">{label}</p>
      <div className="mt-1 font-bold text-white">{value}</div>
    </div>
  );
}