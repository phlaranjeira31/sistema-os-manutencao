import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ClipboardList,
  Plus,
  AlertTriangle,
  Activity,
  BarChart3,
  Search,
} from "lucide-react";
import { prisma } from "@/src/lib/prisma";
import NovoSetorForm from "@/components/NovoSetorForm";
import EditarSetorInline from "@/components/EditarSetorInline";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
  }>;
};

export default async function SetoresPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const q = String(params?.q ?? "").trim();
  const status = String(params?.status ?? "").trim();

  const setores = await prisma.setor.findMany({
    where: {
      ...(q
        ? {
            nome: {
              contains: q,
              mode: "insensitive",
            },
          }
        : {}),

      ...(status === "ativo"
        ? { ativo: true }
        : status === "inativo"
        ? { ativo: false }
        : {}),
    },
    include: {
      ordens: true,
    },
    orderBy: {
      nome: "asc",
    },
  });

  const totalSetores = setores.length;
  const setoresAtivos = setores.filter((setor: any) => setor.ativo).length;
  const totalOS = setores.reduce((acc: number, setor: any) => acc + setor.ordens.length, 0);

const totalConcluidas = setores.reduce(
  (acc: number, setor: any) =>
    acc + setor.ordens.filter((os: any) => os.status === "CONCLUIDA").length,
  0
);

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-8 text-white md:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* HEADER */}
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-lg shadow-cyan-950/30">
              <Building2 size={26} />
            </div>

            <div>
              <p className="text-sm font-bold text-cyan-300">Gestão</p>
              <h1 className="text-3xl font-black md:text-4xl">Setores</h1>
              <p className="text-slate-400">
                Gerencie setores e acompanhe as ordens de serviço.
              </p>
            </div>
          </div>

          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-lg hover:bg-cyan-50"
          >
            <ArrowLeft size={17} />
            Voltar
          </Link>
        </header>
<section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 backdrop-blur">
  
  {/* CARDS */}
  <div className="mb-6 grid gap-4 md:grid-cols-2">
    <Card title="Setores" value={totalSetores} icon={<Building2 />} />
    <Card title="Ativos" value={setoresAtivos} icon={<CheckCircle2 />} />
  </div>

  {/* FILTRO */}
  <form className="grid gap-4 md:grid-cols-[1fr_220px_160px_130px]">
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
        <Search size={16} />
        Pesquisar setor
      </label>

      <input
        name="q"
        defaultValue={q}
        placeholder="Ex: Manutenção, TI, Administrativo..."
        className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
      />
    </div>

    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
        <CheckCircle2 size={16} />
        Status
      </label>

      <select
        name="status"
        defaultValue={status}
        className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none focus:border-cyan-400"
      >
        <option value="">Todos</option>
        <option value="ativo">Ativos</option>
        <option value="inativo">Inativos</option>
      </select>
    </div>

    <div className="flex items-end">
      <button
        type="submit"
        className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02] hover:bg-cyan-300"
      >
        <Search size={17} />
        Filtrar
      </button>
    </div>
        

            <div className="flex items-end">
              <Link
                href="/admin/setores"
                className="inline-flex h-14 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-black text-white transition hover:bg-white/10"
              >
                Limpar
              </Link>
            </div>
          </form>
        </section>

        {/* NOVO SETOR */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
              <Plus size={20} />
            </div>

            <div>
              <h2 className="text-xl font-black">Adicionar setor</h2>
              <p className="text-sm text-slate-400">
                Setores ativos aparecem na criação de OS.
              </p>
            </div>
          </div>

          <NovoSetorForm />
        </section>

        {/* LISTA */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">Dashboard dos setores</h2>
              <p className="text-sm text-slate-400">
                Visualize desempenho, gargalos e volume de OS por setor.
              </p>
            </div>

            <div className="hidden h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-cyan-300 md:flex">
              <BarChart3 size={20} />
            </div>
          </div>

          {setores.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 p-10 text-center text-slate-400">
              Nenhum setor encontrado com os filtros selecionados.
            </div>
          ) : (
            <div className="grid gap-5">
              {setores.map((setor) => {
                const total = setor.ordens.length;
                const naoIniciadas = setor.ordens.filter(
                  (os) => os.status === "NAO_INICIADA"
                ).length;
                const emAndamento = setor.ordens.filter(
                  (os) => os.status === "EM_ANDAMENTO"
                ).length;
                const abertas = naoIniciadas + emAndamento;
                const concluidas = setor.ordens.filter(
                  (os) => os.status === "CONCLUIDA"
                ).length;
                const canceladas = setor.ordens.filter(
                  (os) => os.status === "CANCELADA"
                ).length;

                const percentual =
                  total > 0 ? Math.round((concluidas / total) * 100) : 0;

                return (
                  <div
                    key={setor.id}
                    className="overflow-hidden rounded-3xl border border-white/10 bg-[#080d1f] shadow-xl transition hover:border-cyan-400/40"
                  >
                    <div className="grid gap-5 p-5 xl:grid-cols-[1fr_360px]">
                      <div className="min-w-0 space-y-5">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="break-words text-2xl font-black">
                                {setor.nome}
                              </h3>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-black ${
                                  setor.ativo
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : "bg-red-500/20 text-red-300"
                                }`}
                              >
                                {setor.ativo ? "Ativo" : "Inativo"}
                              </span>
                            </div>

                            <p className="mt-1 text-sm text-slate-400">
                              {total} ordem(ns) de serviço vinculada(s).
                            </p>
                          </div>

                          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#050816] px-4 py-3">
                            <Activity size={18} className="text-cyan-300" />
                            <div>
                              <p className="text-xs font-bold uppercase text-slate-400">
                                Resolução
                              </p>
                              <p className="text-xl font-black text-white">
                                {percentual}%
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <Mini label="Total" value={total} color="cyan" />
                          <Mini label="Abertas" value={abertas} color="orange" />
                          <Mini
                            label="Concluídas"
                            value={concluidas}
                            color="green"
                          />
                          <Mini
                            label="Canceladas"
                            value={canceladas}
                            color="red"
                          />
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-[#050816] p-4">
                          <div className="mb-4 flex items-center justify-between text-xs font-bold text-slate-400">
                            <span>Distribuição das OS</span>
                            <span>{total} total</span>
                          </div>

                          <div className="flex flex-col items-center gap-5 md:flex-row md:items-center">
                            <div
                              className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full"
                              style={{
                                background:
                                  total > 0
                                    ? `conic-gradient(
                                        #facc15 0 ${Math.round(
                                          (naoIniciadas / total) * 100
                                        )}%,
                                        #22d3ee ${Math.round(
                                          (naoIniciadas / total) * 100
                                        )}% ${Math.round(
                                          ((naoIniciadas + emAndamento) /
                                            total) *
                                            100
                                        )}%,
                                        #34d399 ${Math.round(
                                          ((naoIniciadas + emAndamento) /
                                            total) *
                                            100
                                        )}% ${Math.round(
                                          ((naoIniciadas +
                                            emAndamento +
                                            concluidas) /
                                            total) *
                                            100
                                        )}%,
                                        #f87171 ${Math.round(
                                          ((naoIniciadas +
                                            emAndamento +
                                            concluidas) /
                                            total) *
                                            100
                                        )}% 100%
                                      )`
                                    : "#1e293b",
                              }}
                            >
                              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-[#050816]">
                                <span className="text-2xl font-black text-white">
                                  {total}
                                </span>
                                <span className="text-xs font-bold text-slate-400">
                                  OS
                                </span>
                              </div>
                            </div>

                            <div className="w-full space-y-3">
                              <Legenda
                                label="Não iniciadas"
                                value={naoIniciadas}
                                color="bg-yellow-400"
                              />
                              <Legenda
                                label="Em andamento"
                                value={emAndamento}
                                color="bg-cyan-400"
                              />
                              <Legenda
                                label="Concluídas"
                                value={concluidas}
                                color="bg-emerald-400"
                              />
                              <Legenda
                                label="Canceladas"
                                value={canceladas}
                                color="bg-red-400"
                              />
                            </div>
                          </div>
                        </div>

                        {abertas > 0 && (
                          <div className="flex items-center gap-2 rounded-2xl border border-orange-400/20 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-300">
                            <AlertTriangle size={16} />
                            Atenção: este setor possui OS em aberto.
                          </div>
                        )}
                      </div>

                      <EditarSetorInline setor={setor} />
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

function Card({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#080d1f] p-5 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-3xl font-black">{value}</p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
          {icon}
        </div>
      </div>
    </div>
  );
}

function Mini({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "cyan" | "orange" | "green" | "red";
}) {
  const colors = {
    cyan: "text-cyan-300 bg-cyan-500/10 border-cyan-400/20",
    orange: "text-orange-300 bg-orange-500/10 border-orange-400/20",
    green: "text-emerald-300 bg-emerald-500/10 border-emerald-400/20",
    red: "text-red-300 bg-red-500/10 border-red-400/20",
  };

  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-bold uppercase opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function Legenda({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="flex items-center gap-2">
        <span className={`h-3 w-3 rounded-full ${color}`} />
        <span className="text-sm font-bold text-slate-300">{label}</span>
      </div>

      <span className="text-sm font-black text-white">{value}</span>
    </div>
  );
}