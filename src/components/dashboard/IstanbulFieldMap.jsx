import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const ANADOLU_DISTRICTS = [
  { id: 'kadikoy', name: 'Kadıköy', title: 'Kadıköy Rıhtım Meydanı' },
  { id: 'uskudar', name: 'Üsküdar', title: 'Üsküdar Mimar Sinan Meydanı' },
  { id: 'umraniye', name: 'Ümraniye', title: 'Ümraniye 15 Temmuz Şehitler Meydanı' },
  { id: 'maltepe', name: 'Maltepe', title: 'Maltepe Sahil Meydanı' },
  { id: 'kartal', name: 'Kartal', title: 'Kartal Meydanı' },
  { id: 'pendik', name: 'Pendik', title: 'Pendik Sahil Meydanı' },
  { id: 'beykoz', name: 'Beykoz', title: 'Beykoz Sahil Meydanı' },
  { id: 'cekmekoy', name: 'Çekmeköy', title: 'Çekmeköy Meydanı' },
  { id: 'sancaktepe', name: 'Sancaktepe', title: 'Sancaktepe Meydanı' },
  { id: 'sultanbeyli', name: 'Sultanbeyli', title: 'Sultanbeyli Kent Meydanı' },
  { id: 'tuzla', name: 'Tuzla', title: 'Tuzla Sahil Meydanı' },
  { id: 'sile', name: 'Şile', title: 'Şile Meydanı' },
];

const AVRUPA_DISTRICTS = [
  { id: 'taksim', name: 'Taksim', title: 'Taksim Meydanı' },
  { id: 'besiktas', name: 'Beşiktaş', title: 'Beşiktaş İskele Meydanı' },
  { id: 'fatih', name: 'Fatih (Aksaray)', title: 'Fatih Aksaray Meydanı' },
  { id: 'sisli', name: 'Şişli Mecidiyeköy', title: 'Şişli Mecidiyeköy Meydanı' },
  { id: 'bakirkoy', name: 'Bakırköy', title: 'Bakırköy Özgürlük Meydanı' },
  { id: 'bahcelievler', name: 'Bahçelievler', title: 'Bahçelievler Şirinevler Meydanı' },
  { id: 'zeytinburnu', name: 'Zeytinburnu', title: 'Zeytinburnu 15 Temmuz Meydanı' },
  { id: 'eyupsultan', name: 'Eyüpsultan', title: 'Eyüpsultan Meydanı' },
  { id: 'sariyer', name: 'Sarıyer', title: 'Sarıyer Merkez Meydanı' },
  { id: 'sultangazi', name: 'Sultangazi', title: 'Sultangazi Meydanı' },
  { id: 'esenler', name: 'Esenler', title: 'Esenler Dörtyol Meydanı' },
  { id: 'bagcilar', name: 'Bağcılar', title: 'Bağcılar 15 Temmuz Meydanı' },
  { id: 'avcilar', name: 'Avcılar', title: 'Avcılar Marmara Cad. Meydanı' },
  { id: 'beylikduzu', name: 'Beylikdüzü', title: 'Beylikdüzü Yaşam Vadisi Meydanı' },
  { id: 'buyukcekmece', name: 'Büyükçekmece', title: 'Büyükçekmece Kent Meydanı' },
  { id: 'silivri', name: 'Silivri', title: 'Silivri Sahil Meydanı' },
];

export default function IstanbulFieldMap({ todayShifts = [], activeMeydanlar = [] }) {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [sideFilter, setSideFilter] = useState('all'); // 'all' | 'avrupa' | 'anadolu'

  // Map counts per district
  const districtData = useMemo(() => {
    const counts = new Map();
    const activeStaff = new Map();

    todayShifts.forEach((shift) => {
      const id = shift.meydanId;
      if (!id) return;
      counts.set(id, (counts.get(id) || 0) + 1);

      if (!activeStaff.has(id)) activeStaff.set(id, []);
      activeStaff.get(id).push(shift);
    });

    return { counts, activeStaff };
  }, [todayShifts]);

  const getDistrictStatus = (id) => {
    const count = districtData.counts.get(id) || 0;
    if (count >= 3) return { level: 'high', label: `${count} Personel Aktif`, colorClass: 'badge-high' };
    if (count > 0) return { level: 'moderate', label: `${count} Personel Aktif`, colorClass: 'badge-moderate' };
    return { level: 'none', label: 'Plan Yok', colorClass: 'badge-none' };
  };

  return (
    <div className="istanbul-field-map-container">
      <div className="map-controls">
        <div className="map-controls__side-picker">
          <button
            type="button"
            className={`map-tab ${sideFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => setSideFilter('all')}
          >
            Tüm İstanbul (42 Meydan)
          </button>
          <button
            type="button"
            className={`map-tab ${sideFilter === 'avrupa' ? 'is-active' : ''}`}
            onClick={() => setSideFilter('avrupa')}
          >
            🏰 Avrupa Yakası
          </button>
          <button
            type="button"
            className={`map-tab ${sideFilter === 'anadolu' ? 'is-active' : ''}`}
            onClick={() => setSideFilter('anadolu')}
          >
            🌊 Anadolu Yakası
          </button>
        </div>

        <div className="map-legend">
          <span className="legend-item"><span className="dot dot--high" /> Yoğun Personel (3+)</span>
          <span className="legend-item"><span className="dot dot--moderate" /> Aktif Personel (1-2)</span>
          <span className="legend-item"><span className="dot dot--none" /> Planlı Görev Yok</span>
        </div>
      </div>

      <div className="map-grid-layout">
        {sideFilter === 'all' || sideFilter === 'avrupa' ? (
          <div className="map-region-block">
            <h4 className="region-title">🏰 Avrupa Yakası Saha Görünümü</h4>
            <div className="district-cards-grid">
              {AVRUPA_DISTRICTS.map((d) => {
                const status = getDistrictStatus(d.id);
                const count = districtData.counts.get(d.id) || 0;
                const isSelected = selectedDistrict?.id === d.id;

                return (
                  <div
                    key={d.id}
                    className={`district-map-card ${status.colorClass} ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => setSelectedDistrict({ ...d, count, staff: districtData.activeStaff.get(d.id) || [] })}
                  >
                    <div className="card-top">
                      <span className="district-name">{d.name}</span>
                      <span className={`status-indicator ${status.colorClass}`} />
                    </div>
                    <div className="card-bottom">
                      <span className="count-label">{count} Vardiya</span>
                      <span className="arrow-icon">→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {sideFilter === 'all' || sideFilter === 'anadolu' ? (
          <div className="map-region-block">
            <h4 className="region-title">🌊 Anadolu Yakası Saha Görünümü</h4>
            <div className="district-cards-grid">
              {ANADOLU_DISTRICTS.map((d) => {
                const status = getDistrictStatus(d.id);
                const count = districtData.counts.get(d.id) || 0;
                const isSelected = selectedDistrict?.id === d.id;

                return (
                  <div
                    key={d.id}
                    className={`district-map-card ${status.colorClass} ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => setSelectedDistrict({ ...d, count, staff: districtData.activeStaff.get(d.id) || [] })}
                  >
                    <div className="card-top">
                      <span className="district-name">{d.name}</span>
                      <span className={`status-indicator ${status.colorClass}`} />
                    </div>
                    <div className="card-bottom">
                      <span className="count-label">{count} Vardiya</span>
                      <span className="arrow-icon">→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {selectedDistrict ? (
        <div className="district-detail-drawer">
          <div className="drawer-header">
            <div>
              <h3>{selectedDistrict.title || selectedDistrict.name}</h3>
              <span className="drawer-subtitle">Bugün Sahadaki Personel Kadrosu ({selectedDistrict.count})</span>
            </div>
            <button type="button" className="btn-close" onClick={() => setSelectedDistrict(null)}>×</button>
          </div>

          <div className="drawer-body">
            {selectedDistrict.staff.length > 0 ? (
              <ul className="drawer-staff-list">
                {selectedDistrict.staff.map((s, idx) => (
                  <li key={idx} className="staff-item">
                    <div className="staff-info">
                      <strong>{s.personelAdi}</strong>
                      <small>{s.saatAraligi}</small>
                    </div>
                    <Link to={`/personel/${encodeURIComponent(s.personelAdi)}`} className="btn btn-sm btn-ghost">
                      Personel Detay →
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-staff-msg">
                Bugün bu meydan için planlanmış aktif personel bulunmamaktadır.
              </div>
            )}
          </div>

          <div className="drawer-footer">
            <Link to={`/meydan/${selectedDistrict.id}`} className="btn btn-primary btn-block">
              {selectedDistrict.name} Meydan Detayına Git →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
