import React from 'react';
import {
  MapPinIcon,
  BuildingLibraryIcon,
  DocumentDuplicateIcon,
  ChartBarIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

export default function QuickAccessGrid({
  onOpenMeydanYonetimi,
  onOpenIstanbulIcinCalisiyoruz,
  onOpenIbbBilgiHizmetleri,
  onOpenVeriYonetimi,
  className = '',
}) {
  return (
    <div className={`quick-access-container ${className}`}>
      {/* 2x2 Action Cards Grid (Ref Image 1 & 2) */}
      <div className="quick-access-grid">
        {/* 1. Meydan Yönetimi */}
        <div
          className="quick-card"
          onClick={onOpenMeydanYonetimi}
          role="button"
          tabIndex={0}
        >
          <div className="quick-card__left">
            <div className="quick-card__icon-wrap quick-card__icon-wrap--blue">
              <MapPinIcon width={18} height={18} />
            </div>
            <strong className="quick-card__title">Meydan Yönetimi</strong>
          </div>
          <div className="quick-card__right">
            <div
              className="quick-card__thumb"
              style={{ backgroundImage: 'url(/login-scenes/cult/galata.jpg)' }}
            />
            <ChevronRightIcon width={14} height={14} className="quick-card__arrow" />
          </div>
        </div>

        {/* 2. İstanbul için Çalışıyoruz */}
        <div
          className="quick-card"
          onClick={onOpenIstanbulIcinCalisiyoruz}
          role="button"
          tabIndex={0}
        >
          <div className="quick-card__left">
            <div className="quick-card__icon-wrap quick-card__icon-wrap--cyan">
              <BuildingLibraryIcon width={18} height={18} />
            </div>
            <strong className="quick-card__title">İstanbul için çalışıyoruz</strong>
          </div>
          <div className="quick-card__right">
            <div
              className="quick-card__thumb"
              style={{ backgroundImage: 'url(/login-scenes/cult/ortakoy.jpg)' }}
            />
            <ChevronRightIcon width={14} height={14} className="quick-card__arrow" />
          </div>
        </div>

        {/* 3. İBB Bilgi Hizmetleri */}
        <div
          className="quick-card"
          onClick={onOpenIbbBilgiHizmetleri}
          role="button"
          tabIndex={0}
        >
          <div className="quick-card__left">
            <div className="quick-card__icon-wrap quick-card__icon-wrap--indigo">
              <DocumentDuplicateIcon width={18} height={18} />
            </div>
            <strong className="quick-card__title">İBB Bilgi Hizmetleri</strong>
          </div>
          <div className="quick-card__right">
            <div
              className="quick-card__thumb"
              style={{ backgroundImage: 'url(/login-scenes/cult/tarihi-yarimada.jpg)' }}
            />
            <ChevronRightIcon width={14} height={14} className="quick-card__arrow" />
          </div>
        </div>

        {/* 4. Veri Yönetimi */}
        <div
          className="quick-card"
          onClick={onOpenVeriYonetimi}
          role="button"
          tabIndex={0}
        >
          <div className="quick-card__left">
            <div className="quick-card__icon-wrap quick-card__icon-wrap--emerald">
              <ChartBarIcon width={18} height={18} />
            </div>
            <strong className="quick-card__title">Veri Yönetimi</strong>
          </div>
          <div className="quick-card__right">
            <div
              className="quick-card__thumb"
              style={{ backgroundImage: 'url(/login-scenes/cult/istiklal-tram.jpg)' }}
            />
            <ChevronRightIcon width={14} height={14} className="quick-card__arrow" />
          </div>
        </div>
      </div>
    </div>
  );
}
