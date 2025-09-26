export type MappedHeaders = {
  lat?: string;
  lon?: string;
  state?: string;
  city?: string;
  name?: string;
  address?: string;
};

export type POIStatus = {
  type:
    | 'clean'
    | 'invalid'
    | 'duplicate'
    | 'proximity'
    | 'location'
    | 'base'
    | 'match';
  reason: string;
};

export type POI = {
  row: number;
  latitude: number | null;
  longitude: number | null;
  data: Record<string, any>;
  status: POIStatus | null;
  detectedState?: string | null;
  detectedCity?: string | null;
  stateMatch?: boolean;
  cityMatch?: boolean;
};

export type AnalysisOptions = {
  invalidData: boolean;
  exactDuplicates: boolean;
  proximity: boolean;
  geographic: boolean;
};

export type AnalysisMetrics = {
  totalPois: number;
  invalidCoordinates: number;
  poisInProximity: number;
  poisInExactOverlap: number;
  stateMismatches: number;
  cityMismatches: number;
  cleanPointsCount: number;
};

export type GeocodedRow = Record<string, any> & {
  LATITUDE_GEO?: number | string;
  LONGITUDE_GEO?: number | string;
  ESTADO_DETECTADO?: string | null;
  CIDADE_DETECTADA?: string | null;
  CORRESP_ESTADO?: boolean;
  CORRESP_CIDADE?: boolean;
  ERRO_VERIFICACAO?: string;
};

export type ComparisonMethod = {
  type: 'm2' | 'nearest' | 'radius';
  value?: number;
};

export type ComparisonResult = {
  results: any[];
  sameSquareMatches: any[];
  basePlanilha: 'A' | 'B';
  method: ComparisonMethod;
};
