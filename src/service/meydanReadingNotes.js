function normalizeText(value) {
  return String(value || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[ıi]/g, 'i')
    .replace(/[ğ]/g, 'g')
    .replace(/[ü]/g, 'u')
    .replace(/[ş]/g, 's')
    .replace(/[ö]/g, 'o')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const MEYDAN_READING_NOTES = [
  {
    title: 'Bakırköy Özgürlük Meydanı',
    summary: 'Bakırköy\'ün tarihsel belleğini modern kent yaşamıyla birleştiren, etkinlik ve kamusal buluşma odağı güçlü bir merkez.',
    badge: 'Detaylı oku',
    aliases: ['bakirkoy ozgurluk', 'bakirkoy meydani'],
    sections: [
      {
        heading: 'Tarihçesi',
        text: 'Bakırköy Özgürlük Meydanı, kökleri Bizans dönemine uzanan Bakırköy\'ün sosyo-kültürel hafızasında önemli bir yere sahiptir. Osmanlı ve Cumhuriyet dönemlerinde bölgenin toplumsal merkezlerinden biri olarak gelişmiş, zamanla modern bir kent meydanı kimliği kazanmıştır. Özgürlük adı, Cumhuriyet değerlerini ve kamusal özgürlük anlayışını simgeleyen güçlü bir anlam taşır.',
      },
      {
        heading: 'Mimari ve Fiziksel Doku',
        text: 'Meydan, geniş açık alanı, yaya yolları, oturma alanları ve yeşil dokusuyla sosyal etkinliklere elverişli bir plan sunar. Çevresindeki ticari birimler, kültür noktaları ve belediye işlevleriyle günlük yaşamın merkezi haline gelir. Son düzenlemelerle altyapı ve peyzaj kalitesi artırılmış; Atatürk heykeli meydanın simgesel odağı olarak öne çıkmıştır.',
      },
      {
        heading: 'Kültürel ve Sosyal Önemi',
        text: 'Resmi bayramlar, konserler, açık hava etkinlikleri ve toplumsal buluşmalar bu alanda yoğunlaşır. Meydan, Bakırköy\'ün kimliğini taşıyan bir sembol niteliğindedir; yalnızca bir geçiş alanı değil, aynı zamanda sosyalleşme ve dayanışma mekanıdır. Korunması ve nitelikli biçimde geliştirilmesi, hem ilçe ölçeğinde hem İstanbul bütünü için stratejik önem taşır.',
      },
    ],
  },
  {
    title: 'Küçükçekmece Cennet Meydanı',
    summary: 'Küçükçekmece\'nin dönüşen kent dokusunda, ulaşım ve sosyal yaşamı bir araya getiren canlı bir açık alan merkezi.',
    badge: 'Detaylı oku',
    aliases: ['kucukcekmece cennet', 'cennet meydani'],
    sections: [
      {
        heading: 'Tarihçesi',
        text: 'Cennet Meydanı, Küçükçekmece\'nin kırsal karakterden modern kent yapısına geçiş sürecinde öne çıkan merkezlerinden biridir. Adını Cennet Mahallesi\'nden alan alan, özellikle 20. yüzyılın ikinci yarısından sonra artan nüfus ve şehirleşmeyle birlikte sosyal ve ticari çekim odağına dönüşmüştür.',
      },
      {
        heading: 'Mimari ve Fiziksel Doku',
        text: 'Yürüyüş yolları, yeşil alanlar, çocuk oyun alanları ve modern peyzaj öğeleriyle meydan güçlü bir açık alan deneyimi sunar. Yoğun yaya ve araç trafiğine rağmen çevresindeki kafe, restoran, mağaza ve kamu birimleriyle canlı bir gündelik ritim üretir. Son düzenlemeler oturma bölgeleri, dekoratif aydınlatma ve küçük etkinlik alanlarını güçlendirmiştir.',
      },
      {
        heading: 'Kültürel ve Sosyal Önemi',
        text: 'Bölge halkının günlük buluşmaları, hafta sonu hareketliliği, yerel etkinlikler ve çocuk odaklı faaliyetler bu meydanda yoğunlaşır. Metrobüs ağına yakınlığı nedeniyle meydan aynı zamanda önemli bir transit noktasıdır. Bu çift işlev, Cennet Meydanı\'nı hem yaşam alanı hem de ilçe kimliğini temsil eden bir simge haline getirir.',
      },
    ],
  },
  {
    title: 'Beyoğlu Piyalepaşa Meydanı',
    summary: 'Osmanlı mirasını, Piyale Paşa çevresindeki gündelik mahalle yaşamı ve yeni kentsel dönüşüm katmanlarıyla buluşturan odak.',
    badge: 'Detaylı oku',
    aliases: ['piyalepasa', 'beyoglu piyalepasa'],
    sections: [
      {
        heading: 'Tarihçesi',
        text: 'Piyalepaşa Meydanı adını, Osmanlı döneminin önemli denizcilerinden Kaptan-ı Derya Piyale Paşa\'dan alır. 1573\'te Mimar Sinan tarafından inşa edilen Piyalepaşa Camii, bölgenin tarihsel ağırlığını belirleyen temel unsurdur. Alan, Osmanlı\'dan günümüze yerleşim ve ticaret dokusunu taşıyan bir merkez olarak varlığını sürdürmüştür.',
      },
      {
        heading: 'Mimari ve Fiziksel Doku',
        text: 'Meydanın karakteri, Piyalepaşa Camii odağında şekillenen tarihsel mahalle yapısı ve çevredeki gündelik kentsel kullanım katmanlarından oluşur. Konut, küçük ölçekli ticaret ve sokak dokusu meydanın canlılığını besler. Son dönem kentsel dönüşüm ve altyapı yatırımları, alana modern bir görünüm ve işlevsellik kazandırmıştır.',
      },
      {
        heading: 'Kültürel ve Sosyal Önemi',
        text: 'Piyalepaşa Meydanı, dini-sosyal etkinlikler ve mahalle ölçeğindeki buluşmaların doğal merkezi olarak öne çıkar. Tarihi miras ile çağdaş yaşamın aynı zeminde buluşması, Beyoğlu\'nun yerel dokusunu görünür kılar. Kültürel süreklilik korunarak yapılacak iyileştirmeler, alanın kent içindeki etkisini daha da artıracaktır.',
      },
    ],
  },
  {
    title: 'Beşiktaş Barbaros Meydanı',
    summary: 'Deniz ulaşımı, tarihsel denizcilik mirası ve yoğun kamusal buluşma kültürünü bir arada taşıyan İstanbul odağı.',
    badge: 'Detaylı oku',
    aliases: ['besiktas barbaros', 'barbaros meydani', 'besiktas iskele'],
    sections: [
      {
        heading: 'Tarihçesi',
        text: 'Barbaros Meydanı, adını Osmanlı denizciliğinin simge isimlerinden Barbaros Hayreddin Paşa\'dan alır. 1541 sonrası türbe ve mescidin inşasıyla alan tarihsel bir odak kazanmış, Cumhuriyet döneminde ise ulaşım ağlarının genişlemesiyle İstanbul\'un deniz bağlantılarında kritik bir merkez haline gelmiştir.',
      },
      {
        heading: 'Mimari ve Fiziksel Doku',
        text: 'Meydanın en güçlü mimari referansları Barbaros Hayreddin Paşa Türbesi ve Barbaros Anıtı\'dır. Beşiktaş İskelesi ile birleşen açık alan yapısı, hem günlük geçiş hem etkinlik kullanımı için yüksek kapasite sunar. Çevredeki ticari birimler, alanın gün boyu canlı ve çok katmanlı bir kamusal kullanıma sahip olmasını sağlar.',
      },
      {
        heading: 'Kültürel ve Sosyal Önemi',
        text: 'Barbaros Meydanı; denizcilik temalı törenler, kültürel etkinlikler, kutlamalar ve toplumsal buluşmalar için güçlü bir merkezdir. Yerli-yabancı ziyaretçilerin yoğun ilgisi, alanı Beşiktaş\'ın giriş kapılarından biri haline getirir. Tarihi dokuyu koruyan çevresel düzenlemeler, meydanın kültürel ve turistik değerini kalıcı biçimde artırır.',
      },
    ],
  },
  {
    title: 'Bağcılar Ebubekir Meydanı',
    summary: 'Bağcılar\'da dini ve mahalle ölçekli sosyal buluşmaları güçlendiren, günlük yaşamla iç içe yerel merkez.',
    badge: 'Detaylı oku',
    aliases: ['bagcilar ebubekir', 'ebubekir meydani', 'ebubekir camii'],
    sections: [
      {
        heading: 'Tarihçesi',
        text: 'Ebubekir Meydanı, adını İslam tarihinin önemli şahsiyetlerinden Hz. Ebubekir\'den alır. Bağcılar\'ın hızlı kentleştiği dönemde mahalle ölçeğinde şekillenen alan, zamanla bölgenin dini ve sosyal buluşma noktalarından biri haline gelmiştir.',
      },
      {
        heading: 'Mimari ve Fiziksel Doku',
        text: 'Meydan ölçek olarak sınırlı olsa da çevresindeki modern-geleneksel yapı birlikteliğiyle ayırt edilir. Ebubekir Camii, alana güçlü bir kimlik kazandıran merkez öğedir. Oturma alanları, küçük yeşil dokular ve çevredeki ticari birimler günlük kullanımın sürekliliğini destekler.',
      },
      {
        heading: 'Kültürel ve Sosyal Önemi',
        text: 'Cuma günleri ve dini dönemlerde yoğunluk belirgin şekilde artar; meydan mahalle dayanışmasının görünür olduğu bir toplumsal temas noktasına dönüşür. Küçük etkinlikler ve komşuluk buluşmaları için de işlev gören alan, yerel sosyal bağların güçlenmesine katkı sağlar.',
      },
    ],
  },
  {
    title: 'Üsküdar Mimar Sinan Meydanı',
    summary: 'Tarihsel dini miras, boğaz geçişleri ve güncel kamusal yaşamı aynı mekanda birleştiren Üsküdar çekirdeği.',
    badge: 'Detaylı oku',
    aliases: ['uskudar mimar sinan', 'mihrimah sultan camii', 'uskudar meydani'],
    sections: [
      {
        heading: 'Tarihçesi',
        text: 'Üsküdar\'ın köklü yerleşim hafızasında önemli yer tutan bu meydan, adını Osmanlı\'nın büyük mimarı Mimar Sinan\'dan alır. 1548 tarihli Mihrimah Sultan Camii, alanın tarihsel merkezini oluşturur. Meydan Osmanlı\'dan bugüne ticaret, ulaşım ve ibadet eksenlerinde süreklilik taşıyan bir odak olmuştur.',
      },
      {
        heading: 'Mimari ve Fiziksel Doku',
        text: 'Mihrimah Sultan Camii, şadırvan ve avlu bileşenleri meydanın tarihsel dokusunu belirlerken; modern düzenlemeler yürüyüş yolları, oturma alanları ve yeşil kullanımı güçlendirmiştir. Üsküdar İskelesi bağlantısı, alanı deniz ulaşımı açısından kritik bir geçiş noktasına dönüştürür.',
      },
      {
        heading: 'Kültürel ve Sosyal Önemi',
        text: 'Ramazan buluşmaları, dini programlar, açık hava etkinlikleri ve gündelik kent hareketi bu meydanda birleşir. Hem yerel kullanıcılar hem ziyaretçiler için güçlü bir çekim noktası olan alan, Üsküdar\'ın kültürel değerlerini görünür kılan kamusal vitrin işlevi görür.',
      },
    ],
  },
  {
    title: 'Ümraniye 15 Temmuz Şehitler Meydanı',
    summary: 'Milli hafıza, anma kültürü ve modern kent işlevlerini birleştiren Ümraniye\'nin sembolik kamusal merkezi.',
    badge: 'Detaylı oku',
    aliases: ['umraniye 15 temmuz', '15 temmuz sehitler meydani'],
    sections: [
      {
        heading: 'Tarihçesi',
        text: 'Meydan, 2016\'daki 15 Temmuz darbe girişiminde şehit olan vatandaşların anısını yaşatmak amacıyla bu adla anılmaktadır. Ümraniye\'nin merkezinde konumlanan alan, ilçenin gelişen kentsel yapısı içinde yeniden düzenlenerek milli hafızayı kamusal mekana taşıyan sembolik bir merkez haline gelmiştir.',
      },
      {
        heading: 'Mimari ve Fiziksel Doku',
        text: 'Anıt ve heykel öğeleri, meydanın duygusal ve tarihsel temasını güçlendiren temel unsurlardır. Yürüyüş yolları, oturma bölgeleri, yeşil alanlar ve çevredeki ticari birimler günlük kullanım konforunu artırır. Modern yapılaşma ve resmi kurum varlığı, alanın işlevselliğini yükseltir.',
      },
      {
        heading: 'Kültürel ve Sosyal Önemi',
        text: '15 Temmuz anma programları başta olmak üzere resmi törenler, iftar organizasyonları, konserler ve sergiler meydanın güçlü toplumsal rolünü destekler. Meydan, milli birlik duygusunu kamusal yaşamla buluşturan bir odak olarak Ümraniye\'nin sosyal-ekonomik ritmini besler.',
      },
    ],
  },
  {
    title: 'Kartal Neyzen Tevfik Meydanı',
    summary: 'Sahil dokusu ile sanat ve toplumsal buluşmaları bir araya getiren, Kartal\'ın güçlü kültürel odaklarından biri.',
    badge: 'Detaylı oku',
    aliases: ['kartal neyzen tevfik', 'neyzen tevfik meydani', 'kartal meydani'],
    sections: [
      {
        heading: 'Tarihçesi',
        text: 'Meydan adını, Türk edebiyatı ve tasavvuf kültürünün önemli ismi Neyzen Tevfik Kolaylı\'dan alır. Kartal sahilindeki bu alan, uzun yıllardır bölgenin sosyal-kültürel buluşma noktası olmanın yanında ulaşım açısından da stratejik bir konuma sahip olmuştur.',
      },
      {
        heading: 'Mimari ve Fiziksel Doku',
        text: 'Neyzen Tevfik\'i simgeleyen anıt/heykel öğeleri meydanın karakterini belirler. Sahil boyunca uzanan yürüyüş aksı, yeşil alanlar ve oturma bölgeleri alanı dinlenme ve sosyalleşme için güçlü bir açık mekan haline getirir. Çevredeki kafe-restoran ve ticari kullanım da canlılığı destekler.',
      },
      {
        heading: 'Kültürel ve Sosyal Önemi',
        text: 'Açık hava konserleri, şiir dinletileri ve yerel etkinlikler meydanın kültürel profilini güçlendirir. Bayram kutlamaları ve toplumsal buluşmalar için de tercih edilen alan, denizle kurduğu ilişki sayesinde Kartal\'ın kamusal yaşamında özgün bir deneyim sunar.',
      },
    ],
  },
  {
    title: 'Maltepe Cumhuriyet Meydanı',
    summary: 'Cumhuriyet değerlerini temsil eden anıtsal kimliğiyle, Maltepe\'de sosyal etkinlik ve kamusal birlikteliği güçlendiren merkez.',
    badge: 'Detaylı oku',
    aliases: ['maltepe cumhuriyet', 'maltepe sahil etkinlik', 'maltepe meydani'],
    sections: [
      {
        heading: 'Tarihçesi',
        text: 'Maltepe Cumhuriyet Meydanı, adını Cumhuriyet\'in kurucu değerlerinden alır ve ilçenin kentsel gelişim sürecinde merkezi bir rol üstlenir. Özellikle 20. yüzyılın ikinci yarısından sonra sosyal-kültürel buluşmaların ana alanlarından biri haline gelmiştir.',
      },
      {
        heading: 'Mimari ve Fiziksel Doku',
        text: 'Meydanda Atatürk ve Cumhuriyet değerlerini simgeleyen anıtsal odak, geniş yürüyüş alanları ve oturma bölgeleriyle desteklenir. Modern kent dokusuna uyumlu çevre yapıları, peyzaj düzenlemeleri ve yeşil alanlar, meydanın işlevsel ve estetik bütünlüğünü güçlendirir.',
      },
      {
        heading: 'Kültürel ve Sosyal Önemi',
        text: 'Milli bayram kutlamaları, açık hava konserleri, sergiler ve toplu etkinlikler meydanın toplumsal işlevini belirginleştirir. Sahil bağlantısı sayesinde alan, gündelik yaşam ve etkinlik kullanımı arasında güçlü bir denge kurar. Gelecekte kültürel program çeşitliliğinin artması, meydanın cazibesini daha da yükseltecektir.',
      },
    ],
  },
  {
    title: 'Şirinevler Meydanı',
    summary: 'Bahçelievler\'de yoğun ulaşım ağları ile ticari hayatın kesiştiği, gün boyu yüksek insan hareketi üreten kent düğümü.',
    badge: 'Detaylı oku',
    aliases: ['sirinevler', 'bahcelievler meydani'],
    sections: [
      {
        heading: 'Tarihçesi',
        text: 'Şirinevler Meydanı, Bahçelievler ilçesinde 20. yüzyılın ikinci yarısından itibaren hızlanan şehirleşme ile gelişmiş; 1980\'lerden sonra nüfus artışı ve ticari yoğunlukla önemli bir merkez kimliği kazanmıştır. Yerleşim ağırlıklı karakter zamanla güçlü bir ulaşım-ticaret odağına evrilmiştir.',
      },
      {
        heading: 'Mimari ve Fiziksel Doku',
        text: 'Yüksek yoğunluklu yapı dokusu, iş merkezleri ve güçlü yaya akışı meydanın temel fiziksel karakterini oluşturur. Metrobüs, metro ve otobüs ağlarının kesişimi nedeniyle alan İstanbul\'un en hareketli geçiş noktalarından biridir. Yayalaştırma adımlarına rağmen araç-yaya etkileşimi halen belirgin bir planlama konusu olarak öne çıkar.',
      },
      {
        heading: 'Kültürel ve Sosyal Önemi',
        text: 'Kozmopolit kullanıcı profiliyle Şirinevler, öğrenci, çalışan ve esnaf gruplarının gündelik buluşmalarına ev sahipliği yapar. Bölgedeki üniversite ve iş alanları nedeniyle yüksek sirkülasyon üretir. Ramazan etkinlikleri, seçim dönemleri ve sosyal organizasyonlarda da güçlü bir kamusal zemin olarak işlev görür.',
      },
    ],
  },
];

export function getMeydanReadingNote(meydan) {
  const haystack = normalizeText(`${meydan?.id || ''} ${meydan?.isim || ''} ${meydan?.tamAd || ''}`);
  if (!haystack) {
    return null;
  }

  const match = MEYDAN_READING_NOTES.find((note) => note.aliases.some((alias) => haystack.includes(normalizeText(alias))));
  if (!match) {
    return null;
  }

  return {
    ...match,
    readPath: `/meydan/${encodeURIComponent(meydan?.id || '')}/not`,
  };
}
