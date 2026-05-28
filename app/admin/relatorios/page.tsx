import Link from "next/link";
import {
  FileText,
  ClipboardList,
  ArrowLeft,
  Search,
  User,
  Building2,
  CalendarDays,
  Eye,
} from "lucide-react";
import { prisma } from "@/src/lib/prisma";

type PageProps = {
  searchParams?: Promise<{
    os?: string;
    colaborador?: string;
    dataInicio?: string;
    dataFim?: string;
    setor?: string;
  }>;
};

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

export default async function RelatoriosPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const osFiltro = String(params?.os ?? "").trim();
  const colaboradorFiltro = String(params?.colaborador ?? "").trim();
  const dataInicioFiltro = String(params?.dataInicio ?? "").trim();
  const dataFimFiltro = String(params?.dataFim ?? "").trim();
  const setorFiltro = String(params?.setor ?? "").trim();

  const dataInicio = dataInicioFiltro
    ? new Date(`${dataInicioFiltro}T00:00:00`)
    : null;

  const dataFim = dataFimFiltro
    ? new Date(`${dataFimFiltro}T23:59:59`)
    : null;

  const [relatorios, colaboradores, setores] = await Promise.all([
    prisma.ordemServico.findMany({
      where: {
        registroFinal: {
          not: null,
        },

        ...(osFiltro ? { numero: Number(osFiltro) } : {}),

        ...(colaboradorFiltro
          ? {
              responsaveis: {
                some: {
                  userId: colaboradorFiltro,
                },
              },
            }
          : {}),

        ...(setorFiltro ? { setorId: setorFiltro } : {}),

        ...(dataInicio || dataFim
          ? {
              updatedAt: {
                ...(dataInicio ? { gte: dataInicio } : {}),
                ...(dataFim ? { lte: dataFim } : {}),
              },
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
        updatedAt: "desc",
      },
    }),

    prisma.user.findMany({
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
  ]);

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-8 text-white md:px-10">
      <div className="mx-auto max-w-[1600px] space-y-8">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-lg shadow-cyan-950/30">
              <FileText size={26} />
            </div>

            <div>
              <p className="text-sm font-bold text-cyan-300">Documentos</p>
              <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                Relatórios
              </h1>
              <p className="mt-1 text-slate-400">
                Relatórios salvos por número da OS.
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

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 backdrop-blur">
          <form className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
                <Search size={16} />
                Número da OS
              </label>

              <input
                name="os"
                defaultValue={osFiltro}
                type="number"
                placeholder="Ex: 7"
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
                defaultValue={colaboradorFiltro}
                className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-400"
              >
                <option value="">Todos</option>
                {colaboradores.map((colaborador: any) => (
                  <option key={colaborador.id} value={colaborador.id}>
                    {colaborador.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3">
              <label className="mb-1 flex items-center gap-2 text-sm font-bold text-slate-400">
                <CalendarDays size={16} />
                Período
              </label>

              <input
                name="dataInicio"
                defaultValue={dataInicioFiltro}
                type="date"
                className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-400"
              />

              <input
                name="dataFim"
                defaultValue={dataFimFiltro}
                type="date"
                className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
                <Building2 size={16} />
                Setor
              </label>

              <select
                name="setor"
                defaultValue={setorFiltro}
                className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-400"
              >
                <option value="">Todos</option>
                {setores.map((setor: any) => (
                  <option key={setor.id} value={setor.id}>
                    {setor.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row xl:col-span-4">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02] hover:bg-cyan-300"
              >
                <Search size={17} />
                Filtrar
              </button>

              <Link
                href="/admin/relatorios"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
              >
                Limpar filtros
              </Link>
            </div>
          </form>

          {relatorios.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-[#080d1f] p-8">
              <p className="text-slate-400">
                Nenhum relatório encontrado com os filtros selecionados.
              </p>

              <Link
                href="/admin/os"
                className="mt-5 inline-flex rounded-2xl bg-cyan-400 px-5 py-3 font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02] hover:bg-cyan-300"
              >
                Ver ordens de serviço
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {relatorios.map((os: any) => (
                <div
                  key={os.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-[#060b1a] shadow-xl transition hover:-translate-y-1 hover:border-cyan-400/20"
                >
                  <div className="border-b border-white/10 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-cyan-300">
                          OS #{os.numero}
                        </p>

                        <h3 className="mt-1 break-words text-xl font-black text-white">
                          {os.titulo}
                        </h3>
                      </div>

                      <Link
                        href={`/admin/relatorios/${os.id}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-200 transition hover:bg-cyan-500/20"
                      >
                        <Eye size={14} />
                        Ver relatório
                      </Link>
                    </div>
                  </div>

                  <div className="grid gap-3 p-4">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Building2 size={16} />
                        <span className="text-xs font-bold uppercase tracking-wide">
                          Setor
                        </span>
                      </div>

                      <p className="mt-2 font-bold text-white">
                        {os.setor?.nome ?? "-"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <User size={16} />
                        <span className="text-xs font-bold uppercase tracking-wide">
                          Responsável
                        </span>
                      </div>

                      <p className="mt-2 line-clamp-2 font-bold text-white">
                        {os.responsaveis.length
                          ? os.responsaveis.map((r) => r.user.nome).join(", ")
                          : "-"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <CalendarDays size={16} />
                        <span className="text-xs font-bold uppercase tracking-wide">
                          Atualizado em
                        </span>
                      </div>

                      <p className="mt-2 font-bold text-white">
                        {formatDate(os.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-white/10 bg-[#050816]/80 p-4">
                    <div className="rounded-2xl border border-white/10 bg-[#020617]/70 p-4">
                      <p className="mb-2 text-sm font-black text-white">
                        Relatório
                      </p>

                      <p className="line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-slate-300">
                        {os.registroFinal}
                      </p>
                    </div>
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