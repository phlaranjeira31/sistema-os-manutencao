import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Download,
  Search,
  UserRound,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { authOptions } from "@/src/lib/auth";
import HeaderUsuario from "@/components/HeaderUsuario";
import AdminMenu from "@/components/AdminMenu";
import { prisma } from "@/src/lib/prisma";

type PageProps = {
  searchParams?: Promise<{
    colaborador?: string;
  }>;
};

export default async function DashboardColaboradoresPage({
  searchParams,
}: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");

  const params = await searchParams;
  const filtroColaborador = params?.colaborador ?? "";

  const colaboradores = await prisma.user.findMany({
    where: {
      ativo: true,
      setor: {
        is: {
          tipo: "MANUTENCAO",
        },
      },
      nome: filtroColaborador
        ? {
            contains: filtroColaborador,
            mode: "insensitive",
          }
        : undefined,
    },
    orderBy: {
      nome: "asc",
    },
    include: {
      setor: {
        select: {
          id: true,
          nome: true,
          tipo: true,
        },
      },
      funcao: {
        select: {
          id: true,
          nome: true,
        },
      },
      ordensResponsavel: {
        include: {
          os: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020617] text-white">
      <div className="flex min-w-0">
        <aside className="hidden min-h-screen w-72 shrink-0 border-r border-white/10 bg-[#020617] text-white lg:block">
          <div className="p-6">
            <h1 className="text-2xl font-extrabold">Sistema de OS</h1>
            <p className="mt-1 text-sm text-slate-400">Painel de manutenção</p>
          </div>

          <AdminMenu />
        </aside>

        <section className="min-w-0 flex-1 overflow-x-hidden">
          <HeaderUsuario />

          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-r from-[#020617] via-[#0f172a] to-[#020617] p-6 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-cyan-300">
                    <UserRound size={16} />
                    Dashboard por colaborador
                  </p>

                  <h1 className="mt-2 text-2xl font-black sm:text-3xl">
                    Desempenho da Equipe
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm text-slate-300">
                    Acompanhe pendências, conclusões, cancelamentos e resolução individual.
                  </p>
                </div>

                <Link
                  href="/admin/os"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-50 sm:w-fit"
                >
                  Ver ordens
                  <ArrowRight size={17} />
                </Link>
              </div>
            </div>

            <form className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
                <Search size={16} />
                Filtrar colaborador
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  name="colaborador"
                  defaultValue={filtroColaborador}
                  placeholder="Digite o nome do colaborador..."
                  className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-400"
                />

                <button className="rounded-xl bg-cyan-400 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300">
                  Filtrar
                </button>

                <Link
                  href="/admin/dashboard-colaboradores"
                  className="rounded-xl border border-white/10 px-6 py-3 text-center text-sm font-black text-white transition hover:bg-white/10"
                >
                  Limpar
                </Link>
              </div>
            </form>

            <div className="grid gap-5 xl:grid-cols-2">
              {colaboradores.map((colaborador: any) => {
                const ordens = colaborador.ordensResponsavel.map((item: any) => item.os);

                const total = ordens.length;
                const naoIniciadas = ordens.filter(
                  (os: any) => os.status === "NAO_INICIADA"
                ).length;
                const emAndamento = ordens.filter(
                  (os: any) => os.status === "EM_ANDAMENTO"
                ).length;
                const concluidas = ordens.filter(
                 (os: any) => os.status === "CONCLUIDA"
                ).length;
                const canceladas = ordens.filter(
                  (os: any) => os.status === "CANCELADA"
                ).length;

                const abertas = naoIniciadas + emAndamento;
                const resolucao =
                  total > 0 ? Math.round((concluidas / total) * 100) : 0;

                return (
                  <section
                    key={colaborador.id}
                    className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_25px_rgba(15,23,42,0.65)]"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-black text-white">
                            {colaborador.nome}
                          </h2>

                          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-300">
                            Ativo
                          </span>

                          <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-300">
                            {colaborador.perfil}
                          </span>

                          <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-black text-violet-300">
                            {colaborador.funcao?.nome ?? "Função não definida"}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-400">
                          {total} OS vinculada(s)
                        </p>
                      </div>

                      <Link
                        href={`/api/admin/dashboard-colaboradores/${colaborador.id}/pdf`}
                        target="_blank"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-200 transition hover:bg-cyan-400/20"
                      >
                        <Download size={15} />
                        PDF
                      </Link>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                      <ResumoCard label="Total" value={total} color="cyan" />
                      <ResumoCard label="Abertas" value={abertas} color="orange" />
                      <ResumoCard label="Concluídas" value={concluidas} color="green" />
                      <ResumoCard label="Canceladas" value={canceladas} color="red" />
                    </div>

                    <div className="mt-5 rounded-2xl border border-white/10 bg-[#020617]/70 p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <p className="flex items-center gap-2 text-sm font-black text-slate-400">
                          <Activity size={16} className="text-cyan-300" />
                          Resolução
                        </p>

                        <p className="text-2xl font-black text-white">
                          {resolucao}%
                        </p>
                      </div>

                      <Barra label="Não iniciadas" value={naoIniciadas} total={total} color="yellow" icon={<Clock3 size={15} />} />
                      <Barra label="Em andamento" value={emAndamento} total={total} color="cyan" icon={<BarChart3 size={15} />} />
                      <Barra label="Concluídas" value={concluidas} total={total} color="green" icon={<CheckCircle2 size={15} />} />
                      <Barra label="Canceladas" value={canceladas} total={total} color="red" icon={<XCircle size={15} />} />
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ResumoCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "cyan" | "orange" | "green" | "red";
}) {
  const styles = {
    cyan: "border-cyan-400/30 bg-cyan-500/10 text-cyan-300",
    orange: "border-orange-400/30 bg-orange-500/10 text-orange-300",
    green: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
    red: "border-red-400/30 bg-red-500/10 text-red-300",
  };

  return (
    <div className={`rounded-2xl border p-4 ${styles[color]}`}>
      <p className="text-xs font-black uppercase">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function Barra({
  label,
  value,
  total,
  color,
  icon,
}: {
  label: string;
  value: number;
  total: number;
  color: "yellow" | "cyan" | "green" | "red";
  icon: React.ReactNode;
}) {
  const porcentagem = total > 0 ? Math.round((value / total) * 100) : 0;

  const styles = {
    yellow: "bg-yellow-400 text-yellow-300",
    cyan: "bg-cyan-400 text-cyan-300",
    green: "bg-emerald-400 text-emerald-300",
    red: "bg-red-400 text-red-300",
  };

  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
        <div className={`flex items-center gap-2 font-bold ${styles[color].split(" ")[1]}`}>
          {icon}
          {label}
        </div>

        <span className="font-black text-white">
          {value} · {porcentagem}%
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${styles[color].split(" ")[0]}`}
          style={{ width: `${porcentagem}%` }}
        />
      </div>
    </div>
  );
}