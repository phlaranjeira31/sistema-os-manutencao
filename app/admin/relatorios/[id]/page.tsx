import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  Package,
  UserRound,
  Wrench,
} from "lucide-react";

import { prisma } from "@/src/lib/prisma";
import AtualizarStatusOS from "@/components/AtualizarStatusOS";
import FormRelatorioOS from "@/components/FormRelatorioOS";
import BotaoPdfRelatorio from "@/components/BotaoPdfRelatorio";
import {
  obterDataTerminoRelatorio,
  obterDuracaoRelatorioMinutos,
  formatarDuracaoMinutos,
} from "@/src/lib/kpiColaborador";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(
  date: Date | string | null | undefined
) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date(date));
}

function formatReportDate(value: string) {
  if (!value || value === "—") return "—";

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) return value;

  const [, ano, mes, dia] = match;

  return `${dia}/${mes}/${ano}`;
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

function prioridadeLabel(
  prioridade: string | null | undefined
) {
  const map: Record<string, string> = {
    BAIXA: "Baixa",
    MEDIA: "Média",
    ALTA: "Alta",
    URGENTE: "Urgente",
  };

  return (
    map[prioridade ?? ""] ??
    prioridade ??
    "—"
  );
}

function prioridadeClasse(prioridade: string) {
  const classes: Record<string, string> = {
    BAIXA:
      "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300",
    MEDIA:
      "border-yellow-400/20 bg-yellow-400/[0.07] text-yellow-300",
    ALTA:
      "border-orange-400/20 bg-orange-400/[0.07] text-orange-300",
    URGENTE:
      "border-red-400/20 bg-red-400/[0.07] text-red-300",
  };

  return (
    classes[prioridade] ??
    "border-white/10 bg-white/[0.04] text-slate-300"
  );
}

function extrairCampo(
  texto: string,
  rotulo: string
) {
  const escape = rotulo.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const match = texto.match(
    new RegExp(
      `${escape}:\\s*\\n?\\s*([^\\n\\r]+)`,
      "i"
    )
  );

  return match?.[1]?.trim() || "—";
}

function extrairSecao(
  texto: string,
  inicio: string,
  proximos: string[]
) {
  const escape = (valor: string) =>
    valor.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

  const fim =
    proximos.length > 0
      ? `(?=\\n\\s*(?:${proximos
          .map(escape)
          .join("|")}):|$)`
      : "$";

  const match = texto.match(
    new RegExp(
      `${escape(
        inicio
      )}:\\s*\\n?\\s*([\\s\\S]*?)${fim}`,
      "i"
    )
  );

  return match?.[1]?.trim() || "—";
}

function extrairChecklist(texto: string) {
  const secao = extrairSecao(
    texto,
    "Checklist final da manutenção",
    []
  );

  if (!secao || secao === "—") {
    return [];
  }

  return secao
    .split(/\n\s*\n/)
    .map((bloco) => bloco.trim())
    .filter(Boolean)
    .map((bloco) => {
      const linhas = bloco
        .split(/\r?\n/)
        .map((linha) => linha.trim())
        .filter(Boolean);

      const respostaLinha = linhas.find(
        (linha) =>
          /^Resposta:/i.test(linha)
      );

      return {
        pergunta: linhas
          .filter(
            (linha) =>
              !/^Resposta:/i.test(linha)
          )
          .join(" "),
        resposta:
          respostaLinha
            ?.replace(
              /^Resposta:\s*/i,
              ""
            )
            .trim() || "—",
      };
    });
}

export default async function RelatorioDetalhePage({
  params,
}: PageProps) {
  const { id } = await params;

  const os =
    await prisma.ordemServico.findUnique({
      where: {
        id,
      },

      include: {
        setor: true,
        maquina: true,
        criadoPor: true,

        responsaveis: {
          include: {
            user: true,
          },
        },
      },
    });

  if (!os) {
    return notFound();
  }

  const responsavel =
    os.responsaveis
      .map(
        (item) =>
          item.user.nome
      )
      .join(", ") ||
    "Sem responsável";

  const relatorio =
    os.registroFinal?.trim() ??
    "";

  const temRelatorio =
    Boolean(relatorio);

  const dataReal =
    obterDataTerminoRelatorio(
      os.registroFinal
    );

  const duracaoReal =
    obterDuracaoRelatorioMinutos(
      os.registroFinal
    );

  const duracaoFormatada =
    duracaoReal == null
      ? "—"
      : formatarDuracaoMinutos(
          duracaoReal
        );

  const dadosOS = {
    numero: os.numero,
    titulo: os.titulo,
    setor:
      os.setor?.nome ?? "—",
    maquina:
      os.maquina?.nome ??
      "Sem máquina",
    status:
      statusLabel(os.status),
    prioridade:
      prioridadeLabel(
        os.prioridade
      ),
    criadaEm:
      formatDate(
        os.createdAt
      ),
    atualizadaEm:
      formatDate(
        os.updatedAt
      ),
    descricao:
      os.descricao ?? "—",
    responsavel,
  };

  const campos =
    temRelatorio
      ? {
          dataInicio:
            extrairCampo(
              relatorio,
              "Data de início"
            ),
          horaInicio:
            extrairCampo(
              relatorio,
              "Hora de início"
            ),
          dataTermino:
            extrairCampo(
              relatorio,
              "Data de término"
            ),
          horaTermino:
            extrairCampo(
              relatorio,
              "Hora de término"
            ),
          defeito:
            extrairSecao(
              relatorio,
              "Defeito",
              [
                "Causa do defeito",
              ]
            ),
          causa:
            extrairSecao(
              relatorio,
              "Causa do defeito",
              [
                "Solução do defeito",
              ]
            ),
          solucao:
            extrairSecao(
              relatorio,
              "Solução do defeito",
              [
                "Peças utilizadas",
              ]
            ),
          pecas:
            extrairSecao(
              relatorio,
              "Peças utilizadas",
              [
                "Observações finais",
                "Checklist final da manutenção",
              ]
            ),
          observacoes:
            extrairSecao(
              relatorio,
              "Observações finais",
              [
                "Checklist final da manutenção",
              ]
            ),
          checklist:
            extrairChecklist(
              relatorio
            ),
        }
      : null;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020617] px-3 py-5 text-white sm:px-5 lg:px-8">
      <div className="mx-auto w-full max-w-[1550px] space-y-5">
        {/* =====================================================
            CABEÇALHO
        ====================================================== */}
        <header className="relative overflow-hidden rounded-[26px] border border-cyan-400/15 bg-[linear-gradient(120deg,#07101f_0%,#071827_58%,#06101d_100%)] p-5 shadow-[0_18px_55px_rgba(0,0,0,.22)] sm:p-6">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-400/[0.07] blur-3xl" />

          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300">
                <FileText size={25} />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-300">
                  Relatório técnico
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-2.5">
                  <h1 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
                    OS #{os.numero}
                  </h1>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${prioridadeClasse(
                      os.prioridade
                    )}`}
                  >
                    {prioridadeLabel(
                      os.prioridade
                    )}
                  </span>
                </div>

                <p className="mt-1.5 max-w-3xl text-sm font-semibold text-slate-300 sm:text-base">
                  {os.titulo}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              {temRelatorio && (
                <BotaoPdfRelatorio
                  registroAtual={
                    os.registroFinal
                  }
                  dadosOS={
                    dadosOS
                  }
                />
              )}

              <Link
                href="/admin/relatorios"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-50"
              >
                <ArrowLeft
                  size={17}
                />
                Voltar
              </Link>
            </div>
          </div>
        </header>

        {temRelatorio &&
        campos ? (
          <>
            {/* =================================================
                RESUMO RÁPIDO
            ================================================== */}
            <section className="rounded-[24px] border border-white/[0.07] bg-[#070c1b] p-5 shadow-[0_12px_35px_rgba(0,0,0,.18)] sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.13em] text-cyan-300">
                    Resumo do atendimento
                  </p>

                  <h2 className="mt-1 text-xl font-black tracking-[-0.02em] text-white">
                    O essencial deste relatório
                  </h2>
                </div>

                <p className="text-xs text-slate-600">
                  Dados preenchidos pelo manutentor
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <ResumoCard
                  icon={
                    <CalendarDays
                      size={18}
                    />
                  }
                  label="Data do serviço"
                  value={
                    formatDate(
                      dataReal
                    )
                  }
                  helper={`${formatReportDate(
                    campos.dataInicio
                  )} → ${formatReportDate(
                    campos.dataTermino
                  )}`}
                  tone="cyan"
                />

                <ResumoCard
                  icon={
                    <Clock3
                      size={18}
                    />
                  }
                  label="Horário"
                  value={`${campos.horaInicio} → ${campos.horaTermino}`}
                  helper={`Duração: ${duracaoFormatada}`}
                  tone="green"
                />

                <ResumoCard
                  icon={
                    <UserRound
                      size={18}
                    />
                  }
                  label="Responsável"
                  value={
                    responsavel
                  }
                  helper="Executor vinculado à OS"
                  tone="violet"
                />

                <ResumoCard
                  icon={
                    <Wrench
                      size={18}
                    />
                  }
                  label="Local do serviço"
                  value={
                    os.maquina?.nome ??
                    os.setor?.nome ??
                    "—"
                  }
                  helper={
                    os.maquina
                      ? os.setor?.nome ??
                        "Sem setor"
                      : "Sem máquina vinculada"
                  }
                  tone="blue"
                />
              </div>
            </section>

            {/* =================================================
                HISTÓRIA TÉCNICA
            ================================================== */}
            <section className="rounded-[24px] border border-white/[0.07] bg-[#070c1b] p-5 shadow-[0_12px_35px_rgba(0,0,0,.18)] sm:p-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.13em] text-cyan-300">
                  Diagnóstico e intervenção
                </p>

                <h2 className="mt-1 text-xl font-black tracking-[-0.02em] text-white">
                  Entenda o que aconteceu
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Leitura em sequência: problema → causa → solução.
                </p>
              </div>

              <div className="mt-5 grid gap-3 xl:grid-cols-3">
                <PassoTecnico
                  numero="01"
                  titulo="Problema encontrado"
                  texto={
                    campos.defeito
                  }
                  tone="red"
                />

                <PassoTecnico
                  numero="02"
                  titulo="Causa identificada"
                  texto={
                    campos.causa
                  }
                  tone="orange"
                />

                <PassoTecnico
                  numero="03"
                  titulo="Solução realizada"
                  texto={
                    campos.solucao
                  }
                  tone="green"
                />
              </div>
            </section>

            {/* =================================================
                EXECUÇÃO + DADOS DA OS
            ================================================== */}
            <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[24px] border border-white/[0.07] bg-[#070c1b] p-5 shadow-[0_12px_35px_rgba(0,0,0,.18)] sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.05] text-cyan-300">
                    <Clock3
                      size={19}
                    />
                  </div>

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.12em] text-cyan-300">
                      Linha do tempo
                    </p>

                    <h2 className="mt-0.5 text-lg font-black text-white">
                      Quando o serviço aconteceu
                    </h2>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <TimePoint
                    label="Início"
                    date={formatReportDate(
                      campos.dataInicio
                    )}
                    time={
                      campos.horaInicio
                    }
                    tone="blue"
                  />

                  <div className="hidden h-px w-14 bg-gradient-to-r from-blue-400/30 to-emerald-400/30 sm:block" />

                  <TimePoint
                    label="Término"
                    date={formatReportDate(
                      campos.dataTermino
                    )}
                    time={
                      campos.horaTermino
                    }
                    tone="green"
                  />
                </div>

                <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.025] px-4 py-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-cyan-300">
                      Tempo real em manutenção
                    </p>

                    <p className="mt-1 text-2xl font-black tracking-[-0.04em] text-white">
                      {
                        duracaoFormatada
                      }
                    </p>
                  </div>

                  <Clock3
                    size={28}
                    className="text-cyan-300/50"
                  />
                </div>
              </div>

              <div className="rounded-[24px] border border-white/[0.07] bg-[#070c1b] p-5 shadow-[0_12px_35px_rgba(0,0,0,.18)] sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.05] text-cyan-300">
                    <ClipboardCheck
                      size={19}
                    />
                  </div>

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.12em] text-cyan-300">
                      Referência da OS
                    </p>

                    <h2 className="mt-0.5 text-lg font-black text-white">
                      Informações do chamado
                    </h2>
                  </div>
                </div>

                <div className="mt-5 space-y-2.5">
                  <InfoLinha
                    label="Status"
                    value={
                      <AtualizarStatusOS
                        osId={os.id}
                        statusAtual={
                          os.status
                        }
                      />
                    }
                  />

                  <InfoLinha
                    label="Prioridade"
                    value={
                      prioridadeLabel(
                        os.prioridade
                      )
                    }
                  />

                  <InfoLinha
                    label="Setor"
                    value={
                      os.setor?.nome ??
                      "—"
                    }
                  />

                  <InfoLinha
                    label="Máquina"
                    value={
                      os.maquina?.nome ??
                      "Sem máquina"
                    }
                  />

                  <InfoLinha
                    label="Criada por"
                    value={
                      os.criadoPor
                        ?.nome ?? "—"
                    }
                  />
                </div>
              </div>
            </section>

            {/* =================================================
                MATERIAIS / OBSERVAÇÕES
            ================================================== */}
            <section className="grid gap-5 xl:grid-cols-2">
              <BlocoTexto
                icon={
                  <Package
                    size={19}
                  />
                }
                title="Peças utilizadas"
                eyebrow="Materiais"
                value={
                  campos.pecas
                }
              />

              <BlocoTexto
                icon={
                  <FileText
                    size={19}
                  />
                }
                title="Observações finais"
                eyebrow="Complemento"
                value={
                  campos.observacoes
                }
              />
            </section>

            {/* =================================================
                CHECKLIST
            ================================================== */}
            <section className="rounded-[24px] border border-white/[0.07] bg-[#070c1b] p-5 shadow-[0_12px_35px_rgba(0,0,0,.18)] sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] text-emerald-300">
                  <CheckCircle2
                    size={19}
                  />
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-emerald-300">
                    Encerramento
                  </p>

                  <h2 className="mt-0.5 text-lg font-black text-white">
                    Checklist final
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Conferências feitas antes de encerrar a manutenção.
                  </p>
                </div>
              </div>

              {campos.checklist.length >
              0 ? (
                <div className="mt-5 grid gap-2.5 md:grid-cols-2">
                  {campos.checklist.map(
                    (
                      item,
                      index
                    ) => (
                      <ChecklistItem
                        key={`${item.pergunta}-${index}`}
                        index={
                          index + 1
                        }
                        pergunta={
                          item.pergunta
                        }
                        resposta={
                          item.resposta
                        }
                      />
                    )
                  )}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-white/[0.08] bg-[#030817] p-5 text-sm text-slate-500">
                  Checklist não identificado neste relatório.
                </div>
              )}
            </section>

            {/* =================================================
                DESCRIÇÃO ORIGINAL
            ================================================== */}
            <section className="rounded-[24px] border border-white/[0.07] bg-[#070c1b] p-5 shadow-[0_12px_35px_rgba(0,0,0,.18)] sm:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">
                Descrição original da OS
              </p>

              <p className="mt-3 rounded-2xl border border-white/[0.06] bg-[#030817] p-4 text-sm font-semibold leading-6 text-slate-300">
                {os.descricao || "—"}
              </p>
            </section>
          </>
        ) : (
          <section className="rounded-[24px] border border-white/[0.07] bg-[#070c1b] p-5 shadow-[0_12px_35px_rgba(0,0,0,.18)] sm:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.13em] text-cyan-300">
              Preenchimento
            </p>

            <h2 className="mt-1 text-xl font-black text-white">
              Relatório técnico
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Esta OS ainda não possui relatório final.
            </p>

            <FormRelatorioOS
              osId={os.id}
              registroAtual={
                os.registroFinal
              }
              dadosOS={
                dadosOS
              }
            />
          </section>
        )}
      </div>
    </main>
  );
}

function ResumoCard({
  icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
  tone:
    | "cyan"
    | "green"
    | "violet"
    | "blue";
}) {
  const tones = {
    cyan:
      "border-cyan-400/15 bg-cyan-400/[0.035] text-cyan-300",
    green:
      "border-emerald-400/15 bg-emerald-400/[0.035] text-emerald-300",
    violet:
      "border-violet-400/15 bg-violet-400/[0.035] text-violet-300",
    blue:
      "border-blue-400/15 bg-blue-400/[0.035] text-blue-300",
  };

  return (
    <div
      className={`rounded-[18px] border p-4 ${tones[tone]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
            {label}
          </p>

          <p className="mt-1.5 line-clamp-2 text-lg font-black leading-tight text-white">
            {value}
          </p>

          <p className="mt-1 text-[10px] font-semibold text-slate-600">
            {helper}
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-black/10">
          {icon}
        </div>
      </div>
    </div>
  );
}

function PassoTecnico({
  numero,
  titulo,
  texto,
  tone,
}: {
  numero: string;
  titulo: string;
  texto: string;
  tone:
    | "red"
    | "orange"
    | "green";
}) {
  const tones = {
    red:
      "border-red-400/15 bg-red-400/[0.03] text-red-300",
    orange:
      "border-orange-400/15 bg-orange-400/[0.03] text-orange-300",
    green:
      "border-emerald-400/15 bg-emerald-400/[0.03] text-emerald-300",
  };

  return (
    <div
      className={`rounded-[20px] border p-5 ${tones[tone]}`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-current/20 bg-black/10 text-xs font-black">
          {numero}
        </span>

        <p className="text-[11px] font-black uppercase tracking-[0.08em]">
          {titulo}
        </p>
      </div>

      <p className="mt-4 whitespace-pre-line text-[15px] font-semibold leading-6 text-slate-200">
        {texto}
      </p>
    </div>
  );
}

function TimePoint({
  label,
  date,
  time,
  tone,
}: {
  label: string;
  date: string;
  time: string;
  tone:
    | "blue"
    | "green";
}) {
  const classe =
    tone === "green"
      ? "border-emerald-400/15 bg-emerald-400/[0.035] text-emerald-300"
      : "border-blue-400/15 bg-blue-400/[0.035] text-blue-300";

  return (
    <div
      className={`rounded-2xl border p-4 ${classe}`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.1em]">
        {label}
      </p>

      <p className="mt-2 text-xl font-black text-white">
        {date}
      </p>

      <p className="mt-0.5 text-sm font-black">
        {time}
      </p>
    </div>
  );
}

function InfoLinha({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[52px] items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-[#030817] px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.07em] text-slate-600">
        {label}
      </p>

      <div className="text-right text-sm font-bold text-slate-200">
        {value}
      </div>
    </div>
  );
}

function BlocoTexto({
  icon,
  eyebrow,
  title,
  value,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/[0.07] bg-[#070c1b] p-5 shadow-[0_12px_35px_rgba(0,0,0,.18)] sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.05] text-cyan-300">
          {icon}
        </div>

        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-cyan-300">
            {eyebrow}
          </p>

          <h2 className="mt-0.5 text-lg font-black text-white">
            {title}
          </h2>
        </div>
      </div>

      <p className="mt-5 whitespace-pre-line rounded-2xl border border-white/[0.06] bg-[#030817] p-4 text-sm font-semibold leading-6 text-slate-300">
        {value}
      </p>
    </div>
  );
}

function ChecklistItem({
  index,
  pergunta,
  resposta,
}: {
  index: number;
  pergunta: string;
  resposta: string;
}) {
  const normalizada =
    resposta.toLowerCase();

  const positiva =
    normalizada === "sim";

  const negativa =
    normalizada === "não" ||
    normalizada === "nao";

  const classe =
    positiva
      ? "border-emerald-400/15 bg-emerald-400/[0.03] text-emerald-300"
      : negativa
        ? "border-red-400/15 bg-red-400/[0.03] text-red-300"
        : "border-white/[0.07] bg-[#030817] text-slate-300";

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-4 ${classe}`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current/20 bg-black/10 text-[10px] font-black">
        {index}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-5 text-slate-300">
          {pergunta}
        </p>

        <span className="mt-2 inline-flex rounded-full border border-current/20 bg-black/10 px-2.5 py-1 text-[10px] font-black uppercase">
          {resposta}
        </span>
      </div>
    </div>
  );
}
