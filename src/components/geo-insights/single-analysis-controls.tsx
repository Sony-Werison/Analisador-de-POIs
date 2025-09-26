'use client';
import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from '@/lib/translations';
import { parseFile } from '@/lib/xlsx-utils';
import { useToast } from '@/hooks/use-toast';
import { processSingleFile } from '@/lib/analysis-helpers';
import type { AnalysisOptions, MappedHeaders } from '@/types';
import L from 'leaflet';

type Props = {
  setIsLoading: (loading: boolean) => void;
  setLoadingMessage: (message: string) => void;
  setAnalysisResults: (results: any) => void;
  setMapPoints: (points: any[]) => void;
  setMapBounds: (bounds: any) => void;
  handleClear: () => void;
};

export default function SingleAnalysisControls({
  setIsLoading,
  setLoadingMessage,
  setAnalysisResults,
  setMapPoints,
  setMapBounds,
  handleClear,
}: Props) {
  const { t } = useTranslations();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappedHeaders, setMappedHeaders] = useState<MappedHeaders>({
    lat: '',
    lon: '',
    state: '',
    city: '',
  });
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptions>({
    invalidData: true,
    exactDuplicates: true,
    proximity: true,
    geographic: false,
  });
  const [loadMapPoints, setLoadMapPoints] = useState(true);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      try {
        const { headers: fileHeaders } = await parseFile(selectedFile);
        setHeaders(fileHeaders);
        autoMapHeaders(fileHeaders);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: t('error_reading_file'),
          description: error instanceof Error ? error.message : String(error),
        });
      }
    }
  };

  const autoMapHeaders = (headers: string[]) => {
    const mapping: Partial<MappedHeaders> = {};
    const latKeys = ['latitude', 'lat', 'latitude*'];
    const lonKeys = ['longitude', 'lon', 'lng', 'longitude*'];
    const stateKeys = ['estado', 'uf', 'state', 'state*'];
    const cityKeys = ['cidade', 'município', 'municipio', 'city', 'city*'];

    mapping.lat = headers.find((h) =>
      latKeys.includes(h.trim().toLowerCase())
    );
    mapping.lon = headers.find((h) =>
      lonKeys.includes(h.trim().toLowerCase())
    );
    mapping.state = headers.find((h) =>
      stateKeys.includes(h.trim().toLowerCase())
    );
    mapping.city = headers.find((h) =>
      cityKeys.includes(h.trim().toLowerCase())
    );

    setMappedHeaders((prev) => ({ ...prev, ...mapping }));
  };

  const isAnalyzeDisabled =
    !file || !mappedHeaders.lat || !mappedHeaders.lon;

  const handleAnalyze = async () => {
    if (!file || !mappedHeaders.lat || !mappedHeaders.lon) {
      toast({
        variant: 'destructive',
        title: 'Mapeamento Incompleto',
        description:
          'Por favor, selecione as colunas de latitude e longitude.',
      });
      return;
    }
    
    // This check is now only relevant if we add geographic check back to single analysis
    // For now it can be simplified or removed if geographic is always done elsewhere
    if (
      analysisOptions.geographic &&
      (!mappedHeaders.state || !mappedHeaders.city)
    ) {
      toast({
        variant: 'destructive',
        title: 'Mapeamento Incompleto',
        description:
          'Para a verificação geográfica, mapeie as colunas de estado e cidade.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const results = await processSingleFile({
        file,
        mappedHeaders,
        analysisOptions,
        setLoadingMessage,
        t,
      });

      setAnalysisResults(results);

      if (loadMapPoints) {
        const allPoints = [...results.cleanPoints, ...results.allProblematicPoints];
        setMapPoints(allPoints);
        if (allPoints.length > 0) {
          const validCoords = allPoints.filter(
            (p) => p.latitude !== null && p.longitude !== null
          ) as { latitude: number; longitude: number }[];
          if (validCoords.length > 0) {
            const bounds = L.latLngBounds(
              validCoords.map((p) => [p.latitude, p.longitude])
            );
            setMapBounds(bounds);
          }
        }
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('error_generic'),
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardHeader>
            <CardTitle>{t('select_file')}</CardTitle>
        </CardHeader>
        <CardContent>
            <Input id="file-input" type="file" onChange={handleFileChange} accept=".csv, .xlsx" />
            {fileName && <p className="text-sm text-muted-foreground mt-2">{fileName}</p>}
        </CardContent>
      </Card>


      {headers.length > 0 && (
        <>
          <Card>
            <CardHeader><CardTitle>{t('column_mapping_title')}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {Object.keys(mappedHeaders).map((key) => (
                <div key={key}>
                  <Label htmlFor={`${key}-select`}>{t(`${key}_column` as any)}</Label>
                  <Select
                    value={mappedHeaders[key as keyof MappedHeaders]}
                    onValueChange={(value) =>
                      setMappedHeaders((prev) => ({ ...prev, [key]: value }))
                    }
                  >
                    <SelectTrigger id={`${key}-select`}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('analysis_options_title')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="invalidData"
                  checked={analysisOptions.invalidData}
                  onCheckedChange={(checked) =>
                    setAnalysisOptions((prev) => ({ ...prev, invalidData: !!checked }))
                  }
                />
                <Label htmlFor="invalidData" className="font-normal">{t('option_invalid_data')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="exactDuplicates"
                  checked={analysisOptions.exactDuplicates}
                  onCheckedChange={(checked) =>
                    setAnalysisOptions((prev) => ({ ...prev, exactDuplicates: !!checked }))
                  }
                />
                <Label htmlFor="exactDuplicates" className="font-normal">{t('option_exact_duplicates')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="proximity"
                  checked={analysisOptions.proximity}
                  onCheckedChange={(checked) =>
                    setAnalysisOptions((prev) => ({ ...prev, proximity: !!checked }))
                  }
                />
                <Label htmlFor="proximity" className="font-normal">{t('option_proximity')}</Label>
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox id="load-map" checked={loadMapPoints} onCheckedChange={(checked) => setLoadMapPoints(!!checked)}/>
                  <Label htmlFor="load-map" className="font-normal">{t('load_map_points')}</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex gap-4">
        <Button onClick={handleAnalyze} className="w-2/3" disabled={isAnalyzeDisabled}>
          {t('analyze_button')}
        </Button>
        <Button onClick={handleClear} variant="outline" className="w-1/3">
          {t('clear_button')}
        </Button>
      </div>
    </div>
  );
}
