"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileDown,
  Play,
  Users,
  Wrench,
} from "lucide-react";

import { useRouter } from "next/navigation";

import {
  useEffect,
  useState,
} from "react";

type Resposta = "" | "SIM" | "NAO" | "NA";

type Execucao = {
  id: string;

  status: string;

  dataProgramada: string;

  dataInicio: string | null;

  dataConclusao: string | null;

  duracaoEstimadaMinutos:
    | number
    | null;

  duracaoRealMinutos:
    | number
    | null;

  descricaoExecucao:
    | string
    | null;

  pecasUtilizadas:
    | string
    | null;

  observacoes:
    | string
    | null;

  checkQuantidadePecas:
    | string
    | null;

  checkFerramentasRecolhidas:
    | string
    | null;

  checkMaterialRepostoRecolhido:
    | string
    | null;

  checkLimpezaRealizada:
    | string
    | null;

  checkLimpezaEfetiva:
    | string
    | null;

  concluidoPor: {
    nome: string;
    email: string;
  } | null;

  plano: {
    id: string;

    titulo: string;

    descricao: string;

    prioridade: string;

    frequencia: string;

    duracaoEstimadaMinutos:
      | number
      | null;

    empresa: {
      nome: string;
      sigla?: string | null;
    } | null;

    setor: {
      nome: string;
    };

    maquina: {
      nome: string;
    } | null;

    criadoPor: {
      nome: string;
      email: string;
    } | null;
  };

  responsaveis: Array<{
    user: {
      nome: string;
      email: string;
    };
  }>;
};

function formatarData(
  data: string
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        "America/Sao_Paulo",
    }
  ).format(new Date(data));
}

function formatarDataHora(
  data: string | null
) {
  if (!data) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        "America/Sao_Paulo",

      dateStyle: "short",

      timeStyle: "short",
    }
  ).format(new Date(data));
}

function formatarDuracao(
  minutos:
    | number
    | null
    | undefined
) {
  if (
    minutos === null ||
    minutos === undefined
  ) {
    return "-";
  }

  const horas =
    Math.floor(
      minutos / 60
    );

  const restante =
    minutos % 60;

  if (
    horas > 0 &&
    restante > 0
  ) {
    return `${horas}h ${restante}min`;
  }

  if (horas > 0) {
    return `${horas}h`;
  }

  return `${restante}min`;
}

export default function ExecucaoPreventivaForm({
  execucao,
}: {
  execucao: Execucao;
}) {
  const router =
    useRouter();

  const [
    status,
    setStatus,
  ] = useState(
    execucao.status
  );

  const [
    dataInicio,
    setDataInicio,
  ] = useState(
    execucao.dataInicio
  );

  const [
    processando,
    setProcessando,
  ] = useState(false);

  const [
    descricaoExecucao,
    setDescricaoExecucao,
  ] = useState(
    execucao.descricaoExecucao ??
      ""
  );

  const [
    pecasUtilizadas,
    setPecasUtilizadas,
  ] = useState(
    execucao.pecasUtilizadas ??
      ""
  );

  const [
    observacoes,
    setObservacoes,
  ] = useState(
    execucao.observacoes ??
      ""
  );

  const [
    checkQuantidadePecas,
    setCheckQuantidadePecas,
  ] =
    useState<Resposta>(
      (execucao.checkQuantidadePecas as Resposta) ??
        ""
    );

  const [
    checkFerramentas,
    setCheckFerramentas,
  ] =
    useState<Resposta>(
      (execucao.checkFerramentasRecolhidas as Resposta) ??
        ""
    );

  const [
    checkMaterial,
    setCheckMaterial,
  ] =
    useState<Resposta>(
      (execucao.checkMaterialRepostoRecolhido as Resposta) ??
        ""
    );

  const [
    checkLimpeza,
    setCheckLimpeza,
  ] =
    useState<Resposta>(
      (execucao.checkLimpezaRealizada as Resposta) ??
        ""
    );

  const [
    checkLimpezaEfetiva,
    setCheckLimpezaEfetiva,
  ] =
    useState<Resposta>(
      (execucao.checkLimpezaEfetiva as Resposta) ??
        ""
    );

  const [
    agora,
    setAgora,
  ] = useState(
    new Date()
  );

  useEffect(() => {
    if (
      status !==
        "EM_EXECUCAO" ||
      !dataInicio
    ) {
      return;
    }

    const intervalo =
      window.setInterval(
        () => {
          setAgora(
            new Date()
          );
        },
        1000
      );

    return () => {
      window.clearInterval(
        intervalo
      );
    };
  }, [
    status,
    dataInicio,
  ]);

  const minutosEmExecucao =
    dataInicio
      ? Math.max(
          0,
          Math.floor(
            (agora.getTime() -
              new Date(
                dataInicio
              ).getTime()) /
              60000
          )
        )
      : 0;

  const concluida =
    status ===
    "CONCLUIDA";

  async function iniciar() {
    try {
      setProcessando(true);

      const resposta =
        await fetch(
          `/api/admin/os/preventivas/execucoes/${execucao.id}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                acao:
                  "INICIAR",
              }),
          }
        );

      const dados =
        await resposta.json();

      if (
        !resposta.ok
      ) {
        alert(
          dados?.error ??
            "Erro ao iniciar preventiva."
        );

        return;
      }

      setStatus(
        "EM_EXECUCAO"
      );

      setDataInicio(
        dados.execucao
          ?.dataInicio ??
          new Date().toISOString()
      );

      router.refresh();
    } catch (error) {
      console.error(
        error
      );

      alert(
        "Erro ao iniciar preventiva."
      );
    } finally {
      setProcessando(
        false
      );
    }
  }

  async function concluir() {
    if (
      !descricaoExecucao.trim()
    ) {
      alert(
        "Descreva o serviço executado."
      );

      return;
    }

    if (
      !checkQuantidadePecas ||
      !checkFerramentas ||
      !checkMaterial ||
      !checkLimpeza ||
      !checkLimpezaEfetiva
    ) {
      alert(
        "Responda todas as perguntas do checklist."
      );

      return;
    }

    const confirmar =
      window.confirm(
        "Deseja concluir esta preventiva?"
      );

    if (!confirmar) {
      return;
    }

    try {
      setProcessando(
        true
      );

      const resposta =
        await fetch(
          `/api/admin/os/preventivas/execucoes/${execucao.id}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                acao:
                  "CONCLUIR",

                descricaoExecucao,

                pecasUtilizadas,

                observacoes,

                checkQuantidadePecas,

                checkFerramentasRecolhidas:
                  checkFerramentas,

                checkMaterialRepostoRecolhido:
                  checkMaterial,

                checkLimpezaRealizada:
                  checkLimpeza,

                checkLimpezaEfetiva,
              }),
          }
        );

      const dados =
        await resposta.json();

      if (
        !resposta.ok
      ) {
        alert(
          dados?.error ??
            "Erro ao concluir preventiva."
        );

        return;
      }

      setStatus(
        "CONCLUIDA"
      );

      router.refresh();
    } catch (error) {
      console.error(
        error
      );

      alert(
        "Erro ao concluir preventiva."
      );
    } finally {
      setProcessando(
        false
      );
    }
  }

  /*
   * ============================================================
   * PDF PADRÃO SEQUOIA
   * ============================================================
   *
   * ALTERAÇÃO:
   * antes o PDF era gerado aqui no navegador com jsPDF.
   *
   * agora chamamos a rota:
   *
   * /api/admin/os/preventivas/execucoes/[id]/pdf
   *
   * que usa:
   *
   * src/lib/pdfExecucaoPreventiva.ts
   *
   * ============================================================
   */

  function gerarPDF() {
    window.open(
      `/api/admin/os/preventivas/execucoes/${execucao.id}/pdf`,
      "_blank"
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Info
          titulo="Data programada"
          valor={formatarData(
            execucao.dataProgramada
          )}
          icon={
            <CalendarDays
              size={18}
            />
          }
        />

        <Info
          titulo="Máquina"
          valor={
            execucao.plano
              .maquina
              ?.nome ??
            "Não definida"
          }
          icon={
            <Wrench
              size={18}
            />
          }
        />

        <Info
          titulo="Duração prevista"
          valor={formatarDuracao(
            execucao.duracaoEstimadaMinutos ??
              execucao.plano
                .duracaoEstimadaMinutos
          )}
          icon={
            <Clock3
              size={18}
            />
          }
        />

        <Info
          titulo="Responsáveis"
          valor={
            execucao
              .responsaveis
              .length > 0
              ? execucao.responsaveis
                  .map(
                    (
                      item
                    ) =>
                      item.user
                        .nome
                  )
                  .join(
                    ", "
                  )
              : "Não definido"
          }
          icon={
            <Users
              size={18}
            />
          }
        />
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-cyan-400">
              Status
            </p>

            <h2 className="mt-1 text-2xl font-black">
              {status ===
              "EM_EXECUCAO"
                ? "Preventiva em execução"
                : status ===
                    "CONCLUIDA"
                  ? "Preventiva concluída"
                  : "Aguardando execução"}
            </h2>

            {status ===
              "EM_EXECUCAO" &&
              dataInicio && (
                <p className="mt-2 text-sm text-slate-400">
                  Iniciada em{" "}
                  {formatarDataHora(
                    dataInicio
                  )}{" "}
                  •{" "}
                  {formatarDuracao(
                    minutosEmExecucao
                  )}{" "}
                  decorridos
                </p>
              )}
          </div>

          {status !==
            "EM_EXECUCAO" &&
            status !==
              "CONCLUIDA" && (
              <button
                type="button"
                onClick={
                  iniciar
                }
                disabled={
                  processando
                }
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-6 font-black text-slate-950"
              >
                <Play
                  size={17}
                />

                Iniciar preventiva
              </button>
            )}

          {concluida && (
            <button
              type="button"
              onClick={
                gerarPDF
              }
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-6 font-black text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-950"
            >
              <FileDown
                size={17}
              />

              Gerar PDF
            </button>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <h2 className="text-xl font-black">
          Registro da execução
        </h2>

        <div className="mt-5 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-300">
              Serviço executado *
            </label>

            <textarea
              rows={5}
              disabled={
                concluida
              }
              value={
                descricaoExecucao
              }
              onChange={(
                event
              ) =>
                setDescricaoExecucao(
                  event.target
                    .value
                )
              }
              className={
                textareaClass
              }
              placeholder="Descreva detalhadamente o serviço executado..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-300">
              Peças utilizadas
            </label>

            <textarea
              rows={3}
              disabled={
                concluida
              }
              value={
                pecasUtilizadas
              }
              onChange={(
                event
              ) =>
                setPecasUtilizadas(
                  event.target
                    .value
                )
              }
              className={
                textareaClass
              }
              placeholder="Informe peças, materiais e quantidades..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-300">
              Observações
            </label>

            <textarea
              rows={3}
              disabled={
                concluida
              }
              value={
                observacoes
              }
              onChange={(
                event
              ) =>
                setObservacoes(
                  event.target
                    .value
                )
              }
              className={
                textareaClass
              }
              placeholder="Observações adicionais..."
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div>
          <p className="text-sm font-black uppercase tracking-wider text-cyan-400">
            Checklist obrigatório
          </p>

          <h2 className="mt-1 text-xl font-black">
            Verificação após manutenção
          </h2>
        </div>

        <div className="mt-5 space-y-3">
          <Pergunta
            pergunta="Foi verificada a quantidade de peças utilizadas?"
            valor={
              checkQuantidadePecas
            }
            disabled={
              concluida
            }
            onChange={
              setCheckQuantidadePecas
            }
          />

          <Pergunta
            pergunta="Todas as ferramentas utilizadas foram recolhidas?"
            valor={
              checkFerramentas
            }
            disabled={
              concluida
            }
            onChange={
              setCheckFerramentas
            }
          />

          <Pergunta
            pergunta="O material reposto (peças) foi devidamente recolhido?"
            valor={
              checkMaterial
            }
            disabled={
              concluida
            }
            onChange={
              setCheckMaterial
            }
          />

          <Pergunta
            pergunta="Foi realizada a limpeza após a manutenção?"
            valor={
              checkLimpeza
            }
            disabled={
              concluida
            }
            onChange={
              setCheckLimpeza
            }
          />

          <Pergunta
            pergunta="A limpeza foi efetiva?"
            valor={
              checkLimpezaEfetiva
            }
            disabled={
              concluida
            }
            onChange={
              setCheckLimpezaEfetiva
            }
          />
        </div>

        {status ===
          "EM_EXECUCAO" && (
          <button
            type="button"
            onClick={
              concluir
            }
            disabled={
              processando
            }
            className="mt-6 inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-8 font-black text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
          >
            <CheckCircle2
              size={19}
            />

            Concluir preventiva
          </button>
        )}
      </section>
    </div>
  );
}

function Info({
  titulo,
  valor,
  icon,
}: {
  titulo: string;

  valor: string;

  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-2 text-cyan-300">
        {icon}

        <p className="text-xs font-black uppercase tracking-wider">
          {titulo}
        </p>
      </div>

      <p className="mt-2 font-black text-white">
        {valor}
      </p>
    </div>
  );
}

function Pergunta({
  pergunta,
  valor,
  disabled,
  onChange,
}: {
  pergunta: string;

  valor: Resposta;

  disabled: boolean;

  onChange: (
    valor: Resposta
  ) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#050816] p-4">
      <p className="font-bold text-white">
        {pergunta}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {[
          [
            "SIM",
            "Sim",
          ],
          [
            "NAO",
            "Não",
          ],
          [
            "NA",
            "N.A",
          ],
        ].map(
          ([
            valorOpcao,
            label,
          ]) => {
            const ativo =
              valor ===
              valorOpcao;

            return (
              <button
                key={
                  valorOpcao
                }
                type="button"
                disabled={
                  disabled
                }
                onClick={() =>
                  onChange(
                    valorOpcao as Resposta
                  )
                }
                className={`min-w-20 rounded-xl border px-4 py-2 text-sm font-black transition ${
                  ativo
                    ? "border-cyan-400 bg-cyan-400 text-slate-950"
                    : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-cyan-400/30"
                } disabled:cursor-not-allowed`}
              >
                {label}
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}

const textareaClass =
  "w-full resize-y rounded-2xl border border-white/10 bg-[#050816] p-4 text-white outline-none focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-70";