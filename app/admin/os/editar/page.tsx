import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Search,
  Settings,
  User,
  ClipboardList,
} from "lucide-react";
import { prisma } from "@/src/lib/prisma";
import ExcluirOSButton from "@/components/ExcluirOSButton";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
  }>;
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

export default async function EditarOSPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const q = String(params?.q ?? "").trim();
  const status = String(params?.status ?? "").trim();

  const ordens = await prisma.ordemServico.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { titulo: { contains: q, mode: "insensitive" } },
              { descricao: { contains: q, mode: "insensitive" } },
              {
                setor: {
                  nome: { contains: q, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),

      ...(status
        ? {
            status: status as any,
          }
        : {}),
    },

    include: {
      setor: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-10">
        <header className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-lg shadow-cyan-950/30">
              <Settings size={26} />
            </div>

            <div>
              <p className="mb-1 text-sm font-bold text-cyan-300">
                Gerenciamento
              </p>

              <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                Editar Ordens de Serviço
              </h1>

              <p className="mt-1 text-slate-400">
                Edite ou exclua ordens de serviço cadastradas.
              </p>
            </div>
          </div>

          <Link
            href="/admin"
            className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/10 bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:scale-[1.02] hover:bg-cyan-50"
          >
            <ArrowLeft size={17} />
            Voltar
          </Link>
        </header>
        <section className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 backdrop-blur">
          <form className="grid gap-4 xl:grid-cols-[1fr_280px_280px_170px_120px]">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
                <Search size={16} />
                Pesquisar
              </label>

              <input
                name="q"
                defaultValue={q}
                placeholder="Título, descrição ou setor..."
                className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
                <User size={16} />
                Colaborador
              </label>

              <select className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none focus:border-cyan-400">
                <option>Todos</option>
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
                className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none focus:border-cyan-400"
              >
                <option value="">Todos</option>
                <option value="NAO_INICIADA">Não iniciada</option>
                <option value="EM_ANDAMENTO">Em andamento</option>
                <option value="CONCLUIDA">Concluída</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02] hover:bg-cyan-300"
              >
                <Search size={18} />
                Filtrar
              </button>
            </div>

            <div className="flex items-end">
              <Link
                href="/admin/os/editar"
                className="inline-flex h-14 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-black text-white transition hover:bg-white/10"
              >
                Limpar
              </Link>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 backdrop-blur md:p-6">
          {ordens.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-[#080d1f] p-10 text-center text-slate-400">
              Nenhuma ordem de serviço encontrada.
            </div>
          ) : (
            <div className="grid gap-4">
              {ordens.map((os: any) =>(
                <div
                  key={os.id}
                  className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-[#080d1f] p-5 shadow-lg shadow-black/20 transition hover:border-cyan-400/40 hover:bg-[#0b1228] md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-cyan-300">
                        OS #{os.numero}
                      </span>
                    </div>

                    <h2 className="break-words text-xl font-black text-white">
                      {os.titulo}
                    </h2>

                    <p className="mt-3 text-sm font-medium text-slate-400">
                      <strong className="text-slate-200">Setor:</strong>{" "}
                      {os.setor?.nome ?? "-"} ·{" "}
                      <strong className="text-slate-200">Status:</strong>{" "}
                      {statusLabel(os.status)} ·{" "}
                      <strong className="text-slate-200">Criada em:</strong>{" "}
                      {formatDate(os.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link
                      href={`/admin/os/editar/${os.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-200 transition hover:bg-cyan-400 hover:text-slate-950"
                    >
                      <Edit size={17} />
                      Editar
                    </Link>

                    <ExcluirOSButton osId={os.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}