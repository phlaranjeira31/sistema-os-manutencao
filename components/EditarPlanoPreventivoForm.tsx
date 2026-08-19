"use client";

import {
  CalendarDays,
  CalendarRange,
  Clock3,
  Save,
  ShieldAlert,
  Users,
  Wrench,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type Maquina = {
  id: string;
  nome: string;
};

type Setor = {
  id: string;
  nome: string;

  maquinas: Maquina[];
};

type Colaborador = {
  id: string;
  nome: string;
  email: string;
};

type Plano = {
  id: string;

  titulo: string;
  descricao: string;

  prioridade: string;

  setorId: string;

  maquinaId:
    | string
    | null;

  frequencia: string;

  intervaloPersonalizadoDias:
    | number
    | null;

  dataInicio: string;

  dataFim:
    | string
    | null;

  diasAntesAviso: number;

  duracaoEstimadaMinutos:
    | number
    | null;

  gerarAutomaticamente: boolean;

  ativo: boolean;

  responsavelIds: string[];
};

type Props = {
  plano: Plano;

  setores: Setor[];

  colaboradores: Colaborador[];
};

const frequencias = [
  {
    value: "SEMANAL",
    label: "Semanal",
  },
  {
    value: "QUINZENAL",
    label: "Quinzenal",
  },
  {
    value: "MENSAL",
    label: "Mensal",
  },
  {
    value: "BIMESTRAL",
    label: "Bimestral",
  },
  {
    value: "TRIMESTRAL",
    label: "Trimestral",
  },
  {
    value: "SEMESTRAL",
    label: "Semestral",
  },
  {
    value: "ANUAL",
    label: "Anual",
  },
  {
    value: "PERSONALIZADA",
    label: "Personalizada",
  },
];

export default function EditarPlanoPreventivoForm({
  plano,
  setores,
  colaboradores,
}: Props) {
  const router =
    useRouter();

  const [salvando, setSalvando] =
    useState(false);

  const [setorId, setSetorId] =
    useState(
      plano.setorId
    );

  const [maquinaId, setMaquinaId] =
    useState(
      plano.maquinaId ?? ""
    );

  const [
    frequencia,
    setFrequencia,
  ] = useState(
    plano.frequencia
  );

  const maquinas =
    useMemo(() => {
      return (
        setores.find(
          (setor) =>
            setor.id === setorId
        )?.maquinas ?? []
      );
    }, [
      setorId,
      setores,
    ]);

  const minutosTotais =
    plano.duracaoEstimadaMinutos ??
    0;

  const horas =
    Math.floor(
      minutosTotais /
        60
    );

  const minutos =
    minutosTotais %
    60;

  async function salvar(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSalvando(true);

      const form =
        event.currentTarget;

      const formData =
        new FormData(form);

      const resposta =
        await fetch(
          `/api/admin/os/preventivas/planos/${plano.id}`,
          {
            method: "PATCH",

            body:
              formData,
          }
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        alert(
          dados?.error ??
            "Erro ao atualizar plano."
        );

        return;
      }

      router.push(
        "/admin/os/preventivas/lista"
      );

      router.refresh();
    } catch (error) {
      console.error(
        error
      );

      alert(
        "Erro ao atualizar plano preventivo."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form
      onSubmit={salvar}
      className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Campo label="Título">
          <input
            name="titulo"
            required
            defaultValue={
              plano.titulo
            }
            className={inputClass}
          />
        </Campo>

        <Campo label="Setor">
          <select
            name="setorId"
            required
            value={
              setorId
            }
            onChange={(
              event
            ) => {
              setSetorId(
                event.target
                  .value
              );

              setMaquinaId(
                ""
              );
            }}
            className={
              inputClass
            }
          >
            {setores.map(
              (
                setor
              ) => (
                <option
                  key={
                    setor.id
                  }
                  value={
                    setor.id
                  }
                >
                  {
                    setor.nome
                  }
                </option>
              )
            )}
          </select>
        </Campo>

        <div className="md:col-span-2">
          <Campo
            label="Máquina"
            icon={
              <Wrench
                size={16}
              />
            }
          >
            <select
              name="maquinaId"
              value={
                maquinaId
              }
              onChange={(
                event
              ) =>
                setMaquinaId(
                  event.target
                    .value
                )
              }
              className={
                inputClass
              }
            >
              <option value="">
                Nenhuma máquina
              </option>

              {maquinas.map(
                (
                  maquina
                ) => (
                  <option
                    key={
                      maquina.id
                    }
                    value={
                      maquina.id
                    }
                  >
                    {
                      maquina.nome
                    }
                  </option>
                )
              )}
            </select>
          </Campo>
        </div>

        <div className="md:col-span-2">
          <Campo label="Descrição">
            <textarea
              name="descricao"
              required
              rows={5}
              defaultValue={
                plano.descricao
              }
              className="w-full rounded-2xl border border-white/10 bg-[#050816] p-4 text-white outline-none focus:border-cyan-400"
            />
          </Campo>
        </div>

        <Campo label="Prioridade">
          <select
            name="prioridade"
            defaultValue={
              plano.prioridade
            }
            className={
              inputClass
            }
          >
            <option value="BAIXA">
              Baixa
            </option>

            <option value="MEDIA">
              Média
            </option>

            <option value="ALTA">
              Alta
            </option>

            <option value="URGENTE">
              Urgente
            </option>
          </select>
        </Campo>

        <Campo label="Periodicidade">
          <select
            name="frequencia"
            value={
              frequencia
            }
            onChange={(
              event
            ) =>
              setFrequencia(
                event.target
                  .value
              )
            }
            className={
              inputClass
            }
          >
            {frequencias.map(
              (
                item
              ) => (
                <option
                  key={
                    item.value
                  }
                  value={
                    item.value
                  }
                >
                  {
                    item.label
                  }
                </option>
              )
            )}
          </select>
        </Campo>

        {frequencia ===
          "PERSONALIZADA" && (
          <div className="md:col-span-2">
            <Campo label="Intervalo em dias">
              <input
                type="number"
                min="1"
                required
                name="intervaloPersonalizadoDias"
                defaultValue={
                  plano.intervaloPersonalizadoDias ??
                  30
                }
                className={
                  inputClass
                }
              />
            </Campo>
          </div>
        )}

        <div className="md:col-span-2">
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-300">
            <Clock3
              size={16}
            />

            Duração estimada
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="number"
              min="0"
              required
              name="duracaoEstimadaHoras"
              defaultValue={
                horas
              }
              className={
                inputClass
              }
            />

            <input
              type="number"
              min="0"
              max="59"
              required
              name="duracaoEstimadaMinutosAdicionais"
              defaultValue={
                minutos
              }
              className={
                inputClass
              }
            />
          </div>
        </div>

        <Campo
          label="Primeira execução"
          icon={
            <CalendarDays
              size={16}
            />
          }
        >
          <input
            type="date"
            required
            name="dataInicio"
            defaultValue={
              plano.dataInicio
            }
            className={
              inputClass
            }
          />
        </Campo>

        <Campo
          label="Encerrar plano em"
          icon={
            <CalendarRange
              size={16}
            />
          }
        >
          <input
            type="date"
            name="dataFim"
            defaultValue={
              plano.dataFim ??
              ""
            }
            className={
              inputClass
            }
          />
        </Campo>

        <Campo
          label="Avisar antes"
          icon={
            <ShieldAlert
              size={16}
            />
          }
        >
          <select
            name="diasAntesAviso"
            defaultValue={String(
              plano.diasAntesAviso
            )}
            className={
              inputClass
            }
          >
            <option value="1">
              1 dia antes
            </option>

            <option value="2">
              2 dias antes
            </option>

            <option value="3">
              3 dias antes
            </option>

            <option value="7">
              7 dias antes
            </option>

            <option value="15">
              15 dias antes
            </option>

            <option value="30">
              30 dias antes
            </option>
          </select>
        </Campo>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-300">
            Configurações
          </label>

          <div className="space-y-3">
            <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-[#050816] px-4">
              <input
                type="checkbox"
                name="gerarAutomaticamente"
                defaultChecked={
                  plano.gerarAutomaticamente
                }
                className="h-5 w-5 accent-cyan-400"
              />

              <span className="font-bold">
                Geração automática
              </span>
            </label>

            <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-[#050816] px-4">
              <input
                type="checkbox"
                name="ativo"
                defaultChecked={
                  plano.ativo
                }
                className="h-5 w-5 accent-emerald-400"
              />

              <span className="font-bold">
                Plano ativo
              </span>
            </label>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-300">
            <Users
              size={17}
            />

            Responsáveis
          </label>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {colaboradores.map(
              (
                colaborador
              ) => (
                <label
                  key={
                    colaborador.id
                  }
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-[#050816] p-4"
                >
                  <input
                    type="checkbox"
                    name="responsavelIds"
                    value={
                      colaborador.id
                    }
                    defaultChecked={plano.responsavelIds.includes(
                      colaborador.id
                    )}
                    className="mt-1 h-4 w-4 accent-cyan-400"
                  />

                  <div>
                    <p className="font-bold text-white">
                      {
                        colaborador.nome
                      }
                    </p>

                    <p className="text-xs text-slate-500">
                      {
                        colaborador.email
                      }
                    </p>
                  </div>
                </label>
              )
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={
            salvando
          }
          className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-8 font-black text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
        >
          <Save
            size={18}
          />

          {salvando
            ? "Salvando..."
            : "Salvar alterações"}
        </button>

        <button
          type="button"
          onClick={() =>
            router.back()
          }
          className="h-14 rounded-2xl border border-white/10 bg-white/[0.04] px-8 font-black text-white"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-white outline-none focus:border-cyan-400";

function Campo({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children:
    React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-300">
        {icon}

        {label}
      </label>

      {children}
    </div>
  );
}