const MAX_INSIGHTS = 6;

function formatDateLabel(dateKey) {
  if (!dateKey) {
    return '';
  }

  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateKey;
  }

  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function getDaysDiff(fromKey, toKey) {
  if (!fromKey || !toKey) {
    return 0;
  }

  const from = new Date(`${fromKey}T00:00:00`);
  const to = new Date(`${toKey}T00:00:00`);
  const diff = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function createMeydanNameMap(meydanlar) {
  return new Map((meydanlar || []).map((meydan) => [meydan.id, meydan.isim || meydan.id]));
}

function buildStaleMeydanInsight(historyShifts, meydanlar, todayKey) {
  const meydanNameMap = createMeydanNameMap(meydanlar);
  const lastDateByMeydan = new Map();

  (historyShifts || []).forEach((shift) => {
    if (!shift?.meydanId || !shift?.tarih) {
      return;
    }

    const current = lastDateByMeydan.get(shift.meydanId);
    if (!current || String(shift.tarih) > current) {
      lastDateByMeydan.set(shift.meydanId, String(shift.tarih));
    }
  });

  const ranked = Array.from(lastDateByMeydan.entries())
    .filter(([meydanId]) => meydanNameMap.has(meydanId))
    .sort((left, right) => left[1].localeCompare(right[1], 'tr'));

  if (!ranked.length) {
    return null;
  }

  const [meydanId, lastDate] = ranked[0];
  const days = getDaysDiff(lastDate, todayKey);
  return {
    title: 'Planlama Sessizliği',
    text: `${meydanNameMap.get(meydanId) || meydanId} alanına ait en güncel planlama kaydı ${formatDateLabel(lastDate)} tarihlidir. Bu alana ${days} gündür yeni vardiya planlaması oluşturulmamıştır.`,
    severity: 'warning',
  };
}

function buildFlexiblePersonInsight(historyShifts, meydanlar) {
  const meydanNameMap = createMeydanNameMap(meydanlar);
  const personMap = new Map();

  (historyShifts || []).forEach((shift) => {
    if (!shift?.personelAdi || !shift?.meydanId) {
      return;
    }

    const existing = personMap.get(shift.personelAdi) || { meydanlar: new Set(), count: 0 };
    existing.meydanlar.add(shift.meydanId);
    existing.count += 1;
    personMap.set(shift.personelAdi, existing);
  });

  const ranked = Array.from(personMap.entries()).sort((left, right) => {
    const distinctDiff = right[1].meydanlar.size - left[1].meydanlar.size;
    if (distinctDiff !== 0) {
      return distinctDiff;
    }

    return right[1].count - left[1].count;
  });

  if (!ranked.length || ranked[0][1].meydanlar.size <= 1) {
    return null;
  }

  const [personelAdi, data] = ranked[0];
  const preview = Array.from(data.meydanlar)
    .slice(0, 3)
    .map((meydanId) => meydanNameMap.get(meydanId) || meydanId)
    .join(', ');

  return {
    title: 'Çok Meydanlı Personel',
    text: `${personelAdi}, kayıt döneminde ${data.meydanlar.size} farklı alanda görevlendirilmiştir. Ağırlıklı olarak görev gördüğü alanlar: ${preview}.`,
    severity: 'info',
  };
}

function buildStablePairInsight(historyShifts, meydanlar) {
  const meydanNameMap = createMeydanNameMap(meydanlar);
  const pairCounts = new Map();

  (historyShifts || []).forEach((shift) => {
    if (!shift?.personelAdi || !shift?.meydanId) {
      return;
    }

    const key = `${shift.personelAdi}__${shift.meydanId}`;
    pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
  });

  const ranked = Array.from(pairCounts.entries()).sort((left, right) => right[1] - left[1]);
  if (!ranked.length || ranked[0][1] < 2) {
    return null;
  }

  const [pairKey, count] = ranked[0];
  const [personelAdi, meydanId] = pairKey.split('__');
  return {
    title: 'Sabit Görev Eşleşmesi',
    text: `${personelAdi} ile ${meydanNameMap.get(meydanId) || meydanId} arasında ${count} vardiya kaydına dayanan süregelen bir görevlendirme ilişkisi tespit edilmiştir.`,
    severity: 'info',
  };
}

function buildTopMeydanInsight(historyShifts, meydanlar) {
  const meydanNameMap = createMeydanNameMap(meydanlar);
  const meydanCounts = new Map();

  (historyShifts || []).forEach((shift) => {
    if (!shift?.meydanId) {
      return;
    }

    meydanCounts.set(shift.meydanId, (meydanCounts.get(shift.meydanId) || 0) + 1);
  });

  const ranked = Array.from(meydanCounts.entries()).sort((left, right) => right[1] - left[1]);
  if (!ranked.length) {
    return null;
  }

  const [meydanId, count] = ranked[0];
  return {
    title: 'Toplam Kayıt Lideri',
    text: `${meydanNameMap.get(meydanId) || meydanId}, kayıt dönemi genelinde ${count} vardiya ile en yüksek faaliyet yoğunluğuna sahip alan olarak öne çıkmaktadır.`,
    severity: 'info',
  };
}

function buildDataFlowInsight(recentShifts) {
  if (recentShifts.length >= 15) {
    return {
      title: 'Veri Akışı',
      text: 'Güncel vardiya kayıtları düzenli seyretmektedir. Günlük planlama ve veri akışı tutarlı düzeydedir.',
      severity: 'success',
    };
  }

  if (recentShifts.length > 0 && recentShifts.length < 10) {
    return {
      title: 'Veri Akışı',
      text: `Sistemde ${recentShifts.length} güncel vardiya kaydı bulunmaktadır. Veri girişlerinin düzenlilik ve tamlık yönünden incelenmesi önerilir.`,
      severity: 'warning',
    };
  }

  return null;
}

function buildTopKronikTopicsInsight(kronikSorunlar) {
  const topicCounts = new Map();

  (kronikSorunlar || []).forEach((item) => {
    const topic = String(item?.konuBasligi || item?.basvuruAciklamasi || '').trim();
    if (!topic || topic === '-') {
      return;
    }

    topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
  });

  const ranked = Array.from(topicCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (!ranked.length) {
    return null;
  }

  const list = ranked.map(([topic, count], i) => `${i + 1}. ${topic} (${count} kayıt)`).join('; ');
  return {
    title: 'Öne Çıkan Kronik Konular',
    text: `Kronik sorun kayıtlarında en sık tekrar eden başlıklar: ${list}.`,
    severity: 'info',
  };
}

function buildLocalInsights({ historyShifts = [], recentShifts = [], meydanlar = [], kronikSorunlar = [], todayKey = '' }) {
  const insights = [];

  const staleMeydan = buildStaleMeydanInsight(historyShifts, meydanlar, todayKey);
  if (staleMeydan) insights.push(staleMeydan);

  const flexiblePerson = buildFlexiblePersonInsight(historyShifts, meydanlar);
  if (flexiblePerson) insights.push(flexiblePerson);

  const stablePair = buildStablePairInsight(historyShifts, meydanlar);
  if (stablePair) insights.push(stablePair);

  const topMeydan = buildTopMeydanInsight(historyShifts, meydanlar);
  if (topMeydan) insights.push(topMeydan);

  const dataFlow = buildDataFlowInsight(recentShifts);
  if (dataFlow) insights.push(dataFlow);

  const topKronik = buildTopKronikTopicsInsight(kronikSorunlar);
  if (topKronik) insights.push(topKronik);

  return insights.slice(0, MAX_INSIGHTS);
}

export async function generateOperationalInsights(params, options = {}) {
  void options;
  return buildLocalInsights(params);
}
