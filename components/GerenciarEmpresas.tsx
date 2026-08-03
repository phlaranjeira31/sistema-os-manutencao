"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  ImageIcon,
  Loader2,
  Mail,
  Palette,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Save,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type ContagemEmpresa = {
  setores: number;
  ordens: number;
  preventivas: number;
  usuariosOrigem: number;
  usuariosAtendimento: number;
};

type Empresa = {
  id: string;
  nome: string;
  sigla: string;
  ativo: boolean;
  logoUrl: string | null;
  cor: string | null;
  emailNotificacao: string | null;
  createdAt: string;
  updatedAt: string;
  _count: ContagemEmpresa;
};

type FormEmpresa = {
  nome: string;
  sigla: string;
  cor: string;
  logoUrl: string;
  emailNotificacao: string;
  ativo: boolean;
};

const FORM_INICIAL: FormEmpresa = {
  nome: "",
  sigla: "",
  cor: "#22D3EE",
  logoUrl: "",
  emailNotificacao: "",
  ativo: true,
};

function mensagemErroPadrao() {
  return "Não foi possível concluir a operação.";
}

function normalizarEmpresa(empresa: Empresa): Empresa {
  return {
    ...empresa,
    _count: {
      setores: empresa._count?.setores ?? 0,
      ordens: empresa._count?.ordens ?? 0,
      preventivas: empresa._count?.preventivas ?? 0,
      usuariosOrigem: empresa._count?.usuariosOrigem ?? 0,
      usuariosAtendimento: empresa._count?.usuariosAtendimento ?? 0,
    },
  };
}

export default function GerenciarEmpresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvandoNovo, setSalvandoNovo] = useState(false);
  const [atualizandoId, setAtualizandoId] = useState<string | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  const [novo, setNovo] = useState<FormEmpresa>(FORM_INICIAL);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [edicao, setEdicao] = useState<FormEmpresa>(FORM_INICIAL);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const carregarEmpresas = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const resposta = await fetch("/api/admin/empresas", {
        method: "GET",
        cache: "no-store",
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados?.error || "Erro ao carregar empresas.");
      }

      const lista = Array.isArray(dados)
        ? dados.map((empresa: Empresa) => normalizarEmpresa(empresa))
        : [];

      setEmpresas(lista);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro inesperado ao carregar empresas."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarEmpresas();
  }, [carregarEmpresas]);

  const resumo = useMemo(() => {
    return {
      total: empresas.length,
      ativas: empresas.filter((empresa) => empresa.ativo).length,
      setores: empresas.reduce(
        (total, empresa) => total + empresa._count.setores,
        0
      ),
      ordens: empresas.reduce(
        (total, empresa) => total + empresa._count.ordens,
        0
      ),
    };
  }, [empresas]);

  function limparMensagens() {
    setErro("");
    setSucesso("");
  }

  function atualizarEmpresaNaLista(empresaAtualizada: Empresa) {
    setEmpresas((listaAtual) =>
      listaAtual
        .map((empresa) =>
          empresa.id === empresaAtualizada.id
            ? normalizarEmpresa(empresaAtualizada)
            : empresa
        )
        .sort((a, b) => {
          if (a.ativo !== b.ativo) {
            return a.ativo ? -1 : 1;
          }

          return a.nome.localeCompare(b.nome, "pt-BR");
        })
    );
  }

  function validarFormulario(formulario: FormEmpresa) {
    if (!formulario.nome.trim()) {
      return "Informe o nome da empresa.";
    }

    if (!formulario.sigla.trim()) {
      return "Informe a sigla da empresa.";
    }

    if (!/^[A-Za-z0-9]{2,6}$/.test(formulario.sigla.trim())) {
      return "A sigla deve possuir entre 2 e 6 letras ou números.";
    }

    if (
      formulario.cor.trim() &&
      !/^#[0-9A-Fa-f]{6}$/.test(formulario.cor.trim())
    ) {
      return "A cor deve estar no formato hexadecimal. Exemplo: #22D3EE.";
    }

    return null;
  }

  async function criarEmpresa() {
    limparMensagens();

    const validacao = validarFormulario(novo);

    if (validacao) {
      setErro(validacao);
      return;
    }

    setSalvandoNovo(true);

    try {
      const resposta = await fetch("/api/admin/empresas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: novo.nome.trim(),
          sigla: novo.sigla.trim().toUpperCase(),
          cor: novo.cor.trim() || null,
          logoUrl: novo.logoUrl.trim() || null,
          emailNotificacao: novo.emailNotificacao.trim() || null,
          ativo: novo.ativo,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados?.error || "Erro ao criar empresa.");
      }

      const empresaCriada = normalizarEmpresa(dados);

      setEmpresas((listaAtual) =>
        [...listaAtual, empresaCriada].sort((a, b) => {
          if (a.ativo !== b.ativo) {
            return a.ativo ? -1 : 1;
          }

          return a.nome.localeCompare(b.nome, "pt-BR");
        })
      );

      setNovo(FORM_INICIAL);
      setSucesso(`Empresa "${empresaCriada.nome}" cadastrada com sucesso.`);
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : mensagemErroPadrao()
      );
    } finally {
      setSalvandoNovo(false);
    }
  }

  function iniciarEdicao(empresa: Empresa) {
    limparMensagens();

    setEditandoId(empresa.id);

    setEdicao({
      nome: empresa.nome,
      sigla: empresa.sigla,
      cor: empresa.cor ?? "",
      logoUrl: empresa.logoUrl ?? "",
      emailNotificacao: empresa.emailNotificacao ?? "",
      ativo: empresa.ativo,
    });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setEdicao(FORM_INICIAL);
  }

  async function salvarEdicao(empresa: Empresa) {
    limparMensagens();

    const validacao = validarFormulario(edicao);

    if (validacao) {
      setErro(validacao);
      return;
    }

    setAtualizandoId(empresa.id);

    try {
      const resposta = await fetch(`/api/admin/empresas/${empresa.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: edicao.nome.trim(),
          sigla: edicao.sigla.trim().toUpperCase(),
          cor: edicao.cor.trim() || null,
          logoUrl: edicao.logoUrl.trim() || null,
          emailNotificacao: edicao.emailNotificacao.trim() || null,
          ativo: edicao.ativo,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados?.error || "Erro ao editar empresa.");
      }

      atualizarEmpresaNaLista(dados);
      cancelarEdicao();
      setSucesso(`Empresa "${dados.nome}" atualizada com sucesso.`);
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : mensagemErroPadrao()
      );
    } finally {
      setAtualizandoId(null);
    }
  }

  async function alternarStatus(empresa: Empresa) {
    limparMensagens();

    const novoStatus = !empresa.ativo;

    const confirmar = window.confirm(
      novoStatus
        ? `Deseja ativar a empresa "${empresa.nome}"?`
        : `Deseja desativar a empresa "${empresa.nome}"?\n\nOs registros existentes serão preservados.`
    );

    if (!confirmar) {
      return;
    }

    setAtualizandoId(empresa.id);

    try {
      const resposta = await fetch(`/api/admin/empresas/${empresa.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ativo: novoStatus,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error || "Erro ao atualizar o status da empresa."
        );
      }

      atualizarEmpresaNaLista(dados);

      setSucesso(
        novoStatus
          ? `Empresa "${dados.nome}" ativada com sucesso.`
          : `Empresa "${dados.nome}" desativada. Os dados foram preservados.`
      );
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : mensagemErroPadrao()
      );
    } finally {
      setAtualizandoId(null);
    }
  }

  async function excluirEmpresa(empresa: Empresa) {
    limparMensagens();

    const confirmar = window.confirm(
      `Tem certeza que deseja excluir a empresa "${empresa.nome}"?\n\nA exclusão só será permitida se ela não possuir nenhum dado vinculado.`
    );

    if (!confirmar) {
      return;
    }

    setExcluindoId(empresa.id);

    try {
      const resposta = await fetch(`/api/admin/empresas/${empresa.id}`, {
        method: "DELETE",
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados?.error || "Erro ao excluir empresa.");
      }

      setEmpresas((listaAtual) =>
        listaAtual.filter((item) => item.id !== empresa.id)
      );

      if (editandoId === empresa.id) {
        cancelarEdicao();
      }

      setSucesso(`Empresa "${empresa.nome}" excluída com sucesso.`);
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : mensagemErroPadrao()
      );
    } finally {
      setExcluindoId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-8 text-white md:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-lg shadow-cyan-950/30">
              <Building2 size={27} />
            </div>

            <div>
              <p className="text-sm font-bold text-cyan-300">
                Gestão corporativa
              </p>

              <h1 className="text-3xl font-black md:text-4xl">
                Empresas do grupo
              </h1>

              <p className="max-w-2xl text-slate-400">
                Organize Sequoia, Shasta, Ocotillo e as demais empresas
                atendidas pelo sistema.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={carregarEmpresas}
              disabled={carregando}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10 disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={carregando ? "animate-spin" : ""}
              />
              Atualizar
            </button>

            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:bg-cyan-50"
            >
              <ArrowLeft size={17} />
              Voltar
            </Link>
          </div>
        </header>

        {(erro || sucesso) && (
          <section
            aria-live="polite"
            className={`rounded-2xl border px-5 py-4 text-sm font-bold ${
              erro
                ? "border-red-400/30 bg-red-500/10 text-red-200"
                : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
            }`}
          >
            {erro || sucesso}
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ResumoCard
            titulo="Empresas"
            valor={resumo.total}
            icone={<Building2 size={20} />}
          />

          <ResumoCard
            titulo="Empresas ativas"
            valor={resumo.ativas}
            icone={<CheckCircle2 size={20} />}
          />

          <ResumoCard
            titulo="Setores vinculados"
            valor={resumo.setores}
            icone={<Users size={20} />}
          />

          <ResumoCard
            titulo="Ordens de serviço"
            valor={resumo.ordens}
            icone={<ClipboardList size={20} />}
          />
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur md:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
              <Plus size={21} />
            </div>

            <div>
              <h2 className="text-xl font-black">Adicionar empresa</h2>

              <p className="text-sm text-slate-400">
                Cadastre uma nova empresa sem interferir nos registros atuais.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <CampoTexto
              label="Nome da empresa"
              valor={novo.nome}
              placeholder="Ex: Sequoia"
              onChange={(valor) =>
                setNovo((atual) => ({
                  ...atual,
                  nome: valor,
                }))
              }
            />

            <CampoTexto
              label="Sigla"
              valor={novo.sigla}
              placeholder="Ex: SEQ"
              maxLength={6}
              onChange={(valor) =>
                setNovo((atual) => ({
                  ...atual,
                  sigla: valor.toUpperCase(),
                }))
              }
            />

            <CampoCor
              valor={novo.cor}
              onChange={(valor) =>
                setNovo((atual) => ({
                  ...atual,
                  cor: valor,
                }))
              }
            />

            <CampoTexto
              label="E-mail de notificação"
              valor={novo.emailNotificacao}
              placeholder="Ex: manutencao@empresa.com.br"
              tipo="email"
              icone={<Mail size={16} />}
              onChange={(valor) =>
                setNovo((atual) => ({
                  ...atual,
                  emailNotificacao: valor,
                }))
              }
            />

            <CampoTexto
              label="URL do logo"
              valor={novo.logoUrl}
              placeholder="https://..."
              tipo="url"
              icone={<ImageIcon size={16} />}
              onChange={(valor) =>
                setNovo((atual) => ({
                  ...atual,
                  logoUrl: valor,
                }))
              }
            />

            <label className="flex h-[78px] items-center justify-between rounded-2xl border border-white/10 bg-[#050816] px-5">
              <div>
                <p className="text-sm font-black text-white">
                  Empresa ativa
                </p>

                <p className="text-xs text-slate-500">
                  Disponível para novos cadastros
                </p>
              </div>

              <input
                type="checkbox"
                checked={novo.ativo}
                onChange={(event) =>
                  setNovo((atual) => ({
                    ...atual,
                    ativo: event.target.checked,
                  }))
                }
                className="h-5 w-5 accent-cyan-400"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={criarEmpresa}
            disabled={salvandoNovo}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-4 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01] hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
          >
            {salvandoNovo ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Plus size={18} />
            )}

            {salvandoNovo ? "Cadastrando..." : "Adicionar empresa"}
          </button>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur md:p-6">
          <div className="mb-6">
            <h2 className="text-xl font-black">Empresas cadastradas</h2>

            <p className="text-sm text-slate-400">
              Edite informações, altere o status ou consulte os vínculos de
              cada empresa.
            </p>
          </div>

          {carregando ? (
            <div className="flex min-h-52 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#050816] text-slate-300">
              <Loader2 size={22} className="animate-spin text-cyan-300" />
              Carregando empresas...
            </div>
          ) : empresas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 p-10 text-center text-slate-400">
              Nenhuma empresa cadastrada.
            </div>
          ) : (
            <div className="grid gap-5">
              {empresas.map((empresa) => {
                const editando = editandoId === empresa.id;
                const atualizando = atualizandoId === empresa.id;
                const excluindo = excluindoId === empresa.id;
                const corEmpresa = empresa.cor || "#22D3EE";

                return (
                  <article
                    key={empresa.id}
                    className="overflow-hidden rounded-3xl border border-white/10 bg-[#080d1f] shadow-xl"
                  >
                    <div
                      className="h-1.5 w-full"
                      style={{
                        backgroundColor: corEmpresa,
                      }}
                    />

                    <div className="p-5 md:p-6">
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                          <div
                            className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border"
                            style={{
                              borderColor: `${corEmpresa}66`,
                              backgroundColor: `${corEmpresa}18`,
                              color: corEmpresa,
                            }}
                          >
                            {empresa.logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={empresa.logoUrl}
                                alt={`Logo da empresa ${empresa.nome}`}
                                className="h-full w-full object-contain p-2"
                              />
                            ) : (
                              <Building2 size={26} />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="break-words text-2xl font-black">
                                {empresa.nome}
                              </h3>

                              <span
                                className="rounded-full border px-3 py-1 text-xs font-black"
                                style={{
                                  borderColor: `${corEmpresa}55`,
                                  backgroundColor: `${corEmpresa}18`,
                                  color: corEmpresa,
                                }}
                              >
                                {empresa.sigla}
                              </span>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-black ${
                                  empresa.ativo
                                    ? "bg-emerald-500/15 text-emerald-300"
                                    : "bg-red-500/15 text-red-300"
                                }`}
                              >
                                {empresa.ativo ? "Ativa" : "Inativa"}
                              </span>
                            </div>

                            <p className="mt-2 break-all text-sm text-slate-400">
                              {empresa.emailNotificacao ||
                                "Sem e-mail específico de notificação"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              editando
                                ? cancelarEdicao()
                                : iniciarEdicao(empresa)
                            }
                            disabled={atualizando || excluindo}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black text-white transition hover:bg-white/10 disabled:opacity-60"
                          >
                            {editando ? (
                              <X size={16} />
                            ) : (
                              <Pencil size={16} />
                            )}

                            {editando ? "Cancelar" : "Editar"}
                          </button>

                          <button
                            type="button"
                            onClick={() => alternarStatus(empresa)}
                            disabled={atualizando || excluindo}
                            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-black transition disabled:opacity-60 ${
                              empresa.ativo
                                ? "border-orange-400/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20"
                                : "border-emerald-400/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                            }`}
                          >
                            {atualizando ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Power size={16} />
                            )}

                            {empresa.ativo ? "Desativar" : "Ativar"}
                          </button>

                          <button
                            type="button"
                            onClick={() => excluirEmpresa(empresa)}
                            disabled={atualizando || excluindo}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-black text-red-300 transition hover:bg-red-500 hover:text-white disabled:opacity-60"
                          >
                            {excluindo ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}

                            Excluir
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        <VinculoCard
                          titulo="Setores"
                          valor={empresa._count.setores}
                          icone={<Users size={17} />}
                        />

                        <VinculoCard
                          titulo="OS"
                          valor={empresa._count.ordens}
                          icone={<ClipboardList size={17} />}
                        />

                        <VinculoCard
                          titulo="Preventivas"
                          valor={empresa._count.preventivas}
                          icone={<CalendarClock size={17} />}
                        />

                        <VinculoCard
                          titulo="Origem"
                          valor={empresa._count.usuariosOrigem}
                          icone={<Users size={17} />}
                        />

                        <VinculoCard
                          titulo="Atendimentos"
                          valor={empresa._count.usuariosAtendimento}
                          icone={<Users size={17} />}
                        />
                      </div>

                      {editando && (
                        <div className="mt-6 rounded-3xl border border-cyan-400/20 bg-cyan-500/[0.04] p-5">
                          <div className="mb-5">
                            <h4 className="text-lg font-black">
                              Editar empresa
                            </h4>

                            <p className="text-sm text-slate-400">
                              Alterações não apagam OS, setores ou
                              colaboradores.
                            </p>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <CampoTexto
                              label="Nome da empresa"
                              valor={edicao.nome}
                              onChange={(valor) =>
                                setEdicao((atual) => ({
                                  ...atual,
                                  nome: valor,
                                }))
                              }
                            />

                            <CampoTexto
                              label="Sigla"
                              valor={edicao.sigla}
                              maxLength={6}
                              onChange={(valor) =>
                                setEdicao((atual) => ({
                                  ...atual,
                                  sigla: valor.toUpperCase(),
                                }))
                              }
                            />

                            <CampoCor
                              valor={edicao.cor}
                              onChange={(valor) =>
                                setEdicao((atual) => ({
                                  ...atual,
                                  cor: valor,
                                }))
                              }
                            />

                            <CampoTexto
                              label="E-mail de notificação"
                              valor={edicao.emailNotificacao}
                              tipo="email"
                              icone={<Mail size={16} />}
                              onChange={(valor) =>
                                setEdicao((atual) => ({
                                  ...atual,
                                  emailNotificacao: valor,
                                }))
                              }
                            />

                            <CampoTexto
                              label="URL do logo"
                              valor={edicao.logoUrl}
                              tipo="url"
                              icone={<ImageIcon size={16} />}
                              onChange={(valor) =>
                                setEdicao((atual) => ({
                                  ...atual,
                                  logoUrl: valor,
                                }))
                              }
                            />

                            <label className="flex h-[78px] items-center justify-between rounded-2xl border border-white/10 bg-[#050816] px-5">
                              <div>
                                <p className="text-sm font-black text-white">
                                  Empresa ativa
                                </p>

                                <p className="text-xs text-slate-500">
                                  Liberada para novos registros
                                </p>
                              </div>

                              <input
                                type="checkbox"
                                checked={edicao.ativo}
                                onChange={(event) =>
                                  setEdicao((atual) => ({
                                    ...atual,
                                    ativo: event.target.checked,
                                  }))
                                }
                                className="h-5 w-5 accent-cyan-400"
                              />
                            </label>
                          </div>

                          <button
                            type="button"
                            onClick={() => salvarEdicao(empresa)}
                            disabled={atualizando}
                            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3.5 text-sm font-black text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60 md:w-auto"
                          >
                            {atualizando ? (
                              <Loader2
                                size={17}
                                className="animate-spin"
                              />
                            ) : (
                              <Save size={17} />
                            )}

                            {atualizando
                              ? "Salvando..."
                              : "Salvar alterações"}
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ResumoCard({
  titulo,
  valor,
  icone,
}: {
  titulo: string;
  valor: number;
  icone: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#080d1f] p-5 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{titulo}</p>
          <p className="mt-1 text-3xl font-black text-white">{valor}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
          {icone}
        </div>
      </div>
    </div>
  );
}

function VinculoCard({
  titulo,
  valor,
  icone,
}: {
  titulo: string;
  valor: number;
  icone: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#050816] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {titulo}
          </p>

          <p className="mt-1 text-2xl font-black text-white">{valor}</p>
        </div>

        <div className="text-cyan-300">{icone}</div>
      </div>
    </div>
  );
}

function CampoTexto({
  label,
  valor,
  onChange,
  placeholder,
  tipo = "text",
  maxLength,
  icone,
}: {
  label: string;
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  tipo?: "text" | "email" | "url";
  maxLength?: number;
  icone?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-black text-slate-300">
        {icone}
        {label}
      </span>

      <input
        type={tipo}
        value={valor}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
      />
    </label>
  );
}

function CampoCor({
  valor,
  onChange,
}: {
  valor: string;
  onChange: (valor: string) => void;
}) {
  const corValida = /^#[0-9A-Fa-f]{6}$/.test(valor)
    ? valor
    : "#22D3EE";

  return (
    <div>
      <span className="mb-2 flex items-center gap-2 text-sm font-black text-slate-300">
        <Palette size={16} />
        Cor de identificação
      </span>

      <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-[#050816] px-3 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/20">
        <input
          type="color"
          value={corValida}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="h-9 w-11 cursor-pointer rounded-lg border-0 bg-transparent p-0"
          aria-label="Selecionar cor da empresa"
        />

        <input
          type="text"
          value={valor}
          maxLength={7}
          placeholder="#22D3EE"
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold uppercase text-white outline-none placeholder:text-slate-500"
        />
      </div>
    </div>
  );
}