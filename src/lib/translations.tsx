'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

const translations = {
  pt: {
    main_title: 'Analisador Avançado de Pontos de Interesse (POIs)',
    main_subtitle:
      'Carregue um arquivo para validar, analisar sobreposições e visualizar POIs num mapa interativo.',
    control_title: 'Controle',
    select_file: '1. Selecione o arquivo (.xlsx, .csv)',
    column_mapping_title: 'Mapeamento de Colunas',
    latitude_column: 'Latitude',
    longitude_column: 'Longitude',
    state_column: 'Estado/UF',
    city_column: 'Cidade/Município',
    analyze_button: 'Analisar',
    clear_button: 'Limpar',
    analysis_options_title: 'Opções de Análise',
    option_invalid_data: 'Verificar dados inválidos',
    option_exact_duplicates: 'Verificar duplicatas exatas',
    option_proximity: 'Verificar pontos em proximidade',
    option_geographic: 'Verificar correspondência geográfica',
    load_map_points: 'Carregar pontos no mapa',
    processing_message: 'A processar os dados...',
    parsing_message: 'A ler o ficheiro...',
    analyzing_message: (current: number, total: number) =>
      `Analisando: ${Math.round((current / total) * 100)}%`,
    geocoding_message: (current: number, total: number) =>
      `Verificando: ${current} / ${total}`,
    map_loading_message: (current: number, total: number) =>
      `A carregar pontos: ${current} / ${total}`,
    downloads_title: 'Downloads',
    download_full_report_button: 'Relatório Completo (XLSX)',
    download_problems_button: 'Problemas (XLSX)',
    map_title: 'Visualização no Mapa',
    show_all_button: 'Mostrar Todos',
    summary_title: 'Métricas de Validação',
    total_pois_label: 'Total de POIs analisados:',
    exact_overlap_label: 'POIs em sobreposição exata:',
    proximity_label: 'Pontos em Proximidade:',
    invalid_coords_label: 'Dados Inválidos:',
    removed_points_label: 'Pontos problemáticos:',
    clean_points_label: 'Pontos na base limpa:',
    state_mismatch_label: 'POIs com Estado incorreto:',
    city_mismatch_label: 'POIs com Cidade incorreta:',
    results_title_proximity: 'Células com Pontos em Proximidade',
    results_title_exact: 'Grupos de Sobreposição Exata',
    results_title_mismatch: 'Inconsistências de Localização',
    results_title_invalid: 'Dados Inválidos',
    mismatch_state_header: 'Estado Incorreto',
    mismatch_city_header: 'Cidade Incorreta',
    map_popup_row: 'Linha',
    map_popup_status: 'Status',
    map_popup_status_clean: 'Ponto Válido',
    error_reading_file: 'Erro ao ler o arquivo:',
    error_no_data: 'Nenhum dado para processar.',
    error_generic: 'Ocorreu um erro na análise:',
    success_no_problems: 'Análise concluída. Nenhum problema encontrado.',
    download_no_data: 'Não há dados para baixar.',
    analysis_mode: 'Modo de Operação',
    mode_single: 'Análise Única',
    mode_compare: 'Comparação',
    mode_geocode: 'Geocodificação',
    spreadsheet_a_title: 'Planilha A',
    spreadsheet_b_title: 'Planilha B',
    spreadsheet_a_short: 'Planilha A',
    spreadsheet_b_short: 'Planilha B',
    base_spreadsheet_title: 'Planilha Base para Análise',
    base_spreadsheet_note:
      'A análise irá encontrar o ponto mais próximo da outra planilha para cada ponto da planilha base selecionada.',
    compare_button: 'Comparar Arquivos',
    download_comparison_report_button: 'Relatório de Comparação (XLSX)',
    comparison_summary_title: 'Resultados da Comparação',
    total_base_points: (sheet: string) =>
      `Total de pontos na Planilha ${sheet}:`,
    points_with_match: 'Pontos com correspondência próxima:',
    same_square_meter_matches: 'Pontos no mesmo metro quadrado:',
    comparison_results_title: 'Detalhes da Comparação',
    base_point_row: 'Linha Base',
    match_point_row: 'Linha Correspondente',
    distance_meters: 'Distância (m)',
    comparing_message: (current: number, total: number) =>
      `Comparando: ${current} de ${total}`,
    comparison_method_title: 'Método de Comparação',
    method_m2: 'Mesmo M²',
    method_nearest: 'N Pontos Mais Próximos',
    method_radius: 'Raio Máximo (metros)',
    select_file_geocode: 'Selecione a Planilha',
    column_mapping_geocode_title: 'Mapeamento para Geocodificação',
    column_mapping_geocode_note:
      'Mapeie as colunas que contêm as informações de endereço. Pelo menos uma deve ser selecionada.',
    column_mapping_geo_note: 'Mapeie as colunas de coordenadas, estado e cidade para verificação.',
    geocode_name: 'Nome do Local',
    geocode_address: 'Logradouro',
    geocode_city: 'Cidade',
    geocode_state: 'Estado',
    geocode_button: 'Executar',
    download_geocoded_report_button: 'Baixar Planilha Resultante (XLSX)',
    geocoding_search_message: (current: number, total: number) =>
      `Processando: ${current} / ${total}`,
    geocoding_done: 'Processo Concluído!',
    neighbors: 'Vizinhos',
  },
  es: {
    // Simplified Spanish translations
    main_title: 'Analizador Avanzado de Puntos de Interés (POIs)',
    main_subtitle:
      'Cargue un archivo para validar, analizar superposiciones y visualizar POIs en un mapa interactivo.',
    control_title: 'Control',
    select_file: '1. Seleccione el archivo (.xlsx, .csv)',
    column_mapping_title: 'Mapeo de Columnas',
    latitude_column: 'Latitud',
    longitude_column: 'Longitud',
    state_column: 'Estado/Provincia',
    city_column: 'Ciudad/Municipio',
    analyze_button: 'Analizar',
    clear_button: 'Limpiar',
    processing_message: 'Procesando datos...',
    mode_single: 'Análisis Único',
    mode_compare: 'Comparación',
    mode_geocode: 'Geocodificación',
  },
  en: {
    // Simplified English translations
    main_title: 'Advanced Point of Interest (POI) Analyzer',
    main_subtitle:
      'Upload a file to validate, analyze overlaps, and visualize POIs on an interactive map.',
    control_title: 'Controls',
    select_file: '1. Select file (.xlsx, .csv)',
    column_mapping_title: 'Column Mapping',
    latitude_column: 'Latitude',
    longitude_column: 'Longitude',
    state_column: 'State/Province',
    city_column: 'City/Municipality',
    analyze_button: 'Analyze',
    clear_button: 'Clear',
    processing_message: 'Processing data...',
    mode_single: 'Single Analysis',
    mode_compare: 'Comparison',
    mode_geocode: 'Geocoding',
  },
};

type Language = 'pt' | 'es' | 'en';
type Translations = typeof translations.pt;

type TranslationsContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (
    key: keyof Translations,
    ...args: (string | number)[]
  ) => string;
};

const TranslationsContext = createContext<TranslationsContextType | undefined>(
  undefined
);

export const TranslationsProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('pt');

  const t = (
    key: keyof Translations,
    ...args: (string | number)[]
  ): string => {
    const translationSet = translations[language] || translations.pt;
    const translation = translationSet[key] || translations.pt[key];
    if (typeof translation === 'function') {
      return (translation as Function)(...args);
    }
    return translation;
  };

  return (
    <TranslationsContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationsContext.Provider>
  );
};

export const useTranslations = () => {
  const context = useContext(TranslationsContext);
  if (context === undefined) {
    throw new Error(
      'useTranslations must be used within a TranslationsProvider'
    );
  }
  return context;
};
