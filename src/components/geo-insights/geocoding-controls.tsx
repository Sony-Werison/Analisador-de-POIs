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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTranslations } from '@/lib/translations';
import { useToast } from '@/hooks/use-toast';
import { parseFile } from '@/lib/xlsx-utils';
import { MappedHeaders, GeocodedRow } from '@/types';
import { geocodeFile } from '@/lib/analysis-helpers';

type GeocodeMode = 'geocode' | 'verify';

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
  const [geocodeMode, setGeocodeMode] = useState<GeocodeMode>('geocode');

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
    geocodeMode === 'geocode' && !mappedHeaders.address && !mappedHeaders.name && !mappedHeaders.city && !mappedHeaders.state
  ) || (
    geocodeMode === 'verify' && (!mappedHeaders.lat || !mappedHeaders.lon || !mappedHeaders.city || !mappedHeaders.state)
  );
  
  const handleGeocode = async () => {
    if (isGeocodeDisabled || !file) return;

    setIsLoading(true);
    try {
        const results = await geocodeFile({
            file: file,
            mappedHeaders,
            setLoadingMessage,
            t,
            checkGeographic: geocodeMode === 'verify',
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
  
  const addressHeaders = ['name', 'address', 'city', 'state'];
  const verifyHeaders = ['lat', 'lon', 'state', 'city'];

  const getLabelKey = (key: string) => {
    if (geocodeMode === 'geocode') {
        return `geocode_${key}` as any;
    }
    return `${key}_column` as any;
  }

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
                <RadioGroup value={geocodeMode} onValueChange={(value) => setGeocodeMode(value as GeocodeMode)} className="gap-4">
                    <div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="geocode" id="geocode-mode" />
                            <Label htmlFor="geocode-mode">{t('geocode_mode_geocode')}</Label>
                        </div>
                        <p className="text-sm text-muted-foreground ml-6 mt-1">{t('geocode_mode_geocode_desc')}</p>
                    </div>
                    <div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="verify" id="verify-mode" />
                            <Label htmlFor="verify-mode">{t('geocode_mode_verify')}</Label>
                        </div>
                        <p className="text-sm text-muted-foreground ml-6 mt-1">{t('geocode_mode_verify_desc')}</p>
                    </div>
                </RadioGroup>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>{geocodeMode === 'verify' ? t('column_mapping_title') : t('column_mapping_geocode_title')}</CardTitle>
                <CardDescription>{geocodeMode === 'verify' ? t('column_mapping_geo_note') : t('column_mapping_geocode_note')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                {(geocodeMode === 'verify' ? verifyHeaders : addressHeaders).map(key => (
                     <div key={key}>
                     <Label htmlFor={`${key}-select-geo`}>{t(getLabelKey(key))}</Label>
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
