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
  const [aberto, setAberto] = useState(false);
  const [pergunta, setPergunta] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([
    mensagemInicial,
  ]);

  const fimMensagensRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!aberto) return;

    const timeout = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    return () => window.clearTimeout(timeout);
  }, [aberto]);

  useEffect(() => {
    fimMensagensRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [mensagens, carregando]);

  useEffect(() => {
    function fecharComEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setAberto(false);
      }
    }

    window.addEventListener("keydown", fecharComEscape);

    return () => {
      window.removeEventListener("keydown", fecharComEscape);
    };
  }, []);

  function criarId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  async function enviarPergunta(textoRecebido?: string) {
    const texto = String(textoRecebido ?? pergunta).trim();

    if (!texto || carregando) return;

    if (texto.length > 500) {
      setMensagens((mensagensAtuais) => [
        ...mensagensAtuais,
        {
          id: criarId(),
          autor: "assistente",
          texto: "A pergunta deve ter no máximo 500 caracteres.",
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
          dados?.error || "Não foi possível consultar o assistente."
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
      console.error("Erro no assistente do sistema:", error);

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

  return (
    <>
      {aberto && (
        <section
          aria-label="Assistente do Sistema de OS"
          className="
            fixed inset-x-3 bottom-[88px] z-[100]
            flex max-h-[calc(100dvh-110px)] min-h-[480px]
            flex-col overflow-hidden rounded-3xl
            border border-cyan-400/20 bg-[#050816]
            shadow-[0_20px_80px_rgba(0,0,0,0.65)]
            sm:inset-x-auto sm:bottom-24 sm:right-5
            sm:h-[620px] sm:max-h-[calc(100dvh-120px)]
            sm:w-[420px]
          "
        >
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-[#071021] px-4 py-4 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
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
                  Assistente de dúvidas
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar assistente"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <X size={19} />
            </button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-4">
            {mensagens.map((mensagem) => {
              const usuario = mensagem.autor === "usuario";

              return (
                <div
                  key={mensagem.id}
                  className={`flex items-end gap-2 ${
                    usuario ? "justify-end" : "justify-start"
                  }`}
                >
                  {!usuario && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                      <Bot size={16} />
                    </div>
                  )}

                  <div
                    className={`max-w-[84%] break-words rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed ${
                      usuario
                        ? "rounded-br-md bg-cyan-400 text-slate-950"
                        : "rounded-bl-md border border-white/10 bg-white/[0.06] text-slate-200"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">
                      {mensagem.texto}
                    </p>
                  </div>

                  {usuario && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-slate-300">
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

            {mensagens.length === 1 && !carregando && (
              <div className="pt-1">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <HelpCircle size={14} />
                  Perguntas rápidas
                </div>

                <div className="grid gap-2">
                  {perguntasSugeridas.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => enviarPergunta(item)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-semibold text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-white"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={fimMensagensRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="shrink-0 border-t border-white/10 bg-[#071021] p-3 sm:p-4"
          >
            <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-[#020617] p-2 transition focus-within:border-cyan-400/40 focus-within:ring-2 focus-within:ring-cyan-400/10">
              <textarea
                ref={inputRef}
                value={pergunta}
                onChange={(event) =>
                  setPergunta(event.target.value.slice(0, 500))
                }
                onKeyDown={handleKeyDown}
                disabled={carregando}
                rows={1}
                maxLength={500}
                placeholder="Digite sua dúvida..."
                aria-label="Digite sua dúvida sobre o sistema"
                className="max-h-28 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-3 text-sm font-medium text-white outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={!pergunta.trim() || carregando}
                aria-label="Enviar pergunta"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400 text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {carregando ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3 px-1">
              <p className="text-[11px] font-medium text-slate-500">
                Enter para enviar • Shift + Enter para quebrar linha
              </p>

              <span className="shrink-0 text-[11px] font-semibold text-slate-600">
                {pergunta.length}/500
              </span>
            </div>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setAberto((estadoAtual) => !estadoAtual)}
        aria-label={
          aberto
            ? "Fechar guia do sistema"
            : "Abrir guia do sistema"
        }
        aria-expanded={aberto}
        className="
          fixed bottom-4 right-4 z-[101]
          flex h-14 w-14 items-center justify-center
          rounded-full border border-cyan-300/40
          bg-cyan-400 text-slate-950
          shadow-[0_10px_40px_rgba(34,211,238,0.35)]
          transition hover:scale-105 hover:bg-cyan-300
          active:scale-95
          sm:bottom-6 sm:right-6 sm:h-16 sm:w-16
        "
      >
        {aberto ? <X size={24} /> : <MessageCircle size={26} />}

        {!aberto && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#020617] bg-emerald-400">
            <Sparkles size={11} />
          </span>
        )}
      </button>
    </>
  );
}