"use client";

import {
  Bot,
  HelpCircle,
  LoaderCircle,
  MessageCircle,
  Send,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type Mensagem = {
  id: string;
  autor: "usuario" | "assistente";
  texto: string;
};

const perguntasSugeridas = [
  "Como criar uma nova OS?",
  "Como atribuir uma OS?",
  "Como cadastrar uma máquina?",
  "Como gerar um relatório?",
];

const mensagemInicial: Mensagem = {
  id: "mensagem-inicial",
  autor: "assistente",
  texto:
    "Olá! Sou o assistente do Sistema de OS. Posso ajudar com dúvidas sobre ordens de serviço, colaboradores, setores, máquinas, preventivas, relatórios e indicadores.",
};

export default function AssistenteSistema() {
  const [montado, setMontado] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [pergunta, setPergunta] = useState("");
  const [carregando, setCarregando] = useState(false);

  const [mensagens, setMensagens] = useState<Mensagem[]>([
    mensagemInicial,
  ]);

  const listaMensagensRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    if (!aberto) return;

    const lista = listaMensagensRef.current;

    if (!lista) return;

    const frame = window.requestAnimationFrame(() => {
      lista.scrollTop = lista.scrollHeight;
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [mensagens, carregando, aberto]);

  useEffect(() => {
    if (!aberto) return;

    const telaDesktop = window.matchMedia(
      "(min-width: 768px)"
    ).matches;

    if (!telaDesktop) return;

    const timeout = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [aberto]);

  useEffect(() => {
    function fecharComEscape(
      event: globalThis.KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setAberto(false);
      }
    }

    window.addEventListener("keydown", fecharComEscape);

    return () => {
      window.removeEventListener("keydown", fecharComEscape);
    };
  }, []);

  useEffect(() => {
    if (!aberto) return;

    const scrollAtual = window.scrollY;

    const bodyPositionAnterior =
      document.body.style.position;
    const bodyTopAnterior = document.body.style.top;
    const bodyWidthAnterior = document.body.style.width;
    const bodyOverflowAnterior =
      document.body.style.overflow;

    const htmlOverflowAnterior =
      document.documentElement.style.overflow;

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollAtual}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.position =
        bodyPositionAnterior;
      document.body.style.top = bodyTopAnterior;
      document.body.style.width = bodyWidthAnterior;
      document.body.style.overflow =
        bodyOverflowAnterior;

      document.documentElement.style.overflow =
        htmlOverflowAnterior;

      window.scrollTo(0, scrollAtual);
    };
  }, [aberto]);

  function criarId() {
    return `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;
  }

  async function enviarPergunta(textoRecebido?: string) {
    const texto = String(
      textoRecebido ?? pergunta
    ).trim();

    if (!texto || carregando) return;

    if (texto.length > 500) {
      setMensagens((mensagensAtuais) => [
        ...mensagensAtuais,
        {
          id: criarId(),
          autor: "assistente",
          texto:
            "A pergunta deve ter no máximo 500 caracteres.",
        },
      ]);

      return;
    }

    const mensagemUsuario: Mensagem = {
      id: criarId(),
      autor: "usuario",
      texto,
    };

    setMensagens((mensagensAtuais) => [
      ...mensagensAtuais,
      mensagemUsuario,
    ]);

    setPergunta("");
    setCarregando(true);

    try {
      const resposta = await fetch("/api/assistente", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          pergunta: texto,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
            "Não foi possível consultar o assistente."
        );
      }

      const textoResposta = String(
        dados?.resposta ??
          "Não encontrei uma resposta para essa dúvida."
      ).trim();

      setMensagens((mensagensAtuais) => [
        ...mensagensAtuais,
        {
          id: criarId(),
          autor: "assistente",
          texto: textoResposta,
        },
      ]);
    } catch (error) {
      console.error(
        "Erro no assistente do sistema:",
        error
      );

      setMensagens((mensagensAtuais) => [
        ...mensagensAtuais,
        {
          id: criarId(),
          autor: "assistente",
          texto:
            error instanceof Error
              ? error.message
              : "O assistente está temporariamente indisponível.",
        },
      ]);
    } finally {
      setCarregando(false);
    }
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    enviarPergunta();
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      enviarPergunta();
    }
  }

  if (!montado) {
    return null;
  }

  return createPortal(
    <>
      {aberto && (
        <div
          className="
            fixed inset-0 z-[2147483646]
            flex items-stretch justify-stretch
            bg-black/80 backdrop-blur-sm

            md:items-end md:justify-end
            md:p-5
          "
          onClick={() => setAberto(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Assistente do Sistema de OS"
            onClick={(event) => event.stopPropagation()}
            className="
              relative z-[1]
              flex h-[100dvh] w-full
              min-w-0 flex-col
              overflow-hidden
              bg-[#050816]
              text-white
              shadow-[0_24px_100px_rgba(0,0,0,0.85)]

              md:h-[min(700px,calc(100dvh-40px))]
              md:w-[440px]
              md:rounded-3xl
              md:border md:border-cyan-400/20
            "
          >
            <header
              className="
                z-10 flex shrink-0
                items-center justify-between gap-3
                border-b border-white/10
                bg-[#071021]
                px-4 pb-4
                pt-[max(16px,env(safe-area-inset-top))]
                shadow-[0_10px_35px_rgba(0,0,0,0.28)]

                md:px-5 md:py-4
              "
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.14)]">
                  <Bot size={22} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-base font-black text-white">
                      Guia do Sistema
                    </h2>

                    <Sparkles
                      size={14}
                      className="shrink-0 text-cyan-300"
                    />
                  </div>

                  <p className="truncate text-xs font-semibold text-slate-400">
                    Tire suas dúvidas sobre o sistema
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar guia do sistema"
                className="
                  flex h-11 w-11 shrink-0
                  items-center justify-center
                  rounded-xl border border-red-400/20
                  bg-red-500/10 text-red-300
                  transition
                  hover:border-red-400/40
                  hover:bg-red-500/20
                  active:scale-95
                "
              >
                <X size={21} />
              </button>
            </header>

            <div
              ref={listaMensagensRef}
              aria-live="polite"
              className="
                min-h-0 flex-1
                overflow-y-auto overscroll-contain
                bg-[#050816]
                px-3 py-4
                touch-pan-y

                sm:px-4
                md:py-5
              "
            >
              <div className="mx-auto w-full max-w-2xl space-y-4">
                {mensagens.map((mensagem) => {
                  const usuario =
                    mensagem.autor === "usuario";

                  return (
                    <div
                      key={mensagem.id}
                      className={`flex min-w-0 items-end gap-2 ${
                        usuario
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      {!usuario && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/10 text-cyan-300">
                          <Bot size={16} />
                        </div>
                      )}

                      <div
                        className={`
                          max-w-[calc(100%-42px)]
                          min-w-0 break-words
                          rounded-2xl px-4 py-3
                          text-sm font-medium
                          leading-relaxed shadow-sm

                          sm:max-w-[84%]

                          ${
                            usuario
                              ? "rounded-br-md bg-cyan-400 text-slate-950"
                              : "rounded-bl-md border border-white/10 bg-white/[0.06] text-slate-200"
                          }
                        `}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {mensagem.texto}
                        </p>
                      </div>

                      {usuario && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-slate-300">
                          <UserRound size={16} />
                        </div>
                      )}
                    </div>
                  );
                })}

                {carregando && (
                  <div className="flex items-end gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                      <Bot size={16} />
                    </div>

                    <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-slate-300">
                      <LoaderCircle
                        size={16}
                        className="animate-spin text-cyan-300"
                      />

                      Pensando...
                    </div>
                  </div>
                )}

                {mensagens.length === 1 &&
                  !carregando && (
                    <div className="pt-2">
                      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                        <HelpCircle size={14} />
                        Perguntas rápidas
                      </div>

                      <div className="grid gap-2">
                        {perguntasSugeridas.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() =>
                              enviarPergunta(item)
                            }
                            className="
                              w-full rounded-xl
                              border border-white/10
                              bg-white/[0.04]
                              px-4 py-3
                              text-left text-sm
                              font-semibold text-slate-300
                              transition
                              hover:border-cyan-400/30
                              hover:bg-cyan-400/10
                              hover:text-white
                              active:scale-[0.99]
                            "
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="
                z-10 shrink-0
                border-t border-white/10
                bg-[#071021]
                px-3 pt-3
                pb-[max(14px,env(safe-area-inset-bottom))]
                shadow-[0_-12px_35px_rgba(0,0,0,0.32)]

                sm:px-4
                md:pb-4
              "
            >
              <div className="flex min-w-0 items-end gap-2 rounded-2xl border border-white/10 bg-[#020617] p-2 transition focus-within:border-cyan-400/40 focus-within:ring-2 focus-within:ring-cyan-400/10">
                <textarea
                  ref={inputRef}
                  value={pergunta}
                  onChange={(event) =>
                    setPergunta(
                      event.target.value.slice(0, 500)
                    )
                  }
                  onKeyDown={handleKeyDown}
                  disabled={carregando}
                  rows={1}
                  maxLength={500}
                  placeholder="Digite sua dúvida..."
                  aria-label="Digite sua dúvida sobre o sistema"
                  className="
                    max-h-28 min-h-[46px]
                    min-w-0 flex-1 resize-none
                    bg-transparent
                    px-2 py-3
                    text-base font-medium text-white
                    outline-none
                    placeholder:text-slate-500
                    disabled:cursor-not-allowed
                    disabled:opacity-60

                    md:text-sm
                  "
                />

                <button
                  type="submit"
                  disabled={
                    !pergunta.trim() || carregando
                  }
                  aria-label="Enviar pergunta"
                  className="
                    flex h-12 w-12 shrink-0
                    items-center justify-center
                    rounded-xl bg-cyan-400
                    text-slate-950
                    shadow-lg shadow-cyan-500/10
                    transition
                    hover:bg-cyan-300
                    active:scale-95
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {carregando ? (
                    <LoaderCircle
                      size={19}
                      className="animate-spin"
                    />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>

              <div className="mt-2 flex items-center justify-between gap-3 px-1">
                <p className="text-[11px] font-medium text-slate-500">
                  Digite sua dúvida sobre o sistema
                </p>

                <span className="shrink-0 text-[11px] font-semibold text-slate-600">
                  {pergunta.length}/500
                </span>
              </div>
            </form>
          </section>
        </div>
      )}

      {!aberto && (
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label="Abrir guia do sistema"
          aria-expanded={false}
          className="
            fixed bottom-4 right-4
            z-[2147483645]
            flex h-14 w-14
            items-center justify-center
            rounded-full
            border border-cyan-300/40
            bg-cyan-400 text-slate-950
            shadow-[0_10px_40px_rgba(34,211,238,0.35)]
            transition
            hover:scale-105
            hover:bg-cyan-300
            active:scale-95

            sm:bottom-6 sm:right-6
            sm:h-16 sm:w-16
          "
        >
          <MessageCircle size={26} />

          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#020617] bg-emerald-400">
            <Sparkles size={11} />
          </span>
        </button>
      )}
    </>,
    document.body
  );
}