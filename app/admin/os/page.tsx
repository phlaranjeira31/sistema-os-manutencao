import Link from "next/link";
import {
  Plus,
  Search,
  ClipboardList,
  ArrowLeft,
  Calendar,
  User,
  Building2,
  Eye,
} from "lucide-react";
import { prisma } from "../../../src/lib/prisma";
import AtribuirOSForm from "@/components/AtribuirOSForm";

type PageProps = {
  searchParams?: Promise<{ q?: string; status?: string; colaborador?: string }>;
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

function statusClasses(status: string) {
  const map: Record<string, string> = {
    NAO_INICIADA: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
    EM_ANDAMENTO: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
    CONCLUIDA: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    CANCELADA: "border-red-500/20 bg-red-500/10 text-red-300",
  };

  return map[status] ?? "border-white/10 bg-white/5 text-white";
}

function prioridadeClasses(prioridade: string | null | undefined) {
  const map: Record<string, string> = {
    BAIXA: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    MEDIA: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
    ALTA: "border-orange-500/20 bg-orange-500/10 text-orange-300",
    URGENTE: "border-red-500/20 bg-red-500/10 text-red-300",
  };

  return map[prioridade ?? ""] ?? "border-white/10 bg-white/5 text-white";
}

export default async function OrdensServicoPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const q = String(params?.q ?? "").trim();
  const status = String((params as any)?.status ?? "").trim();
  const colaboradorId = String((params as any)?.colaborador ?? "").trim();

  const [ordens, colaboradores] = await Promise.all([
    prisma.ordemServico.findMany({
      where: {
        ...(status ? { status: status as any } : {}),

        ...(colaboradorId
          ? {
              responsaveis: {
                some: {
                  userId: colaboradorId,
                },
              },
            }
          : {}),

        ...(q
          ? {
              OR: [
                { titulo: { contains: q, mode: "insensitive" } },
                { descricao: { contains: q, mode: "insensitive" } },
                {
                  setor: {
                    nome: {
                      contains: q,
                      mode: "insensitive",
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        setor: true,
        responsaveis: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
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

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020617] px-3 py-6 text-white sm:px-4 md:px-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-6 md:space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.18)]">
              <ClipboardList size={28} />
            </div>

            <div className="min-w-0">
              <h1 className="break-words text-2xl font-black tracking-tight md:text-4xl">
                Ordens de Serviço
              </h1>

              <p className="mt-1 break-words text-sm text-slate-400 md:text-base">
                Visualize, acompanhe e distribua as OS da manutenção.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/admin"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 sm:w-auto"
            >
              <ArrowLeft size={17} />
              Voltar
            </Link>

            <Link
              href="/admin/os/nova"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/20 px-5 py-3 text-sm font-bold text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.15)] transition hover:bg-cyan-400/20 sm:w-auto"
            >
              <Plus size={18} />
              Nova OS
            </Link>
          </div>
        </header>
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/30 backdrop-blur sm:p-6">
          <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
                <Search size={16} />
                Pesquisar
              </label>

              <input
                name="q"
                defaultValue={q}
                placeholder="Título, descrição ou setor..."
                className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
                <User size={16} />
                Colaborador
              </label>

              <select
                name="colaborador"
                defaultValue={colaboradorId}
                className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-400"
              >
                <option value="">Todos</option>

                {colaboradores.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
                <ClipboardList size={16} />
                Status
              </label>

              <select
                name="status"
                defaultValue={status}
                className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-400"
              >
                <option value="">Todos</option>
                <option value="NAO_INICIADA">Não iniciada</option>
                <option value="EM_ANDAMENTO">Em andamento</option>
                <option value="CONCLUIDA">Concluída</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>

            <div className="flex items-end gap-3">
              <button
                type="submit"
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02] hover:bg-cyan-300"
              >
                <Search size={17} />
                Filtrar
              </button>

              <Link
                href="/admin/os"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-black text-white transition hover:bg-white/10"
              >
                Limpar
              </Link>
            </div>
          </form>
        </section>
        <section className="space-y-5">
          <div>
            <h2 className="text-xl font-black md:text-2xl">Planner de OS</h2>

            <p className="mt-1 text-sm text-slate-400">
              Clique em uma OS para visualizar detalhes completos.
            </p>
          </div>

          {ordens.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-500">
              Nenhuma ordem de serviço encontrada.
            </div>
          ) : (
            <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {ordens.map((os) => {
                const responsaveisTexto = os.responsaveis.length
                  ? os.responsaveis.map((r) => r.user.nome).join(", ")
                  : "Não atribuído";

                const jaAtribuida = os.responsaveis.length > 0;

                return (
                  <div
                    key={os.id}
                    className="flex h-full min-h-[500px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#060b1a] shadow-xl transition hover:-translate-y-1 hover:border-cyan-400/20"
                  >
                    <div className="flex min-h-[150px] flex-col border-b border-white/10 p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-cyan-300">
                            OS #{os.numero}
                          </p>

                          <h3 className="mt-1 line-clamp-2 break-words text-xl font-black text-white">
                            {os.titulo}
                          </h3>
                        </div>

                        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                          <div className="flex flex-wrap gap-2 sm:justify-end">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-black ${statusClasses(
                                os.status
                              )}`}
                            >
                              {statusLabel(os.status)}
                            </span>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-black ${prioridadeClasses(
                                os.prioridade
                              )}`}
                            >
                              {prioridadeLabel(os.prioridade)}
                            </span>
                          </div>

                          <Link
                            href={`/admin/os/${os.id}`}
                            className="inline-flex w-fit items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-200 transition hover:bg-cyan-500/20"
                          >
                            <Eye size={14} />
                            Ver detalhes
                          </Link>
                        </div>
                      </div>

                      <p className="mt-4 line-clamp-2 min-h-[44px] text-sm leading-relaxed text-slate-400">
                        {os.descricao || "Sem descrição cadastrada."}
                      </p>
                    </div>
                    <div className="grid flex-1 content-start gap-3 p-4">
                      <InfoCard
                        icon={<Building2 size={16} />}
                        label="Setor"
                        value={os.setor?.nome ?? "Sem setor"}
                      />

                      <InfoCard
                        icon={<Calendar size={16} />}
                        label="Criada em"
                        value={formatDate(os.createdAt)}
                      />

                      <InfoCard
                        icon={<User size={16} />}
                        label="Responsável"
                        value={responsaveisTexto}
                      />
                    </div>
                    <div className="mt-auto border-t border-white/10 bg-[#050816]/80 p-4">
                      {jaAtribuida ? (
                        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                          <p className="text-sm font-black text-emerald-300">
                            OS já atribuída
                          </p>

                          <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-300">
                            Responsável: {responsaveisTexto}
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-white/10 bg-[#020617]/70 p-4">
                          <p className="mb-3 text-sm font-bold text-slate-300">
                            Enviar OS para colaborador
                          </p>

                          <AtribuirOSForm
                            osId={os.id}
                            colaboradores={colaboradores}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-h-[76px] rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wide">
          {label}
        </span>
      </div>

      <p className="mt-2 line-clamp-2 break-words font-bold text-white">
        {value}
      </p>
    </div>
  );
}