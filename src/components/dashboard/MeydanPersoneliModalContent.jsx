import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserGroupIcon,
  ClockIcon,
  PhoneIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function MeydanPersoneliModalContent({
  selectedMeydan,
  todayShifts = [],
  meydanMap = {},
}) {
  const navigate = useNavigate();

  // Find matching shifts for selected meydan
  const meydanNameNorm = (selectedMeydan?.name || '').toLowerCase('tr-TR').replace(/\s+/g, '');
  const matchedShifts = todayShifts.filter((shift) => {
    const shiftMeydanName = (meydanMap[shift.meydanId]?.isim || shift.meydanId || '')
      .toLowerCase('tr-TR')
      .replace(/\s+/g, '');
    return (
      shiftMeydanName.includes(meydanNameNorm) ||
      meydanNameNorm.includes(shiftMeydanName) ||
      (selectedMeydan?.district && shiftMeydanName.includes(selectedMeydan.district.toLowerCase('tr-TR')))
    );
  });

  return (
    <div className="meydan-personeli-modal-wrap">
      {/* Header Info */}
      <div className="personeli-head-card">
        <div className="personeli-head-left">
          <div className="personeli-avatar-square" style={{ backgroundImage: `url(${selectedMeydan?.heroImage || '/assets/dashboard/kadikoy-boga.jpg'})` }} />
          <div>
            <h3 className="personeli-title">{selectedMeydan?.name || 'Kadıköy Meydanı'}</h3>
            <p className="personeli-subtitle">{selectedMeydan?.district || 'Kadıköy'}, İstanbul</p>
          </div>
        </div>

        <div className="personeli-stats-group">
          <div className="personeli-chip">
            <span>Bugünkü Vardiya</span>
            <strong>{matchedShifts.length} Personel</strong>
          </div>
        </div>
      </div>

      {/* Personnel List */}
      <div className="personeli-list-section">
        <h4 className="personeli-section-title">Sahada Görevli Personel Listesi</h4>
        {matchedShifts.length === 0 ? (
          <div className="personeli-empty-note">
            <UserGroupIcon width={36} height={36} className="personeli-empty-icon" />
            <p>Bu meydan için bugün henüz aktif veya planlı vardiya girişi bulunmamaktadır.</p>
            <small>Tüm 95 meydan sistemde kayıtlıdır. Vardiya planlaması Veri Yönetimi modülünden yüklenebilir.</small>
          </div>
        ) : (
          <div className="personeli-cards-grid">
            {matchedShifts.map((shift, idx) => (
              <div key={shift.id || idx} className="personeli-card">
                <div className="personeli-card-header">
                  <div className="personeli-badge-dot" />
                  <strong>{shift.personelAdi || 'Saha Personeli'}</strong>
                </div>
                <div className="personeli-card-details">
                  <div className="personeli-detail-row">
                    <ClockIcon width={14} height={14} />
                    <span>{shift.saatAraligi || '08:30 - 17:00'}</span>
                  </div>
                  <div className="personeli-detail-row">
                    <span className="personeli-tag">{shift.vardiyaTipi || 'Normal Vardiya'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Navigation Link */}
      <div className="personeli-modal-footer">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            if (selectedMeydan?.id) {
              navigate(`/meydan/${selectedMeydan.id}`);
            }
          }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <span>Meydan Detay Sayfasına Git</span>
          <ArrowTopRightOnSquareIcon width={16} height={16} />
        </button>
      </div>
    </div>
  );
}
