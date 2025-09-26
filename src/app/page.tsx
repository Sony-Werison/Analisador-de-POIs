'use client';

import dynamic from 'next/dynamic';
import { useCallback, useMemo, useState } from 'react';
import type { LngLatBounds } from 'leaflet';
import { TranslationsProvider } from '@/lib/translations';
import type {
  AnalysisMetrics,
  AnalysisOptions,
  ComparisonResult,
  GeocodedRow,
  MappedHeaders,
  POI,
} from '@/types';
import Header from '@/components/geo-insights/header';
import { Card } from '@/components/ui/card';

const ControlPanel = dynamic(
  () => import('@/components/geo-insights/control-panel'),
  { ssr: false }
);
const MapView = dynamic(() => import('@/components/geo-insights/map-view'), {
  ssr: false,
});

export default function Home() {
  const [analysisResults, setAnalysisResults] = useState<{
    metrics: AnalysisMetrics;
    resultGroups: any;
    allProblematicPoints: POI[];
    cleanPoints: POI[];
  } | null>(null);
  const [comparisonResults, setComparisonResults] =
    useState<ComparisonResult | null>(null);
  const [geocodedResults, setGeocodedResults] = useState<GeocodedRow[] | null>(
    null
  );

  const [mapPoints, setMapPoints] = useState<POI[]>([]);
  const [mapBounds, setMapBounds] = useState<LngLatBounds | undefined>(
    undefined
  );
  const [highlightedPoints, setHighlightedPoints] = useState<POI[]>([]);
  const [highlightedBounds, setHighlightedBounds] = useState<
    LngLatBounds | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [mode, setMode] = useState<'single' | 'compare' | 'geocode'>('single');

  const clearState = useCallback(() => {
    setAnalysisResults(null);
    setComparisonResults(null);
    setGeocodedResults(null);
    setMapPoints([]);
    setMapBounds(undefined);
    setHighlightedPoints([]);
    setHighlightedBounds(undefined);
    setIsLoading(false);
    setLoadingMessage('');
  }, []);

  const handleClear = useCallback(() => {
    clearState();
  }, [clearState]);

  const allPoints = useMemo(() => {
    if (analysisResults) {
      return [
        ...analysisResults.cleanPoints,
        ...analysisResults.allProblematicPoints,
      ];
    }
    return [];
  }, [analysisResults]);

  const handleLoadComparisonOnMap = useCallback(async () => {
    if (!comparisonResults) return;

    // Dynamically import Leaflet only on the client-side
    const L = (await import('leaflet')).default;

    const points: POI[] = [];
    const { results, baseFilePois, matchFilePois, basePlanilha } =
      comparisonResults;

    const basePois = basePlanilha === 'A' ? baseFilePois.pois : matchFilePois.pois;
    const matchPois = basePlanilha === 'A' ? matchFilePois.pois : baseFilePois.pois;
    
    const basePointsSet = new Set<number>();
    const matchPointsSet = new Set<number>();

    results.forEach((r) => {
      basePointsSet.add(r.base_row);
      matchPointsSet.add(r.match_row);
    });

    basePois.forEach((p) => {
      if (basePointsSet.has(p.row)) {
        points.push({ ...p, status: { type: 'base', reason: 'Ponto Base' } });
      }
    });

    matchPois.forEach((p) => {
      if (matchPointsSet.has(p.row)) {
        points.push({ ...p, status: { type: 'match', reason: 'Ponto Correspondente' } });
      }
    });
    
    setMapPoints(points);

    if (points.length > 0) {
      const validCoords = points.filter(
        (p) => p.latitude !== null && p.longitude !== null
      ) as { latitude: number; longitude: number }[];
      if (validCoords.length > 0) {
        const bounds = L.latLngBounds(
          validCoords.map((p) => [p.latitude, p.longitude])
        );
        setMapBounds(bounds);
      }
    }
  }, [comparisonResults]);

  return (
    <TranslationsProvider>
      <div className="max-w-screen-2xl mx-auto p-4 md:p-8">
        <Header />
        <main className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 h-fit">
            <ControlPanel
              mode={mode}
              setMode={setMode}
              setIsLoading={setIsLoading}
              setLoadingMessage={setLoadingMessage}
              setAnalysisResults={setAnalysisResults}
              setComparisonResults={setComparisonResults}
              setGeocodedResults={setGeocodedResults}
              setMapPoints={setMapPoints}
              setMapBounds={setMapBounds}
              handleClear={handleClear}
              isLoading={isLoading}
              loadingMessage={loadingMessage}
              analysisResults={analysisResults}
              comparisonResults={comparisonResults}
              geocodedResults={geocodedResults}
              setHighlightedPoints={setHighlightedPoints}
              setHighlightedBounds={setHighlightedBounds}
              allPoints={allPoints}
              handleLoadComparisonOnMap={handleLoadComparisonOnMap}
            />
          </div>
          <div className="lg:col-span-3">
            <Card className="h-fit">
              <MapView
                points={mapPoints}
                bounds={mapBounds}
                highlightedPoints={highlightedPoints}
                highlightedBounds={highlightedBounds}
              />
            </Card>
          </div>
        </main>
      </div>
    </TranslationsProvider>
  );
}
