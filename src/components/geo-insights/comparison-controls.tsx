'use client';
import { ChangeEvent, useState } from 'react';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTranslations } from '@/lib/translations';
import { parseFile } from '@/lib/xlsx-utils';
import { useToast } from '@/hooks/use-toast';
import type { ComparisonMethod, MappedHeaders } from '@/types';

type FileState = {
  file: File | null;
  name: string;
  headers: string[];
  mappedHeaders: Pick<MappedHeaders, 'lat' | 'lon'>;
};

const initialFileState: FileState = {
  file: null,
  name: '',
  headers: [],
  mappedHeaders: { lat: '', lon: '' },
};

type Props = {
  setIsLoading: (loading: boolean) => void;
  setLoadingMessage: (message: string) => void;
  setComparisonResults: (results: any) => void;
  handleClear: () => void;
};

export default function ComparisonControls({
  setIsLoading,
  setLoadingMessage,
  setComparisonResults,
  handleClear,
}: Props) {
  const { t } = useTranslations();
  const { toast } = useToast();
  const [fileA, setFileA] = useState<FileState>(initialFileState);
  const [fileB, setFileB] = useState<FileState>(initialFileState);
  const [baseSheet, setBaseSheet] = useState<'A' | 'B'>('A');
  const [comparisonMethod, setComparisonMethod] =
    useState<ComparisonMethod['type']>('m2');
  const [nearestN, setNearestN] = useState(1);
  const [radius, setRadius] = useState(100);

  const handleFileChange = async (
    e: ChangeEvent<HTMLInputElement>,
    sheet: 'A' | 'B'
  ) => {
    const selectedFile = e.target.files?.[0];
    const setFileState = sheet === 'A' ? setFileA : setFileB;

    if (selectedFile) {
      try {
        const { headers } = await parseFile(selectedFile);
        const lat = headers.find((h) =>
          ['latitude', 'lat'].includes(h.toLowerCase())
        );
        const lon = headers.find((h) =>
          ['longitude', 'lon', 'lng'].includes(h.toLowerCase())
        );

        setFileState({
          file: selectedFile,
          name: selectedFile.name,
          headers,
          mappedHeaders: { lat: lat || '', lon: lon || '' },
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: t('error_reading_file'),
          description: error instanceof Error ? error.message : String(error),
        });
      }
    }
  };

  const isCompareDisabled =
    !fileA.file ||
    !fileB.file ||
    !fileA.mappedHeaders.lat ||
    !fileA.mappedHeaders.lon ||
    !fileB.mappedHeaders.lat ||
    !fileB.mappedHeaders.lon;

  const handleCompare = async () => {
    if (isCompareDisabled) return;
    // Mock processing logic
    setIsLoading(true);
    setLoadingMessage(t('processing_message'));
    // In a real app, you would call your comparison logic from analysis-helpers.ts
    // For now, we'll just simulate a delay.
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setComparisonResults({
      results: [],
      sameSquareMatches: [],
      basePlanilha: 'A',
      method: { type: 'm2' },
    });
    toast({ title: 'Comparação (Simulada)', description: 'Funcionalidade em desenvolvimento.' });
    setIsLoading(false);
  };

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('spreadsheet_a_title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="file" onChange={(e) => handleFileChange(e, 'A')} accept=".csv, .xlsx"/>
          {fileA.name && (
            <p className="text-sm text-muted-foreground">{fileA.name}</p>
          )}
          {fileA.headers.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lat-a-select">{t('latitude_column')}</Label>
                <Select value={fileA.mappedHeaders.lat} onValueChange={(v) => setFileA(f => ({...f, mappedHeaders: {...f.mappedHeaders, lat: v}}))}>
                  <SelectTrigger id="lat-a-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {fileA.headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="lon-a-select">{t('longitude_column')}</Label>
                <Select value={fileA.mappedHeaders.lon} onValueChange={(v) => setFileA(f => ({...f, mappedHeaders: {...f.mappedHeaders, lon: v}}))}>
                  <SelectTrigger id="lon-a-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {fileA.headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('spreadsheet_b_title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="file" onChange={(e) => handleFileChange(e, 'B')} accept=".csv, .xlsx"/>
          {fileB.name && (
            <p className="text-sm text-muted-foreground">{fileB.name}</p>
          )}
          {fileB.headers.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
               <div>
                <Label htmlFor="lat-b-select">{t('latitude_column')}</Label>
                <Select value={fileB.mappedHeaders.lat} onValueChange={(v) => setFileB(f => ({...f, mappedHeaders: {...f.mappedHeaders, lat: v}}))}>
                  <SelectTrigger id="lat-b-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {fileB.headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="lon-b-select">{t('longitude_column')}</Label>
                <Select value={fileB.mappedHeaders.lon} onValueChange={(v) => setFileB(f => ({...f, mappedHeaders: {...f.mappedHeaders, lon: v}}))}>
                  <SelectTrigger id="lon-b-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {fileB.headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>{t('comparison_method_title')}</CardTitle></CardHeader>
        <CardContent>
        <RadioGroup
            value={comparisonMethod}
            onValueChange={(v) =>
              setComparisonMethod(v as ComparisonMethod['type'])
            }
            className="gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="m2" id="m2" />
              <Label htmlFor="m2">{t('method_m2')}</Label>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nearest" id="nearest" />
                <Label htmlFor="nearest">{t('method_nearest')}</Label>
              </div>
              {comparisonMethod === 'nearest' && (
                <div className="pl-6 pt-2">
                  <Input
                    type="number"
                    value={nearestN}
                    onChange={(e) => setNearestN(Number(e.target.value))}
                    className="h-8"
                    placeholder={t('neighbors') as string}
                  />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="radius" id="radius" />
                <Label htmlFor="radius">{t('method_radius')}</Label>
              </div>
              {comparisonMethod === 'radius' && (
                <div className="pl-6 pt-2">
                  <Input
                    type="number"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="h-8"
                    placeholder={t('distance_meters') as string}
                  />
                </div>
              )}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>{t('base_spreadsheet_title')}</CardTitle>
        <CardDescription>{t('base_spreadsheet_note')}</CardDescription>
        </CardHeader>
        <CardContent>
            <RadioGroup value={baseSheet} onValueChange={(v) => setBaseSheet(v as any)} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="A" id="sheetA" />
                <Label htmlFor="sheetA">{t('spreadsheet_a_short')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="B" id="sheetB" />
                <Label htmlFor="sheetB">{t('spreadsheet_b_short')}</Label>
              </div>
            </RadioGroup>
        </CardContent>
      </Card>


      <div className="flex gap-4">
        <Button onClick={handleCompare} className="w-2/3" disabled={isCompareDisabled}>
          {t('compare_button')}
        </Button>
        <Button onClick={handleClear} variant="outline" className="w-1/3">
          {t('clear_button')}
        </Button>
      </div>
    </div>
  );
}
