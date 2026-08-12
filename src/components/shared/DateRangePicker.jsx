import { useState } from 'react';

function toDateKey(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function DateRangePicker({
  value = { from: '', to: '', preset: 'all' },
  onChange,
  className = '',
}) {
  const presets = [
    { id: 'today', label: 'Bugün' },
    { id: 'week', label: 'Bu Hafta' },
    { id: 'month', label: 'Bu Ay' },
    { id: 'last30', label: 'Son 30 Gün' },
    { id: 'last90', label: 'Son 3 Ay' },
    { id: 'all', label: 'Tüm Dönem' },
    { id: 'custom', label: 'Özel Aralık' },
  ];

  const [activePreset, setActivePreset] = useState(value.preset || 'all');
  const [customFrom, setCustomFrom] = useState(value.from || '');
  const [customTo, setCustomTo] = useState(value.to || '');

  const applyPreset = (presetId) => {
    setActivePreset(presetId);
    const now = new Date();
    let from = '';
    let to = toDateKey(now);

    if (presetId === 'today') {
      from = toDateKey(now);
    } else if (presetId === 'week') {
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diffToMonday));
      from = toDateKey(monday);
    } else if (presetId === 'month') {
      from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    } else if (presetId === 'last30') {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      from = toDateKey(d);
    } else if (presetId === 'last90') {
      const d = new Date();
      d.setDate(d.getDate() - 89);
      from = toDateKey(d);
    } else if (presetId === 'all') {
      from = '';
      to = '';
    } else if (presetId === 'custom') {
      from = customFrom;
      to = customTo;
    }

    if (onChange) {
      onChange({ from, to, preset: presetId });
    }
  };

  const handleCustomChange = (newFrom, newTo) => {
    setCustomFrom(newFrom);
    setCustomTo(newTo);
    if (activePreset === 'custom' && onChange) {
      onChange({ from: newFrom, to: newTo, preset: 'custom' });
    }
  };

  return (
    <div className={`date-range-picker ${className}`}>
      <div className="date-range-picker__presets" role="tablist" aria-label="Tarih aralığı filtreleri">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`date-range-picker__pill ${activePreset === p.id ? 'is-active' : ''}`}
            onClick={() => applyPreset(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {activePreset === 'custom' ? (
        <div className="date-range-picker__inputs">
          <label className="date-range-picker__label">
            <span>Başlangıç:</span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => handleCustomChange(e.target.value, customTo)}
              className="date-range-picker__input"
            />
          </label>
          <label className="date-range-picker__label">
            <span>Bitiş:</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => handleCustomChange(customFrom, e.target.value)}
              className="date-range-picker__input"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
