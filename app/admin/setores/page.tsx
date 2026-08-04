import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  Plus,
  Search,
} from "lucide-react";
import { prisma } from "@/src/lib/prisma";
import NovoSetorForm from "@/components/NovoSetorForm";
import EditarSetorInline from "@/components/EditarSetorInline";
import GerenciarMaquinasSetor from "@/components/GerenciarMaquinasSetor";

type PageProps = {
  searchParams?: Promise<{
    empresaId?: string;
    q?: string;
    status?: string;
  }>;
};

const ORDEM_EMPRESAS: Record<string, number> = {
  SEQ: 1,
  SHA: 2,
  OCO: 3,
};

const COR_EMPRESAS: Record<string, string> = {
  SEQ: "#E31E24",
  SHA: "#003E71",
  OCO: "#517F3B",
};

function corDaFaixaEmpresa(
  sigla: string | null | undefined,
  corCadastrada: string | null | undefined
) {
  return COR_EMPRESAS[sigla ?? ""] ?? corCadastrada ?? "#22D3EE";
}

export const dynamic = "force-dynamic";

export default async function SetoresPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const empresaIdInformada = String(
    params?.empresaId ?? ""
  ).trim();

  const q = String(params?.q ?? "").trim();
  const status = String(params?.status ?? "").trim();

  const empresasEncontradas = await prisma.empresa.findMany({
    where: {
      sigla: {
        in: ["SEQ", "SHA", "OCO"],
      },
    },

    select: {
      id: true,
      nome: true,
      sigla: true,
      ativo: true,
      cor: true,
    },
  });

  const empresas = empresasEncontradas.sort(
    (a, b) =>
      (ORDEM_EMPRESAS[a.sigla] ?? 99) -
      (ORDEM_EMPRESAS[b.sigla] ?? 99)
  );

  const empresaSelecionada =
    empresas.find(
      (empresa) => empresa.id === empresaIdInformada
    ) ??
    empresas.find((empresa) => empresa.sigla === "SEQ") ??
    empresas[0] ??
    null;

  const empresaId = empresaSelecionada?.id ?? "";

  const setores = empresaId
    ? await prisma.setor.findMany({
        where: {
          empresaId,

          ...(q
            ? {
                nome: {
                  contains: q,
                  mode: "insensitive",
                },
              }
            : {}),

          ...(status === "ativo"
            ? {
                ativo: true,
              }
            : status === "inativo"
              ? {
                  ativo: false,
                }
              : {}),
        },

        include: {
          empresa: {
            select: {
              id: true,
              nome: true,
              sigla: true,
              cor: true,
            },
          },

          maquinas: {
            orderBy: {
              nome: "asc",
            },
          },

          _count: {
            select: {
              ordens: true,
            },
          },
        },

        orderBy: {
          nome: "asc",
        },
      })
    : [];

  const idsSetores = setores.map((setor) => setor.id);

  const agrupamentoStatus = idsSetores.length
    ? await prisma.ordemServico.groupBy({
        by: ["setorId", "status"],

        where: {
          setorId: {
            in: idsSetores,
          },
        },

        _count: {
          _all: true,
        },
      })
    : [];

  type ResumoStatusSetor = {
    naoIniciadas: number;
    emAndamento: number;
    concluidas: number;
    canceladas: number;
  };

  const resumoStatusPorSetor =
    new Map<string, ResumoStatusSetor>();

  for (const item of agrupamentoStatus) {
    const resumoAtual =
      resumoStatusPorSetor.get(item.setorId) ?? {
        naoIniciadas: 0,
        emAndamento: 0,
        concluidas: 0,
        canceladas: 0,
      };

    if (item.status === "NAO_INICIADA") {
      resumoAtual.naoIniciadas =
        item._count._all;
    }

    if (item.status === "EM_ANDAMENTO") {
      resumoAtual.emAndamento =
        item._count._all;
    }

    if (item.status === "CONCLUIDA") {
      resumoAtual.concluidas =
        item._count._all;
    }

    if (item.status === "CANCELADA") {
      resumoAtual.canceladas =
        item._count._all;
    }

    resumoStatusPorSetor.set(
      item.setorId,
      resumoAtual
    );
  }

  const totalSetores = setores.length;

  const setoresAtivos = setores.filter(
    (setor) => setor.ativo
  ).length;

  const totalOS = setores.reduce(
    (total, setor) =>
      total + setor._count.ordens,
    0
  );

  const totalConcluidas = setores.reduce(
    (total, setor) =>
      total +
      (resumoStatusPorSetor.get(setor.id)
        ?.concluidas ?? 0),
    0
  );

  const corEmpresa =
    empresaSelecionada?.cor || "#22D3EE";

  const corFaixaEmpresa = corDaFaixaEmpresa(
    empresaSelecionada?.sigla,
    empresaSelecionada?.cor
  );

  const limparHref = empresaId
    ? `/admin/setores?empresaId=${encodeURIComponent(
        empresaId
      )}`
    : "/admin/setores";

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-8 text-white md:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-lg shadow-cyan-950/30">
              <Building2 size={26} />
            </div>

            <div>
              <p className="text-sm font-bold text-cyan-300">
                Gestão
              </p>

              <h1 className="text-3xl font-black md:text-4xl">
                Setores
              </h1>

              <p className="text-slate-400">
                Gerencie os setores separadamente por empresa.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {empresaSelecionada && (
              <Link
                href={`/admin/empresas/${empresaSelecionada.sigla.toLowerCase()}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
              >
                <Building2 size={17} />
                Dashboard da empresa
              </Link>
            )}

            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:bg-cyan-50"
            >
              <ArrowLeft size={17} />
              Voltar
            </Link>
          </div>
        </header>

        {empresaSelecionada && (
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#080d1f] shadow-xl">
            <div
              className="h-1.5 w-full"
              style={{
                backgroundColor: corFaixaEmpresa,
              }}
            />

            <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border"
                  style={{
                    borderColor: `${corEmpresa}55`,
                    backgroundColor: `${corEmpresa}15`,
                    color: corEmpresa,
                  }}
                >
                  <Building2 size={23} />
                </div>

                <div>
                  <p
                    className="text-xs font-black uppercase tracking-wider"
                    style={{
                      color: corEmpresa,
                    }}
                  >
                    Empresa selecionada
                  </p>

                  <h2 className="text-2xl font-black">
                    {empresaSelecionada.nome}
                  </h2>
                </div>
              </div>

              <span
                className={`w-fit rounded-full px-3 py-1.5 text-xs font-black ${
                  empresaSelecionada.ativo
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-red-500/15 text-red-300"
                }`}
              >
                {empresaSelecionada.ativo
                  ? "Empresa ativa"
                  : "Empresa inativa"}
              </span>
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card
              title="Setores encontrados"
              value={totalSetores}
              icon={<Building2 />}
            />

            <Card
              title="Setores ativos"
              value={setoresAtivos}
              icon={<CheckCircle2 />}
            />

            <Card
              title="Ordens de serviço"
              value={totalOS}
              icon={<ClipboardList />}
            />

            <Card
              title="OS concluídas"
              value={totalConcluidas}
              icon={<CheckCircle2 />}
            />
          </div>

          <form className="grid gap-4 lg:grid-cols-[260px_1fr_220px_160px_130px]">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
                <Building2 size={16} />
                Empresa
              </label>

              <select
                name="empresaId"
                defaultValue={empresaId}
                disabled={empresas.length === 0}
                className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {empresas.length === 0 ? (
                  <option value="">
                    Nenhuma empresa encontrada
                  </option>
                ) : (
                  empresas.map((empresa) => (
                    <option
                      key={empresa.id}
                      value={empresa.id}
                    >
                      {empresa.nome} — {empresa.sigla}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
                <Search size={16} />
                Pesquisar setor
              </label>

              <input
                name="q"
                defaultValue={q}
                placeholder="Ex: Manutenção, Produção, Administrativo..."
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
                disabled={empresas.length === 0}
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02] hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Search size={17} />
                Filtrar
              </button>
            </div>

            <div className="flex items-end">
              <Link
                href={limparHref}
                className="inline-flex h-14 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-black text-white transition hover:bg-white/10"
              >
                Limpar
              </Link>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
              <Plus size={20} />
            </div>

            <div>
              <h2 className="text-xl font-black">
                Adicionar setor
              </h2>

              <p className="text-sm text-slate-400">
                Escolha a empresa e informe o nome do novo
                setor.
              </p>
            </div>
          </div>

          <NovoSetorForm
  key={empresaId}
  empresaIdInicial={empresaId}
/>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">
                Dashboard dos setores
              </h2>

              <p className="text-sm text-slate-400">
                {empresaSelecionada
                  ? `Visualizando os setores da empresa ${empresaSelecionada.nome}.`
                  : "Selecione uma empresa para visualizar seus setores."}
              </p>
            </div>

            <div className="hidden h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-cyan-300 md:flex">
              <BarChart3 size={20} />
            </div>
          </div>

          {!empresaSelecionada ? (
            <div className="rounded-2xl border border-dashed border-white/20 p-10 text-center text-slate-400">
              Nenhuma empresa disponível.
            </div>
          ) : setores.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 p-10 text-center text-slate-400">
              Nenhum setor encontrado para a empresa{" "}
              {empresaSelecionada.nome} com os filtros
              selecionados.
            </div>
          ) : (
            <div className="grid gap-5">
              {setores.map((setor) => {
                const total =
                  setor._count.ordens;

                const resumoStatus =
                  resumoStatusPorSetor.get(setor.id);

                const naoIniciadas =
                  resumoStatus?.naoIniciadas ?? 0;

                const emAndamento =
                  resumoStatus?.emAndamento ?? 0;

                const abertas =
                  naoIniciadas + emAndamento;

                const concluidas =
                  resumoStatus?.concluidas ?? 0;

                const canceladas =
                  resumoStatus?.canceladas ?? 0;

                const percentual =
                  total > 0
                    ? Math.round(
                        (concluidas / total) * 100
                      )
                    : 0;

                const corSetor =
                  setor.empresa?.cor || corEmpresa;

                const corFaixaSetor = corDaFaixaEmpresa(
                  setor.empresa?.sigla ??
                    empresaSelecionada.sigla,
                  setor.empresa?.cor ??
                    empresaSelecionada.cor
                );

                return (
                  <article
                    key={setor.id}
                    className="overflow-hidden rounded-3xl border border-white/10 bg-[#080d1f] shadow-xl transition hover:border-cyan-400/40"
                  >
                    <div
                      className="h-1 w-full"
                      style={{
                        backgroundColor: corFaixaSetor,
                      }}
                    />

                    <div className="grid gap-5 p-5 xl:grid-cols-[1fr_360px]">
                      <div className="min-w-0 space-y-5">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="break-words text-2xl font-black">
                                {setor.nome}
                              </h3>

                              <span
                                className="rounded-full border px-3 py-1 text-xs font-black"
                                style={{
                                  borderColor: `${corSetor}55`,
                                  backgroundColor: `${corSetor}15`,
                                  color: corSetor,
                                }}
                              >
                                {setor.empresa?.sigla ??
                                  empresaSelecionada.sigla}
                              </span>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-black ${
                                  setor.ativo
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : "bg-red-500/20 text-red-300"
                                }`}
                              >
                                {setor.ativo
                                  ? "Ativo"
                                  : "Inativo"}
                              </span>
                            </div>

                            <p className="mt-1 text-sm text-slate-400">
                              {total} ordem(ns) de serviço e{" "}
                              {setor.maquinas.length} máquina(s)
                              vinculada(s).
                            </p>
                          </div>

                          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#050816] px-4 py-3">
                            <Activity
                              size={18}
                              className="text-cyan-300"
                            />

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
                          <Mini
                            label="Total"
                            value={total}
                            color="cyan"
                          />

                          <Mini
                            label="Abertas"
                            value={abertas}
                            color="orange"
                          />

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
                                          (naoIniciadas /
                                            total) *
                                            100
                                        )}%,
                                        #22d3ee ${Math.round(
                                          (naoIniciadas /
                                            total) *
                                            100
                                        )}% ${Math.round(
                                          ((naoIniciadas +
                                            emAndamento) /
                                            total) *
                                            100
                                        )}%,
                                        #34d399 ${Math.round(
                                          ((naoIniciadas +
                                            emAndamento) /
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

                        <GerenciarMaquinasSetor
                          setorId={setor.id}
                          setorNome={setor.nome}
                          maquinas={setor.maquinas}
                        />

                        {abertas > 0 && (
                          <div className="flex items-center gap-2 rounded-2xl border border-orange-400/20 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-300">
                            <AlertTriangle size={16} />
                            Atenção: este setor possui OS em
                            aberto.
                          </div>
                        )}
                      </div>

                      <EditarSetorInline setor={setor} />
                    </div>
                  </article>
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
          <p className="text-sm text-slate-400">
            {title}
          </p>

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
    orange:
      "text-orange-300 bg-orange-500/10 border-orange-400/20",
    green:
      "text-emerald-300 bg-emerald-500/10 border-emerald-400/20",
    red: "text-red-300 bg-red-500/10 border-red-400/20",
  };

  return (
    <div
      className={`rounded-2xl border p-4 ${colors[color]}`}
    >
      <p className="text-xs font-bold uppercase opacity-80">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black">
        {value}
      </p>
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
        <span
          className={`h-3 w-3 rounded-full ${color}`}
        />

        <span className="text-sm font-bold text-slate-300">
          {label}
        </span>
      </div>

      <span className="text-sm font-black text-white">
        {value}
      </span>
    </div>
  );
}