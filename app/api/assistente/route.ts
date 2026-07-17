import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ItemGuia = {
  titulo: string;
  palavrasChave: string[];
  resposta: string;
};

const PALAVRAS_IGNORADAS = new Set([
  "a",
  "ao",
  "aos",
  "as",
  "como",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "eu",
  "essa",
  "esse",
  "esta",
  "este",
  "fazer",
  "foi",
  "na",
  "nas",
  "no",
  "nos",
  "o",
  "os",
  "ou",
  "para",
  "pela",
  "pelas",
  "pelo",
  "pelos",
  "por",
  "pra",
  "que",
  "se",
  "um",
  "uma",
]);

const GUIA: ItemGuia[] = [
  {
    titulo: "Página principal e dashboard",
    palavrasChave: [
      "pagina principal",
      "dashboard",
      "painel",
      "visao geral",
      "inicio",
      "home",
      "cards",
      "eficiencia",
    ],
    resposta: `Na página principal você encontra a visão geral do sistema.

Ela mostra:
1. Ordens não iniciadas.
2. Ordens em andamento.
3. Ordens concluídas.
4. Ordens canceladas.
5. Distribuição por prioridade.
6. Eficiência geral.
7. Quantidade de colaboradores e setores.

Clique nos cards para acessar as informações relacionadas.`,
  },
  {
    titulo: "Criar uma ordem de serviço",
    palavrasChave: [
      "criar os",
      "nova os",
      "abrir os",
      "cadastrar os",
      "ordem de servico",
      "novo chamado",
      "registrar problema",
    ],
    resposta: `Para criar uma nova OS:

1. Acesse "Ordens de Serviço".
2. Clique em "Nova OS".
3. Selecione o setor.
4. Selecione a máquina ou equipamento.
5. Descreva o problema.
6. Informe a data e o horário da parada, caso necessário.
7. Adicione fotos ou vídeos, caso necessário.
8. Escolha a prioridade e o status.
9. Clique em "Criar OS".

O campo "Criada por" é preenchido automaticamente com o usuário conectado.`,
  },
  {
    titulo: "Criador da ordem de serviço",
    palavrasChave: [
      "criada por",
      "criador",
      "quem criou",
      "usuario que criou",
      "login da os",
      "autor da os",
    ],
    resposta: `O criador da OS é definido automaticamente pelo login utilizado no momento da criação.

Não existe uma lista para escolher outra pessoa. Isso evita que uma OS seja registrada em nome de um usuário diferente.`,
  },
  {
    titulo: "Consultar ordens de serviço",
    palavrasChave: [
      "consultar os",
      "procurar os",
      "pesquisar os",
      "buscar os",
      "encontrar os",
      "planner",
      "lista de os",
      "ver ordens",
    ],
    resposta: `Para consultar uma OS:

1. Acesse "Ordens de Serviço".
2. Use o campo de pesquisa para procurar pelo título, descrição ou setor.
3. Use os filtros de colaborador ou status, quando necessário.
4. Clique em "Ver detalhes" na OS desejada.`,
  },
  {
    titulo: "Atribuir uma ordem de serviço",
    palavrasChave: [
      "atribuir os",
      "responsavel",
      "colaborador responsavel",
      "enviar os",
      "designar os",
      "passar os",
      "atribuir colaborador",
    ],
    resposta: `Para atribuir uma OS:

1. Acesse "Ordens de Serviço".
2. Localize a OS desejada.
3. Encontre a área "Enviar OS para colaborador".
4. Selecione o colaborador responsável.
5. Confirme a atribuição.

Depois disso, o nome do responsável aparecerá no card da OS.`,
  },
  {
    titulo: "Alterar status",
    palavrasChave: [
      "alterar status",
      "mudar status",
      "concluir os",
      "cancelar os",
      "iniciar os",
      "em andamento",
      "nao iniciada",
      "concluida",
      "cancelada",
    ],
    resposta: `Para alterar o status:

1. Abra os detalhes da OS.
2. Localize o campo "Status".
3. Escolha o novo status.
4. Confirme a alteração.

Os status disponíveis são:
- Não iniciada.
- Em andamento.
- Concluída.
- Cancelada.`,
  },
  {
    titulo: "Detalhes da ordem de serviço",
    palavrasChave: [
      "detalhes da os",
      "informacoes da os",
      "ver detalhes",
      "data de criacao",
      "data parada",
      "maquina parada",
      "prioridade da os",
    ],
    resposta: `Na página de detalhes da OS você pode consultar:

1. Número e título.
2. Setor.
3. Status.
4. Prioridade.
5. Data e horário da criação.
6. Usuário que criou a OS.
7. Data e horário da parada da máquina, quando informado.
8. Descrição do problema.
9. Fotos e vídeos anexados.
10. Responsáveis pela manutenção.`,
  },
  {
    titulo: "Relatório de manutenção",
    palavrasChave: [
      "relatorio",
      "escrever relatorio",
      "relatorio final",
      "defeito",
      "causa",
      "solucao",
      "pecas utilizadas",
      "finalizar manutencao",
    ],
    resposta: `Para preencher o relatório:

1. Abra os detalhes da OS.
2. Clique em "Escrever relatório".
3. Preencha as informações solicitadas.
4. Informe o defeito encontrado.
5. Informe a causa.
6. Descreva a solução aplicada.
7. Registre as peças utilizadas.
8. Revise e finalize o relatório.

Quando já existe um relatório final, o sistema não permite criar outro para a mesma OS.`,
  },
  {
    titulo: "Cadastrar colaborador",
    palavrasChave: [
      "cadastrar colaborador",
      "novo colaborador",
      "adicionar funcionario",
      "criar usuario",
      "cadastro de usuario",
      "editar colaborador",
      "desativar colaborador",
    ],
    resposta: `Para gerenciar colaboradores:

1. Acesse a área "Colaboradores".
2. Clique na opção de novo cadastro.
3. Informe os dados solicitados.
4. Cadastre um e-mail válido.
5. Defina o perfil e as permissões.
6. Salve o cadastro.

Também é possível editar, ativar ou desativar colaboradores, conforme a permissão do usuário conectado.`,
  },
  {
    titulo: "Cadastrar setor",
    palavrasChave: [
      "cadastrar setor",
      "novo setor",
      "adicionar setor",
      "editar setor",
      "setor ativo",
      "setor nao aparece",
    ],
    resposta: `Para cadastrar um setor:

1. Acesse a área "Setores".
2. Clique na opção de novo cadastro.
3. Informe o nome do setor.
4. Salve o cadastro.

Somente setores ativos aparecem durante a criação de uma OS.`,
  },
  {
    titulo: "Cadastrar máquina ou equipamento",
    palavrasChave: [
      "cadastrar maquina",
      "nova maquina",
      "adicionar maquina",
      "equipamento",
      "maquina nao aparece",
      "editar maquina",
      "maquina por setor",
    ],
    resposta: `Para cadastrar uma máquina:

1. Acesse a área de máquinas.
2. Clique na opção de novo cadastro.
3. Selecione o setor da máquina.
4. Informe o nome do equipamento.
5. Mantenha o cadastro ativo.
6. Salve.

Na criação de uma OS, o sistema mostra apenas as máquinas do setor selecionado.`,
  },
  {
    titulo: "Máquina não aparece",
    palavrasChave: [
      "maquina nao aparece",
      "equipamento nao aparece",
      "lista de maquinas vazia",
      "nenhuma maquina cadastrada",
      "nao carrega maquina",
    ],
    resposta: `Quando uma máquina não aparece na criação da OS, confira:

1. Se o setor correto foi selecionado.
2. Se a máquina foi cadastrada nesse setor.
3. Se a máquina está ativa.
4. Se o setor está ativo.
5. Se a página foi atualizada depois do cadastro.`,
  },
  {
    titulo: "Manutenção preventiva",
    palavrasChave: [
      "preventiva",
      "manutencao preventiva",
      "ordem preventiva",
      "programar preventiva",
      "preventivas cadastradas",
    ],
    resposta: `A área de preventivas é usada para acompanhar manutenções programadas.

Nela você pode:
1. Consultar as preventivas cadastradas.
2. Ver datas e equipamentos relacionados.
3. Acompanhar o status.
4. Registrar informações da manutenção programada.`,
  },
  {
    titulo: "Indicadores",
    palavrasChave: [
      "indicadores",
      "graficos",
      "dashboard maquina",
      "desempenho",
      "dados por colaborador",
      "dados por setor",
      "dados por maquina",
      "filtros",
    ],
    resposta: `Na área de indicadores você pode analisar o desempenho das ordens de serviço.

Dependendo da página, é possível filtrar por:
1. Período.
2. Setor.
3. Máquina.
4. Colaborador.
5. Status.
6. Prioridade.

Os indicadores ajudam a acompanhar quantidade de OS, tempo de atendimento e desempenho da manutenção.`,
  },
  {
    titulo: "Exportar PDF ou Excel",
    palavrasChave: [
      "exportar pdf",
      "baixar pdf",
      "gerar pdf",
      "exportar excel",
      "baixar excel",
      "planilha",
      "imprimir relatorio",
    ],
    resposta: `Para exportar informações:

1. Acesse o relatório ou indicador desejado.
2. Aplique os filtros necessários.
3. Clique no botão de exportação disponível.
4. Escolha PDF ou Excel, conforme as opções da página.

O arquivo será gerado com os dados filtrados.`,
  },
  {
    titulo: "Fotos e vídeos",
    palavrasChave: [
      "foto",
      "fotos",
      "video",
      "videos",
      "anexo",
      "anexar arquivo",
      "remover arquivo",
      "galeria",
    ],
    resposta: `Para adicionar fotos ou vídeos:

1. Durante a criação da OS, localize "Fotos ou vídeos".
2. Selecione os arquivos do dispositivo.
3. Confira a prévia apresentada.
4. Use o botão de remover caso tenha escolhido um arquivo errado.
5. Crie a OS.

Depois do cadastro, os anexos aparecem na página de detalhes.`,
  },
  {
    titulo: "Data e horário da parada",
    palavrasChave: [
      "data parada",
      "horario parada",
      "maquina parou",
      "maquina parada desde",
      "tempo parada",
    ],
    resposta: `O campo de data e horário da parada é opcional.

Preencha quando souber o momento em que a máquina parou. Essa informação ficará registrada nos detalhes da OS.

Quando a máquina não estiver parada ou o horário não for conhecido, deixe o campo vazio.`,
  },
  {
    titulo: "Prioridade",
    palavrasChave: [
      "prioridade",
      "baixa",
      "media",
      "alta",
      "urgente",
      "nivel de urgencia",
    ],
    resposta: `As prioridades disponíveis são:

- Baixa: atendimento sem urgência.
- Média: necessita acompanhamento.
- Alta: deve receber atenção rápida.
- Urgente: situação crítica que exige atendimento prioritário.

Escolha a prioridade conforme o impacto do problema na operação.`,
  },
  {
    titulo: "Notificação por e-mail",
    palavrasChave: [
      "email",
      "e-mail",
      "notificacao",
      "supervisor",
      "nilton",
      "aviso de nova os",
      "nao chegou email",
    ],
    resposta: `Quando uma nova OS é criada, o sistema tenta enviar uma notificação ao supervisor configurado.

Caso o e-mail não chegue:
1. Confira se a OS foi criada normalmente.
2. Verifique a caixa de spam.
3. Confirme se o endereço cadastrado está correto.
4. Informe o administrador do sistema para verificar o serviço de envio.`,
  },
  {
    titulo: "Problemas de login",
    palavrasChave: [
      "login",
      "entrar",
      "senha",
      "acesso",
      "nao consigo entrar",
      "usuario inativo",
      "esqueci senha",
    ],
    resposta: `Quando não conseguir entrar no sistema:

1. Confira se o e-mail foi digitado corretamente.
2. Confira a senha.
3. Verifique se o usuário está ativo.
4. Tente entrar novamente.
5. Caso continue sem acesso, procure o administrador do sistema.

Nunca compartilhe sua senha com outra pessoa.`,
  },
  {
    titulo: "Segurança",
    palavrasChave: [
      "seguranca",
      "senha",
      "token",
      "chave",
      "credencial",
      "compartilhar login",
      "usuario",
    ],
    resposta: `Para manter o sistema seguro:

1. Cada pessoa deve utilizar seu próprio login.
2. Não compartilhe senhas.
3. Não envie tokens ou chaves por mensagem.
4. Saia do sistema em computadores compartilhados.
5. Informe o administrador sobre acessos suspeitos.`,
  },
];

const RESPOSTA_AJUDA = `Posso ajudar com dúvidas sobre:

1. Criar e consultar ordens de serviço.
2. Atribuir responsáveis.
3. Alterar o status.
4. Preencher relatórios.
5. Cadastrar colaboradores.
6. Cadastrar setores.
7. Cadastrar máquinas.
8. Manutenções preventivas.
9. Indicadores, PDF e Excel.
10. Fotos, vídeos e notificações.

Digite sua dúvida com suas próprias palavras.`;

const RESPOSTA_NAO_ENCONTRADA = `Não encontrei essa informação no guia do sistema.

Tente perguntar de outra forma ou procure o administrador ou supervisor responsável.`;

function normalizarTexto(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizar(texto: string) {
  return normalizarTexto(texto)
    .split(" ")
    .filter(
      (palavra) =>
        palavra.length >= 2 && !PALAVRAS_IGNORADAS.has(palavra)
    );
}

function calcularPontuacao(pergunta: string, item: ItemGuia) {
  const perguntaNormalizada = normalizarTexto(pergunta);
  const tokensPergunta = new Set(tokenizar(pergunta));

  let pontuacao = 0;

  const tituloNormalizado = normalizarTexto(item.titulo);
  const tokensTitulo = tokenizar(item.titulo);

  if (perguntaNormalizada.includes(tituloNormalizado)) {
    pontuacao += 12;
  }

  for (const token of tokensTitulo) {
    if (tokensPergunta.has(token)) {
      pontuacao += 2;
    }
  }

  for (const palavraChave of item.palavrasChave) {
    const chaveNormalizada = normalizarTexto(palavraChave);
    const tokensChave = tokenizar(palavraChave);

    if (perguntaNormalizada.includes(chaveNormalizada)) {
      pontuacao += 10 + tokensChave.length;
      continue;
    }

    let correspondencias = 0;

    for (const token of tokensChave) {
      if (tokensPergunta.has(token)) {
        correspondencias += 1;
        pontuacao += 2;
      }
    }

    if (
      tokensChave.length > 1 &&
      correspondencias === tokensChave.length
    ) {
      pontuacao += 5;
    }
  }

  return pontuacao;
}

function buscarResposta(pergunta: string) {
  const textoNormalizado = normalizarTexto(pergunta);

  const saudacoes = [
    "oi",
    "ola",
    "bom dia",
    "boa tarde",
    "boa noite",
    "ajuda",
    "menu",
    "o que voce faz",
    "como voce pode ajudar",
  ];

  if (
    saudacoes.some(
      (saudacao) =>
        textoNormalizado === saudacao ||
        textoNormalizado.includes(saudacao)
    )
  ) {
    return RESPOSTA_AJUDA;
  }

  const resultados = GUIA.map((item) => ({
    item,
    pontuacao: calcularPontuacao(pergunta, item),
  })).sort((a, b) => b.pontuacao - a.pontuacao);

  const melhorResultado = resultados[0];

  if (!melhorResultado || melhorResultado.pontuacao < 4) {
    return RESPOSTA_NAO_ENCONTRADA;
  }

  return melhorResultado.item.resposta;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      {
        error: "Usuário não autenticado.",
      },
      {
        status: 401,
      }
    );
  }

  let corpo: {
    pergunta?: unknown;
  };

  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Dados da pergunta inválidos.",
      },
      {
        status: 400,
      }
    );
  }

  const pergunta = String(corpo.pergunta ?? "").trim();

  if (!pergunta) {
    return NextResponse.json(
      {
        error: "Digite uma pergunta.",
      },
      {
        status: 400,
      }
    );
  }

  if (pergunta.length > 500) {
    return NextResponse.json(
      {
        error: "A pergunta deve ter no máximo 500 caracteres.",
      },
      {
        status: 400,
      }
    );
  }

  const resposta = buscarResposta(pergunta);

  return NextResponse.json({
    resposta,
  });
}