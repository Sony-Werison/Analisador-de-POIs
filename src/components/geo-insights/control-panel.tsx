
'use client';

import { useTranslations } from '@/lib/translations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SingleAnalysisControls from './single-analysis-controls';
import ComparisonControls from './comparison-controls';
import GeocodingControls from './geocoding-controls';
import AnalysisResults from './analysis-results';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type {
  AnalysisMetrics,
  ComparisonResult,
  GeocodedRow,
  POI,
} from '@/types';
import type { LatLngBounds } from 'leaflet';

type ControlPanelProps = {
  mode: 'single' | 'compare' | 'geocode';
  setMode: (mode: 'single' | 'compare' | 'geocode') => void;
  setIsLoading: (loading: boolean) => void;
  setLoadingMessage: (message: string) => void;
  setAnalysisResults: (results: any) => void;
  setComparisonResults: (results: ComparisonResult | null) => void;
  setGeocodedResults: (results: GeocodedRow[] | null) => void;
  setMapPoints: (points: POI[]) => void;
  setMapBounds: (bounds: LatLngBounds | undefined) => void;
  handleClear: () => void;
  isLoading: boolean;
  loadingMessage: string;
  analysisResults: {
    metrics: AnalysisMetrics;
    resultGroups: any;
    allProblematicPoints: POI[];
    cleanPoints: POI[];
  } | null;
  comparisonResults: ComparisonResult | null;
  geocodedResults: GeocodedRow[] | null;
  setHighlightedPoints: (points: POI[]) => void;
  setHighlightedBounds: (bounds: LatLngBounds | undefined) => void;
  allPoints: POI[];
};

export default function ControlPanel({
  mode,
  setMode,
  handleClear,
  ...props
}: ControlPanelProps) {
  const { t } = useTranslations();

  const onModeChange = (newMode: string) => {
    handleClear();
    setMode(newMode as 'single' | 'compare' | 'geocode');
  };

  return (
    <Card className="p-6 h-fit max-h-[calc(100vh-100px)] overflow-y-auto">
      <div className="border-b pb-6">
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          {t('control_title')}
        </h2>
        <Tabs value={mode} onValueChange={onModeChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="single">{t('mode_single')}</TabsTrigger>
            <TabsTrigger value="compare">{t('mode_compare')}</TabsTrigger>
            <TabsTrigger value="geocode">{t('mode_geocode')}</TabsTrigger>
          </TabsList>
          <TabsContent value="single">
            <SingleAnalysisControls
              setIsLoading={props.setIsLoading}
              setLoadingMessage={props.setLoadingMessage}
              setAnalysisResults={props.setAnalysisResults}
              setMapPoints={props.setMapPoints}
              setMapBounds={props.setMapBounds}
              handleClear={handleClear}
            />
          </TabsContent>
          <TabsContent value="compare">
            <ComparisonControls
              setIsLoading={props.setIsLoading}
              setLoadingMessage={props.setLoadingMessage}
              setComparisonResults={props.setComparisonResults}
              handleClear={handleClear}
            />
          </TabsContent>
          <TabsContent value="geocode">
            <GeocodingControls
              setIsLoading={props.setIsLoading}
              setLoadingMessage={props.setLoadingMessage}
              setGeocodedResults={props.setGeocodedResults}
              handleClear={handleClear}
            />
          </TabsContent>
        </Tabs>
      </div>

      {props.isLoading && (
        <div className="flex flex-col justify-center items-center my-6">
          <div className="flex items-center">
            <Loader2 className="animate-spin h-12 w-12 text-primary" />
            <p className="ml-4 text-muted-foreground">{props.loadingMessage}</p>
          </div>
        </div>
      )}

      <div className="mt-4">
        <AnalysisResults
          analysisResults={props.analysisResults}
          comparisonResults={props.comparisonResults}
          geocodedResults={props.geocodedResults}
          setHighlightedPoints={props.setHighlightedPoints}
          setHighlightedBounds={props.setHighlightedBounds}
          allPoints={props.allPoints}
          setMapPoints={props.setMapPoints}
          setMapBounds={props.setMapBounds}
        />
      </div>
    </Card>
  );
}
