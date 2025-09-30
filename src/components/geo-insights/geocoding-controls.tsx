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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useTranslations } from '@/lib/translations';
import { parseFile } from '@/lib/xlsx-utils';
import { useToast } from '@/hooks/use-toast';
import { geocodeFile } from '@/lib/analysis-helpers';
import type { MappedHeaders, GeocodedRow } from '@/types';

type Props = {
  setIsLoading: (loading: boolean) => void;
  setLoadingMessage: (message: string) => void;
  setGeocodedResults: (results: GeocodedRow[] | null) => void;
  handleClear: () => void;
};

export default function GeocodingControls({
  setIsLoading,
  setLoadingMessage,
  setGeocodedResults,
  handleClear,
}: Props) {
  const { t } = useTranslations();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappedHeaders, setMappedHeaders] = useState<
    Pick<MappedHeaders, 'name' | 'address' | 'city' | 'state'>
  >({
    name: '',
    address: '',
    city: '',
    state: '',
  });

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
    const mapping: Partial<typeof mappedHeaders> = {};
    const nameKeys = ['nome', 'name', 'local'];
    const addressKeys = ['endereco', 'logradouro', 'address'];
    const cityKeys = ['cidade', 'municipio', 'city'];
    const stateKeys = ['estado', 'uf', 'state'];

    mapping.name = headers.find(h => nameKeys.includes(h.trim().toLowerCase()));
    mapping.address = headers.find(h => addressKeys.includes(h.trim().toLowerCase()));
    mapping.city = headers.find(h => cityKeys.includes(h.trim().toLowerCase()));
    mapping.state = headers.find(h => stateKeys.includes(h.trim().toLowerCase()));

    setMappedHeaders(prev => ({ ...prev, ...mapping }));
  };

  const isGeocodeDisabled =
    !file || Object.values(mappedHeaders).every((v) => !v);

  const handleGeocode = async () => {
    if (!file) return;

    setIsLoading(true);
    setLoadingMessage(t('geocoding_search_message', 0, 0));

    try {
      const results = await geocodeFile({
        file,
        mappedHeaders,
        setLoadingMessage,
        t,
      });
      setGeocodedResults(results);
      toast({ title: t('geocoding_done') });
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
          <CardTitle>{t('select_file_geocode')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Input id="file-input-geocode" type="file" onChange={handleFileChange} accept=".csv, .xlsx" />
          {fileName && <p className="text-sm text-muted-foreground mt-2">{fileName}</p>}
        </CardContent>
      </Card>

      {headers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('column_mapping_geocode_title')}</CardTitle>
            <CardDescription>{t('column_mapping_geocode_note')}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {Object.keys(mappedHeaders).map((key) => (
              <div key={key}>
                <Label htmlFor={`${key}-select`}>{t(`geocode_${key}` as any)}</Label>
                <Select
                  value={mappedHeaders[key as keyof typeof mappedHeaders]}
                  onValueChange={(value) =>
                    setMappedHeaders((prev) => ({ ...prev, [key]: value }))
                  }
                >
                  <SelectTrigger id={`${key}-select`}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <Button onClick={handleGeocode} className="w-2/3" disabled={isGeocodeDisabled}>
          {t('geocode_button')}
        </Button>
        <Button onClick={handleClear} variant="outline" className="w-1/3">
          {t('clear_button')}
        </Button>
      </div>
    </div>
  );
}
