import { Suspense, useState } from 'react';

export default function DataManagementSection({
  adminUnlocked,
  adminPasswordInput,
  adminPasswordError,
  onAdminPasswordChange,
  onAdminUnlock,
  uploading,
  uploadingKronik,
  progress,
  uploadPercent,
  ExcelUpload,
  LoadingUploadModule,
  handleExcelUpload,
  handleKronikUpload,
  raporBaslik,
  setRaporBaslik,
  uploadingRapor,
  handleUploadMeydanRaporu,
  meydanFaaliyetRaporlari,
  raporUrls,
  toggleRaporAcilimi,
  formatFileSize,
  handleRemoveMeydanRaporu,
  handleDeleteAll,
  lastImportSummary,
  kronikSorunlar,
  visibleAdminKronikSorunlar,
  getKronikDraft,
  kronikSavingId,
  expandedAdminKronikId,
  setExpandedAdminKronikId,
  handleKronikFieldChange,
  handleAddDetailRow,
  handleKronikDetailChange,
  handleRemoveDetailRow,
  handleSaveKronik,
  handleDeleteKronik,
  showAllAdminKronik,
  setShowAllAdminKronik,
  initialVisibleAdminKronikCount,
  recentShifts,
  visibleShiftsCount,
  setVisibleShiftsCount,
  meydanMap,
  handleDeleteShift,
}) {
  const [previewReportId, setPreviewReportId] = useState('');

  return (
    <section className="panel-section">
      <div className="panel-section__header">
        <div>
          <span className="section-kicker">Kontrol Alanı</span>
          <h2>Yönetim Erişimi</h2>
        </div>
      </div>

      {!adminUnlocked ? (
        <div className="admin-lock">
          <div className="admin-lock__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <p className="admin-lock__description">Yetkili erişim gerekli.</p>
          <form className="admin-lock__form" onSubmit={onAdminUnlock}>
            <label htmlFor="admin-password-input" className="sr-only">Yönetici parolası</label>
            <input
              id="admin-password-input"
              type="password"
              className={`admin-lock__input${adminPasswordError ? ' admin-lock__input--error' : ''}`}
              placeholder="Erişim kodu"
              value={adminPasswordInput}
              onChange={onAdminPasswordChange}
              aria-invalid={adminPasswordError ? 'true' : 'false'}
              aria-describedby={adminPasswordError ? 'admin-password-error' : undefined}
              autoComplete="current-password"
            />
            <button className="btn btn-primary" type="submit">Giriş Yap</button>
          </form>
          {adminPasswordError ? (
            <p id="admin-password-error" className="admin-lock__error">Parola hatalı. Lütfen tekrar deneyin.</p>
          ) : null}
        </div>
      ) : (
        <>
          <div className="management-grid">
            <div className="management-card">
              <div className="management-card__header">
                <div className="management-card__icon management-card__icon--blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                </div>
                <div>
                  <h3 className="management-card__title">Plan Ekle</h3>
                  <p className="management-card__subtitle">Vardiya verilerini .xlsx veya .xls formatında içe aktarın</p>
                </div>
              </div>
              <Suspense fallback={<LoadingUploadModule />}>
                <ExcelUpload onJsonReady={handleExcelUpload} disabled={uploading} />
              </Suspense>

              {uploading ? (
                <div className="upload-progress message message-loading" role="status" aria-live="polite">
                  <div className="upload-progress__meta">
                    <span>{progress ? `Grup ${progress.current}/${progress.total} işleniyor...` : 'İşlem hazırlanıyor...'}</span>
                    <strong>{uploadPercent}%</strong>
                  </div>
                  <div className="upload-progress__track" aria-hidden="true">
                    <div className="upload-progress__fill" style={{ width: `${uploadPercent}%` }} />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="management-card">
              <div className="management-card__header">
                <div className="management-card__icon management-card__icon--blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7h18" />
                    <path d="M7 3v8" />
                    <path d="M17 3v8" />
                    <rect x="3" y="7" width="18" height="14" rx="2" />
                    <path d="M8 14h8" />
                  </svg>
                </div>
                <div>
                  <h3 className="management-card__title">Kronik Sorun Ekle</h3>
                  <p className="management-card__subtitle">Kronik başvuruları .xlsx veya .xls formatında ayrı olarak yükleyin</p>
                </div>
              </div>

              <Suspense fallback={<LoadingUploadModule />}>
                <ExcelUpload onJsonReady={handleKronikUpload} disabled={uploading} />
              </Suspense>

              {uploadingKronik ? (
                <div className="message message-loading" role="status" aria-live="polite">
                  Kronik sorun kayıtları işleniyor...
                </div>
              ) : null}
            </div>

            <div className="management-card">
              <div className="management-card__header">
                <div className="management-card__icon management-card__icon--blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20" />
                    <path d="M5 9h14" />
                    <path d="M5 16h14" />
                    <path d="M4 4h16v16H4z" />
                  </svg>
                </div>
                <div>
                  <h3 className="management-card__title">Faaliyet Raporu Ekle</h3>
                  <p className="management-card__subtitle">Raporları PDF formatında yükleyin ve yönetin</p>
                </div>
              </div>

              <div className="meydan-yonetimi-upload-row">
                <input
                  type="text"
                  placeholder="Rapor başlığı (ör: ŞUBAT 2026 FAALİYET RAPORU)"
                  value={raporBaslik}
                  onChange={(e) => setRaporBaslik(e.target.value)}
                  disabled={uploadingRapor}
                  className="form-control meydan-yonetimi-rapor-baslik-input"
                />
                <label className={`btn btn-ghost meydan-yonetimi-upload${uploadingRapor ? ' is-loading' : ''}`}>
                  {uploadingRapor ? 'Yükleniyor...' : 'PDF Rapor Yükle'}
                  <input type="file" accept=".pdf,application/pdf" multiple onChange={handleUploadMeydanRaporu} disabled={uploadingRapor} />
                </label>
              </div>

              {meydanFaaliyetRaporlari.length ? (
                <ul className="meydan-yonetimi-rapor-list">
                  {meydanFaaliyetRaporlari.map((report) => {
                    const reportUrl = raporUrls[report.id];
                    return (
                      <li key={`admin-${report.id}`}>
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
                              <button className="btn btn-ghost btn-inline" type="button" onClick={() => handleRemoveMeydanRaporu(report.id)}>Kaldır</button>
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

            <div className="management-card management-card--danger">
              <div className="management-card__header">
                <div className="management-card__icon management-card__icon--danger">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </div>
                <div>
                  <h3 className="management-card__title">Sistem Sıfırlama</h3>
                  <p className="management-card__subtitle">Tüm vardiya ve meydan verilerini kalıcı olarak siler</p>
                </div>
              </div>
              <p className="management-card__body">
                Bu işlem geri alınamaz. Sistemdeki tüm vardiya kayıtları ve meydan tanımları silinecektir.
                Devam etmeden önce verilerinizi yedeklediğinizden emin olun.
              </p>
              <button className="btn btn-danger btn-block" type="button" onClick={handleDeleteAll} disabled={uploading}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Sistemi Sıfırla
              </button>
            </div>
          </div>

          {lastImportSummary ? (
            <div className="import-detail-card">
              <div className="import-detail-card__header">
                <h3>Son Yükleme Detayı</h3>
                <span className="import-detail-card__badge">Sadece yönetici görünümü</span>
              </div>

              <div className="import-detail-card__summary">
                <span>{lastImportSummary.createdShifts || 0} vardiya eklendi</span>
                <span>{lastImportSummary.createdMeydanlar || 0} yeni meydan eklendi</span>
                <span>{(lastImportSummary.skippedMissingFields || 0) + (lastImportSummary.skippedInvalidDate || 0) + (lastImportSummary.skippedInvalidMeydan || 0)} kayıt atlandı</span>
                <span>{lastImportSummary.ignoredOffDays || 0} HT/izin satırı hariç tutuldu</span>
              </div>

              <div className="import-detail-card__reasons">
                <p>
                  Eksik alan: <strong>{lastImportSummary.skippedMissingFields || 0}</strong> |
                  Tarih formatı: <strong>{lastImportSummary.skippedInvalidDate || 0}</strong> |
                  Meydan eşleşmedi: <strong>{lastImportSummary.skippedInvalidMeydan || 0}</strong> |
                  HT/izin (normal): <strong>{lastImportSummary.ignoredOffDays || 0}</strong>
                </p>
              </div>

              {(lastImportSummary.skippedDetails?.invalidMeydan || []).length ? (
                <div className="import-detail-card__list-wrap">
                  <h4>Meydan eşleşmeyen örnek kayıtlar</h4>
                  <ul className="import-detail-card__list">
                    {lastImportSummary.skippedDetails.invalidMeydan.map((item, index) => (
                      <li key={`invalid-meydan-${index}`}>
                        <strong>{item.personelAdi}</strong>
                        <span>{item.meydan}</span>
                        <small>{item.tarih}</small>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {(lastImportSummary.skippedDetails?.invalidDate || []).length ? (
                <div className="import-detail-card__list-wrap">
                  <h4>Tarih formatı hatalı örnek kayıtlar</h4>
                  <ul className="import-detail-card__list">
                    {lastImportSummary.skippedDetails.invalidDate.map((item, index) => (
                      <li key={`invalid-date-${index}`}>
                        <strong>{item.personelAdi}</strong>
                        <span>{item.meydan}</span>
                        <small>{item.tarih}</small>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {(lastImportSummary.skippedDetails?.missingFields || []).length ? (
                <div className="import-detail-card__list-wrap">
                  <h4>Eksik alanlı örnek kayıtlar</h4>
                  <ul className="import-detail-card__list">
                    {lastImportSummary.skippedDetails.missingFields.map((item, index) => (
                      <li key={`missing-${index}`}>
                        <strong>{item.personelAdi}</strong>
                        <span>{item.meydan}</span>
                        <small>{item.tarih}</small>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="table-section">
            <div className="table-section__header">
              <h3>Kronik Başvuru Süreci Düzenleme</h3>
            </div>

            {kronikSorunlar.length ? (
              <div className="kronik-admin-list">
                {visibleAdminKronikSorunlar.map((item) => {
                  const draft = getKronikDraft(item);
                  const isSaving = kronikSavingId === item.id;
                  const isOpen = expandedAdminKronikId === item.id;

                  return (
                    <div key={`admin-${item.id}`} className={`kronik-admin-item${isOpen ? ' is-open' : ''}`}>
                      <button
                        type="button"
                        className="kronik-admin-item__row"
                        onClick={() => setExpandedAdminKronikId((current) => (current === item.id ? '' : item.id))}
                        aria-expanded={isOpen}
                      >
                        <div className="kronik-admin-item__row-info">
                          <strong>{item.basvuruNo || '-'}</strong>
                          <span>{item.meydanAdi || '-'}</span>
                        </div>
                        <svg
                          className="kronik-admin-item__chevron"
                          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      {isOpen ? (
                        <div className="kronik-admin-item__body">
                          <div className="kronik-admin-item__fields">
                            <label className="kronik-admin-item__field">
                              <span>Başvuru No</span>
                              <input
                                type="text"
                                value={draft.basvuruNo}
                                onChange={(event) => handleKronikFieldChange(item, 'basvuruNo', event.target.value)}
                                className="kronik-admin-item__input"
                              />
                            </label>

                            <label className="kronik-admin-item__field">
                              <span>Meydan Adı</span>
                              <input
                                type="text"
                                value={draft.meydanAdi}
                                onChange={(event) => handleKronikFieldChange(item, 'meydanAdi', event.target.value)}
                                className="kronik-admin-item__input"
                              />
                            </label>

                            <label className="kronik-admin-item__field">
                              <span>Başvuru Geliş Tarihi</span>
                              <input
                                type="text"
                                value={draft.basvuruGelisTarihi}
                                onChange={(event) => handleKronikFieldChange(item, 'basvuruGelisTarihi', event.target.value)}
                                className="kronik-admin-item__input"
                              />
                            </label>

                            <label className="kronik-admin-item__field kronik-admin-item__field--full">
                              <span>Konu Başlığı</span>
                              <input
                                type="text"
                                value={draft.konuBasligi}
                                onChange={(event) => handleKronikFieldChange(item, 'konuBasligi', event.target.value)}
                                className="kronik-admin-item__input"
                              />
                            </label>

                            <label className="kronik-admin-item__field kronik-admin-item__field--full">
                              <span>Başvuru Açıklaması</span>
                              <textarea
                                value={draft.basvuruAciklamasi}
                                onChange={(event) => handleKronikFieldChange(item, 'basvuruAciklamasi', event.target.value)}
                                className="kronik-admin-item__textarea"
                              />
                            </label>
                          </div>

                          <div className="kronik-admin-item__details">
                            <div className="kronik-admin-item__details-head">
                              <strong>Ek Detay Alanları</strong>
                              <button className="btn btn-ghost btn-inline" type="button" onClick={() => handleAddDetailRow(item)}>
                                Detay Ekle
                              </button>
                            </div>

                            {(draft.detaylar || []).length ? (
                              <div className="kronik-admin-item__detail-list">
                                {(draft.detaylar || []).map((detail, index) => (
                                  <div key={`${item.id}-detail-edit-${index}`} className="kronik-admin-item__detail-row">
                                    <input
                                      type="text"
                                      value={detail.label}
                                      placeholder="Alan"
                                      onChange={(event) => handleKronikDetailChange(item, index, 'label', event.target.value)}
                                      className="kronik-admin-item__input"
                                    />
                                    <input
                                      type="text"
                                      value={detail.value}
                                      placeholder="Değer"
                                      onChange={(event) => handleKronikDetailChange(item, index, 'value', event.target.value)}
                                      className="kronik-admin-item__input"
                                    />
                                    <button className="btn btn-ghost btn-inline" type="button" onClick={() => handleRemoveDetailRow(item, index)}>
                                      Sil
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="kronik-admin-item__details-empty">Ek detay bulunmuyor.</p>
                            )}
                          </div>

                          <div className="kronik-admin-item__actions">
                            <button
                              className="btn btn-primary btn-inline"
                              type="button"
                              onClick={() => handleSaveKronik(item)}
                              disabled={isSaving}
                            >
                              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                            <button className="btn btn-ghost btn-inline" type="button" onClick={() => handleDeleteKronik(item)}>
                              Sil
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                {kronikSorunlar.length > initialVisibleAdminKronikCount ? (
                  <div className="show-more-row">
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => setShowAllAdminKronik((current) => !current)}
                    >
                      {showAllAdminKronik
                        ? 'Daha Az Göster'
                        : `Devamını Gör (${kronikSorunlar.length - initialVisibleAdminKronikCount} kayıt daha)`}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="empty-state">Düzenlenebilir kronik başvuru kaydı bulunmuyor.</div>
            )}
          </div>

          <div className="table-section">
            <div className="table-section__header">
              <h3>Son Eklenen Vardiyalar</h3>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Personel</th>
                    <th>Meydan</th>
                    <th>Tarih</th>
                    <th>Saat</th>
                    <th>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {recentShifts.slice(0, visibleShiftsCount).map((shift) => (
                    <tr key={shift.id}>
                      <td>{shift.personelAdi}</td>
                      <td>{meydanMap[shift.meydanId]?.isim || shift.meydanId}</td>
                      <td>{shift.tarih}</td>
                      <td>{shift.saatAraligi || '-'}</td>
                      <td>
                        <button className="btn btn-ghost btn-inline" type="button" onClick={() => handleDeleteShift(shift.id)}>
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!recentShifts.length ? (
                    <tr>
                      <td colSpan="5">Kayıt bulunmamaktadır.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {recentShifts.length > visibleShiftsCount ? (
              <div className="show-more-row">
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => setVisibleShiftsCount((prev) => prev + 10)}
                >
                  Daha Fazla Göster ({recentShifts.length - visibleShiftsCount} kayıt daha)
                </button>
              </div>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
