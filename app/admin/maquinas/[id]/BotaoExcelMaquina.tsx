"use client";

import { FileSpreadsheet } from "lucide-react";

type OrdemExcel = {
  numero: number;
  setor: string;
  maquina: string;
  descricao: string;
  status: string;
  prioridade: string;
  criadaEm: string;
  concluidaEm: string;
  responsavel: string;
};

type Props = {
  maquina: string;
  setor: string;
  periodoInicio?: string;
  periodoFim?: string;
  total: number;
  naoIniciadas: number;
  emAndamento: number;
  concluidas: number;
  canceladas: number;
  taxaResolucao: number;
  tempoMedio: string;
  ordens: OrdemExcel[];
};

function escaparHTML(valor: string | number) {
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slug(valor: string) {
  return valor
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function BotaoExcelMaquina({
  maquina,
  setor,
  periodoInicio,
  periodoFim,
  total,
  naoIniciadas,
  emAndamento,
  concluidas,
  canceladas,
  taxaResolucao,
  tempoMedio,
  ordens,
}: Props) {
  function exportarExcel() {
    const periodo =
      periodoInicio || periodoFim
        ? `${periodoInicio || "Início"} até ${periodoFim || "Hoje"}`
        : "Todos os registros";

    const linhas = ordens
      .map(
        (os) => `
          <tr>
            <td>${escaparHTML(os.numero)}</td>
            <td>${escaparHTML(os.setor)}</td>
            <td>${escaparHTML(os.maquina)}</td>
            <td>${escaparHTML(os.descricao)}</td>
            <td>${escaparHTML(os.status)}</td>
            <td>${escaparHTML(os.prioridade)}</td>
            <td>${escaparHTML(os.criadaEm)}</td>
            <td>${escaparHTML(os.concluidaEm)}</td>
            <td>${escaparHTML(os.responsavel)}</td>
          </tr>
        `
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #0f172a;
            }

            h1 {
              color: #0891b2;
            }

            table {
              border-collapse: collapse;
              width: 100%;
              margin-bottom: 24px;
            }

            th, td {
              border: 1px solid #94a3b8;
              padding: 8px;
              vertical-align: top;
            }

            th {
              background: #22d3ee;
              color: #020617;
              font-weight: bold;
            }

            .titulo {
              background: #050816;
              color: #ffffff;
              font-size: 18px;
              font-weight: bold;
            }

            .subtitulo {
              background: #e2e8f0;
              font-weight: bold;
            }
          </style>
        </head>

        <body>
          <table>
            <tr>
              <td colspan="4" class="titulo">
                Dashboard da máquina: ${escaparHTML(maquina)}
              </td>
            </tr>

            <tr>
              <td class="subtitulo">Setor</td>
              <td>${escaparHTML(setor)}</td>
              <td class="subtitulo">Período</td>
              <td>${escaparHTML(periodo)}</td>
            </tr>

            <tr>
              <td class="subtitulo">Total de OS</td>
              <td>${total}</td>
              <td class="subtitulo">Não iniciadas</td>
              <td>${naoIniciadas}</td>
            </tr>

            <tr>
              <td class="subtitulo">Em andamento</td>
              <td>${emAndamento}</td>
              <td class="subtitulo">Concluídas</td>
              <td>${concluidas}</td>
            </tr>

            <tr>
              <td class="subtitulo">Canceladas</td>
              <td>${canceladas}</td>
              <td class="subtitulo">Taxa de resolução</td>
              <td>${taxaResolucao}%</td>
            </tr>

            <tr>
              <td class="subtitulo">Tempo médio</td>
              <td>${escaparHTML(tempoMedio)}</td>
              <td class="subtitulo">Exportado em</td>
              <td>${escaparHTML(new Date().toLocaleString("pt-BR"))}</td>
            </tr>
          </table>

          <table>
            <thead>
              <tr>
                <th>Nº</th>
                <th>Setor</th>
                <th>Máquina</th>
                <th>Descrição</th>
                <th>Status</th>
                <th>Prioridade</th>
                <th>Criada em</th>
                <th>Concluída em</th>
                <th>Responsável</th>
              </tr>
            </thead>

            <tbody>
              ${
                linhas ||
                `
                  <tr>
                    <td colspan="9">
                      Nenhuma OS encontrada no período selecionado.
                    </td>
                  </tr>
                `
              }
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob(["\ufeff", html], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `dashboard-${slug(maquina)}.xls`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={exportarExcel}
      className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/15 px-5 text-sm font-black text-emerald-200 transition hover:bg-emerald-400 hover:text-slate-950 lg:w-auto"
    >
      <FileSpreadsheet size={18} />
      Exportar Excel
    </button>
  );
}
