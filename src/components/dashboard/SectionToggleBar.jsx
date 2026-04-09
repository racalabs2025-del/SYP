const SECTION_ITEMS = [
  {
    key: 'active-meydanlar',
    label: 'Aktif Meydanlar',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    key: 'meydan-yonetimi-grup',
    label: 'Meydan Yönetimi',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 10h6" />
        <path d="M9 14h6" />
      </svg>
    ),
  },
  {
    key: 'meydan-hakkinda',
    label: 'Meydan Yönetimi Hakkında',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
  {
    key: 'ziyaret-formu',
    label: 'Kurum Ziyaret Formu',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    key: 'faaliyet-raporlari',
    label: 'Faaliyet Raporları',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    key: 'personel-listesi',
    label: 'Personel Listesi',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: 'ai-icgoru',
    label: 'AI Desteği',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    key: 'kronik-sorunlar',
    label: 'Kronik Sorunlar',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  {
    key: 'istanbul-icin-calisiyoruz',
    label: 'İstanbul İçin Çalışıyoruz - 39 İlçede Yaptıklarımız',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2l7 4v6c0 5-3.5 9.5-7 10-3.5-.5-7-5-7-10V6l7-4z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    key: 'ibb-bilgi-hizmetleri',
    label: 'İBB Bilgi Hizmetleri',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 4h16v12H4z" />
        <path d="M8 20h8" />
        <path d="M12 16v4" />
      </svg>
    ),
  },
  {
    key: 'veri-yonetimi',
    label: 'Veri Yönetimi',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
  },
];

const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export function getSectionItem(itemKey) {
  return SECTION_ITEMS.find((section) => section.key === itemKey) || null;
}

export default function SectionToggleBar({ itemKey, isOpen, onToggle, children }) {
  const item = getSectionItem(itemKey);
  if (!item) {
    return null;
  }

  if (item.href) {
    return null;
  }

  return (
    <div className={`section-accordion-item${isOpen ? ' is-open' : ''}`}>
      <button
        type="button"
        className={`section-toggle-pill${isOpen ? ' is-active' : ''}`}
        aria-expanded={isOpen}
        onClick={() => onToggle(itemKey)}
      >
        <span className="section-toggle-pill__icon">{item.icon}</span>
        <span className="section-toggle-pill__label">{item.label}</span>
        <span className={`section-toggle-pill__chevron${isOpen ? ' is-open' : ''}`}>
          <ChevronIcon />
        </span>
      </button>

      <div className={`collapsible-section${isOpen ? ' is-open' : ''}`}>
        {children}
      </div>
    </div>
  );
}

export function SectionLinkBar({ itemKey, href }) {
  const item = getSectionItem(itemKey);
  if (!item || !href) {
    return null;
  }

  function handleClick(event) {
    event.preventDefault();

    const confirmed = window.confirm('Dış bir sayfaya yönlendirileceksiniz. Devam etmek istiyor musunuz?');
    if (!confirmed) {
      return;
    }

    window.open(href, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="section-accordion-item">
      <a
        className="section-toggle-pill section-toggle-pill--link"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
      >
        <span className="section-toggle-pill__icon">{item.icon}</span>
        <span className="section-toggle-pill__label">{item.label}</span>
        <span className="section-toggle-pill__chevron">
          <ChevronIcon />
        </span>
      </a>
    </div>
  );
}
