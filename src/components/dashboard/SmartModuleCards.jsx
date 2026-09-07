import React from 'react';
import {
  SparklesIcon,
  DocumentTextIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export default function SmartModuleCards({
  onOpenSmartSupport,
  onOpenSmartBriefing,
  className = '',
}) {
  return (
    <div className={`smart-module-cards ${className}`}>
      {/* 1. Akıllı Destek Card */}
      <div
        className="smart-card smart-card--support"
        onClick={onOpenSmartSupport}
        role="button"
        tabIndex={0}
      >
        <div className="smart-card__content">
          <div className="smart-card__header">
            <div className="smart-card__icon-badge smart-card__icon-badge--cyan">
              <SparklesIcon width={20} height={20} />
            </div>
            <h3 className="smart-card__title">Akıllı Destek</h3>
          </div>
          <p className="smart-card__desc">Saha operasyonlarınızda yanınızda</p>

          <div className="smart-card__action-circle">
            <ArrowRightIcon width={16} height={16} />
          </div>
        </div>

        {/* 3D Robot Mascot Visual */}
        <div className="smart-card__visual smart-card__visual--robot">
          <img
            src="/assets/dashboard/robot-assistant.jpg"
            alt="SYP Akıllı Asistan"
            className="smart-card__img"
          />
        </div>
      </div>

      {/* 2. Akıllı Brifing Card */}
      <div
        className="smart-card smart-card--briefing"
        onClick={onOpenSmartBriefing}
        role="button"
        tabIndex={0}
      >
        <div className="smart-card__content">
          <div className="smart-card__header">
            <div className="smart-card__icon-badge smart-card__icon-badge--blue">
              <DocumentTextIcon width={20} height={20} />
            </div>
            <h3 className="smart-card__title">Akıllı Brifing</h3>
          </div>
          <p className="smart-card__desc">Günün özeti, önemli bilgiler</p>

          <div className="smart-card__action-circle">
            <ArrowRightIcon width={16} height={16} />
          </div>
        </div>

        {/* Laptop Dashboard Visual */}
        <div className="smart-card__visual smart-card__visual--laptop">
          <img
            src="/assets/dashboard/laptop-briefing.jpg"
            alt="Yönetici Brifingi"
            className="smart-card__img"
          />
        </div>
      </div>
    </div>
  );
}
