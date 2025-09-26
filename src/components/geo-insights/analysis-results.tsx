
'use client';
import { Badge } from '@/components/ui/badge';
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
import { AlertTriangle, MapPin, CheckCircle, Copy, Waypoints } from 'lucide-react';

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

const metricItems = [
    { key: 'totalPois', label: 'total_pois_label' },
    { key: 'invalidCoordinates', label: 'invalid_coords_label' },
    { key: 'poisInExactOverlap', label: 'exact_overlap_label' },
    { key: 'poisInProximity', label: 'proximity_label' },
    { key: 'stateMismatches', label: 'state_mismatch_label' },
    { key: 'cityMismatches', label: 'city_mismatch_label' },
    { key: 'cleanPointsCount', label: 'clean_points_label' },
  ];
  
  const resultCategories = [
    { key: 'invalid', title: 'results_title_invalid', icon: <AlertTriangle className="h-4 w-4" /> },
    { key: 'duplicate', title: 'results_title_exact', icon: <Copy className="h-4 w-4" /> },
    { key: 'proximity', title: 'results_title_proximity', icon: <Waypoints className="h-4 w-4" /> },
    { key: 'location', title: 'results_title_mismatch', icon: <MapPin className="h-4 w-4" /> },
  ];

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
            {metricItems.map(({ key, label }) => (
                <div key={key} className="flex justify-between items-center">
                <span className="font-medium text-muted-foreground">{t(label as any)}</span>
                <span className="font-bold text-lg">{analysisResults.metrics[key as keyof AnalysisMetrics]}</span>
                </div>
            ))}
          </div>
          <div>
            <h3 className="text-xl font-bold mt-6 mb-2">{t('downloads_title')}</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleDownloadFull}>{t('download_full_report_button')}</Button>
              <Button onClick={handleDownloadProblems} variant="destructive">{t('download_problems_button')}</Button>
            </div>
          </div>
          <Accordion type="multiple" className="w-full">
            {resultCategories.map(({ key, title, icon }) => {
              const points = analysisResults.allProblematicPoints.filter(p => p.status?.type === key);
              if (points.length === 0) return null;
              return (
                <AccordionItem value={key} key={key}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      {icon} {t(title as any)} <Badge variant="destructive">{points.length}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="max-h-40 overflow-y-auto">
                      {points.map(p => (
                        <li key={p.row} className="text-sm p-2 hover:bg-muted/50 rounded-md flex justify-between items-center">
                          <span>Linha: {p.row} - {p.status?.reason}</span>
                          <Button size="sm" variant="ghost" onClick={() => handleHighlight([p])}>Ver no mapa</Button>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
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

