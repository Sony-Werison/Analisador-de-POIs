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
              {/* Lat/Lon mapping for File A */}
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
              {/* Lat/Lon mapping for File B */}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>{t('comparison_method_title')}</CardTitle></CardHeader>
        <CardContent>
            {/* Comparison method radio buttons */}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>{t('base_spreadsheet_title')}</CardTitle>
        <CardDescription>{t('base_spreadsheet_note')}</CardDescription>
        </CardHeader>
        <CardContent>
            {/* Base sheet radio buttons */}
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
