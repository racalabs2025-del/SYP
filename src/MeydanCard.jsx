import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MeydanCard.css';

export default function MeydanCard({ meydan, aktifSayisi, planliSayisi }) {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const infoRef = useRef(null);
  const plannedStatus = planliSayisi > 0 ? 'Plan var' : 'Plan yok';
  const activeStatus = aktifSayisi > 0 ? 'Sahada ekip var' : 'Sahada ekip yok';

  useEffect(() => {
    function handleClickOutside(event) {
      if (infoRef.current && !infoRef.current.contains(event.target)) {
        setShowPopup(false);
      }
    }

    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopup]);

  function openDetail() {
    navigate(`/meydan/${meydan.id}`);
  }

  function handleCardKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openDetail();
    }
  }

  function handleInfoClick(event) {
    event.stopPropagation();
    setShowPopup((current) => !current);
  }

  return (
    <article className="meydan-card" role="button" tabIndex={0} onClick={openDetail} onKeyDown={handleCardKeyDown}>
      <div className="meydan-title-row">
        <div className="meydan-title">{meydan.isim}</div>
        {meydan.tamAd ? (
          <div className="meydan-info" ref={infoRef}>
            <button
              className="meydan-info-icon"
              type="button"
              onClick={handleInfoClick}
              aria-label="Meydan bilgisini goster"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
            </button>
            {showPopup ? <div className="meydan-tooltip">{meydan.tamAd}</div> : null}
          </div>
        ) : null}
      </div>
      <div className="meydan-metrics">
        <div className="meydan-metric meydan-metric--planned">
          <span className="meydan-metric__label" title="Bugün meydanda görev alacak personel sayısı">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="3" />
              <line x1="16" y1="3" x2="16" y2="7" />
              <line x1="8" y1="3" x2="8" y2="7" />
              <line x1="3" y1="11" x2="21" y2="11" />
            </svg>
            Planlı
          </span>
          <div className="meydan-metric__value-wrap">
            <b>{planliSayisi}</b>
            <small>kişi</small>
          </div>
          <span className="meydan-metric__status">{plannedStatus}</span>
        </div>
        <div className="meydan-metric meydan-metric--active">
          <span className="meydan-metric__label" title="Şu an meydanda görevli personel sayısı">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="8" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
            Görevde
          </span>
          <div className="meydan-metric__value-wrap">
            <b>{aktifSayisi}</b>
            <small>kişi</small>
          </div>
          <span className="meydan-metric__status">{activeStatus}</span>
        </div>
      </div>
    </article>
  );
}
