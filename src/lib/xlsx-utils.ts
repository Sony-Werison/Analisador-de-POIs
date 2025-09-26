import * as XLSX from 'xlsx';

export async function parseFile(
  file: File
): Promise<{ headers: string[]; data: any[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result;
        if (!buffer) {
          reject(new Error('Failed to read file buffer.'));
          return;
        }

        let data: any[];
        let headers: string[];

        if (file.name.toLowerCase().endsWith('.xlsx')) {
          const workbook = XLSX.read(buffer, { type: 'buffer' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          headers =
            data.length > 0
              ? Object.keys(data[0])
              : (XLSX.utils.sheet_to_json(worksheet, {
                  header: 1,
                })[0] as string[]) || [];
        } else {
          // CSV parsing
          const text = new TextDecoder('utf-8').decode(buffer as ArrayBuffer);
          const lines = text.trim().split(/\r\n|\n/);
          if (lines.length < 1) {
            resolve({ headers: [], data: [] });
            return;
          }
          const delimiter =
            (lines[0].match(/;/g) || []).length >
            (lines[0].match(/,/g) || []).length
              ? ';'
              : ',';
          headers = lines[0].split(delimiter).map((h) => h.trim());
          data = lines.slice(1).map((line) => {
            const values = line.split(delimiter);
            return headers.reduce((obj, header, i) => {
              obj[header] = values[i] ? values[i].trim() : '';
              return obj;
            }, {} as { [key: string]: string });
          });
        }
        resolve({ headers, data });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsArrayBuffer(file);
  });
}

export function downloadXLSX(data: any[], filename: string) {
  if (data.length === 0) {
    console.warn('No data to download.');
    return;
  }
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
  XLSX.writeFile(workbook, filename);
}
