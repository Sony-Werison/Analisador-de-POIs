import {
  addressToCoordinateGeocoding,
} from '@/ai/flows/address-to-coordinate-geocoding';
import {
  geographicConsistencyCheck,
} from '@/ai/flows/geographic-consistency-check';
import type {
  POI,
  MappedHeaders,
  AnalysisOptions,
  GeocodedRow,
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

export async function geocodeFile({
    file,
    mappedHeaders,
    setLoadingMessage,
    t,
    checkGeographic,
}: {
    file: File;
    mappedHeaders: MappedHeaders;
    setLoadingMessage: (message: string) => void;
    t: (key: any, ...args: any[]) => string;
    checkGeographic: boolean;
}): Promise<GeocodedRow[]> {
    setLoadingMessage(t('parsing_message'));
    const { data } = await parseFile(file);
    const geocodedData: GeocodedRow[] = [];

    let processedCount = 0;
    for(const row of data) {
        setLoadingMessage(t('geocoding_search_message', processedCount + 1, data.length));
        
        const newRow: GeocodedRow = {...row};

        if (checkGeographic) {
            const latStr = String(row[mappedHeaders.lat!] || '').replace(',', '.');
            const lonStr = String(row[mappedHeaders.lon!] || '').replace(',', '.');
            const lat = parseFloat(latStr);
            const lon = parseFloat(lonStr);

            if (!isNaN(lat) && !isNaN(lon)) {
                try {
                    const result = await geographicConsistencyCheck({
                        latitude: lat,
                        longitude: lon,
                        state: row[mappedHeaders.state!],
                        city: row[mappedHeaders.city!],
                    });
                    newRow.ESTADO_DETECTADO = result.detectedState;
                    newRow.CIDADE_DETECTADA = result.detectedCity;
                    newRow.CORRESP_ESTADO = result.stateMatch;
                    newRow.CORRESP_CIDADE = result.cityMatch;
                } catch (error) {
                    console.error("Geographic check AI error", error);
                    newRow.ERRO_VERIFICACAO = 'ERRO_API';
                }
            } else {
                newRow.ERRO_VERIFICACAO = 'COORDENADA_INVALIDA';
            }
        } else {
            const addressParts = [
                mappedHeaders.name && row[mappedHeaders.name],
                mappedHeaders.address && row[mappedHeaders.address],
                mappedHeaders.city && row[mappedHeaders.city],
                mappedHeaders.state && row[mappedHeaders.state]
            ].filter(Boolean);

            if (addressParts.length > 0) {
                try {
                    const result = await addressToCoordinateGeocoding({ address: addressParts.join(', ') });
                    newRow.LATITUDE_GEO = result.latitude;
                    newRow.LONGITUDE_GEO = result.longitude;
                } catch (error) {
                    console.error("Geocoding AI error", error);
                    newRow.LATITUDE_GEO = 'ERRO';
                    newRow.LONGITUDE_GEO = 'ERRO';
                }
            } else {
                newRow.LATITUDE_GEO = 'DADOS_INSUFICIENTES';
                newRow.LONGITUDE_GEO = 'DADOS_INSUFICIENTES';
            }
        }
        
        geocodedData.push(newRow);
        processedCount++;
        // To avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    return geocodedData;
}
