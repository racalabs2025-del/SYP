/**
 * Canonical 95 Meydan Dataset for SYP Executive Dashboard
 * 48 Anadolu Yakası + 47 Avrupa Yakası = 95 Meydan
 */

export const ANADOLU_DISTRICTS = [
  {
    id: 'kadikoy',
    name: 'Kadıköy',
    count: 8,
    meydanlar: [
      {
        id: 'kadikoy-meydani',
        name: 'Kadıköy Meydanı',
        district: 'Kadıköy',
        yaka: 'anadolu',
        tagline: 'İstanbul Hepimizin',
        subtitle: 'Kadıköy, İstanbul',
        heroImage: '/assets/dashboard/kadikoy-boga.jpg',
        landmarks: [
          { id: 'iskele', name: 'İskele', img: '/assets/dashboard/kadikoy-iskele.jpg' },
          { id: 'boga', name: 'Boğa Heykeli', img: '/assets/dashboard/kadikoy-boga.jpg' },
          { id: 'genel', name: 'Meydan Genel', img: '/login-scenes/cult/kiz-kulesi.jpg' },
          { id: 'sahil', name: 'Sahil Hattı', img: '/login-scenes/cult/ortakoy.jpg' },
        ],
      },
      { id: 'moda-meydani', name: 'Moda Meydanı', district: 'Kadıköy', yaka: 'anadolu', heroImage: '/login-scenes/cult/kiz-kulesi.jpg' },
      { id: 'bahariye-meydani', name: 'Bahariye Meydanı', district: 'Kadıköy', yaka: 'anadolu', heroImage: '/login-scenes/cult/istiklal-tram.jpg' },
      { id: 'fenerbahce-meydani', name: 'Fenerbahçe Meydanı', district: 'Kadıköy', yaka: 'anadolu', heroImage: '/login-scenes/cult/galata.jpg' },
      { id: 'goztepe-meydani', name: 'Göztepe Meydanı', district: 'Kadıköy', yaka: 'anadolu', heroImage: '/login-scenes/cult/tarihi-yarimada.jpg' },
      { id: 'bostanci-meydani', name: 'Bostancı Meydanı', district: 'Kadıköy', yaka: 'anadolu', heroImage: '/assets/dashboard/kadikoy-iskele.jpg' },
      { id: 'kozyatagi-meydani', name: 'Kozyatağı Meydanı', district: 'Kadıköy', yaka: 'anadolu', heroImage: '/login-scenes/cult/ortakoy.jpg' },
      { id: 'suadiye-meydani', name: 'Suadiye Meydanı', district: 'Kadıköy', yaka: 'anadolu', heroImage: '/login-scenes/cult/kiz-kulesi.jpg' },
    ],
  },
  {
    id: 'uskudar',
    name: 'Üsküdar',
    count: 7,
    meydanlar: [
      {
        id: 'uskudar-mimar-sinan',
        name: 'Üsküdar Mimar Sinan Meydanı',
        district: 'Üsküdar',
        yaka: 'anadolu',
        tagline: 'Tarih ve Boğaz Buluşması',
        subtitle: 'Üsküdar, İstanbul',
        heroImage: '/login-scenes/cult/kiz-kulesi.jpg',
        landmarks: [
          { id: 'kizkulesi', name: 'Kız Kulesi', img: '/login-scenes/cult/kiz-kulesi.jpg' },
          { id: 'camii', name: 'Mihrimah Sultan', img: '/login-scenes/cult/tarihi-yarimada.jpg' },
          { id: 'iskele', name: 'Üsküdar İskele', img: '/assets/dashboard/kadikoy-iskele.jpg' },
          { id: 'sahil', name: 'Salacak Sahili', img: '/login-scenes/cult/ortakoy.jpg' },
        ],
      },
      { id: 'uskudar-meydani', name: 'Üsküdar Meydanı', district: 'Üsküdar', yaka: 'anadolu', heroImage: '/login-scenes/cult/kiz-kulesi.jpg' },
      { id: 'salacak-sahil', name: 'Salacak Sahil Meydanı', district: 'Üsküdar', yaka: 'anadolu', heroImage: '/login-scenes/cult/kiz-kulesi.jpg' },
      { id: 'kuzguncuk-meydani', name: 'Kuzguncuk Meydanı', district: 'Üsküdar', yaka: 'anadolu', heroImage: '/login-scenes/cult/ortakoy.jpg' },
      { id: 'camlica-meydani', name: 'Çamlıca Meydanı', district: 'Üsküdar', yaka: 'anadolu', heroImage: '/login-scenes/cult/galata.jpg' },
      { id: 'beylerbeyi-meydani', name: 'Beylerbeyi Meydanı', district: 'Üsküdar', yaka: 'anadolu', heroImage: '/login-scenes/cult/ortakoy.jpg' },
      { id: 'kandilli-meydani', name: 'Kandilli Meydanı', district: 'Üsküdar', yaka: 'anadolu', heroImage: '/login-scenes/cult/tarihi-yarimada.jpg' },
    ],
  },
  {
    id: 'atasehir',
    name: 'Ataşehir',
    count: 6,
    meydanlar: [
      { id: 'atasehir-cumhuriyet', name: 'Ataşehir Cumhuriyet Meydanı', district: 'Ataşehir', yaka: 'anadolu', heroImage: '/login-scenes/cult/galata.jpg' },
      { id: 'icerenkoy-meydani', name: 'İçerenköy Meydanı', district: 'Ataşehir', yaka: 'anadolu', heroImage: '/login-scenes/cult/tarihi-yarimada.jpg' },
      { id: 'kucukbakkalkoy-meydani', name: 'Küçükbakkalköy Meydanı', district: 'Ataşehir', yaka: 'anadolu', heroImage: '/login-scenes/cult/kiz-kulesi.jpg' },
      { id: 'kayisdagi-meydani', name: 'Kayışdağı Meydanı', district: 'Ataşehir', yaka: 'anadolu', heroImage: '/assets/dashboard/kadikoy-boga.jpg' },
      { id: 'ornek-meydani', name: 'Örnek Meydanı', district: 'Ataşehir', yaka: 'anadolu', heroImage: '/login-scenes/cult/ortakoy.jpg' },
      { id: 'ferhatpasa-meydani', name: 'Ferhatpaşa Meydanı', district: 'Ataşehir', yaka: 'anadolu', heroImage: '/login-scenes/cult/istiklal-tram.jpg' },
    ],
  },
  {
    id: 'maltepe',
    name: 'Maltepe',
    count: 6,
    meydanlar: [
      { id: 'maltepe-sahil', name: 'Maltepe Sahil Etkinlik Meydanı', district: 'Maltepe', yaka: 'anadolu', heroImage: '/login-scenes/cult/kiz-kulesi.jpg' },
      { id: 'maltepe-merkez', name: 'Maltepe Merkez Meydanı', district: 'Maltepe', yaka: 'anadolu', heroImage: '/assets/dashboard/kadikoy-boga.jpg' },
      { id: 'kucukyali-meydani', name: 'Küçükyalı Meydanı', district: 'Maltepe', yaka: 'anadolu', heroImage: '/login-scenes/cult/galata.jpg' },
      { id: 'idealtepe-meydani', name: 'İdealtepe Meydanı', district: 'Maltepe', yaka: 'anadolu', heroImage: '/assets/dashboard/kadikoy-iskele.jpg' },
      { id: 'gulsuyu-meydani', name: 'Gülsuyu Meydanı', district: 'Maltepe', yaka: 'anadolu', heroImage: '/login-scenes/cult/tarihi-yarimada.jpg' },
      { id: 'zumrutevler-meydani', name: 'Zümrütevler Meydanı', district: 'Maltepe', yaka: 'anadolu', heroImage: '/login-scenes/cult/ortakoy.jpg' },
    ],
  },
  {
    id: 'kartal',
    name: 'Kartal',
    count: 5,
    meydanlar: [
      { id: 'kartal-meydani', name: 'Kartal Meydanı', district: 'Kartal', yaka: 'anadolu', heroImage: '/login-scenes/cult/ortakoy.jpg' },
      { id: 'yakacik-meydani', name: 'Yakacık Meydanı', district: 'Kartal', yaka: 'anadolu', heroImage: '/login-scenes/cult/galata.jpg' },
      { id: 'soganlik-meydani', name: 'Soğanlık Meydanı', district: 'Kartal', yaka: 'anadolu', heroImage: '/login-scenes/cult/tarihi-yarimada.jpg' },
      { id: 'ugur-mumcu-meydani', name: 'Uğur Mumcu Meydanı', district: 'Kartal', yaka: 'anadolu', heroImage: '/assets/dashboard/kadikoy-boga.jpg' },
      { id: 'cevizli-meydani', name: 'Cevizli Meydanı', district: 'Kartal', yaka: 'anadolu', heroImage: '/assets/dashboard/kadikoy-iskele.jpg' },
    ],
  },
  {
    id: 'pendik',
    name: 'Pendik',
    count: 4,
    meydanlar: [
      { id: 'pendik-sahil', name: 'Pendik Sahil Meydanı', district: 'Pendik', yaka: 'anadolu', heroImage: '/login-scenes/cult/kiz-kulesi.jpg' },
      { id: 'pendik-carsi', name: 'Pendik Çarşı Meydanı', district: 'Pendik', yaka: 'anadolu', heroImage: '/assets/dashboard/kadikoy-boga.jpg' },
      { id: 'kaynarca-meydani', name: 'Kaynarca Meydanı', district: 'Pendik', yaka: 'anadolu', heroImage: '/login-scenes/cult/galata.jpg' },
      { id: 'kurtkoy-meydani', name: 'Kurtköy Meydanı', district: 'Pendik', yaka: 'anadolu', heroImage: '/login-scenes/cult/ortakoy.jpg' },
    ],
  },
  {
    id: 'tuzla',
    name: 'Tuzla',
    count: 4,
    meydanlar: [
      { id: 'tuzla-sahil', name: 'Tuzla Sahil Tören Alanı', district: 'Tuzla', yaka: 'anadolu', heroImage: '/login-scenes/cult/ortakoy.jpg' },
      { id: 'icmeler-meydani', name: 'İçmeler Meydanı', district: 'Tuzla', yaka: 'anadolu', heroImage: '/login-scenes/cult/kiz-kulesi.jpg' },
      { id: 'aydinli-meydani', name: 'Aydınlı Meydanı', district: 'Tuzla', yaka: 'anadolu', heroImage: '/assets/dashboard/kadikoy-boga.jpg' },
      { id: 'yayla-meydani', name: 'Yayla Meydanı', district: 'Tuzla', yaka: 'anadolu', heroImage: '/login-scenes/cult/tarihi-yarimada.jpg' },
    ],
  },
  {
    id: 'sancaktepe',
    name: 'Sancaktepe',
    count: 3,
    meydanlar: [
      { id: 'sancaktepe-kent', name: 'Sancaktepe Kent Meydanı', district: 'Sancaktepe', yaka: 'anadolu', heroImage: '/login-scenes/cult/galata.jpg' },
      { id: 'samandira-meydani', name: 'Samandıra Meydanı', district: 'Sancaktepe', yaka: 'anadolu', heroImage: '/login-scenes/cult/istiklal-tram.jpg' },
      { id: 'sarigazi-meydani', name: 'Sarıgazi Meydanı', district: 'Sancaktepe', yaka: 'anadolu', heroImage: '/assets/dashboard/kadikoy-boga.jpg' },
    ],
  },
  {
    id: 'sultanbeyli',
    name: 'Sultanbeyli',
    count: 3,
    meydanlar: [
      { id: 'sultanbeyli-kent', name: 'Sultanbeyli Kent Meydanı', district: 'Sultanbeyli', yaka: 'anadolu', heroImage: '/login-scenes/cult/ortakoy.jpg' },
      { id: 'hasanpasa-meydani', name: 'Hasanpaşa Meydanı', district: 'Sultanbeyli', yaka: 'anadolu', heroImage: '/login-scenes/cult/kiz-kulesi.jpg' },
      { id: 'battalgazi-meydani', name: 'Battalgazi Meydanı', district: 'Sultanbeyli', yaka: 'anadolu', heroImage: '/login-scenes/cult/tarihi-yarimada.jpg' },
    ],
  },
  {
    id: 'cekmekoy',
    name: 'Çekmeköy',
    count: 2,
    meydanlar: [
      { id: 'cekmekoy-meydani', name: 'Çekmeköy Meydanı', district: 'Çekmeköy', yaka: 'anadolu', heroImage: '/login-scenes/cult/galata.jpg' },
      { id: 'tasdelen-meydani', name: 'Taşdelen Meydanı', district: 'Çekmeköy', yaka: 'anadolu', heroImage: '/login-scenes/cult/ortakoy.jpg' },
    ],
  },
];

export const AVRUPA_DISTRICTS = [
  {
    id: 'beyoglu',
    name: 'Beyoğlu',
    count: 5,
    meydanlar: [
      {
        id: 'taksim-meydani',
        name: 'Taksim Meydanı',
        district: 'Beyoğlu',
        yaka: 'avrupa',
        tagline: 'İstanbul\'un Kalbi',
        subtitle: 'Beyoğlu, İstanbul',
        heroImage: '/assets/dashboard/taksim-square.jpg',
        landmarks: [
          { id: 'anit', name: 'Cumhuriyet Anıtı', img: '/assets/dashboard/taksim-square.jpg' },
          { id: 'tramvay', name: 'Nostaljik Tramvay', img: '/login-scenes/cult/istiklal-tram.jpg' },
          { id: 'galata', name: 'Galata Kulesi', img: '/login-scenes/cult/galata.jpg' },
          { id: 'gezi', name: 'Gezi Parkı', img: '/login-scenes/cult/ortakoy.jpg' },
        ],
      },
      { id: 'istiklal-meydani', name: 'İstiklal Meydanı', district: 'Beyoğlu', yaka: 'avrupa', heroImage: '/login-scenes/cult/istiklal-tram.jpg' },
      { id: 'tunel-meydani', name: 'Tünel Meydanı', district: 'Beyoğlu', yaka: 'avrupa', heroImage: '/login-scenes/cult/galata.jpg' },
      { id: 'kasimpasa-meydani', name: 'Kasımpaşa Meydanı', district: 'Beyoğlu', yaka: 'avrupa', heroImage: '/login-scenes/cult/tarihi-yarimada.jpg' },
      { id: 'piyalepasa-meydani', name: 'Piyalepaşa Meydanı', district: 'Beyoğlu', yaka: 'avrupa', heroImage: '/login-scenes/cult/ortakoy.jpg' },
    ],
  },
  {
    id: 'besiktas',
    name: 'Beşiktaş',
    count: 5,
    meydanlar: [
      {
        id: 'besiktas-barbaros',
        name: 'Beşiktaş Barbaros Meydanı',
        district: 'Beşiktaş',
        yaka: 'avrupa',
        tagline: 'Boğazın İncisi',
        subtitle: 'Beşiktaş, İstanbul',
        heroImage: '/login-scenes/cult/ortakoy.jpg',
        landmarks: [
          { id: 'ortakoy', name: 'Ortaköy Camii', img: '/login-scenes/cult/ortakoy.jpg' },
          { id: 'kopru', name: 'Boğaziçi Köprüsü', img: '/login-scenes/cult/ortakoy.jpg' },
          { id: 'iskele', name: 'Beşiktaş İskele', img: '/assets/dashboard/kadikoy-iskele.jpg' },
          { id: 'saray', name: 'Dolmabahçe', img: '/login-scenes/cult/tarihi-yarimada.jpg' },
        ],
      },
      { id: 'ortakoy-meydani', name: 'Ortaköy Meydanı', district: 'Beşiktaş', yaka: 'avrupa', heroImage: '/login-scenes/cult/ortakoy.jpg' },
      { id: 'besiktas-iskele', name: 'Beşiktaş İskele Meydanı', district: 'Beşiktaş', yaka: 'avrupa', heroImage: '/assets/dashboard/kadikoy-iskele.jpg' },
      { id: 'koyici-meydani', name: 'Köyiçi Meydanı', district: 'Beşiktaş', yaka: 'avrupa', heroImage: '/assets/dashboard/kadikoy-boga.jpg' },
      { id: 'levent-meydani', name: 'Levent Meydanı', district: 'Beşiktaş', yaka: 'avrupa', heroImage: '/login-scenes/cult/galata.jpg' },
    ],
  },
  {
    id: 'fatih',
    name: 'Fatih',
    count: 6,
    meydanlar: [
      {
        id: 'sultanahmet-meydani',
        name: 'Sultanahmet Meydanı',
        district: 'Fatih',
        yaka: 'avrupa',
        tagline: 'Tarihin Buluşma Noktası',
        subtitle: 'Fatih, İstanbul',
        heroImage: '/login-scenes/cult/tarihi-yarimada.jpg',
        landmarks: [
          { id: 'ayasofya', name: 'Ayasofya-i Kebir', img: '/login-scenes/cult/tarihi-yarimada.jpg' },
          { id: 'dikilitas', name: 'Dikilitaş', img: '/login-scenes/cult/galata.jpg' },
          { id: 'sultanahmet-camii', name: 'Mavi Cami', img: '/login-scenes/cult/tarihi-yarimada.jpg' },
          { id: 'havuz', name: 'Meydan Havuzu', img: '/login-scenes/cult/ortakoy.jpg' },
        ],
      },
      { id: 'eminonu-meydani', name: 'Eminönü Meydanı', district: 'Fatih', yaka: 'avrupa', heroImage: '/login-scenes/cult/tarihi-yarimada.jpg' },
      { id: 'beyazit-meydani', name: 'Beyazıt Meydanı', district: 'Fatih', yaka: 'avrupa', heroImage: '/login-scenes/cult/galata.jpg' },
      { id: 'aksaray-meydani', name: 'Aksaray Meydanı', district: 'Fatih', yaka: 'avrupa', heroImage: '/assets/dashboard/kadikoy-boga.jpg' },
      { id: 'cemberlitas-meydani', name: 'Çemberlitaş Meydanı', district: 'Fatih', yaka: 'avrupa', heroImage: '/login-scenes/cult/istiklal-tram.jpg' },
      { id: 'sirkeci-meydani', name: 'Sirkeci Meydanı', district: 'Fatih', yaka: 'avrupa', heroImage: '/assets/dashboard/kadikoy-iskele.jpg' },
    ],
  },
  {
    id: 'bakirkoy',
    name: 'Bakırköy',
    count: 4,
    meydanlar: [
      { id: 'bakirkoy-ozgurluk', name: 'Bakırköy Özgürlük Meydanı', district: 'Bakırköy', yaka: 'avrupa', heroImage: '/assets/dashboard/taksim-square.jpg' },
      { id: 'bakirkoy-cumhuriyet', name: 'Bakırköy Cumhuriyet Meydanı', district: 'Bakırköy', yaka: 'avrupa', heroImage: '/login-scenes/cult/galata.jpg' },
      { id: 'yesilkoy-meydani', name: 'Yeşilköy Sahil Meydanı', district: 'Bakırköy', yaka: 'avrupa', heroImage: '/login-scenes/cult/kiz-kulesi.jpg' },
      { id: 'florya-meydani', name: 'Florya Meydanı', district: 'Bakırköy', yaka: 'avrupa', heroImage: '/login-scenes/cult/ortakoy.jpg' },
    ],
  },
  {
    id: 'sisli',
    name: 'Şişli',
    count: 4,
    meydanlar: [
      { id: 'mecidiyekoy-meydani', name: 'Mecidiyeköy Meydanı', district: 'Şişli', yaka: 'avrupa', heroImage: '/login-scenes/cult/galata.jpg' },
      { id: 'nisantasi-meydani', name: 'Nişantaşı Meydanı', district: 'Şişli', yaka: 'avrupa', heroImage: '/assets/dashboard/taksim-square.jpg' },
      { id: 'pangalti-meydani', name: 'Pangaltı Meydanı', district: 'Şişli', yaka: 'avrupa', heroImage: '/login-scenes/cult/istiklal-tram.jpg' },
      { id: 'okmeydani-meydani', name: 'Okmeydanı Meydanı', district: 'Şişli', yaka: 'avrupa', heroImage: '/assets/dashboard/kadikoy-boga.jpg' },
    ],
  },
  {
    id: 'bagcilar',
    name: 'Bağcılar',
    count: 4,
    meydanlar: [
      { id: 'bagcilar-15-temmuz', name: '15 Temmuz Demokrasi Meydanı (Bağcılar)', district: 'Bağcılar', yaka: 'avrupa', heroImage: '/assets/dashboard/taksim-square.jpg' },
      { id: 'bagcilar-ebubekir', name: 'Bağcılar Ebubekir Meydanı', district: 'Bağcılar', yaka: 'avrupa', heroImage: '/login-scenes/cult/galata.jpg' },
      { id: 'gunesli-meydani', name: 'Güneşli Meydanı', district: 'Bağcılar', yaka: 'avrupa', heroImage: '/login-scenes/cult/ortakoy.jpg' },
      { id: 'kirazli-meydani', name: 'Kirazlı Meydanı', district: 'Bağcılar', yaka: 'avrupa', heroImage: '/assets/dashboard/kadikoy-boga.jpg' },
    ],
  },
  {
    id: 'bahcelievler',
    name: 'Bahçelievler',
    count: 3,
    meydanlar: [
      { id: 'sirinevler-meydani', name: 'Bahçelievler Şirinevler Meydanı', district: 'Bahçelievler', yaka: 'avrupa', heroImage: '/assets/dashboard/taksim-square.jpg' },
      { id: 'yenibosna-meydani', name: 'Yenibosna Meydanı', district: 'Bahçelievler', yaka: 'avrupa', heroImage: '/login-scenes/cult/galata.jpg' },
      { id: 'yayla-bahcelievler', name: 'Yayla Meydanı', district: 'Bahçelievler', yaka: 'avrupa', heroImage: '/login-scenes/cult/tarihi-yarimada.jpg' },
    ],
  },
  {
    id: 'esenyurt',
    name: 'Esenyurt',
    count: 4,
    meydanlar: [
      { id: 'esenyurt-cumhuriyet', name: 'Esenyurt Cumhuriyet Meydanı', district: 'Esenyurt', yaka: 'avrupa', heroImage: '/assets/dashboard/taksim-square.jpg' },
      { id: 'mehtercesme-meydani', name: 'Mehterçeşme Meydanı', district: 'Esenyurt', yaka: 'avrupa', heroImage: '/login-scenes/cult/galata.jpg' },
      { id: 'kirac-meydani', name: 'Kıraç Meydanı', district: 'Esenyurt', yaka: 'avrupa', heroImage: '/login-scenes/cult/ortakoy.jpg' },
      { id: 'saadetdere-meydani', name: 'Saadetdere Meydanı', district: 'Esenyurt', yaka: 'avrupa', heroImage: '/assets/dashboard/kadikoy-boga.jpg' },
    ],
  },
  {
    id: 'beylikduzu',
    name: 'Beylikdüzü',
    count: 3,
    meydanlar: [
      { id: 'beylikduzu-yasam-vadisi', name: 'Beylikdüzü Yaşam Vadisi Cumhuriyet Meydanı', district: 'Beylikdüzü', yaka: 'avrupa', heroImage: '/assets/dashboard/taksim-square.jpg' },
      { id: 'beykent-meydani', name: 'Beykent Meydanı', district: 'Beylikdüzü', yaka: 'avrupa', heroImage: '/login-scenes/cult/galata.jpg' },
      { id: 'gurpinar-sahil', name: 'Gürpınar Sahil Meydanı', district: 'Beylikdüzü', yaka: 'avrupa', heroImage: '/login-scenes/cult/kiz-kulesi.jpg' },
    ],
  },
  {
    id: 'sariyer',
    name: 'Sarıyer',
    count: 3,
    meydanlar: [
      { id: 'sariyer-merkez', name: 'Sarıyer Merkez Meydanı', district: 'Sarıyer', yaka: 'avrupa', heroImage: '/login-scenes/cult/ortakoy.jpg' },
      { id: 'tarabya-meydani', name: 'Tarabya Meydanı', district: 'Sarıyer', yaka: 'avrupa', heroImage: '/login-scenes/cult/kiz-kulesi.jpg' },
      { id: 'istinye-meydani', name: 'İstinye Meydanı', district: 'Sarıyer', yaka: 'avrupa', heroImage: '/assets/dashboard/kadikoy-iskele.jpg' },
    ],
  },
  {
    id: 'eyupsultan',
    name: 'Eyüpsultan',
    count: 3,
    meydanlar: [
      { id: 'eyupsultan-meydani', name: 'Eyüpsultan Meydanı', district: 'Eyüpsultan', yaka: 'avrupa', heroImage: '/login-scenes/cult/tarihi-yarimada.jpg' },
      { id: 'alibeykoy-meydani', name: 'Alibeyköy Meydanı', district: 'Eyüpsultan', yaka: 'avrupa', heroImage: '/login-scenes/cult/galata.jpg' },
      { id: 'gokturk-meydani', name: 'Göktürk Meydanı', district: 'Eyüpsultan', yaka: 'avrupa', heroImage: '/assets/dashboard/kadikoy-boga.jpg' },
    ],
  },
  {
    id: 'gaziosmanpasa',
    name: 'Gaziosmanpaşa',
    count: 3,
    meydanlar: [
      { id: 'gaziosmanpasa-meydani', name: 'Gaziosmanpaşa Meydanı', district: 'Gaziosmanpaşa', yaka: 'avrupa', heroImage: '/assets/dashboard/taksim-square.jpg' },
      { id: 'kucukkoy-meydani', name: 'Küçükköy Meydanı', district: 'Gaziosmanpaşa', yaka: 'avrupa', heroImage: '/login-scenes/cult/galata.jpg' },
      { id: 'yildiztabya-meydani', name: 'Yıldıztabya Meydanı', district: 'Gaziosmanpaşa', yaka: 'avrupa', heroImage: '/login-scenes/cult/ortakoy.jpg' },
    ],
  },
];

export const TOTAL_MEYDAN_COUNT = 95;
export const ANADOLU_TOTAL_COUNT = 48;
export const AVRUPA_TOTAL_COUNT = 47;

// Flattened lookup map
export const ALL_CANONICAL_MEYDANLAR = [
  ...ANADOLU_DISTRICTS.flatMap((d) => d.meydanlar),
  ...AVRUPA_DISTRICTS.flatMap((d) => d.meydanlar),
];

export const DEFAULT_FEATURED_MEYDAN = ALL_CANONICAL_MEYDANLAR[0]; // Kadıköy Meydanı
