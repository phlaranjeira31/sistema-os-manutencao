export type ZonaMapaFabrica = {
  id: string;
  label: string;
  setorSistema: string;
  aliases: string[];
  points: string;
};

export const MAPA_FABRICA_LARGURA = 1672;
export const MAPA_FABRICA_ALTURA = 941;

/**
 * Áreas clicáveis recalibradas diretamente sobre a nova planta 3D.
 * Não existe demarcação visível em repouso: os polígonos servem apenas
 * como hit-area e destaque de hover.
 */
export const ZONAS_MAPA_FABRICA: ZonaMapaFabrica[] = [
  {
    id: "lavagem-equipamento",
    label: "Lavagem de Equipamento",
    setorSistema: "HIGIENIZAÇÃO",
    aliases: ["HIGIENIZACAO", "LAVAGEM DE EQUIPAMENTO", "LAVAGEM EQUIPAMENTO"],
    points: "100,67 270,67 270,189 100,189",
  },
  {
    id: "pcp",
    label: "PCP",
    setorSistema: "QUALIDADE",
    aliases: ["PCP", "QUALIDADE"],
    points: "322,45 490,45 490,139 322,139",
  },
  {
    id: "producao-trigo",
    label: "Produção Trigo",
    setorSistema: "TRIGO",
    aliases: ["TRIGO", "PRODUCAO TRIGO", "PRODUÇÃO TRIGO", "AREA PRODUCAO TRIGO"],
    points: "20,202 592,202 592,395 20,395",
  },
  {
    id: "armazem-trigo",
    label: "Armazém Trigo",
    setorSistema: "ARMAZENS",
    aliases: ["ARMAZENS", "ARMAZÉNS", "ARMAZEM TRIGO", "ARMAZÉM TRIGO"],
    points: "648,196 897,196 897,392 648,392",
  },
  {
    id: "armazem-embalagens",
    label: "Armazém Embalagens",
    setorSistema: "ARMAZENS",
    aliases: ["ARMAZENS", "ARMAZÉNS", "ARMAZEM EMBALAGENS", "ARMAZÉM EMBALAGENS"],
    points: "903,196 1217,196 1217,392 903,392",
  },
  {
    id: "armazem-milho",
    label: "Armazém Milho",
    setorSistema: "ARMAZENS",
    aliases: ["ARMAZENS", "ARMAZÉNS", "ARMAZEM MILHO", "ARMAZÉM MILHO"],
    points: "1222,160 1449,160 1449,392 1222,392",
  },
  {
    id: "vestiario",
    label: "Vestiário",
    setorSistema: "VESTIÁRIO",
    aliases: ["VESTIARIO", "VESTIÁRIO"],
    points: "1453,300 1538,300 1538,393 1453,393",
  },
  {
    id: "manutencao",
    label: "Manutenção",
    setorSistema: "MANUTENÇÃO",
    aliases: ["MANUTENCAO", "MANUTENÇÃO"],
    points: "271,466 421,466 421,749 271,749",
  },
  {
    id: "adm-manutencao",
    label: "Adm. Manutenção",
    setorSistema: "MANUTENÇÃO",
    aliases: ["ADM MANUTENCAO", "ADM MANUTENÇÃO", "MANUTENCAO", "MANUTENÇÃO"],
    points: "170,690 270,690 270,750 170,750",
  },
  {
    id: "camara-congelados",
    label: "Câmara de Congelados",
    setorSistema: "CÂMARA FRIA",
    aliases: ["CAMARA FRIA", "CÂMARA FRIA", "CAMARA CONGELADOS", "CÂMARA CONGELADOS"],
    points: "368,466 484,466 484,678 368,678",
  },
  {
    id: "garytos",
    label: "Garytos",
    setorSistema: "GARYTOS",
    aliases: ["GARYTOS", "FRITURA E EMPACOTAMENTO GARYTOS"],
    points: "489,466 691,466 691,750 489,750",
  },
  {
    id: "area-multiuso",
    label: "Área Multiuso",
    setorSistema: "AREA MULTIUSO",
    aliases: ["AREA MULTIUSO", "ÁREA MULTIUSO", "MULTIUSO"],
    points: "698,466 907,466 907,697 790,697 790,751 698,751",
  },
  {
    id: "laboratorio",
    label: "Laboratório",
    setorSistema: "LABORATORIO",
    aliases: ["LABORATORIO", "LABORATÓRIO"],
    points: "791,698 907,698 907,789 791,789",
  },
  {
    id: "taco",
    label: "Taco",
    setorSistema: "TACO",
    aliases: ["TACO"],
    points: "910,466 1348,466 1348,578 910,578",
  },
  {
    id: "producao-milho",
    label: "Produção Milho",
    setorSistema: "MILHO",
    aliases: ["MILHO", "PRODUCAO MILHO", "PRODUÇÃO MILHO"],
    points: "910,580 1450,580 1450,750 910,750",
  },
  {
    id: "administracao",
    label: "Administração",
    setorSistema: "ADMINISTRAÇÃO",
    aliases: ["ADMINISTRACAO", "ADMINISTRAÇÃO", "ADM"],
    points: "1452,593 1542,593 1542,750 1452,750",
  },
  {
    id: "gary",
    label: "Gary",
    setorSistema: "SALA DO GARY",
    aliases: ["SALA DO GARY", "GARY"],
    points: "1544,553 1647,553 1647,692 1544,692",
  },
];
