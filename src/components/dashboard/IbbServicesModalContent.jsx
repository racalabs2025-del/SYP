import React from 'react';
import {
  BuildingOfficeIcon,
  CheckBadgeIcon,
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export default function IbbServicesModalContent({ type = 'istanbul-calisiyoruz' }) {
  if (type === 'istanbul-calisiyoruz') {
    return (
      <div className="ibb-services-modal-content">
        <div className="ibb-services-hero">
          <div
            className="ibb-services-hero__bg"
            style={{ backgroundImage: 'url(/login-scenes/cult/ortakoy.jpg)' }}
          />
          <div className="ibb-services-hero__text">
            <span className="section-kicker" style={{ color: '#38bdf8' }}>16 Milyon İçin Çalışıyoruz</span>
            <h3>Daha Yaşanabilir, Yeşil ve Canlı Meydanlar</h3>
            <p>
              İstanbul genelinde 95 meydan ve odak noktasında yayalaştırma, çevre düzenleme, kentsel donatı ve altyapı iyileştirme çalışmaları kesintisiz devam ediyor.
            </p>
          </div>
        </div>

        <div className="ibb-projects-grid">
          <div className="ibb-project-card">
            <div
              className="ibb-project-thumb"
              style={{ backgroundImage: 'url(/assets/dashboard/kadikoy-boga.jpg)' }}
            />
            <div className="ibb-project-info">
              <strong>Kadıköy Meydanı & Rıhtım Yenileme</strong>
              <p>Yaya sirkülasyonu, sahil hattı entegrasyonu ve meydan düzenleme projesi.</p>
            </div>
          </div>

          <div className="ibb-project-card">
            <div
              className="ibb-project-thumb"
              style={{ backgroundImage: 'url(/assets/dashboard/taksim-square.jpg)' }}
            />
            <div className="ibb-project-info">
              <strong>Taksim Meydanı Kültür & Yeşil Kuşak</strong>
              <p>Cumhuriyet Anıtı çevresi, Gezi Parkı bağlantısı ve kentsel mobilya yenilemesi.</p>
            </div>
          </div>

          <div className="ibb-project-card">
            <div
              className="ibb-project-thumb"
              style={{ backgroundImage: 'url(/login-scenes/cult/galata.jpg)' }}
            />
            <div className="ibb-project-info">
              <strong>Tarihi Yarımada & Meydan Restorasyonları</strong>
              <p>Sultanahmet, Beyazıt ve Eminönü yaya odaklı meydan koruma projeleri.</p>
            </div>
          </div>
        </div>

        <div className="ibb-services-footer">
          <a
            href="https://istanbul.ekremimamoglu.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <span>Tüm Projeleri ve Çalışmaları İncele</span>
            <ArrowTopRightOnSquareIcon width={16} height={16} />
          </a>
        </div>
      </div>
    );
  }

  // İBB Bilgi Hizmetleri
  return (
    <div className="ibb-services-modal-content">
      <div className="ibb-services-hero">
        <div
          className="ibb-services-hero__bg"
          style={{ backgroundImage: 'url(/login-scenes/cult/tarihi-yarimada.jpg)' }}
        />
        <div className="ibb-services-hero__text">
          <span className="section-kicker" style={{ color: '#38bdf8' }}>İstanbul Büyükşehir Belediyesi</span>
          <h3>Kurumsal Bilgi ve Vatandaş İletişim Hizmetleri</h3>
          <p>
            Saha Yönetim Paneli, 153 Çözüm Merkezi ve İBB dijital altyapısıyla entegre şekilde saha taleplerini ve meydan durumlarını yönetir.
          </p>
        </div>
      </div>

      <div className="ibb-services-points-grid">
        <div className="ibb-service-point-card">
          <div className="ibb-point-icon">
            <InformationCircleIcon width={22} height={22} />
          </div>
          <div>
            <strong>153 İstanbul Çözüm Merkezi</strong>
            <p>7/24 vatandaş başvuru kabulü, saha ekiplerine anlık yönlendirme ve takip.</p>
          </div>
        </div>

        <div className="ibb-service-point-card">
          <div className="ibb-point-icon">
            <BuildingOfficeIcon width={22} height={22} />
          </div>
          <div>
            <strong>Meydan İletişim & Çözüm Noktaları</strong>
            <p>95 ana meydanda vatandaşların yüz yüze destek alabildiği hizmet noktaları.</p>
          </div>
        </div>

        <div className="ibb-service-point-card">
          <div className="ibb-point-icon">
            <CheckBadgeIcon width={22} height={22} />
          </div>
          <div>
            <strong>İstanbul Senin Entegrasyonu</strong>
            <p>Mobil uygulama üzerinden anlık meydan duyuruları, etkinlikler ve bildirimler.</p>
          </div>
        </div>
      </div>

      <div className="ibb-services-footer">
        <a
          href="https://ibb.istanbul/tum-hizmetler/bilgi-hizmetleri"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <span>İBB Bilgi Hizmetleri Portalına Git</span>
          <ArrowTopRightOnSquareIcon width={16} height={16} />
        </a>
      </div>
    </div>
  );
}
