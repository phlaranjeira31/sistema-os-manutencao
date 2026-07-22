"use client";

import {
  AlertTriangle,
  Building2,
  CalendarClock,
  ClipboardList,
  Cpu,
  ImagePlus,
  ListChecks,
  Save,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Setor = {
  id: string;
  nome: string;
};

type Maquina = {
  id: string;
  nome: string;
  setorId: string;
  ativo?: boolean;
};

type FotoExistente = {
  id: string;
  url: string;
  publicId?: string | null;
  createdAt?: Date | string;
};

type UsuarioCriador = {
  id: string;
  nome: string;
  email: string;
};

type OrdemServico = {
  id: string;
  numero: number;
  titulo: string;
  descricao: string;
  status: string;
  prioridade: string;

  dataInicio: Date | string | null;
  dataPrevista: Date | string | null;
  dataConclusao: Date | string | null;
  dataParada: Date | string | null;

  anotacoes: string | null;
  registroFinal: string | null;

  setorId: string;
  maquinaId: string | null;

  maquina?: Maquina | null;
  criadoPor?: UsuarioCriador | null;
  fotos?: FotoExistente[];
};

type PreviewArquivo = {
  file: File;
  url: string;
  tipo: "imagem" | "video";
};

function obterPartesData(
  value: Date | string | null
) {
  if (!value) return null;

  const data = new Date(value);

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(data);

  const obter = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "";

  return {
    ano: obter("year"),
    mes: obter("month"),
    dia: obter("day"),
    hora: obter("hour"),
    minuto: obter("minute"),
  };
}

function toInputDate(
  value: Date | string | null
) {
  const partes = obterPartesData(value);

  if (!partes) return "";

  return `${partes.ano}-${partes.mes}-${partes.dia}`;
}

function toInputDateTime(
  value: Date | string | null
) {
  const partes = obterPartesData(value);

  if (!partes) return "";

  return `${partes.ano}-${partes.mes}-${partes.dia}T${partes.hora}:${partes.minuto}`;
}

function arquivoExistenteEhVideo(url: string) {
  const urlNormalizada = url.toLowerCase();

  return (
    urlNormalizada.includes("/video/upload/") ||
    /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(
      urlNormalizada
    )
  );
}

export default function EditarOSForm({
  os,
  setores,
}: {
  os: OrdemServico;
  setores: Setor[];
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [loadingMaquinas, setLoadingMaquinas] =
    useState(false);
  const [erro, setErro] = useState("");

  const [maquinas, setMaquinas] = useState<Maquina[]>(
    os.maquina ? [os.maquina] : []
  );

  const [arquivos, setArquivos] = useState<
    PreviewArquivo[]
  >([]);

  const [titulo, setTitulo] = useState(os.titulo);
  const [descricao, setDescricao] = useState(
    os.descricao
  );

  const [setorId, setSetorId] = useState(
    os.setorId
  );

  const [maquinaId, setMaquinaId] = useState(
    os.maquinaId ?? ""
  );

  const [status, setStatus] = useState(
    os.status
  );

  const [prioridade, setPrioridade] = useState(
    os.prioridade
  );

  const [dataParada, setDataParada] = useState(
    toInputDateTime(os.dataParada)
  );

  const [dataInicio, setDataInicio] = useState(
    toInputDate(os.dataInicio)
  );

  const [dataPrevista, setDataPrevista] = useState(
    toInputDate(os.dataPrevista)
  );

  const [dataConclusao, setDataConclusao] =
    useState(toInputDate(os.dataConclusao));

  const [anotacoes, setAnotacoes] = useState(
    os.anotacoes ?? ""
  );

  const [registroFinal, setRegistroFinal] =
    useState(os.registroFinal ?? "");

  useEffect(() => {
    const controller = new AbortController();

    async function carregarMaquinas() {
      if (!setorId) {
        setMaquinas([]);
        return;
      }

      try {
        setLoadingMaquinas(true);
        setErro("");

        const res = await fetch(
          `/api/admin/maquinas?setorId=${encodeURIComponent(
            setorId
          )}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data?.error ||
              "Erro ao carregar máquinas."
          );
        }

        const maquinasRecebidas: Maquina[] =
          Array.isArray(data) ? data : [];

        const maquinaAtualPertenceAoSetor =
          os.maquina &&
          os.maquina.setorId === setorId;

        const maquinaAtualEstaNaLista =
          maquinasRecebidas.some(
            (maquina) =>
              maquina.id === os.maquina?.id
          );

        if (
          maquinaAtualPertenceAoSetor &&
          !maquinaAtualEstaNaLista &&
          os.maquina
        ) {
          setMaquinas([
            os.maquina,
            ...maquinasRecebidas,
          ]);

          return;
        }

        setMaquinas(maquinasRecebidas);
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Erro ao carregar máquinas:",
          error
        );

        setMaquinas(
          os.maquina &&
            os.maquina.setorId === setorId
            ? [os.maquina]
            : []
        );

        setErro(
          error instanceof Error
            ? error.message
            : "Erro ao carregar máquinas."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingMaquinas(false);
        }
      }
    }

    carregarMaquinas();

    return () => {
      controller.abort();
    };
  }, [
    setorId,
    os.maquina?.id,
    os.maquina?.nome,
    os.maquina?.setorId,
  ]);

  function alterarSetor(
    novoSetorId: string
  ) {
    setSetorId(novoSetorId);
    setMaquinaId("");
  }

  function handleArquivosChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      event.target.files ?? []
    );

    const novosArquivos: PreviewArquivo[] =
      files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        tipo: file.type.startsWith("video/")
          ? "video"
          : "imagem",
      }));

    setArquivos((arquivosAtuais) => [
      ...arquivosAtuais,
      ...novosArquivos,
    ]);

    event.target.value = "";
  }

  function removerArquivoNovo(index: number) {
    setArquivos((arquivosAtuais) => {
      const copia = [...arquivosAtuais];
      const arquivoRemovido = copia[index];

      if (arquivoRemovido) {
        URL.revokeObjectURL(
          arquivoRemovido.url
        );
      }

      copia.splice(index, 1);

      return copia;
    });
  }

  async function salvar() {
    setErro("");

    if (!titulo.trim()) {
      setErro("Informe o título.");
      return;
    }

    if (!setorId) {
      setErro("Selecione o setor.");
      return;
    }

    if (!maquinaId) {
      setErro(
        "Selecione a máquina ou equipamento."
      );
      return;
    }

    if (!descricao.trim()) {
      setErro(
        "Informe a descrição do problema."
      );
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();

      data.append("titulo", titulo.trim());
      data.append("setorId", setorId);
      data.append("maquinaId", maquinaId);
      data.append(
        "descricao",
        descricao.trim()
      );
      data.append("status", status);
      data.append(
        "prioridade",
        prioridade
      );

      data.append(
        "dataInicio",
        dataInicio
      );

      data.append(
        "dataPrevista",
        dataPrevista
      );

      data.append(
        "dataConclusao",
        dataConclusao
      );

      data.append(
        "dataParada",
        dataParada
      );

      data.append(
        "anotacoes",
        anotacoes
      );

      data.append(
        "registroFinal",
        registroFinal
      );

      arquivos.forEach((arquivo) => {
        data.append(
          "arquivos",
          arquivo.file
        );
      });

      const res = await fetch(
        `/api/admin/os/${os.id}`,
        {
          method: "PATCH",
          body: data,
        }
      );

      const response = await res
        .json()
        .catch(() => null);

      if (!res.ok) {
        throw new Error(
          response?.error ||
            "Erro ao salvar OS."
        );
      }

      arquivos.forEach((arquivo) => {
        URL.revokeObjectURL(arquivo.url);
      });

      alert(
        "OS atualizada com sucesso."
      );

      router.push("/admin/os/editar");
      router.refresh();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao salvar OS."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-[#080d1f] p-4 shadow-2xl shadow-black/30 sm:p-6">
      {erro && (
        <div className="mb-6 break-words rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
          {erro}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
            <ClipboardList size={17} />
            Título
          </label>

          <input
            value={titulo}
            onChange={(event) =>
              setTitulo(event.target.value)
            }
            className="h-12 w-full rounded-xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
            <Building2 size={17} />
            Setor
          </label>

          <select
            value={setorId}
            onChange={(event) =>
              alterarSetor(
                event.target.value
              )
            }
            className="h-12 w-full rounded-xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          >
            <option value="">
              Selecione o setor
            </option>

            {setores.map((setor) => (
              <option
                key={setor.id}
                value={setor.id}
              >
                {setor.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
            <Cpu size={17} />
            Máquina ou equipamento
          </label>

          <select
            value={maquinaId}
            onChange={(event) =>
              setMaquinaId(
                event.target.value
              )
            }
            disabled={
              !setorId ||
              loadingMaquinas
            }
            className="h-12 w-full rounded-xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">
              {!setorId
                ? "Selecione primeiro o setor"
                : loadingMaquinas
                  ? "Carregando equipamentos..."
                  : maquinas.length === 0
                    ? "Nenhum equipamento cadastrado"
                    : "Selecione a máquina ou equipamento"}
            </option>

            {maquinas.map((maquina) => (
              <option
                key={maquina.id}
                value={maquina.id}
              >
                {maquina.nome}
                {maquina.ativo === false
                  ? " (inativa)"
                  : ""}
              </option>
            ))}
          </select>

          {setorId &&
            !loadingMaquinas &&
            maquinas.length === 0 && (
              <p className="mt-2 text-xs font-semibold text-orange-300">
                Nenhuma máquina cadastrada
                neste setor.
              </p>
            )}
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
            <ClipboardList size={17} />
            Descrição do problema
          </label>

          <textarea
            value={descricao}
            onChange={(event) =>
              setDescricao(
                event.target.value
              )
            }
            rows={5}
            placeholder="Descreva detalhadamente o problema encontrado..."
            className="w-full resize-y rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
            <CalendarClock size={17} />
            Data e horário em que a máquina parou
          </label>

          <input
            type="datetime-local"
            value={dataParada}
            onChange={(event) =>
              setDataParada(
                event.target.value
              )
            }
            className="h-12 w-full rounded-xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          />

          <p className="mt-2 text-xs font-medium text-slate-500">
            Campo opcional. Deixe vazio
            caso a máquina não esteja parada
            ou o horário não seja conhecido.
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
            <ImagePlus size={17} />
            Fotos ou vídeos existentes
          </label>

          {!os.fotos ||
          os.fotos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-[#050816] p-5 text-sm text-slate-500">
              Nenhum anexo cadastrado nesta
              OS.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {os.fotos.map((foto) => (
                <div
                  key={foto.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-[#050816]"
                >
                  {arquivoExistenteEhVideo(
                    foto.url
                  ) ? (
                    <video
                      src={foto.url}
                      controls
                      className="h-44 w-full bg-black object-cover"
                    />
                  ) : (
                    <a
                      href={foto.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={foto.url}
                        alt="Anexo existente da OS"
                        className="h-44 w-full object-cover transition hover:scale-[1.02]"
                      />
                    </a>
                  )}

                  <div className="border-t border-white/10 px-3 py-2">
                    <p className="text-xs font-bold text-emerald-300">
                      Anexo já salvo
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
            <ImagePlus size={17} />
            Adicionar novas fotos ou vídeos
          </label>

          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={
              handleArquivosChange
            }
            className="block w-full min-w-0 rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-bold file:text-slate-950"
          />

          <p className="mt-2 text-xs font-medium text-slate-500">
            Os anexos existentes serão
            mantidos. Os novos arquivos serão
            adicionados à OS.
          </p>

          {arquivos.length > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {arquivos.map(
                (arquivo, index) => (
                  <div
                    key={`${arquivo.url}-${index}`}
                    className="relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#050816]"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        removerArquivoNovo(
                          index
                        )
                      }
                      className="absolute right-2 top-2 z-10 rounded-full bg-red-500 p-1.5 text-white shadow-lg transition hover:bg-red-400"
                      title="Remover novo arquivo"
                    >
                      <X size={15} />
                    </button>

                    {arquivo.tipo ===
                    "imagem" ? (
                      <img
                        src={arquivo.url}
                        alt="Preview do novo arquivo"
                        className="h-44 w-full object-cover"
                      />
                    ) : (
                      <video
                        src={arquivo.url}
                        controls
                        className="h-44 w-full bg-black object-cover"
                      />
                    )}

                    <div className="border-t border-white/10 px-3 py-2">
                      <p className="truncate text-xs font-bold text-cyan-300">
                        {arquivo.file.name}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
            <UserRound size={17} />
            Criada por
          </label>

          <div
            className={`rounded-xl border px-4 py-4 ${
              os.criadoPor
                ? "border-cyan-400/20 bg-cyan-500/10"
                : "border-orange-500/20 bg-orange-500/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  os.criadoPor
                    ? "bg-cyan-400/15 text-cyan-300"
                    : "bg-orange-400/15 text-orange-300"
                }`}
              >
                <UserRound size={19} />
              </div>

              <div className="min-w-0">
                <p className="break-words text-sm font-black text-white">
                  {os.criadoPor?.nome ??
                    "Criador não identificado"}
                </p>

                {os.criadoPor?.email && (
                  <p className="break-all text-xs font-semibold text-slate-400">
                    {os.criadoPor.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          <p className="mt-2 text-xs font-medium text-slate-500">
            O criador original da OS não é
            alterado durante a edição.
          </p>
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
            <AlertTriangle size={17} />
            Prioridade
          </label>

          <select
            value={prioridade}
            onChange={(event) =>
              setPrioridade(
                event.target.value
              )
            }
            className="h-12 w-full rounded-xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
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
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
            <ListChecks size={17} />
            Status
          </label>

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value
              )
            }
            className="h-12 w-full rounded-xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          >
            <option value="NAO_INICIADA">
              Não iniciada
            </option>

            <option value="EM_ANDAMENTO">
              Em andamento
            </option>

            <option value="CONCLUIDA">
              Concluída
            </option>

            <option value="CANCELADA">
              Cancelada
            </option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-400">
            Data de início
          </label>

          <input
            type="date"
            value={dataInicio}
            onChange={(event) =>
              setDataInicio(
                event.target.value
              )
            }
            className="h-12 w-full rounded-xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-400">
            Data prevista
          </label>

          <input
            type="date"
            value={dataPrevista}
            onChange={(event) =>
              setDataPrevista(
                event.target.value
              )
            }
            className="h-12 w-full rounded-xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-400">
            Data de conclusão
          </label>

          <input
            type="date"
            value={dataConclusao}
            onChange={(event) =>
              setDataConclusao(
                event.target.value
              )
            }
            className="h-12 w-full rounded-xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-bold text-slate-400">
            Anotações
          </label>

          <textarea
            value={anotacoes}
            onChange={(event) =>
              setAnotacoes(
                event.target.value
              )
            }
            rows={4}
            className="w-full resize-y rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-bold text-slate-400">
            Registro final
          </label>

          <textarea
            value={registroFinal}
            onChange={(event) =>
              setRegistroFinal(
                event.target.value
              )
            }
            rows={4}
            className="w-full resize-y rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={salvar}
          disabled={
            loading ||
            loadingMaquinas ||
            !setorId ||
            !maquinaId
          }
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-6 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit sm:hover:scale-[1.03]"
        >
          <Save size={18} />

          {loading
            ? "Salvando..."
            : "Salvar alterações"}
        </button>
      </div>
    </section>
  );
}