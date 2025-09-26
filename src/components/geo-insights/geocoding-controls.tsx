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
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTranslations } from '@/lib/translations';
import { useToast } from '@/hooks/use-toast';
import { parseFile } from '@/lib/xlsx-utils';
import { MappedHeaders, GeocodedRow } from '@/types';
import { geocodeFile } from '@/lib/analysis-helpers';

type Props = {
  setIsLoading: (loading: boolean) => void;
  setLoadingMessage: (message: string) => void;
  setGeocodedResults: (results: GeocodedRow[] | null) => void;
  handleClear: () => void;
};

const initialMappedHeaders: Pick<MappedHeaders, 'name' | 'address' | 'city' | 'state' | 'lat' | 'lon'> = {
  name: '',
  address: '',
  city: '',
  state: '',
  lat: '',
  lon: '',
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
  const [mappedHeaders, setMappedHeaders] = useState(initialMappedHeaders);
  const [checkGeographic, setCheckGeographic] = useState(false);

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
    mapping.name = headers.find((h) => ['nome', 'name', 'local'].includes(h.toLowerCase()));
    mapping.address = headers.find((h) => ['endereço', 'endereco', 'logradouro', 'address'].includes(h.toLowerCase()));
    mapping.city = headers.find((h) => ['cidade', 'municipio', 'city'].includes(h.toLowerCase()));
    mapping.state = headers.find((h) => ['estado', 'uf', 'state'].includes(h.toLowerCase()));
    mapping.lat = headers.find((h) => ['latitude', 'lat'].includes(h.toLowerCase()));
    mapping.lon = headers.find((h) => ['longitude', 'lon', 'lng'].includes(h.toLowerCase()));
    setMappedHeaders(prev => ({...prev, ...mapping}));
  };

  const isGeocodeDisabled = !file || (
    !checkGeographic && Object.values(mappedHeaders).slice(0, 4).every(h => !h)
  ) || (
    checkGeographic && (!mappedHeaders.lat || !mappedHeaders.lon || !mappedHeaders.city || !mappedHeaders.state)
  );
  
  const handleGeocode = async () => {
    if (isGeocodeDisabled) return;

    setIsLoading(true);
    try {
        const results = await geocodeFile({
            file: file!,
            mappedHeaders,
            setLoadingMessage,
            t,
            checkGeographic,
        });
        setGeocodedResults(results);
        toast({ title: t('geocoding_done')});
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

  const addressHeaders = Object.keys(initialMappedHeaders).slice(0, 4);
  const coordHeaders = Object.keys(initialMappedHeaders).slice(4);

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('select_file_geocode')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Input type="file" onChange={handleFileChange} accept=".csv, .xlsx" />
          {fileName && <p className="text-sm text-muted-foreground mt-2">{fileName}</p>}
        </CardContent>
      </Card>
      {headers.length > 0 && (
        <>
        <Card>
            <CardHeader>
                <CardTitle>{t('analysis_options_title')}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-2">
                    <Checkbox
                    id="geographic"
                    checked={checkGeographic}
                    onCheckedChange={(checked) => setCheckGeographic(!!checked)}
                    />
                    <Label htmlFor="geographic" className="font-normal">{t('option_geographic')}</Label>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>{checkGeographic ? t('column_mapping_title') : t('column_mapping_geocode_title')}</CardTitle>
                <CardDescription>{checkGeographic ? t('column_mapping_geo_note') : t('column_mapping_geocode_note')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                {(checkGeographic ? [...addressHeaders, ...coordHeaders] : addressHeaders).map(key => (
                     <div key={key}>
                     <Label htmlFor={`${key}-select-geo`}>{t( (checkGeographic && ['lat', 'lon', 'state', 'city'].includes(key)) ? `${key}_column` as any : `geocode_${key}` as any)}</Label>
                     <Select
                       value={mappedHeaders[key as keyof typeof mappedHeaders]}
                       onValueChange={(value) =>
                         setMappedHeaders((prev) => ({ ...prev, [key]: value }))
                       }
                     >
                       <SelectTrigger id={`${key}-select-geo`}>
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
        </>
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
