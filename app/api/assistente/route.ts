import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ItemGuia = {
  id: string;
  titulo: string;
  categoria: string;
  palavrasChave: string[];
  perguntasExemplo?: string[];
  resposta: string;
  prioridade?: number;
};

type RegraDireta = {
  id: string;
  todos?: string[];
  algum?: string[];
};

const PALAVRAS_IGNORADAS = new Set([
  "a",
  "ao",
  "aos",
  "as",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "essa",
  "esse",
  "esta",
  "este",
  "na",
  "nas",
  "no",
  "nos",
  "o",
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

const CORRECOES_COMUNS: Record<string, string> = {
  adm: "administrador",
  adms: "administrador",
  admin: "administrador",
  admins: "administrador",

  atrbuir: "atribuir",
  atribur: "atribuir",
  atribui: "atribuir",
  atrubuir: "atribuir",

  cadastar: "cadastrar",
  cadastra: "cadastrar",
  cadastras: "cadastrar",
  cadrastrar: "cadastrar",

  colaboador: "colaborador",
  coloborador: "colaborador",
  colaborado: "colaborador",
  colaboradorr: "colaborador",

  edtiar: "editar",
  edita: "editar",

  exel: "excel",

  maqiuna: "maquina",
  maquna: "maquina",
  maquinaa: "maquina",
  maqunia: "maquina",

  notifcacao: "notificacao",
  notificao: "notificacao",
  notificacaoo: "notificacao",

  pecas: "peca",

  previntiva: "preventiva",
  preventia: "preventiva",
  prevntiva: "preventiva",
  prevetiva: "preventiva",

  prioridae: "prioridade",
  prioriddae: "prioridade",

  relatorioo: "relatorio",
  relatoio: "relatorio",
  relatotio: "relatorio",

  setro: "setor",

  statuz: "status",
  stauts: "status",

  usario: "usuario",
  usaurio: "usuario",
};

const GUIA: ItemGuia[] = [
  {
    id: "dashboard",
    titulo: "Página principal e dashboard",
    categoria: "dashboard",
    prioridade: 1,
    palavrasChave: [
      "pagina principal",
      "dashboard",
      "painel",
      "visao geral",
      "inicio",
      "home",
      "cards",
      "eficiencia",
      "resumo do sistema",
    ],
    perguntasExemplo: [
      "O que aparece no dashboard?",
      "Como funciona a página principal?",
      "Onde vejo o resumo das OS?",
    ],
    resposta: `Na página principal você encontra a visão geral do sistema.

Ela mostra:
1. Ordens não iniciadas.
2. Ordens em andamento.
3. Ordens concluídas.
4. Ordens canceladas.
5. Distribuição das OS por prioridade.
6. Eficiência geral.
7. Quantidade de colaboradores ativos.
8. Quantidade de setores cadastrados.

Os cards do dashboard podem ser usados para acessar as informações relacionadas.`,
  },

  {
    id: "criar_os",
    titulo: "Criar uma ordem de serviço",
    categoria: "ordens",
    prioridade: 3,
    palavrasChave: [
      "criar os",
      "nova os",
      "abrir os",
      "cadastrar os",
      "registrar os",
      "novo chamado",
      "registrar problema",
      "criar ordem",
      "abrir ordem",
    ],
    perguntasExemplo: [
      "Como criar uma nova OS?",
      "Como faço uma OS?",
      "Onde abro uma ordem de serviço?",
    ],
    resposta: `Para criar uma nova OS:

1. Acesse "Ordens de Serviço".
2. Clique em "Nova OS".
3. Selecione o setor.
4. Selecione a máquina ou equipamento.
5. Descreva detalhadamente o problema.
6. Informe a data e o horário da parada, caso necessário.
7. Adicione fotos ou vídeos, caso necessário.
8. Escolha a prioridade e o status.
9. Clique em "Criar OS".

O campo "Criada por" é preenchido automaticamente com o usuário conectado.`,
  },

  {
    id: "editar_os",
    titulo: "Editar uma ordem de serviço",
    categoria: "ordens",
    prioridade: 3,
    palavrasChave: [
      "editar os",
      "alterar os",
      "corrigir os",
      "atualizar os",
      "editar ordem",
      "alterar ordem",
      "mudar descricao os",
      "corrigir descricao",
    ],
    perguntasExemplo: [
      "Como editar uma OS?",
      "Como corrigir uma ordem de serviço?",
      "Como alterar os dados de uma OS?",
    ],
    resposta: `Para editar uma OS:

1. Acesse a opção "Editar OS" no menu.
2. Localize a ordem desejada.
3. Abra a opção de edição.
4. Altere os campos necessários.
5. Revise as informações.
6. Salve as alterações.

Antes de alterar uma OS, confirme se você selecionou o registro correto.`,
  },

  {
    id: "criador_os",
    titulo: "Criador da ordem de serviço",
    categoria: "ordens",
    prioridade: 3,
    palavrasChave: [
      "criada por",
      "criador",
      "quem criou",
      "usuario que criou",
      "login da os",
      "autor da os",
      "nome do criador",
    ],
    perguntasExemplo: [
      "Quem aparece no campo criada por?",
      "Como o sistema sabe quem criou a OS?",
    ],
    resposta: `O criador da OS é definido automaticamente pelo login utilizado no momento da criação.

Não existe uma lista para selecionar outra pessoa. Isso evita que uma OS seja registrada em nome de um usuário diferente.`,
  },

  {
    id: "consultar_os",
    titulo: "Consultar e pesquisar ordens de serviço",
    categoria: "ordens",
    prioridade: 2,
    palavrasChave: [
      "consultar os",
      "procurar os",
      "pesquisar os",
      "buscar os",
      "encontrar os",
      "planner",
      "lista de os",
      "ver ordens",
      "localizar os",
      "filtro os",
    ],
    perguntasExemplo: [
      "Como consultar uma OS?",
      "Como pesquisar uma OS?",
      "Onde vejo as ordens cadastradas?",
    ],
    resposta: `Para consultar uma OS:

1. Acesse "Ordens de Serviço".
2. Use o campo de pesquisa para procurar pelo título, descrição ou setor.
3. Use os filtros de colaborador ou status, quando necessário.
4. Localize a OS desejada no Planner.
5. Clique em "Ver detalhes" para acessar todas as informações.`,
  },

  {
    id: "atribuir_os",
    titulo: "Atribuir uma ordem de serviço",
    categoria: "ordens",
    prioridade: 4,
    palavrasChave: [
      "atribuir os",
      "responsavel",
      "colaborador responsavel",
      "enviar os",
      "designar os",
      "passar os",
      "atribuir colaborador",
      "selecionar responsavel",
    ],
    perguntasExemplo: [
      "Como atribuir uma OS?",
      "Como enviar uma OS para um colaborador?",
      "Como colocar um responsável na OS?",
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
    id: "status_os",
    titulo: "Alterar o status de uma ordem de serviço",
    categoria: "ordens",
    prioridade: 4,
    palavrasChave: [
      "alterar status os",
      "mudar status os",
      "concluir os",
      "cancelar os",
      "iniciar os",
      "os em andamento",
      "os nao iniciada",
      "os concluida",
      "os cancelada",
    ],
    perguntasExemplo: [
      "Como alterar o status de uma OS?",
      "Como concluir uma OS?",
      "Como colocar uma OS em andamento?",
    ],
    resposta: `Para alterar o status de uma OS:

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
    id: "detalhes_os",
    titulo: "Detalhes da ordem de serviço",
    categoria: "ordens",
    prioridade: 2,
    palavrasChave: [
      "detalhes da os",
      "informacoes da os",
      "ver detalhes",
      "dados da os",
      "data de criacao",
      "prioridade da os",
      "informacao da ordem",
    ],
    perguntasExemplo: [
      "Como ver os detalhes de uma OS?",
      "O que aparece nos detalhes da OS?",
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
    id: "data_parada",
    titulo: "Data e horário da parada da máquina",
    categoria: "ordens",
    prioridade: 4,
    palavrasChave: [
      "data parada",
      "horario parada",
      "maquina parou",
      "maquina parada desde",
      "tempo parada",
      "quando maquina parou",
      "informar parada",
    ],
    perguntasExemplo: [
      "Como informar quando a máquina parou?",
      "O campo de parada é obrigatório?",
    ],
    resposta: `O campo de data e horário da parada é opcional.

Preencha quando souber o momento em que a máquina parou. Essa informação ficará registrada nos detalhes da OS.

Quando a máquina não estiver parada ou o horário não for conhecido, deixe o campo vazio.`,
  },

  {
    id: "anexos",
    titulo: "Fotos, vídeos e anexos",
    categoria: "ordens",
    prioridade: 3,
    palavrasChave: [
      "foto",
      "video",
      "anexo",
      "anexar arquivo",
      "remover arquivo",
      "galeria",
      "imagem da os",
      "enviar foto",
      "enviar video",
    ],
    perguntasExemplo: [
      "Como anexar fotos em uma OS?",
      "Como enviar um vídeo na OS?",
      "Como remover um anexo antes de criar a OS?",
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
    id: "prioridade",
    titulo: "Prioridade da ordem de serviço",
    categoria: "ordens",
    prioridade: 1,
    palavrasChave: [
      "prioridade",
      "prioridade baixa",
      "prioridade media",
      "prioridade alta",
      "prioridade urgente",
      "nivel de urgencia",
      "urgencia os",
    ],
    perguntasExemplo: [
      "Como escolher a prioridade?",
      "Qual é a diferença entre baixa, média, alta e urgente?",
    ],
    resposta: `As prioridades disponíveis são:

- Baixa: atendimento sem urgência.
- Média: necessita acompanhamento.
- Alta: deve receber atenção rápida.
- Urgente: situação crítica que exige atendimento prioritário.

Escolha a prioridade conforme o impacto do problema na operação.`,
  },

  {
    id: "cadastrar_colaborador",
    titulo: "Cadastrar colaborador",
    categoria: "cadastros",
    prioridade: 3,
    palavrasChave: [
      "cadastrar colaborador",
      "novo colaborador",
      "adicionar colaborador",
      "adicionar funcionario",
      "criar usuario",
      "cadastro usuario",
      "novo usuario",
    ],
    perguntasExemplo: [
      "Como cadastrar um colaborador?",
      "Como criar um novo usuário?",
      "Como adicionar um funcionário?",
    ],
    resposta: `Para cadastrar um colaborador:

1. Acesse a área "Colaboradores".
2. Clique na opção de adicionar um novo colaborador.
3. Informe os dados solicitados.
4. Cadastre um e-mail válido.
5. Defina o perfil de acesso.
6. Cadastre a senha.
7. Salve o colaborador.

O e-mail deve estar correto para que o colaborador possa receber notificações.`,
  },

  {
    id: "editar_colaborador",
    titulo: "Editar colaborador",
    categoria: "cadastros",
    prioridade: 3,
    palavrasChave: [
      "editar colaborador",
      "alterar colaborador",
      "atualizar colaborador",
      "corrigir colaborador",
      "mudar dados colaborador",
      "trocar email colaborador",
    ],
    perguntasExemplo: [
      "Como editar um colaborador?",
      "Como trocar o e-mail de um colaborador?",
    ],
    resposta: `Para editar um colaborador:

1. Acesse "Colaboradores".
2. Localize a pessoa desejada.
3. Abra a opção de edição.
4. Altere os dados necessários.
5. Confira o e-mail e o perfil.
6. Salve as alterações.`,
  },

  {
    id: "desativar_colaborador",
    titulo: "Ativar ou desativar colaborador",
    categoria: "cadastros",
    prioridade: 4,
    palavrasChave: [
      "desativar colaborador",
      "inativar colaborador",
      "bloquear colaborador",
      "ativar colaborador",
      "usuario inativo",
      "remover acesso colaborador",
    ],
    perguntasExemplo: [
      "Como desativar um colaborador?",
      "Como retirar o acesso de um usuário?",
    ],
    resposta: `Para desativar um colaborador:

1. Acesse "Colaboradores".
2. Localize o usuário.
3. Abra a opção de edição ou gerenciamento.
4. Altere o cadastro para inativo.
5. Salve.

Um colaborador inativo não conseguirá entrar no sistema e não aparecerá nas seleções de responsáveis ativos.`,
  },

  {
    id: "cadastrar_setor",
    titulo: "Cadastrar setor",
    categoria: "cadastros",
    prioridade: 3,
    palavrasChave: [
      "cadastrar setor",
      "novo setor",
      "adicionar setor",
      "criar setor",
      "cadastro setor",
    ],
    perguntasExemplo: [
      "Como cadastrar um setor?",
      "Como adicionar um novo setor?",
    ],
    resposta: `Para cadastrar um setor:

1. Acesse a área "Setores".
2. Clique na opção de novo cadastro.
3. Informe o nome do setor.
4. Mantenha o setor ativo.
5. Salve o cadastro.

Somente setores ativos aparecem durante a criação de uma OS.`,
  },

  {
    id: "editar_setor",
    titulo: "Editar setor",
    categoria: "cadastros",
    prioridade: 3,
    palavrasChave: [
      "editar setor",
      "alterar setor",
      "atualizar setor",
      "mudar nome setor",
      "desativar setor",
      "ativar setor",
    ],
    perguntasExemplo: [
      "Como editar um setor?",
      "Como alterar o nome de um setor?",
    ],
    resposta: `Para editar um setor:

1. Acesse "Setores".
2. Localize o setor desejado.
3. Abra a opção de edição.
4. Altere o nome ou a situação do cadastro.
5. Salve.

Ao desativar um setor, ele deixa de aparecer nos novos formulários de OS.`,
  },

  {
    id: "setor_nao_aparece",
    titulo: "Setor não aparece no formulário",
    categoria: "cadastros",
    prioridade: 5,
    palavrasChave: [
      "setor nao aparece",
      "setor sumiu",
      "nao carrega setor",
      "lista setor vazia",
      "setor nao esta na lista",
    ],
    perguntasExemplo: [
      "Por que um setor não aparece?",
      "O setor não está aparecendo na nova OS.",
    ],
    resposta: `Quando um setor não aparece no formulário, confira:

1. Se o setor está cadastrado.
2. Se o setor está ativo.
3. Se o cadastro foi salvo.
4. Se a página foi atualizada depois da alteração.

Somente setores ativos são exibidos na criação de uma OS.`,
  },

  {
    id: "cadastrar_maquina",
    titulo: "Cadastrar máquina ou equipamento",
    categoria: "cadastros",
    prioridade: 3,
    palavrasChave: [
      "cadastrar maquina",
      "nova maquina",
      "adicionar maquina",
      "criar maquina",
      "cadastrar equipamento",
      "adicionar equipamento",
      "maquina por setor",
    ],
    perguntasExemplo: [
      "Como cadastrar uma máquina?",
      "Como cadastrar um equipamento?",
      "Como relacionar uma máquina a um setor?",
    ],
    resposta: `Para cadastrar uma máquina:

1. Acesse a área administrativa de setores e máquinas.
2. Selecione o setor ao qual a máquina pertence.
3. Abra a opção de adicionar uma máquina ou equipamento.
4. Informe o nome do equipamento.
5. Mantenha o cadastro ativo.
6. Salve.

Na criação de uma OS, o sistema mostra somente as máquinas do setor selecionado.`,
  },

  {
    id: "editar_maquina",
    titulo: "Editar máquina ou equipamento",
    categoria: "cadastros",
    prioridade: 3,
    palavrasChave: [
      "editar maquina",
      "alterar maquina",
      "atualizar maquina",
      "mudar nome maquina",
      "desativar maquina",
      "ativar maquina",
      "editar equipamento",
    ],
    perguntasExemplo: [
      "Como editar uma máquina?",
      "Como desativar um equipamento?",
    ],
    resposta: `Para editar uma máquina:

1. Acesse o setor ao qual a máquina pertence.
2. Localize o equipamento.
3. Abra a opção de edição.
4. Altere o nome ou a situação do cadastro.
5. Salve.

Máquinas inativas não aparecem na criação de novas ordens de serviço.`,
  },

  {
    id: "maquina_nao_aparece",
    titulo: "Máquina não aparece no formulário",
    categoria: "cadastros",
    prioridade: 6,
    palavrasChave: [
      "maquina nao aparece",
      "equipamento nao aparece",
      "lista maquina vazia",
      "nenhuma maquina cadastrada",
      "nao carrega maquina",
      "maquina sumiu",
      "maquina nao esta na lista",
    ],
    perguntasExemplo: [
      "Por que uma máquina não aparece na nova OS?",
      "O equipamento não está aparecendo.",
    ],
    resposta: `Quando uma máquina não aparece na criação da OS, confira:

1. Se o setor correto foi selecionado.
2. Se a máquina foi cadastrada nesse setor.
3. Se a máquina está ativa.
4. Se o setor está ativo.
5. Se o cadastro foi salvo.
6. Se a página foi atualizada depois do cadastro.`,
  },

  {
    id: "criar_preventiva",
    titulo: "Criar manutenção preventiva",
    categoria: "preventivas",
    prioridade: 4,
    palavrasChave: [
      "criar preventiva",
      "nova preventiva",
      "cadastrar preventiva",
      "agendar preventiva",
      "programar preventiva",
      "criar manutencao preventiva",
    ],
    perguntasExemplo: [
      "Como criar uma preventiva?",
      "Como agendar uma manutenção preventiva?",
    ],
    resposta: `Para criar uma preventiva:

1. Acesse "OS Preventiva".
2. Informe o título.
3. Selecione o setor.
4. Preencha a descrição da manutenção.
5. Selecione a prioridade.
6. Informe a data agendada.
7. Escolha quantos dias antes os administradores serão avisados.
8. Clique em "Salvar preventiva".`,
  },

  {
    id: "listar_preventivas",
    titulo: "Consultar preventivas agendadas",
    categoria: "preventivas",
    prioridade: 4,
    palavrasChave: [
      "consultar preventiva",
      "ver preventiva",
      "lista preventiva",
      "preventiva agendada",
      "preventiva cadastrada",
      "onde vejo preventiva",
      "preventiva nao aparece lista",
    ],
    perguntasExemplo: [
      "Como consultar as preventivas agendadas?",
      "Onde vejo as preventivas cadastradas?",
    ],
    resposta: `Para consultar as preventivas:

1. Acesse "OS Preventiva".
2. Clique em "Ver preventivas".
3. A página mostrará os agendamentos cadastrados.
4. Consulte a data, o setor, a prioridade e o status de cada preventiva.

As preventivas são organizadas pela data agendada.`,
  },

  {
    id: "editar_preventiva",
    titulo: "Editar manutenção preventiva",
    categoria: "preventivas",
    prioridade: 5,
    palavrasChave: [
      "editar preventiva",
      "alterar preventiva",
      "corrigir preventiva",
      "atualizar preventiva",
      "mudar data preventiva",
      "editar agendamento",
    ],
    perguntasExemplo: [
      "Como editar uma preventiva?",
      "Como alterar a data de uma preventiva?",
    ],
    resposta: `Para editar uma preventiva:

1. Abra a lista de preventivas agendadas.
2. Localize a preventiva desejada.
3. Clique em "Editar".
4. Altere os dados necessários.
5. Confira a data agendada.
6. Salve as alterações.`,
  },

  {
    id: "status_preventiva",
    titulo: "Alterar status da preventiva",
    categoria: "preventivas",
    prioridade: 6,
    palavrasChave: [
      "status preventiva",
      "alterar status preventiva",
      "mudar status preventiva",
      "preventiva feita",
      "concluir preventiva",
      "preventiva pendente",
    ],
    perguntasExemplo: [
      "Como alterar o status de uma preventiva?",
      "Como marcar uma preventiva como feita?",
    ],
    resposta: `Para alterar o status de uma preventiva:

1. Abra a lista de preventivas agendadas.
2. Localize a preventiva desejada.
3. Use o campo "Status da preventiva".
4. Escolha o novo status.
5. Aguarde a confirmação da alteração.

O status atualizado aparecerá no card da preventiva.`,
  },

  {
    id: "aviso_preventiva",
    titulo: "Aviso antecipado da preventiva",
    categoria: "preventivas",
    prioridade: 4,
    palavrasChave: [
      "avisar administrador antes",
      "aviso preventiva",
      "dias antes preventiva",
      "notificacao preventiva",
      "lembrete preventiva",
      "quando avisar administrador",
    ],
    perguntasExemplo: [
      "Como escolher quando os administradores serão avisados?",
      "O que significa avisar admins antes?",
    ],
    resposta: `Durante a criação da preventiva, use o campo "Avisar admins antes".

Você pode escolher:
- 1 dia antes.
- 2 dias antes.
- 3 dias antes.
- 7 dias antes.

O valor define com quantos dias de antecedência o sistema deverá considerar o aviso da manutenção programada.`,
  },

  {
    id: "relatorio",
    titulo: "Relatório de manutenção",
    categoria: "relatorios",
    prioridade: 4,
    palavrasChave: [
      "relatorio",
      "escrever relatorio",
      "relatorio final",
      "defeito",
      "causa",
      "solucao",
      "peca utilizada",
      "finalizar manutencao",
      "preencher relatorio",
    ],
    perguntasExemplo: [
      "Como gerar um relatório?",
      "Como preencher o relatório de manutenção?",
      "Onde informar defeito, causa e solução?",
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
    id: "indicadores",
    titulo: "Indicadores das ordens de serviço",
    categoria: "relatorios",
    prioridade: 3,
    palavrasChave: [
      "indicador",
      "grafico",
      "desempenho",
      "dados por colaborador",
      "dados por setor",
      "dados por maquina",
      "filtro indicador",
      "indicadores os",
      "estatistica os",
    ],
    perguntasExemplo: [
      "Como consultar os indicadores das OS?",
      "Como funcionam os filtros dos indicadores?",
    ],
    resposta: `Na área de indicadores você pode analisar o desempenho das ordens de serviço.

Dependendo da página, é possível filtrar por:
1. Período.
2. Setor.
3. Máquina.
4. Colaborador.
5. Status.
6. Prioridade.

Os indicadores ajudam a acompanhar quantidade de OS e desempenho da manutenção.`,
  },

  {
    id: "dashboard_colaboradores",
    titulo: "Dashboard de colaboradores",
    categoria: "relatorios",
    prioridade: 4,
    palavrasChave: [
      "dashboard colaborador",
      "indicador colaborador",
      "desempenho colaborador",
      "dados colaborador",
      "os por colaborador",
      "relatorio colaborador",
    ],
    perguntasExemplo: [
      "Como ver os dados por colaborador?",
      "Onde vejo o desempenho de um colaborador?",
    ],
    resposta: `Para consultar os dados por colaborador:

1. Acesse "Dashboard Colaboradores".
2. Localize ou selecione o colaborador desejado.
3. Consulte as ordens relacionadas.
4. Use os filtros disponíveis.
5. Gere o relatório quando a opção estiver disponível.`,
  },

  {
    id: "dashboard_maquina",
    titulo: "Dashboard de máquinas",
    categoria: "relatorios",
    prioridade: 4,
    palavrasChave: [
      "dashboard maquina",
      "indicador maquina",
      "dados maquina",
      "os por maquina",
      "historico maquina",
      "desempenho equipamento",
    ],
    perguntasExemplo: [
      "Como ver os dados por máquina?",
      "Onde vejo o histórico de uma máquina?",
    ],
    resposta: `Para analisar uma máquina:

1. Acesse o setor ao qual a máquina pertence.
2. Localize o equipamento desejado.
3. Abra o dashboard da máquina.
4. Consulte as OS relacionadas.
5. Aplique os filtros disponíveis.
6. Gere o PDF quando necessário.`,
  },

  {
    id: "exportar",
    titulo: "Exportar PDF ou Excel",
    categoria: "relatorios",
    prioridade: 4,
    palavrasChave: [
      "exportar pdf",
      "baixar pdf",
      "gerar pdf",
      "exportar excel",
      "baixar excel",
      "planilha",
      "imprimir relatorio",
      "baixar relatorio",
    ],
    perguntasExemplo: [
      "Como exportar um relatório em PDF?",
      "Como exportar os dados para Excel?",
    ],
    resposta: `Para exportar informações:

1. Acesse o relatório, dashboard ou indicador desejado.
2. Aplique os filtros necessários.
3. Clique no botão de exportação disponível.
4. Escolha PDF ou Excel, conforme as opções da página.

O arquivo será gerado com os dados filtrados.`,
  },

  {
    id: "email_nova_os",
    titulo: "Notificação ao criar uma nova OS",
    categoria: "notificacoes",
    prioridade: 5,
    palavrasChave: [
      "email nova os",
      "notificacao nova os",
      "aviso nova os",
      "email supervisor",
      "notificar supervisor",
      "nilton nova os",
    ],
    perguntasExemplo: [
      "Quando o supervisor recebe uma notificação?",
      "Quem recebe o e-mail quando uma OS é criada?",
    ],
    resposta: `Quando uma nova OS é criada, o sistema tenta enviar uma notificação ao supervisor configurado.

O e-mail apresenta informações como:
1. Número da OS.
2. Máquina.
3. Setor.
4. Prioridade.
5. Status.
6. Criador da OS.
7. Descrição do problema.
8. Data da parada, quando informada.

A criação da OS não deve ser cancelada caso o serviço de e-mail esteja temporariamente indisponível.`,
  },

  {
    id: "email_atribuicao",
    titulo: "Notificação ao atribuir uma OS",
    categoria: "notificacoes",
    prioridade: 6,
    palavrasChave: [
      "email atribuicao",
      "email colaborador",
      "notificar responsavel",
      "aviso colaborador",
      "os atribuida",
      "email de responsavel",
    ],
    perguntasExemplo: [
      "Quando o colaborador recebe o e-mail da OS?",
      "O responsável recebe uma notificação?",
    ],
    resposta: `Quando uma OS é atribuída, o sistema pode enviar uma notificação ao colaborador responsável.

Para o recebimento funcionar:
1. O colaborador precisa ter um e-mail válido.
2. A atribuição precisa ser concluída.
3. O serviço de envio precisa estar disponível.
4. O e-mail não pode estar bloqueado ou na lista de spam.`,
  },

  {
    id: "email_nao_chega",
    titulo: "E-mail não foi recebido",
    categoria: "notificacoes",
    prioridade: 7,
    palavrasChave: [
      "email nao chegou",
      "email nao chega",
      "nao recebi email",
      "notificacao nao chegou",
      "problema email",
      "email spam",
      "email rejeitado",
    ],
    perguntasExemplo: [
      "O que fazer quando o e-mail não chega?",
      "Por que não recebi a notificação?",
    ],
    resposta: `Caso o e-mail não chegue:

1. Confira se a OS foi criada ou atribuída normalmente.
2. Verifique a caixa de spam ou lixo eletrônico.
3. Confirme se o endereço cadastrado está correto.
4. Aguarde alguns minutos e consulte novamente.
5. Informe o administrador para verificar o serviço de envio.

O problema no envio do e-mail não significa necessariamente que a OS não foi salva.`,
  },

  {
    id: "login",
    titulo: "Problemas de login",
    categoria: "acesso",
    prioridade: 4,
    palavrasChave: [
      "login",
      "entrar",
      "senha",
      "acesso",
      "nao consigo entrar",
      "usuario inativo",
      "esqueci senha",
      "login bloqueado",
    ],
    perguntasExemplo: [
      "Não consigo entrar no sistema. O que faço?",
      "Esqueci minha senha.",
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
    id: "permissoes",
    titulo: "Permissões dos usuários",
    categoria: "acesso",
    prioridade: 3,
    palavrasChave: [
      "permissao",
      "perfil usuario",
      "administrador",
      "colaborador",
      "quem pode editar",
      "quem pode cadastrar",
      "acesso limitado",
    ],
    perguntasExemplo: [
      "Como funcionam as permissões dos usuários?",
      "Qual a diferença entre administrador e colaborador?",
    ],
    resposta: `O sistema possui perfis de acesso.

- Administrador: possui acesso às áreas administrativas e aos cadastros permitidos pelo sistema.
- Colaborador: possui acesso às funções liberadas para execução e acompanhamento das ordens.

As opções exibidas podem variar conforme o perfil do usuário conectado.`,
  },

  {
    id: "seguranca",
    titulo: "Segurança da conta",
    categoria: "acesso",
    prioridade: 3,
    palavrasChave: [
      "seguranca",
      "senha",
      "token",
      "chave",
      "credencial",
      "compartilhar login",
      "compartilhar senha",
      "conta segura",
      "acesso suspeito",
    ],
    perguntasExemplo: [
      "Como manter minha conta segura?",
      "Posso compartilhar meu login?",
    ],
    resposta: `Para manter o sistema seguro:

1. Cada pessoa deve utilizar seu próprio login.
2. Não compartilhe senhas.
3. Não envie tokens ou chaves por mensagem.
4. Saia do sistema em computadores compartilhados.
5. Informe o administrador sobre acessos suspeitos.
6. Confirme sempre qual usuário está conectado antes de criar uma OS.`,
  },
];

const RESPOSTA_AJUDA = `Posso ajudar com dúvidas sobre:

1. Criar, consultar e editar ordens de serviço.
2. Atribuir responsáveis.
3. Alterar o status das OS.
4. Cadastrar colaboradores.
5. Cadastrar setores.
6. Cadastrar máquinas.
7. Criar e acompanhar preventivas.
8. Preencher relatórios.
9. Consultar indicadores.
10. Exportar PDF e Excel.
11. Login, permissões e notificações.

Use as opções do início ou digite sua dúvida com suas próprias palavras.`;

const RESPOSTA_NAO_ENCONTRADA = `Não encontrei uma resposta exata para essa dúvida no guia do sistema.

Você pode:
1. Tentar escrever a pergunta de outra forma.
2. Usar palavras como OS, colaborador, setor, máquina, preventiva ou relatório.
3. Voltar ao início e escolher uma das opções disponíveis.
4. Procurar o administrador ou supervisor responsável.`;

function normalizarTextoBase(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function aplicarSinonimos(texto: string) {
  let resultado = ` ${texto} `;

  const substituicoes: Array<[RegExp, string]> = [
    [/\bordens? de servico\b/g, " os "],
    [/\bordens? servico\b/g, " os "],
    [/\bchamados?\b/g, " os "],

    [/\be mails?\b/g, " email "],
    [/\bemails\b/g, " email "],

    [/\bfuncionarios?\b/g, " colaborador "],
    [/\bcolaboradores\b/g, " colaborador "],

    [/\bequipamentos?\b/g, " maquina "],
    [/\bmaquinas\b/g, " maquina "],

    [/\bsetores\b/g, " setor "],

    [/\bpreventivas\b/g, " preventiva "],
    [/\bmanutencao preventiva\b/g, " preventiva "],

    [/\brelatorios\b/g, " relatorio "],

    [/\bindicadores\b/g, " indicador "],
    [/\bgraficos\b/g, " grafico "],

    [/\bnotificacoes\b/g, " notificacao "],
    [/\bavisos\b/g, " aviso "],

    [/\bfotos\b/g, " foto "],
    [/\bvideos\b/g, " video "],
    [/\banexos\b/g, " anexo "],

    [/\bpecas\b/g, " peca "],

    [/\busuarios\b/g, " usuario "],

    [/\badministradores\b/g, " administrador "],

    [/\bfazer\b/g, " criar "],
    [/\bmontar\b/g, " criar "],

    [/\bvisualizar\b/g, " consultar "],
    [/\bverificar\b/g, " consultar "],

    [/\bmudar\b/g, " alterar "],
    [/\btrocar\b/g, " alterar "],

    [/\bplanilhas?\b/g, " excel "],
  ];

  for (const [expressao, substituicao] of substituicoes) {
    resultado = resultado.replace(expressao, substituicao);
  }

  return resultado.replace(/\s+/g, " ").trim();
}

function corrigirErrosComuns(texto: string) {
  return texto
    .split(" ")
    .map((palavra) => CORRECOES_COMUNS[palavra] ?? palavra)
    .join(" ");
}

function prepararTexto(texto: string) {
  const normalizado = normalizarTextoBase(texto);
  const comSinonimos = aplicarSinonimos(normalizado);

  return corrigirErrosComuns(comSinonimos);
}

function tokenizar(texto: string) {
  return prepararTexto(texto)
    .split(" ")
    .filter(
      (palavra) =>
        palavra.length >= 2 &&
        !PALAVRAS_IGNORADAS.has(palavra)
    );
}

function distanciaLevenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const linhaAnterior = Array.from(
    { length: b.length + 1 },
    (_, indice) => indice
  );

  for (let indiceA = 1; indiceA <= a.length; indiceA += 1) {
    const linhaAtual = [indiceA];

    for (
      let indiceB = 1;
      indiceB <= b.length;
      indiceB += 1
    ) {
      const custo =
        a[indiceA - 1] === b[indiceB - 1] ? 0 : 1;

      linhaAtual[indiceB] = Math.min(
        linhaAtual[indiceB - 1] + 1,
        linhaAnterior[indiceB] + 1,
        linhaAnterior[indiceB - 1] + custo
      );
    }

    for (
      let indice = 0;
      indice < linhaAtual.length;
      indice += 1
    ) {
      linhaAnterior[indice] = linhaAtual[indice];
    }
  }

  return linhaAnterior[b.length];
}

function palavrasParecidas(a: string, b: string) {
  if (a === b) return true;

  if (a.length < 4 || b.length < 4) {
    return false;
  }

  if (a[0] !== b[0]) {
    return false;
  }

  const maiorTamanho = Math.max(a.length, b.length);
  const distanciaPermitida = maiorTamanho <= 6 ? 1 : 2;

  return distanciaLevenshtein(a, b) <= distanciaPermitida;
}

function contemTodos(texto: string, termos: string[]) {
  return termos.every((termo) =>
    texto.includes(prepararTexto(termo))
  );
}

function contemAlgum(texto: string, termos: string[]) {
  return termos.some((termo) =>
    texto.includes(prepararTexto(termo))
  );
}

const REGRAS_DIRETAS: RegraDireta[] = [
  {
    id: "email_nao_chega",
    todos: ["email"],
    algum: [
      "nao chegou",
      "nao chega",
      "nao recebi",
      "spam",
      "rejeitado",
      "problema",
    ],
  },
  {
    id: "email_atribuicao",
    todos: ["email"],
    algum: [
      "atribuicao",
      "atribuida",
      "responsavel",
      "colaborador",
    ],
  },
  {
    id: "email_nova_os",
    todos: ["email"],
    algum: [
      "nova os",
      "criar os",
      "supervisor",
      "nilton",
    ],
  },

  {
    id: "maquina_nao_aparece",
    todos: ["maquina"],
    algum: [
      "nao aparece",
      "nao carrega",
      "sumiu",
      "lista vazia",
      "nao esta na lista",
    ],
  },
  {
    id: "setor_nao_aparece",
    todos: ["setor"],
    algum: [
      "nao aparece",
      "nao carrega",
      "sumiu",
      "lista vazia",
      "nao esta na lista",
    ],
  },

  {
    id: "status_preventiva",
    todos: ["preventiva", "status"],
  },
  {
    id: "editar_preventiva",
    todos: ["preventiva"],
    algum: [
      "editar",
      "alterar",
      "corrigir",
      "atualizar",
      "mudar data",
    ],
  },
  {
    id: "listar_preventivas",
    todos: ["preventiva"],
    algum: [
      "consultar",
      "lista",
      "onde vejo",
      "agendada",
      "cadastrada",
      "nao aparece",
    ],
  },
  {
    id: "aviso_preventiva",
    todos: ["preventiva"],
    algum: [
      "aviso",
      "avisar",
      "dias antes",
      "lembrete",
      "administrador",
    ],
  },
  {
    id: "criar_preventiva",
    todos: ["preventiva"],
    algum: [
      "criar",
      "cadastrar",
      "agendar",
      "programar",
      "nova",
    ],
  },

  {
    id: "maquina_nao_aparece",
    todos: ["maquina", "os"],
    algum: ["nao aparece", "nao carrega"],
  },
  {
    id: "data_parada",
    algum: [
      "data parada",
      "horario parada",
      "maquina parou",
      "parada desde",
      "tempo parada",
    ],
  },
  {
    id: "anexos",
    algum: [
      "foto",
      "video",
      "anexo",
      "imagem",
      "galeria",
    ],
  },

  {
    id: "editar_os",
    todos: ["os"],
    algum: [
      "editar",
      "alterar",
      "corrigir",
      "atualizar",
    ],
  },
  {
    id: "atribuir_os",
    todos: ["os"],
    algum: [
      "atribuir",
      "responsavel",
      "designar",
      "passar",
    ],
  },
  {
    id: "status_os",
    todos: ["os"],
    algum: [
      "status",
      "concluir",
      "cancelar",
      "iniciar",
      "andamento",
    ],
  },
  {
    id: "consultar_os",
    todos: ["os"],
    algum: [
      "consultar",
      "pesquisar",
      "buscar",
      "procurar",
      "encontrar",
      "planner",
      "lista",
    ],
  },
  {
    id: "detalhes_os",
    todos: ["os"],
    algum: [
      "detalhes",
      "informacao",
      "dados",
    ],
  },
  {
    id: "criador_os",
    todos: ["os"],
    algum: [
      "quem criou",
      "criada por",
      "criador",
      "autor",
      "login",
    ],
  },
  {
    id: "criar_os",
    todos: ["os"],
    algum: [
      "criar",
      "nova",
      "abrir",
      "cadastrar",
      "registrar",
    ],
  },

  {
    id: "desativar_colaborador",
    todos: ["colaborador"],
    algum: [
      "desativar",
      "inativar",
      "bloquear",
      "remover acesso",
      "ativar",
    ],
  },
  {
    id: "editar_colaborador",
    todos: ["colaborador"],
    algum: [
      "editar",
      "alterar",
      "atualizar",
      "corrigir",
    ],
  },
  {
    id: "cadastrar_colaborador",
    todos: ["colaborador"],
    algum: [
      "cadastrar",
      "novo",
      "adicionar",
      "criar",
    ],
  },

  {
    id: "editar_setor",
    todos: ["setor"],
    algum: [
      "editar",
      "alterar",
      "atualizar",
      "desativar",
      "ativar",
    ],
  },
  {
    id: "cadastrar_setor",
    todos: ["setor"],
    algum: [
      "cadastrar",
      "novo",
      "adicionar",
      "criar",
    ],
  },

  {
    id: "editar_maquina",
    todos: ["maquina"],
    algum: [
      "editar",
      "alterar",
      "atualizar",
      "desativar",
      "ativar",
    ],
  },
  {
    id: "cadastrar_maquina",
    todos: ["maquina"],
    algum: [
      "cadastrar",
      "nova",
      "adicionar",
      "criar",
      "relacionar",
    ],
  },

  {
    id: "relatorio",
    algum: [
      "relatorio",
      "defeito",
      "causa",
      "solucao",
      "peca utilizada",
    ],
  },
  {
    id: "dashboard_colaboradores",
    todos: ["colaborador"],
    algum: [
      "dashboard",
      "indicador",
      "desempenho",
      "dados",
      "relatorio",
    ],
  },
  {
    id: "dashboard_maquina",
    todos: ["maquina"],
    algum: [
      "dashboard",
      "indicador",
      "historico",
      "desempenho",
      "dados",
    ],
  },
  {
    id: "exportar",
    algum: [
      "pdf",
      "excel",
      "exportar",
      "baixar relatorio",
      "planilha",
    ],
  },
  {
    id: "indicadores",
    algum: [
      "indicador",
      "grafico",
      "estatistica",
      "desempenho",
    ],
  },

  {
    id: "login",
    algum: [
      "login",
      "nao consigo entrar",
      "esqueci senha",
      "acesso bloqueado",
      "usuario inativo",
    ],
  },
  {
    id: "permissoes",
    algum: [
      "permissao",
      "perfil usuario",
      "administrador",
      "acesso limitado",
    ],
  },
  {
    id: "seguranca",
    algum: [
      "seguranca",
      "compartilhar senha",
      "compartilhar login",
      "token",
      "credencial",
      "acesso suspeito",
    ],
  },
];

function buscarPorRegraDireta(pergunta: string) {
  const texto = prepararTexto(pergunta);

  for (const regra of REGRAS_DIRETAS) {
    const passouTodos =
      !regra.todos ||
      regra.todos.length === 0 ||
      contemTodos(texto, regra.todos);

    const passouAlgum =
      !regra.algum ||
      regra.algum.length === 0 ||
      contemAlgum(texto, regra.algum);

    if (passouTodos && passouAlgum) {
      return GUIA.find((item) => item.id === regra.id) ?? null;
    }
  }

  return null;
}

function calcularPontuacao(
  pergunta: string,
  item: ItemGuia
) {
  const perguntaPreparada = prepararTexto(pergunta);
  const tokensPergunta = tokenizar(pergunta);

  let pontuacao = item.prioridade ?? 0;

  const tituloPreparado = prepararTexto(item.titulo);
  const tokensTitulo = tokenizar(item.titulo);

  if (perguntaPreparada.includes(tituloPreparado)) {
    pontuacao += 20;
  }

  for (const tokenTitulo of tokensTitulo) {
    if (tokensPergunta.includes(tokenTitulo)) {
      pontuacao += 3;
      continue;
    }

    if (
      tokensPergunta.some((tokenPergunta) =>
        palavrasParecidas(tokenTitulo, tokenPergunta)
      )
    ) {
      pontuacao += 1;
    }
  }

  for (const palavraChave of item.palavrasChave) {
    const chavePreparada = prepararTexto(palavraChave);
    const tokensChave = tokenizar(palavraChave);

    if (perguntaPreparada.includes(chavePreparada)) {
      pontuacao += 15 + tokensChave.length * 2;
      continue;
    }

    let correspondenciasExatas = 0;
    let correspondenciasAproximadas = 0;

    for (const tokenChave of tokensChave) {
      if (tokensPergunta.includes(tokenChave)) {
        correspondenciasExatas += 1;
        pontuacao += 3;
        continue;
      }

      if (
        tokensPergunta.some((tokenPergunta) =>
          palavrasParecidas(tokenChave, tokenPergunta)
        )
      ) {
        correspondenciasAproximadas += 1;
        pontuacao += 1;
      }
    }

    if (
      tokensChave.length > 1 &&
      correspondenciasExatas === tokensChave.length
    ) {
      pontuacao += 8;
    } else if (
      tokensChave.length > 1 &&
      correspondenciasExatas +
        correspondenciasAproximadas ===
        tokensChave.length
    ) {
      pontuacao += 4;
    }
  }

  for (const exemplo of item.perguntasExemplo ?? []) {
    const exemploPreparado = prepararTexto(exemplo);
    const tokensExemplo = tokenizar(exemplo);

    if (perguntaPreparada === exemploPreparado) {
      pontuacao += 30;
      continue;
    }

    if (
      perguntaPreparada.includes(exemploPreparado) ||
      exemploPreparado.includes(perguntaPreparada)
    ) {
      pontuacao += 18;
    }

    let tokensCorrespondentes = 0;

    for (const tokenExemplo of tokensExemplo) {
      if (
        tokensPergunta.some((tokenPergunta) =>
          palavrasParecidas(tokenExemplo, tokenPergunta)
        )
      ) {
        tokensCorrespondentes += 1;
      }
    }

    if (
      tokensExemplo.length > 0 &&
      tokensCorrespondentes / tokensExemplo.length >= 0.7
    ) {
      pontuacao += 10;
    }
  }

  return pontuacao;
}

function buscarResposta(pergunta: string) {
  const textoPreparado = prepararTexto(pergunta);

  const comandosInicio = new Set([
    "inicio",
    "voltar",
    "voltar inicio",
    "menu",
    "menu principal",
    "ajuda",
    "recomecar",
    "reiniciar",
    "comecar novamente",
  ]);

  if (comandosInicio.has(textoPreparado)) {
    return RESPOSTA_AJUDA;
  }

  const saudacoes = [
    "oi",
    "ola",
    "bom dia",
    "boa tarde",
    "boa noite",
    "o que voce faz",
    "como voce pode ajudar",
  ];

  if (
    saudacoes.some(
      (saudacao) =>
        textoPreparado === saudacao ||
        textoPreparado.startsWith(`${saudacao} `)
    )
  ) {
    return RESPOSTA_AJUDA;
  }

  const resultadoDireto = buscarPorRegraDireta(pergunta);

  if (resultadoDireto) {
    return resultadoDireto.resposta;
  }

  const resultados = GUIA.map((item) => ({
    item,
    pontuacao: calcularPontuacao(pergunta, item),
  })).sort((a, b) => b.pontuacao - a.pontuacao);

  const melhorResultado = resultados[0];

  if (!melhorResultado || melhorResultado.pontuacao < 7) {
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