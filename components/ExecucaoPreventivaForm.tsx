"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileDown,
  Users,
  Wrench,
} from "lucide-react";

import { useRouter } from "next/navigation";

import {
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

  const duracaoInicial =
    execucao.duracaoRealMinutos ??
    0;

  const [
    horasUtilizadas,
    setHorasUtilizadas,
  ] = useState(
    duracaoInicial > 0
      ? String(
          Math.floor(
            duracaoInicial / 60
          )
        )
      : ""
  );

  const [
    minutosUtilizados,
    setMinutosUtilizados,
  ] = useState(
    duracaoInicial > 0
      ? String(
          duracaoInicial % 60
        )
      : ""
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

  const concluida =
    status ===
    "CONCLUIDA";

  const podeConcluir =
    status !==
      "CONCLUIDA" &&
    status !==
      "CANCELADA" &&
    status !==
      "NAO_REALIZADA";

  async function concluir() {
    if (
      !descricaoExecucao.trim()
    ) {
      alert(
        "Descreva o serviço executado."
      );

      return;
    }

    const horas =
      Number(
        horasUtilizadas ||
          "0"
      );

    const minutos =
      Number(
        minutosUtilizados ||
          "0"
      );

    if (
      !Number.isInteger(
        horas
      ) ||
      horas < 0
    ) {
      alert(
        "Informe uma quantidade válida de horas utilizadas."
      );

      return;
    }

    if (
      !Number.isInteger(
        minutos
      ) ||
      minutos < 0 ||
      minutos > 59
    ) {
      alert(
        "Os minutos utilizados devem estar entre 0 e 59."
      );

      return;
    }

    const duracaoRealMinutos =
      horas * 60 +
      minutos;

    if (
      duracaoRealMinutos <= 0
    ) {
      alert(
        "Informe o tempo real utilizado na preventiva."
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

                duracaoRealMinutos,

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
              "CONCLUIDA"
                ? "Preventiva concluída"
                : status ===
                    "CANCELADA"
                  ? "Preventiva cancelada"
                  : status ===
                      "NAO_REALIZADA"
                    ? "Preventiva não realizada"
                    : "Aguardando execução"}
            </h2>
          </div>

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

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-300">
              Tempo real utilizado *
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Horas
                </label>

                <input
                  type="number"
                  min={0}
                  step={1}
                  disabled={
                    concluida
                  }
                  value={
                    horasUtilizadas
                  }
                  onChange={(
                    event
                  ) =>
                    setHorasUtilizadas(
                      event.target
                        .value
                    )
                  }
                  className={
                    inputClass
                  }
                  placeholder="0"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Minutos
                </label>

                <input
                  type="number"
                  min={0}
                  max={59}
                  step={1}
                  disabled={
                    concluida
                  }
                  value={
                    minutosUtilizados
                  }
                  onChange={(
                    event
                  ) =>
                    setMinutosUtilizados(
                      event.target
                        .value
                    )
                  }
                  className={
                    inputClass
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Informe o tempo realmente utilizado na execução da preventiva.
            </p>
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

        {podeConcluir && (
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

            Concluir preventiva / Dar baixa
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

const inputClass =
  "h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-white outline-none focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-70";