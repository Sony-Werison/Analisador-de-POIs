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
  invalidCoordPois.forEach(p => p.status = { type: 'invalid', reason: 'Coordenada inválida'});

  // In a real app, full analysis logic from the prototype would go here.
  // This is a simplified version.
  if (analysisOptions.geographic) {
    let checkedCount = 0;
    for (const poi of validPois) {
      setLoadingMessage(t('geocoding_message', checkedCount + 1, validPois.length));
      try {
        const result = await geographicConsistencyCheck({
          latitude: poi.latitude!,
          longitude: poi.longitude!,
          state: poi.data[mappedHeaders.state!],
          city: poi.data[mappedHeaders.city!],
        });

        poi.detectedState = result.detectedState;
        poi.detectedCity = result.detectedCity;
        poi.stateMatch = result.stateMatch;
        poi.cityMatch = result.cityMatch;
        
        if (!result.stateMatch) {
            poi.status = { type: 'location', reason: 'Estado Incorreto' };
        } else if (!result.cityMatch) {
            poi.status = { type: 'location', reason: 'Cidade Incorreta' };
        } else {
            poi.status = { type: 'clean', reason: 'Ponto Válido' };
        }

      } catch (e) {
        console.error("Error in geographic check", e);
        poi.status = { type: 'invalid', reason: 'Erro na verificação' };
      }
      checkedCount++;
    }
  } else {
    validPois.forEach(p => p.status = { type: 'clean', reason: 'Ponto Válido'});
  }

  const allProblematicPoints = [...invalidCoordPois, ...validPois.filter(p => p.status?.type !== 'clean')];
  const cleanPoints = validPois.filter(p => p.status?.type === 'clean');

  return {
    metrics: {
      totalPois: pois.length,
      invalidCoordinates: invalidCoordPois.length,
      poisInProximity: 0, // Simplified
      poisInExactOverlap: 0, // Simplified
      stateMismatches: validPois.filter(p => p.stateMatch === false).length,
      cityMismatches: validPois.filter(p => p.cityMatch === false).length,
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
    t
}: {
    file: File;
    mappedHeaders: Pick<MappedHeaders, 'name' | 'address' | 'city' | 'state'>;
    setLoadingMessage: (message: string) => void;
    t: (key: any, ...args: any[]) => string;
}): Promise<GeocodedRow[]> {
    setLoadingMessage(t('parsing_message'));
    const { data } = await parseFile(file);
    const geocodedData: GeocodedRow[] = [];

    let processedCount = 0;
    for(const row of data) {
        setLoadingMessage(t('geocoding_search_message', processedCount + 1, data.length));
        const addressParts = [
            mappedHeaders.name && row[mappedHeaders.name],
            mappedHeaders.address && row[mappedHeaders.address],
            mappedHeaders.city && row[mappedHeaders.city],
            mappedHeaders.state && row[mappedHeaders.state]
        ].filter(Boolean);

        const newRow: GeocodedRow = {...row};

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
        geocodedData.push(newRow);
        processedCount++;
        // To avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    return geocodedData;
}
