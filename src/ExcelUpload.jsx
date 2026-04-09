import { useState } from 'react';

async function readWorkbookRows(file) {
  const xlsx = await import('xlsx');
  const data = await file.arrayBuffer();
  const workbook = xlsx.read(data);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  return rows.filter((row) =>
    Object.values(row).some((value) => value !== null && value !== undefined && String(value).trim() !== ''),
  );
}

export default function ExcelUpload({ disabled = false, onJsonReady }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);

  async function handleFileChange(event) {
    const files = Array.from(event.target.files || []);
    setError('');
    setSummary(null);

    if (!files.length) {
      return;
    }

    setLoading(true);

    try {
      const allRows = [];

      for (const file of files) {
        const rows = await readWorkbookRows(file);
        allRows.push(...rows);
      }

      setSummary({
        fileCount: files.length,
        rowCount: allRows.length,
        columns: Object.keys(allRows[0] || {}),
      });

      if (onJsonReady) {
        onJsonReady(allRows, { fileNames: files.map((file) => file.name) });
      }
    } catch (uploadError) {
      console.error('Excel read failed.', uploadError);
      setError('Excel dosyaları okunamadı. Lütfen dosya formatını ve içeriğini kontrol edin.');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  }

  return (
    <div className="excel-upload">
      <label className={`excel-upload__dropzone ${disabled ? 'excel-upload__dropzone--disabled' : ''}`}>
        <span className="excel-upload__title">Dosya Seçin</span>
        <span className="excel-upload__description">Bir veya birden fazla .xlsx / .xls dosyası yükleyebilirsiniz.</span>
        <input type="file" accept=".xlsx,.xls" multiple onChange={handleFileChange} disabled={disabled || loading} />
      </label>

      {loading ? <div className="message message-loading">Dosyalar okunuyor...</div> : null}
      {error ? <div className="message message-error">{error}</div> : null}

      {summary ? (
        <div className="upload-summary">
          <div>
            <strong>{summary.fileCount}</strong>
            <span>Dosya</span>
          </div>
          <div>
            <strong>{summary.rowCount}</strong>
            <span>Satır</span>
          </div>
          <div>
            <strong>{summary.columns.length}</strong>
            <span>Sütun</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
