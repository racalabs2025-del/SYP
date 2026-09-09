import React from 'react';
import {
  SparklesIcon,
  DocumentTextIcon,
  ChartBarSquareIcon,
  ArrowRightIcon,
  MapPinIcon,
  BuildingLibraryIcon,
  DocumentDuplicateIcon,
  ChartBarIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

export default function ExecutiveModuleCards({
  onOpenSmartSupport,
  onOpenSmartBriefing,
  onOpenYonetimPaneli,
  onOpenMeydanYonetimi,
  onOpenIstanbulIcinCalisiyoruz,
  onOpenIbbBilgiHizmetleri,
  onOpenVeriYonetimi,
  className = '',
}) {
  return (
    <section className={`executive-modules-section ${className}`} aria-label="Akıllı Yönetim ve Karar Destek Modülleri">
      {/* ─── 1. ÜST GRUP: 3 ADET AKILLI VE KARAR DESTEK KARTI ─── */}
      <div className="exec-modules-hero-grid">
        {/* Kart 1: Akıllı Destek */}
        <div
          className="exec-smart-card exec-smart-card--support"
          onClick={onOpenSmartSupport}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenSmartSupport();
            }
          }}
        >
          <div className="exec-smart-card__content">
            <div>
              <div className="exec-smart-card__tag exec-smart-card__tag--cyan">
                <span className="exec-smart-card__badge-icon">
                  <SparklesIcon width={15} height={15} />
                </span>
                <span>YAPAY ZEKA ASİSTANI</span>
              </div>
              <h3 className="exec-smart-card__title">Akıllı Destek</h3>
              <p className="exec-smart-card__desc">
                Saha operasyonlarınızda yanınızda • Anlık yapay zeka rehberliği ve operasyonel sorgulama
              </p>
            </div>
            <div className="exec-smart-card__footer">
              <span className="exec-smart-card__action-text">Sohbeti Başlat</span>
              <div className="exec-smart-card__action-circle">
                <ArrowRightIcon width={15} height={15} />
              </div>
            </div>
          </div>
          <div className="exec-smart-card__visual">
            <img
              src="/assets/dashboard/robot-assistant.jpg"
              alt="Akıllı Saha Asistanı"
              className="exec-smart-card__img"
            />
          </div>
        </div>

        {/* Kart 2: Akıllı Brifing */}
        <div
          className="exec-smart-card exec-smart-card--briefing"
          onClick={onOpenSmartBriefing}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenSmartBriefing();
            }
          }}
        >
          <div className="exec-smart-card__content">
            <div>
              <div className="exec-smart-card__tag exec-smart-card__tag--blue">
                <span className="exec-smart-card__badge-icon">
                  <DocumentTextIcon width={15} height={15} />
                </span>
                <span>GÜNLÜK YÖNETİCİ BÜLTENİ</span>
              </div>
              <h3 className="exec-smart-card__title">Akıllı Brifing</h3>
              <p className="exec-smart-card__desc">
                Günün saha özeti, vardiya dengesi, kritik başvuru analizleri ve operasyonel tavsiyeler
              </p>
            </div>
            <div className="exec-smart-card__footer">
              <span className="exec-smart-card__action-text">Brifingi İncele</span>
              <div className="exec-smart-card__action-circle">
                <ArrowRightIcon width={15} height={15} />
              </div>
            </div>
          </div>
          <div className="exec-smart-card__visual">
            <img
              src="/assets/dashboard/laptop-briefing.jpg"
              alt="Yönetici Brifingi"
              className="exec-smart-card__img"
            />
          </div>
        </div>

        {/* Kart 3: Yönetim Paneli & Yönetici Özeti */}
        <div
          className="exec-smart-card exec-smart-card--management"
          onClick={onOpenYonetimPaneli}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenYonetimPaneli();
            }
          }}
        >
          <div className="exec-smart-card__content">
            <div>
              <div className="exec-smart-card__tag exec-smart-card__tag--gold">
                <span className="exec-smart-card__badge-icon">
                  <ChartBarSquareIcon width={15} height={15} />
                </span>
                <span>STRATEJİK YÖNETİM</span>
              </div>
              <h3 className="exec-smart-card__title">Yönetim Paneli & Yönetici Özeti</h3>
              <p className="exec-smart-card__desc">
                Saha KPI analizi, açık başvuru takibi, personel liderleri ve resmi PDF / Excel rapor ihracı
              </p>
            </div>
            <div className="exec-smart-card__footer">
              <span className="exec-smart-card__action-text">Yönetici Paneli</span>
              <div className="exec-smart-card__action-circle">
                <ArrowRightIcon width={15} height={15} />
              </div>
            </div>
          </div>
          <div className="exec-smart-card__visual">
            <img
              src="/login-scenes/cult/istiklal-tram.jpg"
              alt="Yönetim Paneli"
              className="exec-smart-card__img"
            />
          </div>
        </div>
      </div>

      {/* ─── 2. ALT GRUP: 4 ADET OPERASYONEL HİZMET VE VERİ YÖNETİMİ KARTI ─── */}
      <div className="exec-modules-services-grid">
        {/* Hizmet 1: Meydan Yönetimi */}
        <div
          className="exec-service-card"
          onClick={onOpenMeydanYonetimi}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenMeydanYonetimi();
            }
          }}
        >
          <div className="exec-service-card__left">
            <div className="exec-service-card__icon-badge exec-service-card__icon-badge--blue">
              <MapPinIcon width={20} height={20} />
            </div>
            <div className="exec-service-card__text">
              <strong className="exec-service-card__title">Meydan Yönetimi</strong>
              <span className="exec-service-card__desc">Birim görevleri & faaliyet raporları</span>
            </div>
          </div>
          <div className="exec-service-card__right">
            <div
              className="exec-service-card__thumb"
              style={{ backgroundImage: 'url(/login-scenes/cult/galata.jpg)' }}
              title="Meydan Yönetimi - Galata"
            />
            <ChevronRightIcon width={16} height={16} className="exec-service-card__arrow" />
          </div>
        </div>

        {/* Hizmet 2: İstanbul İçin Çalışıyoruz */}
        <div
          className="exec-service-card"
          onClick={onOpenIstanbulIcinCalisiyoruz}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenIstanbulIcinCalisiyoruz();
            }
          }}
        >
          <div className="exec-service-card__left">
            <div className="exec-service-card__icon-badge exec-service-card__icon-badge--cyan">
              <BuildingLibraryIcon width={20} height={20} />
            </div>
            <div className="exec-service-card__text">
              <strong className="exec-service-card__title">İstanbul İçin Çalışıyoruz</strong>
              <span className="exec-service-card__desc">39 ilçede kentsel projeler & meydanlar</span>
            </div>
          </div>
          <div className="exec-service-card__right">
            <div
              className="exec-service-card__thumb"
              style={{ backgroundImage: 'url(/login-scenes/cult/ortakoy.jpg)' }}
              title="İstanbul İçin Çalışıyoruz - Ortaköy"
            />
            <ChevronRightIcon width={16} height={16} className="exec-service-card__arrow" />
          </div>
        </div>

        {/* Hizmet 3: İBB Bilgi Hizmetleri */}
        <div
          className="exec-service-card"
          onClick={onOpenIbbBilgiHizmetleri}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenIbbBilgiHizmetleri();
            }
          }}
        >
          <div className="exec-service-card__left">
            <div className="exec-service-card__icon-badge exec-service-card__icon-badge--indigo">
              <DocumentDuplicateIcon width={20} height={20} />
            </div>
            <div className="exec-service-card__text">
              <strong className="exec-service-card__title">İBB Bilgi Hizmetleri</strong>
              <span className="exec-service-card__desc">Çözüm Merkezi 153 & iletişim noktaları</span>
            </div>
          </div>
          <div className="exec-service-card__right">
            <div
              className="exec-service-card__thumb"
              style={{ backgroundImage: 'url(/login-scenes/cult/tarihi-yarimada.jpg)' }}
              title="İBB Bilgi Hizmetleri - Tarihi Yarımada"
            />
            <ChevronRightIcon width={16} height={16} className="exec-service-card__arrow" />
          </div>
        </div>

        {/* Hizmet 4: Veri ve Sistem Yönetimi */}
        <div
          className="exec-service-card"
          onClick={onOpenVeriYonetimi}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenVeriYonetimi();
            }
          }}
        >
          <div className="exec-service-card__left">
            <div className="exec-service-card__icon-badge exec-service-card__icon-badge--emerald">
              <ChartBarIcon width={20} height={20} />
            </div>
            <div className="exec-service-card__text">
              <strong className="exec-service-card__title">Veri ve Sistem Yönetimi</strong>
              <span className="exec-service-card__desc">Vardiya, izin yükleme & admin paneli</span>
            </div>
          </div>
          <div className="exec-service-card__right">
            <div
              className="exec-service-card__thumb"
              style={{ backgroundImage: 'url(/login-scenes/cult/kiz-kulesi.jpg)' }}
              title="Veri ve Sistem Yönetimi - Kız Kulesi"
            />
            <ChevronRightIcon width={16} height={16} className="exec-service-card__arrow" />
          </div>
        </div>
      </div>
    </section>
  );
}
