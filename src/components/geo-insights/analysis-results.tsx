
'use client';
import { useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTranslations } from '@/lib/translations';
import { cn } from '@/lib/utils';
import {
  AnalysisMetrics,
  ComparisonResult,
  GeocodedRow,
  POI,
} from '@/types';
import { downloadXLSX } from '@/lib/xlsx-utils';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, MapPin, Copy, Waypoints, Map } from 'lucide-react';

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
  setHighlightedBounds: (bounds: any | undefined) => void;
  allPoints: POI[];
  setMapPoints: (points: POI[]) => void;
};

const metricItems = [
    { key: 'totalPois', label: 'total_pois_label', color: 'text-foreground' },
    { key: 'invalidCoordinates', label: 'invalid_coords_label', color: 'text-destructive' },
    { key: 'poisInExactOverlap', label: 'exact_overlap_label', color: 'text-destructive' },
    { key: 'poisInProximity', label: 'proximity_label', color: 'text-destructive' },
    { key: 'stateMismatches', label: 'state_mismatch_label', color: 'text-destructive' },
    { key: 'cityMismatches', label: 'city_mismatch_label', color: 'text-destructive' },
    { key: 'cleanPointsCount', label: 'clean_points_label', color: 'text-green-600' },
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
  setMapPoints,
}: Props) {
  const { t } = useTranslations();
  const { toast } = useToast();

  const handleHighlight = (points: POI[]) => {
    if (points.length === 0) return;
    setHighlightedPoints(points);
    const validCoords = points.filter(p => p.latitude && p.longitude) as { latitude: number, longitude: number }[];
    if (validCoords.length > 0) {
        import('leaflet').then(L => {
            const bounds = L.latLngBounds(validCoords.map(p => [p.latitude, p.longitude]));
            setHighlightedBounds(bounds);
        });
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

  const handleDownloadComparison = () => {
    if(comparisonResults && comparisonResults.results.length > 0) {
      const dataToDownload = comparisonResults.results.map(item => {
        const baseData: Record<string, any> = {};
        for(const key in item.base) {
          baseData[`BASE_${key}`] = item.base[key];
        }

        const matchData: Record<string, any> = {};
        for(const key in item.match) {
          matchData[`MATCH_${key}`] = item.match[key];
        }

        return {
          ...baseData,
          LINHA_BASE: item.base_row,
          ...matchData,
          LINHA_MATCH: item.match_row,
          DISTANCIA_M: item.distance.toFixed(2),
        }
      })
      downloadXLSX(dataToDownload, 'comparacao.xlsx');
    } else {
      toast({ description: t('download_no_data') });
    }
  }

  const handleLoadComparisonOnMap = useCallback(async () => {
    if (!comparisonResults) return;

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
  }, [comparisonResults, setMapPoints]);


  if (!analysisResults && !comparisonResults && !geocodedResults) {
    return null;
  }

  return (
    <div className="space-y-4">
      {analysisResults && (
        <>
          <h3 className="text-xl font-bold">{t('summary_title')}</h3>
          <div className="p-4 rounded-lg bg-secondary/50 space-y-2 text-sm">
            {metricItems.map(({ key, label, color }) => {
                const value = analysisResults.metrics[key as keyof AnalysisMetrics];
                if (value === 0 && key !== 'cleanPointsCount' && key !== 'totalPois') return null;
                return(
                    <div key={key} className="flex justify-between items-center">
                    <span className="font-medium text-muted-foreground">{t(label as any)}</span>
                    <span className={cn("font-bold text-lg", value > 0 ? color : 'text-foreground')}>{value}</span>
                    </div>
                );
            })}
          </div>
          <div>
            <h3 className="text-xl font-bold mt-6 mb-2">{t('downloads_title')}</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleDownloadFull}>{t('download_full_report_button')}</Button>
              <Button onClick={handleDownloadProblems} variant="destructive" disabled={analysisResults.allProblematicPoints.length === 0}>{t('download_problems_button')}</Button>
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
      {comparisonResults && (
        <>
          <h3 className="text-xl font-bold">{t('comparison_summary_title')}</h3>
          <div className="p-4 rounded-lg bg-secondary/50 space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="font-medium text-muted-foreground">{t('total_base_points', comparisonResults.basePlanilha)}</span>
              <span className="font-bold text-lg">{comparisonResults.totalBasePoints}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-muted-foreground">{t('points_with_match')}</span>
              <span className="font-bold text-lg">{comparisonResults.results.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-muted-foreground">{t('same_square_meter_matches')}</span>
              <span className="font-bold text-lg">{comparisonResults.sameSquareMatches.length}</span>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold mt-6 mb-2">{t('actions_title')}</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleLoadComparisonOnMap}><Map className="mr-2" />{t('load_map_points')}</Button>
              <Button onClick={handleDownloadComparison}>{t('download_comparison_report_button')}</Button>
            </div>
          </div>
          <h3 className="text-xl font-bold mt-6 mb-2">{t('comparison_results_title')}</h3>
          <div className="max-h-80 overflow-y-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('base_point_row')}</TableHead>
                  <TableHead>{t('match_point_row')}</TableHead>
                  <TableHead className="text-right">{t('distance_meters')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonResults.results.slice(0, 100).map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.base_row}</TableCell>
                    <TableCell>{r.match_row}</TableCell>
                    <TableCell className="text-right">{r.distance.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {comparisonResults.results.length > 100 && (
            <p className="text-sm text-center text-muted-foreground mt-2">
              Mostrando 100 de {comparisonResults.results.length} resultados. Baixe o relatório completo para ver todos.
            </p>
          )}
        </>
      )}
    </div>
  );
}
