import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserGroupIcon,
  ClockIcon,
  PhoneIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

export default function MeydanPersoneliModalContent({
  selectedMeydan,
  todayShifts = [],
  meydanMap = {},
  activeDateKey = '',
}) {
  const navigate = useNavigate();

  // Find matching shifts for selected meydan
  const staffList = useMemo(() => {
    if (!selectedMeydan) return [];

    if (todayShifts && todayShifts.length > 0) {
      const matched = todayShifts.filter((shift) => {
        if (shift.isLeave) return false;
        if (selectedMeydan.rawVariants && shift.rawLocation && selectedMeydan.rawVariants.some((v) => v.toLowerCase().trim() === shift.rawLocation.toLowerCase().trim())) {
          return true;
        }
        if (shift.rawLocation && (shift.rawLocation.toLowerCase().includes(selectedMeydan.name.toLowerCase()) || selectedMeydan.name.toLowerCase().includes(shift.rawLocation.toLowerCase()))) {
          return true;
        }
        if (selectedMeydan.personnel && shift.personelAdi && selectedMeydan.personnel.some((p) => p.toLowerCase().trim() === shift.personelAdi.toLowerCase().trim())) {
          return true;
        }
        return false;
      });

      if (matched.length > 0) {
        return matched.map((s, idx) => ({
          id: s.id || `shift-${idx}`,
          personelAdi: s.personelAdi,
          saatAraligi: s.saatAraligi || '10:00 - 18:30',
          vardiyaTipi: s.vardiyaTipi || 'Tam Gün',
          rawLocation: s.rawLocation || selectedMeydan.name,
          isLive: true,
        }));
      }
    }

    // Fallback to designated personnel from vardiya dataset
    if (selectedMeydan.personnel && selectedMeydan.personnel.length > 0) {
      return selectedMeydan.personnel.map((name, idx) => ({
        id: `person-${idx}`,
        personelAdi: name,
        saatAraligi: '10:00 - 18:30',
        vardiyaTipi: 'Planlı Saha Görevi',
        rawLocation: selectedMeydan.name,
        isLive: false,
      }));
    }

    return [];
  }, [selectedMeydan, todayShifts]);

  return (
    <div className="meydan-personeli-modal-wrap">
      {/* Header Info */}
      <div className="personeli-head-card">
        <div className="personeli-head-left">
          <div
            className="personeli-avatar-square"
            style={{ backgroundImage: `url(${selectedMeydan?.heroImage || '/assets/dashboard/kadikoy-boga.jpg'})` }}
          />
          <div>
            <h3 className="personeli-title">{selectedMeydan?.name || 'Kadıköy Meydanı'}</h3>
            <p className="personeli-subtitle">{selectedMeydan?.subtitle || `${selectedMeydan?.district || 'Kadıköy'}, İstanbul`}</p>
          </div>
        </div>

        <div className="personeli-stats-group">
          <div className="personeli-chip">
            <span>{activeDateKey ? `${activeDateKey} Vardiyası` : 'Görevli Personel'}</span>
            <strong>{staffList.length} Personel</strong>
          </div>
        </div>
      </div>

      {/* Personnel List */}
      <div className="personeli-list-section">
        <div className="personeli-section-head">
          <h4 className="personeli-section-title">Sahada Görevli Personel Listesi</h4>
          <span className="personeli-badge-sub">Eylül 2026 Vardiya Dağılımı</span>
        </div>

        {staffList.length === 0 ? (
          <div className="personeli-empty-note">
            <UserGroupIcon width={36} height={36} className="personeli-empty-icon" />
            <p>Bu meydan için aktif görevli personel bulunamadı.</p>
          </div>
        ) : (
          <div className="personeli-cards-grid">
            {staffList.map((person) => (
              <div
                key={person.id}
                className="personeli-card personeli-card--interactive"
                onClick={() => navigate(`/personel/${encodeURIComponent(person.personelAdi)}`)}
                title="Personel detaylarını görüntüle"
              >
                <div className="personeli-card-header">
                  <div className="personeli-badge-dot" />
                  <strong>{person.personelAdi}</strong>
                  <ArrowTopRightOnSquareIcon width={13} height={13} className="personeli-link-icon" />
                </div>
                <div className="personeli-card-details">
                  <div className="personeli-detail-row">
                    <ClockIcon width={14} height={14} />
                    <span>{person.saatAraligi}</span>
                  </div>
                  <div className="personeli-detail-row">
                    <span className="personeli-tag">{person.vardiyaTipi}</span>
                    <span className="personeli-tag personeli-tag--active">Görevde</span>
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
