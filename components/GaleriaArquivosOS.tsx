"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";

type Arquivo = {
  id: string;
  url: string;
};

function isVideo(url: string) {
  const lower = url.toLowerCase();

  return (
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".mov")
  );
}

export default function GaleriaArquivosOS({
  arquivos,
}: {
  arquivos: Arquivo[];
}) {
  const [indiceAberto, setIndiceAberto] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  const arquivoAberto = indiceAberto !== null ? arquivos[indiceAberto] : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (indiceAberto !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [indiceAberto]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") fechar();
      if (event.key === "ArrowLeft") anterior();
      if (event.key === "ArrowRight") proximo();
    }

    if (indiceAberto !== null) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [indiceAberto]);

  function fechar() {
    setIndiceAberto(null);
  }

  function anterior() {
    if (indiceAberto === null) return;
    setIndiceAberto(indiceAberto === 0 ? arquivos.length - 1 : indiceAberto - 1);
  }

  function proximo() {
    if (indiceAberto === null) return;
    setIndiceAberto(indiceAberto === arquivos.length - 1 ? 0 : indiceAberto + 1);
  }

  if (!arquivos || arquivos.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {arquivos.map((arquivo, index) => (
          <button
            key={arquivo.id}
            type="button"
            onClick={() => setIndiceAberto(index)}
            className="
              group relative h-44 overflow-hidden rounded-2xl
              border border-white/10 bg-[#020617]
              shadow-lg shadow-black/20 transition
              hover:border-cyan-400/60 hover:shadow-cyan-500/10
            "
          >
            {isVideo(arquivo.url) ? (
              <video
                src={arquivo.url}
                className="h-full w-full bg-black object-cover"
              />
            ) : (
              <img
                src={arquivo.url}
                alt="Arquivo da OS"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            )}

            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-black text-white backdrop-blur">
                <Maximize2 size={16} />
                Ampliar
              </span>
            </div>
          </button>
        ))}
      </div>

      {mounted &&
        arquivoAberto &&
        indiceAberto !== null &&
        createPortal(
          <div
            className="
              fixed inset-0 z-[999999]
              flex items-center justify-center
              bg-black/90 p-3 backdrop-blur-sm
              sm:p-6
            "
            onClick={fechar}
          >
            <div
              className="
                relative flex h-[92dvh] w-full max-w-7xl
                flex-col overflow-hidden rounded-3xl
                border border-white/10 bg-[#020617]
                shadow-2xl shadow-black
              "
              onClick={(event) => event.stopPropagation()}
            >
              <div
                className="
                  flex items-center justify-between gap-3
                  border-b border-white/10 bg-white/[0.03]
                  px-4 py-3 sm:px-5
                "
              >
                <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white sm:text-sm">
                  {indiceAberto + 1} / {arquivos.length}
                </div>

                <button
                  type="button"
                  onClick={fechar}
                  className="
                    inline-flex items-center gap-2 rounded-full
                    bg-red-500/15 px-4 py-2 text-sm font-black
                    text-red-100 ring-1 ring-red-400/30
                    transition hover:bg-red-500/25
                  "
                >
                  Fechar
                  <X size={18} />
                </button>
              </div>

              <div className="relative flex min-h-0 flex-1 items-center justify-center p-3 sm:p-5">
                {arquivos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={anterior}
                      className="
                        absolute left-3 top-1/2 z-20
                        flex h-11 w-11 -translate-y-1/2
                        items-center justify-center rounded-full
                        bg-white/15 text-white backdrop-blur
                        transition hover:bg-white/25
                      "
                    >
                      <ChevronLeft size={28} />
                    </button>

                    <button
                      type="button"
                      onClick={proximo}
                      className="
                        absolute right-3 top-1/2 z-20
                        flex h-11 w-11 -translate-y-1/2
                        items-center justify-center rounded-full
                        bg-white/15 text-white backdrop-blur
                        transition hover:bg-white/25
                      "
                    >
                      <ChevronRight size={28} />
                    </button>
                  </>
                )}

                <div className="flex h-full w-full items-center justify-center">
                  {isVideo(arquivoAberto.url) ? (
                    <video
                      src={arquivoAberto.url}
                      controls
                      autoPlay
                      className="
                        max-h-full max-w-full rounded-2xl
                        bg-black object-contain shadow-2xl
                      "
                    />
                  ) : (
                    <img
                      src={arquivoAberto.url}
                      alt="Arquivo da OS"
                      className="
                        max-h-full max-w-full rounded-2xl
                        object-contain shadow-2xl
                      "
                    />
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}