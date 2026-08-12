const MAX_INSIGHTS = 6;

function normalizeInsightText(value) {
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

function isOperationalMeydanCandidate(meydanId, meydanName = '') {
  const normalized = normalizeInsightText(`${meydanId} ${meydanName}`);
  const compact = normalized.replace(/[\s-]+/g, '');

  if (!compact) {
    return false;
  }

  return !['ofis', 'babalik', 'babalikizni', 'calistay', 'calistayprogrami'].some((token) => compact.includes(token));
}

function filterOperationalMeydanlar(meydanlar = []) {
  return (meydanlar || []).filter((meydan) => isOperationalMeydanCandidate(meydan?.id, meydan?.isim));
}

function filterOperationalHistoryShifts(historyShifts = [], validMeydanIds = new Set()) {
  return (historyShifts || []).filter((shift) => validMeydanIds.has(shift?.meydanId));
}

function toCompactSource(value) {
  return normalizeInsightText(value).replace(/[\s-]+/g, '');
}

function isPlanEkleSourceShift(shift) {
  const sourceTokens = [
    shift?.kaynak,
    shift?.source,
    shift?.importSource,
    shift?.yuklemeKaynagi,
  ].map(toCompactSource).filter(Boolean);

  if (!sourceTokens.length) {
    return null;
  }

  return sourceTokens.some((token) => token.includes('planekle') || token.includes('excelimport'));
}

function filterPlanEkleHistoryShifts(historyShifts = [], todayKey = '') {
  const all = historyShifts || [];
  const floorYear = Number(String(todayKey || '').slice(0, 4));
  const floorDate = Number.isFinite(floorYear) ? `${floorYear}-01-01` : '';
  const ceilingDate = /^\d{4}-\d{2}-\d{2}$/.test(String(todayKey || '').trim()) ? String(todayKey).trim() : '';

  function isDateInRange(shift) {
    const tarih = String(shift?.tarih || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tarih)) {
      return false;
    }

    if (floorDate && tarih < floorDate) {
      return false;
    }

    if (ceilingDate && tarih > ceilingDate) {
      return false;
    }

    return true;
  }

  const explicit = all.filter((shift) => isPlanEkleSourceShift(shift) === true && isDateInRange(shift));

  if (explicit.length) {
    return explicit;
  }

  // Legacy fallback: source field olmayan eski Plan Ekle kayıtlarını koru,
  // ancak gap-fill ve dönem dışı kayıtları dahil etme.
  return all.filter((shift) => {
    const explicitSource = isPlanEkleSourceShift(shift);
    if (explicitSource === false) {
      return false;
    }

    if (shift?.gapFilledAt) {
      return false;
    }

    if (!isDateInRange(shift)) {
      return false;
    }

    return true;
  });
}

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

function buildMeydanIssueCountMap(kronikSorunlar = [], meydanlar = []) {
  const issueCounts = new Map();
  const meydanNameMap = createMeydanNameMap(meydanlar);
  const normalizedNameToId = new Map(
    Array.from(meydanNameMap.entries()).map(([id, name]) => [String(name || '').toLocaleLowerCase('tr-TR'), id]),
  );

  kronikSorunlar.forEach((item) => {
    const rawName = String(item?.meydanAdi || '').trim();
    if (!rawName) {
      return;
    }

    const key = rawName.toLocaleLowerCase('tr-TR');
    const meydanId = normalizedNameToId.get(key);
    if (!meydanId) {
      return;
    }

    issueCounts.set(meydanId, (issueCounts.get(meydanId) || 0) + 1);
  });

  return issueCounts;
}

function buildLeastRecordedMeydanInsight(meydanlar, basvuruCountByMeydan = {}) {
  const meydanNameMap = createMeydanNameMap(meydanlar);
  const ranked = Array.from(meydanNameMap.keys())
    .map((meydanId) => {
      const rawCount = Number(basvuruCountByMeydan?.[meydanId]);
      return [meydanId, rawCount];
    })
    .filter(([, count]) => Number.isFinite(count) && count >= 0)
    .sort((left, right) => left[1] - right[1])
    .slice(0, 3);

  if (!ranked.length) {
    return null;
  }

  const list = ranked
    .map(([meydanId, count]) => `${meydanNameMap.get(meydanId) || meydanId} (${count} başvuru)`)
    .join(', ');

  return {
    title: 'Düşük Kayıtlı Meydanlar',
    text: `Toplam başvuru sayılarına göre en düşük kayıt bulunan alanlar: ${list}. Bu meydanlarda başvuru giriş düzeni ayrıca kontrol edilmelidir.`,
    severity: 'warning',
  };
}

function buildHighTrafficLowIssueInsight(historyShifts, kronikSorunlar, meydanlar) {
  const meydanNameMap = createMeydanNameMap(meydanlar);
  const vardiyaCounts = new Map();

  (historyShifts || []).forEach((shift) => {
    if (!shift?.meydanId || !meydanNameMap.has(shift.meydanId)) {
      return;
    }

    vardiyaCounts.set(shift.meydanId, (vardiyaCounts.get(shift.meydanId) || 0) + 1);
  });

  const busiest = Array.from(vardiyaCounts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5);

  if (!busiest.length) {
    return null;
  }

  const issueCounts = buildMeydanIssueCountMap(kronikSorunlar, meydanlar);
  const best = busiest
    .map(([meydanId, vardiyaCount]) => ({
      meydanId,
      vardiyaCount,
      issueCount: issueCounts.get(meydanId) || 0,
      ratio: (issueCounts.get(meydanId) || 0) / Math.max(vardiyaCount, 1),
    }))
    .sort((left, right) => {
      if (left.ratio !== right.ratio) {
        return left.ratio - right.ratio;
      }
      return right.vardiyaCount - left.vardiyaCount;
    })[0];

  if (!best) {
    return null;
  }

  return {
    title: 'Yoğunluk/Kayıt Dengesi',
    text: `${meydanNameMap.get(best.meydanId) || best.meydanId} alanı yüksek hareketliliğe (${best.vardiyaCount} vardiya) rağmen düşük başvuru kaydı (${best.issueCount}) ile pozitif sinyal vermektedir.`,
    severity: 'info',
  };
}

function buildLocalInsights({ historyShifts = [], recentShifts = [], meydanlar = [], kronikSorunlar = [], basvuruCountByMeydan = {}, todayKey = '' }) {
  const planEkleHistoryShifts = filterPlanEkleHistoryShifts(historyShifts, todayKey);
  const operationalMeydanlar = filterOperationalMeydanlar(meydanlar);
  const operationalMeydanIds = new Set(operationalMeydanlar.map((meydan) => meydan.id));
  const operationalHistoryShifts = filterOperationalHistoryShifts(planEkleHistoryShifts, operationalMeydanIds);
  const insights = [];

  const staleMeydan = buildStaleMeydanInsight(operationalHistoryShifts, operationalMeydanlar, todayKey);
  if (staleMeydan) insights.push(staleMeydan);

  const flexiblePerson = buildFlexiblePersonInsight(operationalHistoryShifts, operationalMeydanlar);
  if (flexiblePerson) insights.push(flexiblePerson);

  const stablePair = buildStablePairInsight(operationalHistoryShifts, operationalMeydanlar);
  if (stablePair) insights.push(stablePair);

  const topMeydan = buildTopMeydanInsight(operationalHistoryShifts, operationalMeydanlar);
  if (topMeydan) insights.push(topMeydan);

  const dataFlow = buildDataFlowInsight(recentShifts);
  if (dataFlow) insights.push(dataFlow);

  const leastRecorded = buildLeastRecordedMeydanInsight(operationalMeydanlar, basvuruCountByMeydan);
  if (leastRecorded) insights.push(leastRecorded);

  const highTrafficLowIssue = buildHighTrafficLowIssueInsight(operationalHistoryShifts, kronikSorunlar, operationalMeydanlar);
  if (highTrafficLowIssue) insights.push(highTrafficLowIssue);

  return insights.slice(0, MAX_INSIGHTS);
}

export async function generateOperationalInsights(params, options = {}) {
  void options;
  return buildLocalInsights(params);
}
