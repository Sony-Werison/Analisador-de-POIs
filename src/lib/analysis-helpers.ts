
import type {
  POI,
  MappedHeaders,
  AnalysisOptions,
  GeocodedRow,
  ComparisonMethod,
  ComparisonResult,
} from '@/types';
import { parseFile } from './xlsx-utils';

function processParsedData(
  data: any[],
  mappedHeaders: MappedHeaders
): POI[] {
  if (data.length === 0) return [];

  const { lat: latHeader, lon: lonHeader } = mappedHeaders;
  if (!latHeader || !lonHeader) {
    // This case is for geocoding where lat/lon are not required initially
    if (data.every(row => !row[latHeader!] && !row[lonHeader!])) {
        return data.map((row, index) => ({
            row: index + 2,
            latitude: null,
            longitude: null,
            data: row,
            status: null,
        }));
    }
    throw new Error('Latitude and Longitude columns must be mapped.');
  }

  return data.map((row, index) => {
    const latStr = String(row[latHeader] || '').replace(',', '.');
    const lonStr = String(row[lonHeader] || '').replace(',', '.');

    const isLatValid = !isNaN(parseFloat(latStr)) && isFinite(Number(latStr));
    const isLonValid = !isNaN(parseFloat(lonStr)) && isFinite(Number(lonStr));

    return {
      row: index + 2, // 1-based index + header row
      latitude: isLatValid ? parseFloat(latStr) : null,
      longitude: isLonValid ? parseFloat(lonStr) : null,
      data: row,
      status: null,
    };
  });
}

export async function processSingleFile({
  file,
  mappedHeaders,
  analysisOptions,
  setLoadingMessage,
  t,
}: {
  file: File;
  mappedHeaders: MappedHeaders;
  analysisOptions: AnalysisOptions;
  setLoadingMessage: (message: string) => void;
  t: (key: any, ...args: any[]) => string;
}) {
  setLoadingMessage(t('parsing_message'));
  const { data } = await parseFile(file);
  const pois = processParsedData(data, mappedHeaders);
  
  const validPois = pois.filter(p => p.latitude !== null && p.longitude !== null);
  const invalidCoordPois = pois.filter(p => p.latitude === null || p.longitude === null);
  
  if(analysisOptions.invalidData) {
    invalidCoordPois.forEach(p => p.status = { type: 'invalid', reason: 'Coordenada inválida'});
  }

  // Simplified analysis logic
  validPois.forEach(p => p.status = { type: 'clean', reason: 'Ponto Válido'});

  const allProblematicPoints = [...invalidCoordPois.filter(p => p.status)];
  const cleanPoints = validPois;

  return {
    metrics: {
      totalPois: pois.length,
      invalidCoordinates: invalidCoordPois.length,
      poisInProximity: 0, // Simplified
      poisInExactOverlap: 0, // Simplified
      stateMismatches: 0,
      cityMismatches: 0,
      cleanPointsCount: cleanPoints.length,
    },
    resultGroups: {},
    allProblematicPoints,
    cleanPoints,
  };
}

// Haversine distance calculation
function haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    return R * c; // in metres
}

export async function compareFiles({
    fileA,
    fileB,
    mappedHeadersA,
    mappedHeadersB,
    baseSheet,
    comparisonMethod,
    setLoadingMessage,
    t,
  }: {
    fileA: File;
    fileB: File;
    mappedHeadersA: Pick<MappedHeaders, 'lat' | 'lon'>;
    mappedHeadersB: Pick<MappedHeaders, 'lat' | 'lon'>;
    baseSheet: 'A' | 'B';
    comparisonMethod: ComparisonMethod;
    setLoadingMessage: (message: string) => void;
    t: (key: any, ...args: any[]) => string;
  }): Promise<ComparisonResult> {
    setLoadingMessage(t('parsing_message'));
    const { data: dataA } = await parseFile(fileA);
    const poisA = processParsedData(dataA, { lat: mappedHeadersA.lat, lon: mappedHeadersA.lon }).filter(p => p.latitude !== null && p.longitude !== null);
  
    const { data: dataB } = await parseFile(fileB);
    const poisB = processParsedData(dataB, { lat: mappedHeadersB.lat, lon: mappedHeadersB.lon }).filter(p => p.latitude !== null && p.longitude !== null);
  
    const basePois = baseSheet === 'A' ? poisA : poisB;
    const comparePois = baseSheet === 'A' ? poisB : poisA;
    const results: any[] = [];
  
    let processedCount = 0;
  
    for (const basePoi of basePois) {
      setLoadingMessage(t('comparing_message', processedCount + 1, basePois.length));
      
      if(basePoi.latitude === null || basePoi.longitude === null) continue;

      let matches: { poi: POI; distance: number }[] = [];
  
      for (const comparePoi of comparePois) {
        if (comparePoi.latitude === null || comparePoi.longitude === null) continue;
        const distance = haversineDistance(
          basePoi.latitude,
          basePoi.longitude,
          comparePoi.latitude,
          comparePoi.longitude
        );
        matches.push({ poi: comparePoi, distance });
      }
  
      // Filter and sort matches based on comparison method
      let finalMatches: any[] = [];
      switch (comparisonMethod.type) {
        case 'm2':
          finalMatches = matches.filter(m => m.distance <= 1).map(m => ({
            base: basePoi.data,
            base_row: basePoi.row,
            match: m.poi.data,
            match_row: m.poi.row,
            distance: m.distance,
          }));
          break;
        case 'nearest':
          finalMatches = matches
            .sort((a, b) => a.distance - b.distance)
            .slice(0, comparisonMethod.value || 1)
            .map(m => ({
                base: basePoi.data,
                base_row: basePoi.row,
                match: m.poi.data,
                match_row: m.poi.row,
                distance: m.distance,
            }));
          break;
        case 'radius':
          finalMatches = matches
            .filter(m => m.distance <= (comparisonMethod.value || 100))
            .sort((a, b) => a.distance - b.distance)
            .map(m => ({
                base: basePoi.data,
                base_row: basePoi.row,
                match: m.poi.data,
                match_row: m.poi.row,
                distance: m.distance,
            }));
          break;
      }
      results.push(...finalMatches);
      processedCount++;
    }
  
    return {
      results: results.flat(),
      sameSquareMatches: results.flat().filter(r => r.distance <= 1),
      basePlanilha: baseSheet,
      method: comparisonMethod,
      totalBasePoints: basePois.length,
      baseFilePois: { pois: poisA, latHeader: mappedHeadersA.lat!, lonHeader: mappedHeadersA.lon! },
      matchFilePois: { pois: poisB, latHeader: mappedHeadersB.lat!, lonHeader: mappedHeadersB.lon! }
    };
  }
  
  async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  export async function geocodeFile({
    file,
    mappedHeaders,
    setLoadingMessage,
    t,
  }: {
    file: File;
    mappedHeaders: MappedHeaders;
    setLoadingMessage: (message: string) => void;
    t: (key: any, ...args: any[]) => string;
  }): Promise<GeocodedRow[]> {
    setLoadingMessage(t('parsing_message'));
    const { data: rows } = await parseFile(file);
    
    const geocodedRows: GeocodedRow[] = [];
    let processedCount = 0;
  
    for (const row of rows) {
      processedCount++;
      setLoadingMessage(t('geocoding_search_message', processedCount, rows.length));
  
      const addressParts = [
        row[mappedHeaders.name!],
        row[mappedHeaders.address!],
        row[mappedHeaders.city!],
        row[mappedHeaders.state!],
      ].filter(Boolean);
  
      let geocodedRow: GeocodedRow = { ...row };
  
      if (addressParts.length > 0) {
        const query = encodeURIComponent(addressParts.join(', '));
        try {
          // Nominatim API call
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
          if (!response.ok) {
            throw new Error(`Nominatim API failed with status ${response.status}`);
          }
          const results = await response.json();
  
          if (results.length > 0) {
            geocodedRow['LATITUDE_GEO'] = parseFloat(results[0].lat);
            geocodedRow['LONGITUDE_GEO'] = parseFloat(results[0].lon);
          } else {
            geocodedRow['ERRO_VERIFICACAO'] = 'Endereço não encontrado';
          }
        } catch (error) {
          geocodedRow['ERRO_VERIFICACAO'] = error instanceof Error ? error.message : String(error);
        }
      } else {
         geocodedRow['ERRO_VERIFICACAO'] = 'Nenhuma coluna de endereço mapeada';
      }
      geocodedRows.push(geocodedRow);
      // Respect Nominatim's usage policy (max 1 request per second)
      await delay(1100); 
    }
  
    return geocodedRows;
  }
