import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Building2,
  ClipboardList,
  Gauge,
  LayoutDashboard,
  Plus,
  Users,
  ArrowRight,
  Activity,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { authOptions } from "@/src/lib/auth";
import HeaderUsuario from "@/components/HeaderUsuario";
import AdminMenu from "@/components/AdminMenu";
import AssistenteSistema from "@/components/AssistenteSistema";
import { prisma } from "@/src/lib/prisma";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");

  const [
    totalOS,
    naoIniciadas,
    emAndamento,
    concluidas,
    canceladas,
    baixa,
    media,
    alta,
    urgente,
    colaboradores,
    setores,
  ] = await Promise.all([
    prisma.ordemServico.count(),
    prisma.ordemServico.count({ where: { status: "NAO_INICIADA" } }),
    prisma.ordemServico.count({ where: { status: "EM_ANDAMENTO" } }),
    prisma.ordemServico.count({ where: { status: "CONCLUIDA" } }),
    prisma.ordemServico.count({ where: { status: "CANCELADA" } }),
    prisma.ordemServico.count({ where: { prioridade: "BAIXA" } }),
    prisma.ordemServico.count({ where: { prioridade: "MEDIA" } }),
    prisma.ordemServico.count({ where: { prioridade: "ALTA" } }),
    prisma.ordemServico.count({ where: { prioridade: "URGENTE" } }),
    prisma.user.count({ where: { ativo: true, perfil: "COLABORADOR" } }),
    prisma.setor.count({ where: { ativo: true } }),
  ]);

  const eficienciaPercentual =
    totalOS > 0 ? Math.round((concluidas / totalOS) * 100) : 0;

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
            <div className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#020617] via-[#0f172a] to-[#020617] p-6 text-white shadow-[0_0_40px_rgba(59,130,246,0.14)] md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
                    <Activity size={16} />
                    Visão geral
                  </p>

                  <h1 className="mt-3 break-words text-2xl font-extrabold sm:text-3xl">
                    Controle de Ordens de Serviço
                  </h1>

                  <p className="mt-2 max-w-2xl break-words text-sm text-slate-300 sm:text-base">
                    Painel BI para acompanhar chamados, prioridades e andamento das manutenções.
                  </p>
                </div>

                <Link
                  href="/admin/os"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.16)] transition hover:bg-cyan-50 sm:w-fit"
                >
                  Ver ordens
                  <ArrowRight size={17} />
                </Link>
              </div>
            </div>

            <div className="grid min-w-0 gap-5 xl:grid-cols-3">
              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur-xl sm:p-6 xl:col-span-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="break-words text-lg font-bold text-white">
                      Painel BI por status
                    </h3>
                    <p className="mt-1 break-words text-sm text-slate-400">
                      Distribuição visual das ordens por etapa.
                    </p>
                  </div>

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-[0_0_24px_rgba(34,211,238,0.12)]">
                    <BarChart3 size={20} />
                  </div>
                </div>

                <div className="mt-6 grid min-w-0 gap-4 md:grid-cols-2">
                  <BIStatusCard label="Não iniciadas" value={naoIniciadas} total={totalOS} href="/admin/os?status=NAO_INICIADA" color="red" />
                  <BIStatusCard label="Em andamento" value={emAndamento} total={totalOS} href="/admin/os?status=EM_ANDAMENTO" color="blue" />
                  <BIStatusCard label="Concluídas" value={concluidas} total={totalOS} href="/admin/os?status=CONCLUIDA" color="green" />
                  <BIStatusCard label="Canceladas" value={canceladas} total={totalOS} href="/admin/os?status=CANCELADA" color="slate" />
                </div>
              </div>

              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur-xl sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="break-words text-lg font-bold text-white">
                      Eficiência geral
                    </h3>
                    <p className="mt-1 break-words text-sm text-slate-400">
                      Percentual de ordens concluídas.
                    </p>
                  </div>

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-[0_0_24px_rgba(34,211,238,0.12)]">
                    <Gauge size={20} />
                  </div>
                </div>

                <div className="mt-7 flex justify-center">
                  <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-slate-900 sm:h-44 sm:w-44">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(#22c55e ${eficienciaPercentual}%, #1e293b 0)`,
                      }}
                    />
                    <div className="relative flex h-28 w-28 flex-col items-center justify-center rounded-full bg-[#020617] shadow-sm sm:h-32 sm:w-32">
                      <span className="text-3xl font-extrabold text-white sm:text-4xl">
                        {eficienciaPercentual}%
                      </span>
                      <span className="text-xs font-semibold text-green-400">
                        concluídas
                      </span>
                      <span className="mt-1 text-[10px] text-slate-500">
                        {concluidas}/{totalOS}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-3">
              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur-xl sm:p-6 lg:col-span-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="break-words text-lg font-bold text-white">
                      Prioridades
                    </h3>
                    <p className="mt-1 break-words text-sm text-slate-400">
                      Distribuição das OS por nível de urgência.
                    </p>
                  </div>

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-[0_0_24px_rgba(34,211,238,0.12)]">
                    <TrendingUp size={20} />
                  </div>
                </div>

                <div className="mt-6 grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <PriorityBox label="Baixa" value={baixa} color="green" href="/admin/os?prioridade=BAIXA" />
                  <PriorityBox label="Média" value={media} color="yellow" href="/admin/os?prioridade=MEDIA" />
                  <PriorityBox label="Alta" value={alta} color="orange" href="/admin/os?prioridade=ALTA" />
                  <PriorityBox label="Urgente" value={urgente} color="red" href="/admin/os?prioridade=URGENTE" />
                </div>
              </div>

              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur-xl sm:p-6">
                <h3 className="text-lg font-bold text-white">Cadastros</h3>

                <div className="mt-5 space-y-4">
                  <MiniCard title="Colaboradores ativos" value={colaboradores} icon={<Users />} href="/admin/colaboradores" />
                  <MiniCard title="Setores cadastrados" value={setores} icon={<Building2 />} href="/admin/setores" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
       <AssistenteSistema />
    </main>
  );
}

function MenuItem({ icon, label, active, href }: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  href?: string;
}) {
  const content = (
    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
      active
        ? "border border-cyan-400/30 bg-cyan-400/10 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.12)]"
        : "text-slate-400 hover:bg-white/5 hover:text-white"
    }`}>
      {icon}
      {label}
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

function BIStatusCard({ label, value, total, href, color }: {
  label: string;
  value: number;
  total: number;
  href: string;
  color: "red" | "blue" | "green" | "slate";
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  const colors = {
    red: {
      bg: "bg-red-500/10",
      border: "border-red-400/20",
      text: "text-red-300",
      bar: "bg-red-400",
    },
    blue: {
      bg: "bg-blue-500/10",
      border: "border-blue-400/20",
      text: "text-blue-300",
      bar: "bg-blue-400",
    },
    green: {
      bg: "bg-green-500/10",
      border: "border-green-400/20",
      text: "text-green-300",
      bar: "bg-green-400",
    },
    slate: {
      bg: "bg-slate-500/10",
      border: "border-slate-400/20",
      text: "text-slate-300",
      bar: "bg-slate-400",
    },
  };

  const current = colors[color];

  return (
    <Link
      href={href}
      className={`block min-w-0 rounded-2xl border ${current.border} ${current.bg} p-5 transition hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(34,211,238,0.10)]`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={`min-w-0 break-words text-sm font-bold ${current.text}`}>
          {label}
        </span>
        <span className={`shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-black ${current.text}`}>
          {percentage}%
        </span>
      </div>

      <p className="mt-5 text-4xl font-extrabold text-white">{value}</p>
      <p className="text-xs font-semibold text-slate-400">ordens</p>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${current.bar}`} style={{ width: `${percentage}%` }} />
      </div>
    </Link>
  );
}

function PriorityBox({ label, value, color, href }: {
  label: string;
  value: number;
  color: "green" | "yellow" | "orange" | "red";
  href: string;
}) {
  const colors = {
    green: "border-green-400/20 bg-green-500/10 text-green-300",
    yellow: "border-yellow-400/20 bg-yellow-500/10 text-yellow-300",
    orange: "border-orange-400/20 bg-orange-500/10 text-orange-300",
    red: "border-red-400/20 bg-red-500/10 text-red-300",
  };

  return (
    <Link
      href={href}
      className={`min-w-0 rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(34,211,238,0.10)] ${colors[color]}`}
    >
      <p className="break-words text-sm font-bold">{label}</p>
      <p className="mt-3 text-3xl font-extrabold">{value}</p>
    </Link>
  );
}

function MiniCard({ title, value, icon, href }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="min-w-0">
        <p className="break-words text-sm text-slate-400">{title}</p>
        <p className="text-2xl font-extrabold text-white">{value}</p>
      </div>

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
        {icon}
      </div>
    </div>
  );
}