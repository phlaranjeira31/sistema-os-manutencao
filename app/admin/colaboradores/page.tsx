import Link from "next/link";
import { ArrowLeft, Mail, Plus, User, Users } from "lucide-react";
import BotaoEditarColaborador from "@/components/BotaoEditarColaborador";
import BotaoExcluirColaborador from "@/components/BotaoExcluirColaborador";
import { prisma } from "@/src/lib/prisma";

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

export default async function ColaboradoresPage() {
  const colaboradores = await prisma.user.findMany({
    where: {
      ativo: true,
    },
    orderBy: {
      nome: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-8 text-white md:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-lg shadow-cyan-950/30">
              <Users size={26} />
            </div>

            <div>
              <p className="text-sm font-bold text-cyan-300">Equipe</p>

              <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                Colaboradores
              </h1>

              <p className="mt-1 text-base font-medium text-slate-400">
                Visualize todos os colaboradores cadastrados.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:scale-[1.02] hover:bg-cyan-50"
            >
              <ArrowLeft size={17} />
              Voltar
            </Link>

            <Link
              href="/admin/colaboradores/novo"
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02] hover:bg-cyan-300"
            >
              <Plus size={18} />
              Novo colaborador
            </Link>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/30 backdrop-blur sm:p-6">
          {colaboradores.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-[#080d1f] p-10 text-center text-slate-400">
              Nenhum colaborador cadastrado ainda.
            </div>
          ) : (
            <div
              className="
                grid
                grid-cols-1
                gap-4
                sm:grid-cols-2
                xl:grid-cols-3
              "
            >
              {colaboradores.map((colaborador) => (
                <div
                  key={colaborador.id}
                  className="
                    rounded-3xl
                    border
                    border-white/10
                    bg-[#080d1f]
                    p-4
                    shadow-lg
                    shadow-black/20
                    transition
                    hover:border-cyan-400/40
                    hover:bg-[#0b1228]
                    sm:p-5
                  "
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#050816] text-cyan-300">
                      {colaborador.fotoUrl ? (
                        <img
                          src={colaborador.fotoUrl}
                          alt={colaborador.nome}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User size={22} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="break-words text-base font-black leading-tight text-white sm:text-lg">
                        {colaborador.nome}
                      </h2>

                      <p className="mt-1 flex items-start gap-2 break-all text-xs font-medium leading-relaxed text-slate-400 sm:text-sm">
                        <Mail
                          size={15}
                          className="mt-[2px] shrink-0 text-cyan-300"
                        />

                        <span className="break-all">
                          {colaborador.email}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <div className="rounded-2xl border border-white/10 bg-[#050816] p-3 text-sm text-slate-300">
                      <strong className="text-slate-100">Perfil:</strong>{" "}
                      {colaborador.perfil}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#050816] p-3 text-sm text-slate-300">
                      <strong className="text-slate-100">Status:</strong>{" "}
                      <span
                        className={
                          colaborador.ativo
                            ? "font-bold text-emerald-300"
                            : "font-bold text-red-300"
                        }
                      >
                        {colaborador.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#050816] p-3 text-sm text-slate-300">
                      <strong className="text-slate-100">
                        Cadastrado em:
                      </strong>{" "}
                      {formatDate(colaborador.createdAt)}
                    </div>

                    <BotaoEditarColaborador
                      colaboradorId={colaborador.id}
                    />

                    <BotaoExcluirColaborador
                      colaboradorId={colaborador.id}
                    />
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