import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import compiledExecutiveData from '../../data/compiledExecutiveBasvurular.json';
import {
  UserGroupIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ShieldExclamationIcon,
  ChevronRightIcon,
  MapPinIcon,
  ArrowTopRightOnSquareIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const PRIORITY_CATEGORIES = new Set(['Ana Meydan', 'Tarihi & Turistik', 'Kültür & Yaşam']);

export default function DailyDecisionCenter({
  todayShifts = [],
  activeDateKey = '',
  meydanlar = [],
  kronikSorunlar = [],
  onSelectMeydan = null,
  onSelectMeydanById = null,
}) {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState(null); // 'staff' | 'gaps' | 'sla' | 'priority' | null

  // 1. Bugün görevli aktif personeller ve meydanlar
  const { activeStaffShifts, staffedMeydanIds, unstaffedMeydanlar } = useMemo(() => {
    const active = todayShifts.filter((s) => {
      const type = (s.vardiyaTipi || '').toLowerCase();
      return !type.includes('izin') && !type.includes('rapor') && !type.includes('off');
    });

    const staffedIds = new Set(active.map((s) => s.meydanId).filter(Boolean));
    const allMeydans = Array.isArray(meydanlar) ? meydanlar : [];

    const unstaffed = allMeydans.filter((m) => !staffedIds.has(m.id));

    // Öncelikli meydanları (merkezi/turistik) en başa al
    unstaffed.sort((a, b) => {
      const aPriority = PRIORITY_CATEGORIES.has(a.kategori) ? 1 : 0;
      const bPriority = PRIORITY_CATEGORIES.has(b.kategori) ? 1 : 0;
      if (bPriority !== aPriority) return bPriority - aPriority;
      return (a.isim || '').localeCompare(b.isim || '', 'tr');
    });

    return {
      activeStaffShifts: active,
      staffedMeydanIds: staffedIds,
      unstaffedMeydanlar: unstaffed,
    };
  }, [todayShifts, meydanlar]);

  // 2. Geciken Başvurular (SLA Aşımları)
  const slaBreachedItems = useMemo(() => {
    return compiledExecutiveData?.slaBreachedItems || [];
  }, []);

  // 3. Öncelikli & Kritik Süreçler
  const criticalItems = useMemo(() => {
    return compiledExecutiveData?.criticalItems || [];
  }, []);

  const totalMeydanCount = meydanlar.length || 95;
  const coveragePercent = Math.round((staffedMeydanIds.size / totalMeydanCount) * 100);
  const totalSlaCount = compiledExecutiveData?.metadata?.totalSlaBreached || slaBreachedItems.length;
  const criticalPriorityGapsCount = unstaffedMeydanlar.filter((m) => PRIORITY_CATEGORIES.has(m.kategori)).length;

  const handleMeydanClick = (meydan) => {
    if (onSelectMeydan) {
      onSelectMeydan(meydan);
    }
  };

  const handleNavigateMeydan = (meydanId) => {
    if (onSelectMeydanById) {
      onSelectMeydanById(meydanId);
    }
    navigate(`/meydan/${meydanId}`);
  };

  const handleNavigatePersonel = (personelAdi) => {
    navigate(`/personel/${encodeURIComponent(personelAdi)}`);
  };

  return (
    <section className="daily-decision-deck" aria-label="Günlük Operasyonel Karar Merkezi">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 4px', flexWrap: 'wrap', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="section-kicker" style={{ margin: 0 }}>Günün Karar Merkezi</span>
          <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#00498E', background: '#e0f2fe', padding: '1px 8px', borderRadius: '999px' }}>
            🗓️ {activeDateKey || 'Bugün'}
          </span>
        </div>
        <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
          Anlık nöbet durumu, personel boşlukları ve acil taahhüt aşımları
        </span>
      </div>
      {/* ─── KART ŞERİDİ (4 TEMEL GÖSTERGE) ─── */}
      <div className="decision-deck__cards-grid">
        {/* Kart 1: Bugün Görevli Ekipler */}
        <button
          type="button"
          className={`decision-stat-card decision-stat-card--teams ${activePanel === 'staff' ? 'is-active' : ''}`}
          onClick={() => setActivePanel(activePanel === 'staff' ? null : 'staff')}
        >
          <div className="decision-stat-card__top">
            <span className="decision-stat-card__badge decision-stat-card__badge--success">
              <span className="badge-pulse-dot" /> Canlı Saha Gücü
            </span>
            <UserGroupIcon className="decision-stat-card__icon" width={22} height={22} />
          </div>
          <div className="decision-stat-card__value-group">
            <strong className="decision-stat-card__number">{activeStaffShifts.length}</strong>
            <span className="decision-stat-card__unit">Personel</span>
          </div>
          <div className="decision-stat-card__footer">
            <span className="decision-stat-card__highlight">%{coveragePercent} Meydan Kapsama</span>
            <span className="decision-stat-card__sub">{staffedMeydanIds.size} meydanda aktif nöbet</span>
          </div>
          <ChevronRightIcon className={`decision-stat-card__chevron ${activePanel === 'staff' ? 'is-rotated' : ''}`} width={16} height={16} />
        </button>

        {/* Kart 2: Personel Eksikleri / Nöbetsiz Meydanlar */}
        <button
          type="button"
          className={`decision-stat-card decision-stat-card--gaps ${activePanel === 'gaps' ? 'is-active' : ''}`}
          onClick={() => setActivePanel(activePanel === 'gaps' ? null : 'gaps')}
        >
          <div className="decision-stat-card__top">
            <span className="decision-stat-card__badge decision-stat-card__badge--warning">
              ⚠️ Nöbet Boşluğu
            </span>
            <MapPinIcon className="decision-stat-card__icon" width={22} height={22} />
          </div>
          <div className="decision-stat-card__value-group">
            <strong className="decision-stat-card__number">{unstaffedMeydanlar.length}</strong>
            <span className="decision-stat-card__unit">Meydan Eksik</span>
          </div>
          <div className="decision-stat-card__footer">
            <span className="decision-stat-card__highlight" style={{ color: '#b45309' }}>
              {criticalPriorityGapsCount} Öncelikli Meydan
            </span>
            <span className="decision-stat-card__sub">Bugün atanmış vardiya yok</span>
          </div>
          <ChevronRightIcon className={`decision-stat-card__chevron ${activePanel === 'gaps' ? 'is-rotated' : ''}`} width={16} height={16} />
        </button>

        {/* Kart 3: Geciken Başvurular (SLA Aşımları) */}
        <button
          type="button"
          className={`decision-stat-card decision-stat-card--sla ${activePanel === 'sla' ? 'is-active' : ''}`}
          onClick={() => setActivePanel(activePanel === 'sla' ? null : 'sla')}
        >
          <div className="decision-stat-card__top">
            <span className="decision-stat-card__badge decision-stat-card__badge--danger">
              🚨 Süre Aşımı (SLA)
            </span>
            <ClockIcon className="decision-stat-card__icon" width={22} height={22} />
          </div>
          <div className="decision-stat-card__value-group">
            <strong className="decision-stat-card__number">{totalSlaCount}</strong>
            <span className="decision-stat-card__unit">Geciken İş</span>
          </div>
          <div className="decision-stat-card__footer">
            <span className="decision-stat-card__highlight" style={{ color: '#e11d48' }}>
              Aksiyon Bekliyor
            </span>
            <span className="decision-stat-card__sub">Taahhüt tarihi dolmuş bildirim</span>
          </div>
          <ChevronRightIcon className={`decision-stat-card__chevron ${activePanel === 'sla' ? 'is-rotated' : ''}`} width={16} height={16} />
        </button>

        {/* Kart 4: Öncelikli & Kronik Süreçler */}
        <button
          type="button"
          className={`decision-stat-card decision-stat-card--priority ${activePanel === 'priority' ? 'is-active' : ''}`}
          onClick={() => setActivePanel(activePanel === 'priority' ? null : 'priority')}
        >
          <div className="decision-stat-card__top">
            <span className="decision-stat-card__badge decision-stat-card__badge--info">
              📌 Öncelikli & Kronik
            </span>
            <ShieldExclamationIcon className="decision-stat-card__icon" width={22} height={22} />
          </div>
          <div className="decision-stat-card__value-group">
            <strong className="decision-stat-card__number">{kronikSorunlar.length + criticalItems.length}</strong>
            <span className="decision-stat-card__unit">Kritik Madde</span>
          </div>
          <div className="decision-stat-card__footer">
            <span className="decision-stat-card__highlight" style={{ color: '#00498E' }}>
              {kronikSorunlar.length} Kronik Saha Süreci
            </span>
            <span className="decision-stat-card__sub">Yönetici takibindeki kritik işler</span>
          </div>
          <ChevronRightIcon className={`decision-stat-card__chevron ${activePanel === 'priority' ? 'is-rotated' : ''}`} width={16} height={16} />
        </button>
      </div>

      {/* ─── GENİŞLEYEN DETAY PANOSU (DRAWER / ACCORDION) ─── */}
      {activePanel ? (
        <div className="decision-deck__expanded-panel">
          <div className="decision-expanded-header">
            <div className="decision-expanded-title-wrap">
              <h4>
                {activePanel === 'staff' ? '👥 Bugün Görevli Personel Listesi & Vardiya Planı' : null}
                {activePanel === 'gaps' ? '⚠️ Personel Eksikliği Olan (Nöbetsiz) Meydanlar' : null}
                {activePanel === 'sla' ? '🚨 Taahhüt Süresi Aşılmış (SLA) Açık Başvurular' : null}
                {activePanel === 'priority' ? '📌 Öncelikli Kronik Süreçler ve Kritik İşler' : null}
              </h4>
              <span className="decision-expanded-subtitle">
                {activePanel === 'staff' ? `Toplam ${activeStaffShifts.length} kayıtlı görevlendirme listeleniyor.` : null}
                {activePanel === 'gaps' ? `${unstaffedMeydanlar.length} meydanda nöbetçi personel bulunmuyor. İncelemek için tıklayın.` : null}
                {activePanel === 'sla' ? 'Çözüm taahhüt tarihi aşılmış, acil koordinasyon gerektiren başvurular.' : null}
                {activePanel === 'priority' ? 'Saha birimleri tarafından öncelikli olarak işaretlenmiş kronik operasyonel konular.' : null}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm decision-expanded-close"
              onClick={() => setActivePanel(null)}
              aria-label="Kapat"
            >
              <XMarkIcon width={18} height={18} />
              <span>Kapat</span>
            </button>
          </div>

          {/* Panel 1: Görevli Ekipler */}
          {activePanel === 'staff' ? (
            <div className="decision-expanded-body">
              {activeStaffShifts.length > 0 ? (
                <div className="decision-items-grid">
                  {activeStaffShifts.slice(0, 18).map((s, idx) => (
                    <div key={idx} className="decision-item-chip">
                      <div className="decision-item-chip__info">
                        <button
                          type="button"
                          className="decision-link-btn"
                          onClick={() => handleNavigatePersonel(s.personelAdi)}
                        >
                          <strong>{s.personelAdi}</strong>
                          <ArrowTopRightOnSquareIcon width={13} height={13} />
                        </button>
                        <span className="decision-item-chip__location">
                          📍 {s.meydanId ? s.meydanId.toUpperCase() : 'Diğer'} · {s.saatAraligi || 'Tam Gün'}
                        </span>
                      </div>
                      {s.meydanId ? (
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          onClick={() => handleNavigateMeydan(s.meydanId)}
                        >
                          Meydan Detay
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">Bugün için kayıtlı aktif personel vardiyası bulunmuyor.</div>
              )}
            </div>
          ) : null}

          {/* Panel 2: Personel Eksikleri */}
          {activePanel === 'gaps' ? (
            <div className="decision-expanded-body">
              <div className="decision-gaps-grid">
                {unstaffedMeydanlar.slice(0, 18).map((m) => {
                  const isPriority = PRIORITY_CATEGORIES.has(m.kategori);
                  return (
                    <div key={m.id} className={`decision-gap-card ${isPriority ? 'decision-gap-card--priority' : ''}`}>
                      <div className="decision-gap-card__header">
                        <strong>{m.isim}</strong>
                        {isPriority ? (
                          <span className="badge badge-warning" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>Öncelikli</span>
                        ) : null}
                      </div>
                      <div className="decision-gap-card__meta">
                        <span>{m.district || m.ilce} · {m.yaka || ''}</span>
                        <span style={{ color: '#dc2626', fontWeight: '600' }}>0 Nöbetçi</span>
                      </div>
                      <div className="decision-gap-card__actions">
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => handleMeydanClick(m)}
                        >
                          Vitrinde Gör
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-xs"
                          onClick={() => handleNavigateMeydan(m.id)}
                        >
                          Meydana Git →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Panel 3: SLA Aşımları */}
          {activePanel === 'sla' ? (
            <div className="decision-expanded-body">
              {slaBreachedItems.length > 0 ? (
                <div className="decision-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Başvuru No</th>
                        <th>İlçe / Meydan</th>
                        <th>Konu & Durum</th>
                        <th>Gecikme</th>
                        <th>Hedef Tarih</th>
                        <th>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slaBreachedItems.slice(0, 8).map((item) => (
                        <tr key={item.docId || item.basvuruNo}>
                          <td><strong>{item.basvuruNo}</strong></td>
                          <td>
                            <span>{item.ilce}</span>
                            {item.meydanId ? <span style={{ color: '#00498E', display: 'block', fontSize: '0.75rem' }}>📍 {item.meydanId}</span> : null}
                          </td>
                          <td>
                            <span>{item.konu || 'Genel Başvuru'}</span>
                            <span style={{ display: 'block', fontSize: '0.74rem', color: '#64748b' }}>{item.durum} · {item.onemDerecesi || ''}</span>
                          </td>
                          <td>
                            <span style={{ color: '#e11d48', fontWeight: '700' }}>
                              +{item.agingDays || 0} Gün
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.taahhutTarihi || '-'}</td>
                          <td>
                            {item.meydanId ? (
                              <button
                                type="button"
                                className="btn btn-outline btn-xs"
                                onClick={() => handleNavigateMeydan(item.meydanId)}
                              >
                                Meydana Git
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">Kayıtlı taahhüt süresi aşımı bulunmuyor.</div>
              )}
            </div>
          ) : null}

          {/* Panel 4: Öncelikli & Kronik Süreçler */}
          {activePanel === 'priority' ? (
            <div className="decision-expanded-body">
              {kronikSorunlar.length > 0 ? (
                <div className="decision-items-grid">
                  {kronikSorunlar.map((k) => (
                    <div key={k.id} className="decision-item-chip" style={{ borderLeft: '3px solid #00498E' }}>
                      <div className="decision-item-chip__info">
                        <strong>{k.basvuruNo || k.konu || 'Kronik Başvuru'}</strong>
                        <span className="decision-item-chip__location">
                          📍 {k.meydanId ? k.meydanId.toUpperCase() : 'Genel'} · {k.durum || 'Süreçte'}
                        </span>
                        {k.aciklama ? <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>{k.aciklama}</p> : null}
                      </div>
                      {k.meydanId ? (
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          onClick={() => handleNavigateMeydan(k.meydanId)}
                        >
                          Meydana Git
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">Kayıtlı kronik süreç bulunmuyor.</div>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
