"use client";

import {
  Check,
  ChevronDown,
  CircleCheck,
  CircleX,
  Clock3,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
} from "react";

type StatusOS =
  | "NAO_INICIADA"
  | "EM_ANDAMENTO"
  | "CONCLUIDA"
  | "CANCELADA";

type Props = {
  osId: string;
  statusAtual: string;
};

const OPCOES: {
  value: StatusOS;
  label: string;
}[] = [
  {
    value: "NAO_INICIADA",
    label: "Não iniciada",
  },
  {
    value: "EM_ANDAMENTO",
    label: "Em andamento",
  },
  {
    value: "CONCLUIDA",
    label: "Concluída",
  },
  {
    value: "CANCELADA",
    label: "Cancelada",
  },
];

function statusValido(
  status: string
): status is StatusOS {
  return OPCOES.some(
    (opcao) => opcao.value === status
  );
}

function IconeStatus({
  status,
  size = 19,
}: {
  status: StatusOS;
  size?: number;
}) {
  if (status === "NAO_INICIADA") {
    return (
      <Clock3
        size={size}
        className="text-blue-300"
      />
    );
  }

  if (status === "EM_ANDAMENTO") {
    return (
      <RefreshCw
        size={size}
        className="text-cyan-300"
      />
    );
  }

  if (status === "CONCLUIDA") {
    return (
      <CircleCheck
        size={size}
        className="text-emerald-300"
      />
    );
  }

  return (
    <CircleX
      size={size}
      className="text-red-300"
    />
  );
}

export default function AtualizarStatusOS({
  osId,
  statusAtual,
}: Props) {
  const router = useRouter();
  const containerRef =
    useRef<HTMLDivElement>(null);

  const statusInicial = statusValido(
    statusAtual
  )
    ? statusAtual
    : "NAO_INICIADA";

  const [status, setStatus] =
    useState<StatusOS>(statusInicial);

  const [aberto, setAberto] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const selecionado =
    OPCOES.find(
      (opcao) => opcao.value === status
    ) ?? OPCOES[0];

  useEffect(() => {
    if (statusValido(statusAtual)) {
      setStatus(statusAtual);
    }
  }, [statusAtual]);

  useEffect(() => {
    function fecharAoClicarFora(
      event: MouseEvent
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setAberto(false);
      }
    }

    function fecharComEsc(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setAberto(false);
      }
    }

    document.addEventListener(
      "mousedown",
      fecharAoClicarFora
    );

    document.addEventListener(
      "keydown",
      fecharComEsc
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        fecharAoClicarFora
      );

      document.removeEventListener(
        "keydown",
        fecharComEsc
      );
    };
  }, []);

  async function alterarStatus(
    novoStatus: StatusOS
  ) {
    if (
      loading ||
      novoStatus === status
    ) {
      setAberto(false);
      return;
    }

    const statusAnterior = status;

    try {
      setLoading(true);
      setErro("");
      setAberto(false);

      const resposta = await fetch(
        `/api/admin/os/${osId}/status`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            status: novoStatus,
          }),
        }
      );

      const dados = await resposta
        .json()
        .catch(() => null);

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
            "Erro ao atualizar o status."
        );
      }

      setStatus(novoStatus);
      router.refresh();
    } catch (error) {
      setStatus(statusAnterior);

      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar o status."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <button
        type="button"
        disabled={loading}
        onClick={() =>
          setAberto((valor) => !valor)
        }
        aria-haspopup="listbox"
        aria-expanded={aberto}
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-cyan-400/60 bg-[#061123] px-4 py-3 text-left shadow-[0_0_22px_rgba(34,211,238,0.08)] outline-none transition hover:border-cyan-300 hover:bg-cyan-400/[0.06] focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-wait disabled:opacity-70"
      >
        <span className="flex min-w-0 items-center gap-3">
          {loading ? (
            <LoaderCircle
              size={19}
              className="shrink-0 animate-spin text-cyan-300"
            />
          ) : (
            <IconeStatus
              status={status}
            />
          )}

          <span className="truncate font-bold text-slate-100">
            {loading
              ? "Atualizando..."
              : selecionado.label}
          </span>
        </span>

        <ChevronDown
          size={19}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${
            aberto ? "rotate-180" : ""
          }`}
        />
      </button>

      {aberto && !loading && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-[100] overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#061123] p-1.5 shadow-[0_25px_70px_rgba(0,0,0,0.70)]"
        >
          {OPCOES.map((opcao) => {
            const ativo =
              opcao.value === status;

            return (
              <button
                key={opcao.value}
                type="button"
                role="option"
                aria-selected={ativo}
                onClick={() =>
                  alterarStatus(
                    opcao.value
                  )
                }
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition ${
                  ativo
                    ? "border border-cyan-400/20 bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-200"
                    : "border border-transparent text-slate-200 hover:bg-white/[0.06]"
                }`}
              >
                <span className="flex items-center gap-3 font-bold">
                  <IconeStatus
                    status={opcao.value}
                  />

                  {opcao.label}
                </span>

                {ativo && (
                  <Check
                    size={18}
                    className="text-cyan-200"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {erro && (
        <p className="mt-2 text-xs font-bold text-red-300">
          {erro}
        </p>
      )}
    </div>
  );
}