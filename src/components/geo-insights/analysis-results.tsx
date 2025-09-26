'use client';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useTranslations } from '@/lib/translations';
import {
  AnalysisMetrics,
  ComparisonResult,
  GeocodedRow,
  POI,
} from '@/types';
import type { LatLngBounds } from 'leaflet';
import L from 'leaflet';
import { downloadXLSX } from '@/lib/xlsx-utils';
import { useToast } from '@/hooks/use-toast';

type Props = {
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

export default function AnalysisResults({
  analysisResults,
  comparisonResults,
  geocodedResults,
  setHighlightedPoints,
  setHighlightedBounds,
  allPoints,
}: Props) {
  const { t } = useTranslations();
  const { toast } = useToast();

  const handleHighlight = (points: POI[]) => {
    if (points.length === 0) return;
    setHighlightedPoints(points);
    const validCoords = points.filter(p => p.latitude && p.longitude) as { latitude: number, longitude: number }[];
    if (validCoords.length > 0) {
        const bounds = L.latLngBounds(validCoords.map(p => [p.latitude, p.longitude]));
        setHighlightedBounds(bounds);
    }
  };

  const handleDownloadProblems = () => {
    if (analysisResults && analysisResults.allProblematicPoints.length > 0) {
      downloadXLSX(analysisResults.allProblematicPoints.map(p => ({...p.data, MOTIVO_PROBLEMA: p.status?.reason})), 'problemas.xlsx');
    } else {
      toast({ description: t('download_no_data') });
    }
  };

  const handleDownloadFull = () => {
    if (allPoints.length > 0) {
      const data = allPoints.map(p => ({
        ...p.data,
        STATUS_ANALISE: p.status?.reason,
        ESTADO_DETECTADO: p.detectedState,
        CIDADE_DETECTADA: p.detectedCity
      }));
      downloadXLSX(data, 'relatorio_completo.xlsx');
    } else {
      toast({ description: t('download_no_data') });
    }
  };
  
  const handleDownloadGeocoded = () => {
    if(geocodedResults && geocodedResults.length > 0) {
      downloadXLSX(geocodedResults, 'geocodificado.xlsx');
    } else {
      toast({ description: t('download_no_data') });
    }
  }

  if (!analysisResults && !comparisonResults && !geocodedResults) {
    return null;
  }

  return (
    <div className="space-y-4">
      {analysisResults && (
        <>
          <h3 className="text-xl font-bold">{t('summary_title')}</h3>
          <div className="p-4 rounded-lg bg-secondary/50 space-y-2 text-sm">
            {/* Metrics display */}
            <div className="flex justify-between items-center">
              <span className="font-medium text-muted-foreground">{t('total_pois_label')}</span>
              <span className="font-bold text-lg">{analysisResults.metrics.totalPois}</span>
            </div>
            {/* Add other metrics here */}
          </div>
          <div>
            <h3 className="text-xl font-bold mt-6 mb-2">{t('downloads_title')}</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleDownloadFull}>{t('download_full_report_button')}</Button>
              <Button onClick={handleDownloadProblems} variant="destructive">{t('download_problems_button')}</Button>
            </div>
          </div>
          {/* Results Accordion */}
        </>
      )}
      {geocodedResults && (
        <div>
            <h3 className="text-xl font-bold mt-6 mb-2">{t('downloads_title')}</h3>
            <Button onClick={handleDownloadGeocoded} className="w-full">{t('download_geocoded_report_button')}</Button>
        </div>
      )}
    </div>
  );
}
