import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SAHA_PERSONELI, normalizePhone } from '../../utils/sahaPersoneli';

const FORCED_HEADERS = {
  about: { kicker: 'Meydan Yönetimi', title: 'Meydan Yönetimi Hakkında' },
  ziyaret: { kicker: 'Kurum Ziyaret', title: 'Kurum Ziyaret Formu' },
  reports: { kicker: 'Raporlar', title: 'Faaliyet Raporları' },
  personel: { kicker: 'Personel', title: 'Personel Listesi' },
};

export default function MeydanYonetimiSection({
  activeMeydanYonetimiBolumu,
  setActiveMeydanYonetimiBolumu,
  meydanYonetimiAciklama,
  visibleMeydanYonetimiGorevleri,
  toplamMeydanYonetimiGorev,
  aboutVisibleResponsibilityCount,
  showAllMeydanYonetimiGorevleri,
  onToggleShowAllMeydanYonetimiGorevleri,
  meydanFaaliyetRaporlari,
  raporUrls,
  toggleRaporAcilimi,
  formatFileSize,
  showAllMeydanYonetimiPersonel,
  initialVisibleMeydanPersonelCount,
  onToggleShowAllMeydanYonetimiPersonel,
  forcedSection,
}) {
  const [previewReportId, setPreviewReportId] = useState('');
  const [personelSearchOpen, setPersonelSearchOpen] = useState(false);
  const [personelSearchTerm, setPersonelSearchTerm] = useState('');

  const activeSection = forcedSection || activeMeydanYonetimiBolumu;
  const forcedHeader = forcedSection ? FORCED_HEADERS[forcedSection] : null;
  const normalizedSearch = personelSearchTerm.trim().toLocaleLowerCase('tr-TR');

  const visiblePersonelList = (showAllMeydanYonetimiPersonel
    ? SAHA_PERSONELI
    : SAHA_PERSONELI.slice(0, initialVisibleMeydanPersonelCount)
  ).filter((sp) => {
    if (!normalizedSearch) {
      return true;
    }

    const haystack = `${sp.ad} ${sp.gorev} ${sp.telefon}`.toLocaleLowerCase('tr-TR');
    return haystack.includes(normalizedSearch);
  });

  return (
    <section className="panel-section meydan-yonetimi-section">
      {forcedHeader ? (
        <div className="panel-section__header">
          <div>
            <span className="section-kicker">{forcedHeader.kicker}</span>
            <h2>{forcedHeader.title}</h2>
          </div>
        </div>
      ) : (
        <>
          <div className="panel-section__header">
            <div>
              <span className="section-kicker">Meydan Yönetimi</span>
              <h2>Meydan Yönetimi Hakkında</h2>
              <p>Bu alan bilgilendirme, faaliyet raporları ve personel görünümünü tek yerde toplar.</p>
            </div>
          </div>

          <div className="meydan-yonetimi-tabs" role="tablist" aria-label="Meydan yönetimi bölümleri">
            <button
              type="button"
              role="tab"
              aria-selected={activeMeydanYonetimiBolumu === 'ziyaret'}
              className={`meydan-yonetimi-tabs__btn${activeMeydanYonetimiBolumu === 'ziyaret' ? ' is-active' : ''}`}
              onClick={() => setActiveMeydanYonetimiBolumu('ziyaret')}
            >
              Kurum Ziyaret Formu
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeMeydanYonetimiBolumu === 'about'}
              className={`meydan-yonetimi-tabs__btn${activeMeydanYonetimiBolumu === 'about' ? ' is-active' : ''}`}
              onClick={() => setActiveMeydanYonetimiBolumu('about')}
            >
              Hakkında / Görev ve Sorumluluklar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeMeydanYonetimiBolumu === 'reports'}
              className={`meydan-yonetimi-tabs__btn${activeMeydanYonetimiBolumu === 'reports' ? ' is-active' : ''}`}
              onClick={() => setActiveMeydanYonetimiBolumu('reports')}
            >
              Faaliyet Raporları
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeMeydanYonetimiBolumu === 'personel'}
              className={`meydan-yonetimi-tabs__btn${activeMeydanYonetimiBolumu === 'personel' ? ' is-active' : ''}`}
              onClick={() => setActiveMeydanYonetimiBolumu('personel')}
            >
              Personel Listesi
            </button>
          </div>
        </>
      )}

      {activeSection === 'ziyaret' ? (
        <div className="meydan-yonetimi-panel">
          <p>Gerçekleştireceğiniz ziyaretler için hazırlanmış olan forma aşağıdaki bağlantıdan ulaşabilirsiniz.</p>
          <a
            className="ziyaret-form-link"
            href="https://forms.gle/GJY9e2rK96AqntXh8"
            target="_blank"
            rel="noreferrer"
          >
            <span className="ziyaret-form-link__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
            </span>
            Ziyaret formuna erişmek için tıklayın
          </a>
        </div>
      ) : null}

      {activeSection === 'about' ? (
        <div className="meydan-yonetimi-panel">
          <p>{meydanYonetimiAciklama}</p>

          <h3>Görev ve Sorumluluklar</h3>
          <ol className="meydan-yonetimi-gorev-list">
            {visibleMeydanYonetimiGorevleri.map((item, index) => (
              <li key={`gorev-${index}`}>{item}</li>
            ))}
          </ol>

          {toplamMeydanYonetimiGorev > aboutVisibleResponsibilityCount ? (
            <div className="show-more-row">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={onToggleShowAllMeydanYonetimiGorevleri}
              >
                {showAllMeydanYonetimiGorevleri
                  ? 'Daha Az Göster'
                  : `Devamını Gör (${toplamMeydanYonetimiGorev - aboutVisibleResponsibilityCount} görev daha)`}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {activeSection === 'reports' ? (
        <div className="meydan-yonetimi-panel">
          <p>Bu ekranda sadece yüklenen raporları görüntüleyebilir ve indirebilirsiniz.</p>

          {meydanFaaliyetRaporlari.length ? (
            <ul className="meydan-yonetimi-rapor-list">
              {meydanFaaliyetRaporlari.map((report) => {
                const reportUrl = raporUrls[report.id];
                return (
                  <li key={report.id}>
                    <button
                      type="button"
                      className="btn btn-ghost meydan-yonetimi-rapor-baslik"
                      onClick={() => toggleRaporAcilimi(report.id)}
                    >
                      <strong>{report.baslik}</strong>
                      <span className="rapor-icon">{report.acilimi ? '▼' : '▶'}</span>
                    </button>
                    {report.acilimi && (
                      <div className="meydan-yonetimi-rapor-details">
                        <div className="rapor-info">
                          <small>{report.ad}</small>
                          <small>{formatFileSize(report.boyut)} • {report.yuklenmeTarihi}</small>
                        </div>
                        <div className="meydan-yonetimi-rapor-actions">
                          {!reportUrl || reportUrl === 'loading' ? (
                            <span className="rapor-loading">PDF yükleniyor...</span>
                          ) : reportUrl === 'error' ? (
                            <span className="rapor-error">Yüklenemedi.</span>
                          ) : (
                            <>
                              <a className="btn btn-ghost btn-inline" href={reportUrl} target="_blank" rel="noreferrer">Görüntüle</a>
                              <button
                                className="btn btn-ghost btn-inline"
                                type="button"
                                onClick={() => setPreviewReportId((current) => (current === report.id ? '' : report.id))}
                              >
                                {previewReportId === report.id ? 'Önizlemeyi Kapat' : 'Önizle'}
                              </button>
                              <a className="btn btn-primary btn-inline" href={reportUrl} download={report.ad}>İndir</a>
                            </>
                          )}
                        </div>
                        {reportUrl && reportUrl !== 'loading' && reportUrl !== 'error' && previewReportId === report.id ? (
                          <div className="report-preview-frame-wrap">
                            <iframe
                              title={`${report.baslik} PDF önizleme`}
                              src={reportUrl}
                              className="report-preview-frame"
                            />
                          </div>
                        ) : null}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="empty-state">Henüz faaliyet raporu yüklenmedi.</div>
          )}
        </div>
      ) : null}

      {activeSection === 'personel' ? (
        <div className="meydan-yonetimi-panel">
          <div className="personel-search-row">
            <button
              type="button"
              className={`btn btn-ghost personel-search-toggle${personelSearchOpen ? ' is-active' : ''}`}
              onClick={() => {
                setPersonelSearchOpen((current) => !current);
                if (personelSearchOpen) {
                  setPersonelSearchTerm('');
                }
              }}
              aria-expanded={personelSearchOpen}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Personel Ara
            </button>
          </div>

          {personelSearchOpen ? (
            <div className="personel-search-input-wrap">
              <input
                type="text"
                className="personel-search-input"
                value={personelSearchTerm}
                onChange={(event) => setPersonelSearchTerm(event.target.value)}
                placeholder="İsim, görev veya telefon ile ara"
                aria-label="Personel listesinde ara"
              />
            </div>
          ) : null}

          <ul className="meydan-yonetimi-personel-list saha-personel-list">
            {visiblePersonelList.map((sp) => {
              const phone = normalizePhone(sp.telefon);
              return (
                <li key={sp.ad}>
                  <div className="saha-personel-item__main">
                    <Link to={`/personel/${encodeURIComponent(sp.ad)}`} className="personel-name-link">
                      <strong>{sp.ad}</strong>
                    </Link>
                    <span className="saha-personel-item__gorev">{sp.gorev}</span>
                  </div>
                  <div className="saha-personel-item__contact">
                    <span className="saha-personel-item__phone">{sp.telefon}</span>
                    <a
                      href={`tel:0${phone}`}
                      className="saha-contact-btn saha-contact-btn--call"
                      aria-label={`${sp.ad} ara`}
                      title="Ara"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                    </a>
                    <a
                      href={`https://wa.me/90${phone}`}
                      className="saha-contact-btn saha-contact-btn--wa"
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${sp.ad} WhatsApp`}
                      title="WhatsApp"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>

          {!visiblePersonelList.length ? (
            <div className="empty-state">Arama kriterine uygun personel bulunamadı.</div>
          ) : null}

          {SAHA_PERSONELI.length > initialVisibleMeydanPersonelCount ? (
            <div className="show-more-row">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={onToggleShowAllMeydanYonetimiPersonel}
                disabled={Boolean(normalizedSearch)}
              >
                {showAllMeydanYonetimiPersonel
                  ? 'Daha Az Göster'
                  : `Devamını Gör (${SAHA_PERSONELI.length - initialVisibleMeydanPersonelCount} personel daha)`}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
