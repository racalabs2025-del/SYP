import React, { useMemo, useState } from 'react';
import compiledExecutiveData from '../../data/compiledExecutiveBasvurular.json';

export default function OpenApplicationsSection() {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'open' | 'in_progress'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const rawUnresolvedItems = useMemo(() => {
    return compiledExecutiveData?.unresolvedItems || [];
  }, []);

  const totalOpenCount = compiledExecutiveData?.metadata?.totalOpen || 32;
  const totalInProgressCount = compiledExecutiveData?.metadata?.totalInProgress || 200;

  // Filtered operational list (Privacy-safe: searches only safe fields)
  const filteredList = useMemo(() => {
    let list = rawUnresolvedItems;

    if (filterType === 'open') {
      list = list.filter((item) => item.durum === 'Açık' || item.durum === 'Atama Bekliyor');
    } else if (filterType === 'in_progress') {
      list = list.filter((item) => item.durum !== 'Açık' && item.durum !== 'Atama Bekliyor');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLocaleLowerCase('tr-TR').trim();
      list = list.filter((item) => {
        const no = String(item.basvuruNo || '').toLowerCase();
        const ilce = String(item.ilce || '').toLocaleLowerCase('tr-TR');
        const mahalle = String(item.mahalle || '').toLocaleLowerCase('tr-TR');
        const konu = String(item.konu || '').toLocaleLowerCase('tr-TR');
        const altKonu = String(item.altKonu || '').toLocaleLowerCase('tr-TR');
        return no.includes(q) || ilce.includes(q) || mahalle.includes(q) || konu.includes(q) || altKonu.includes(q);
      });
    }

    return list;
  }, [rawUnresolvedItems, filterType, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const paginatedList = filteredList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleFilterChange = (type) => {
    setFilterType(type);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Format date helper: YYYY-MM-DD -> DD.MM.YYYY
  const formatIsoDate = (isoStr) => {
    if (!isoStr) return '-';
    const parts = String(isoStr).split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return isoStr;
  };

  return (
    <section className="panel-section open-applications-section" style={{ marginTop: '1.5rem' }}>
      <div
        className="executive-table-container"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        {/* Tablo Üst Kontrol Barı */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1.1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
              <span className="section-kicker" style={{ marginBottom: 0 }}>Saha Takip</span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '600',
                  color: '#475569',
                  background: '#f1f5f9',
                  padding: '0.1rem 0.5rem',
                  borderRadius: '999px',
                }}
              >
                İlçe Havuzları
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: '700' }}>
              Açık ve Süreçteki Başvurular
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              İlçe havuzlarında aksiyon ve saha koordinasyonu bekleyen bildirimler
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {/* Arama Input */}
            <input
              type="text"
              placeholder="İlçe, konu veya no ara..."
              value={searchQuery}
              onChange={handleSearchChange}
              style={{
                fontSize: '0.8rem',
                padding: '0.4rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                width: '180px',
                background: '#f8fafc',
              }}
            />

            {/* Filtreleme Segment Butonları */}
            <div
              style={{
                display: 'inline-flex',
                background: '#f1f5f9',
                padding: '0.2rem',
                borderRadius: '8px',
                gap: '0.2rem',
              }}
            >
              <button
                type="button"
                onClick={() => handleFilterChange('all')}
                style={{
                  border: 'none',
                  background: filterType === 'all' ? '#ffffff' : 'transparent',
                  color: filterType === 'all' ? '#00498E' : '#64748b',
                  fontWeight: filterType === 'all' ? '700' : '500',
                  fontSize: '0.78rem',
                  padding: '0.35rem 0.7rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: filterType === 'all' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Tümü ({rawUnresolvedItems.length})
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('open')}
                style={{
                  border: 'none',
                  background: filterType === 'open' ? '#ffffff' : 'transparent',
                  color: filterType === 'open' ? '#00498E' : '#64748b',
                  fontWeight: filterType === 'open' ? '700' : '500',
                  fontSize: '0.78rem',
                  padding: '0.35rem 0.7rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: filterType === 'open' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Açık ({totalOpenCount})
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('in_progress')}
                style={{
                  border: 'none',
                  background: filterType === 'in_progress' ? '#ffffff' : 'transparent',
                  color: filterType === 'in_progress' ? '#00498E' : '#64748b',
                  fontWeight: filterType === 'in_progress' ? '700' : '500',
                  fontSize: '0.78rem',
                  padding: '0.35rem 0.7rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: filterType === 'in_progress' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Süreçte ({totalInProgressCount})
              </button>
            </div>
          </div>
        </div>

        {/* Tablo Gövdesi */}
        {paginatedList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b', fontSize: '0.85rem' }}>
            Arama kriterine uygun başvuru kaydı bulunamadı.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.82rem',
                textAlign: 'left',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '0.6rem 0.75rem', fontWeight: '600' }}>Başvuru No</th>
                  <th style={{ padding: '0.6rem 0.75rem', fontWeight: '600' }}>İlçe / Mahalle</th>
                  <th style={{ padding: '0.6rem 0.75rem', fontWeight: '600' }}>Konu / Alt Konu</th>
                  <th style={{ padding: '0.6rem 0.75rem', fontWeight: '600' }}>Durum</th>
                  <th style={{ padding: '0.6rem 0.75rem', fontWeight: '600' }}>Başvuru Tarihi</th>
                  <th style={{ padding: '0.6rem 0.75rem', fontWeight: '600' }}>Önem</th>
                </tr>
              </thead>
              <tbody>
                {paginatedList.map((row) => (
                  <tr
                    key={row.docId || row.basvuruNo}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Başvuru No */}
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>
                      #{row.basvuruNo}
                    </td>

                    {/* İlçe / Mahalle */}
                    <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: '600', color: '#1e293b' }}>{row.ilce || 'DİĞER'}</span>
                      {row.mahalle ? (
                        <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b' }}>
                          {row.mahalle}
                        </span>
                      ) : null}
                    </td>

                    {/* Konu / Alt Konu (Privacy-safe: NO citizen aciklama) */}
                    <td style={{ padding: '0.65rem 0.75rem', maxWidth: '300px' }}>
                      <span
                        style={{
                          fontWeight: '600',
                          color: '#00498E',
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {row.konu || 'DİĞER'}
                      </span>
                      {row.altKonu ? (
                        <span
                          style={{
                            fontSize: '0.74rem',
                            color: '#64748b',
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {row.altKonu}
                        </span>
                      ) : null}
                    </td>

                    {/* Durum */}
                    <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: '600',
                          padding: '0.18rem 0.5rem',
                          borderRadius: '6px',
                          background:
                            row.durum === 'Açık' || row.durum === 'Atama Bekliyor'
                              ? '#e0f2fe'
                              : '#f1f5f9',
                          color:
                            row.durum === 'Açık' || row.durum === 'Atama Bekliyor'
                              ? '#0369a1'
                              : '#334155',
                        }}
                      >
                        {row.durum || 'Süreçte'}
                      </span>
                    </td>

                    {/* Başvuru Tarihi */}
                    <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap', color: '#475569', fontSize: '0.8rem' }}>
                      {formatIsoDate(row.tarih || row.basvuruTarihi)}
                    </td>

                    {/* Önem */}
                    <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: '600',
                          color: '#475569',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '6px',
                        }}
                      >
                        {row.onemDerecesi || '4-Düşük'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tablo Alt Sayfalama */}
        {totalPages > 1 ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid #f1f5f9',
              fontSize: '0.78rem',
              color: '#64748b',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <span>
              Toplam {filteredList.length} kayıttan {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, filteredList.length)} arası gösteriliyor
            </span>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: currentPage === 1 ? '#f8fafc' : '#ffffff',
                  color: currentPage === 1 ? '#94a3b8' : '#334155',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '0.75rem',
                }}
              >
                ← Önceki
              </button>
              <span style={{ fontWeight: '600', color: '#0f172a', padding: '0 0.3rem' }}>
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: currentPage === totalPages ? '#f8fafc' : '#ffffff',
                  color: currentPage === totalPages ? '#94a3b8' : '#334155',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '0.75rem',
                }}
              >
                Sonraki →
              </button>
            </div>
          </div>
        ) : null}

        <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '0.85rem 0 0 0', fontStyle: 'italic' }}>
          * Başvuru kayıtları İBB ilçe geneli havuzlarına aittir. Nöbet listeleri doğrudan meydan çalışma programına dayanır.
        </p>
      </div>
    </section>
  );
}
