import { db } from './firebaseDb';
import { collection, setDoc, doc, getDocs } from 'firebase/firestore';

const MEYDANLAR = [
  { id: 'aksaray', isim: 'Aksaray Meydanı' },
  { id: 'bagcilar', isim: 'Bağcılar Meydanı' },
  { id: 'bakirkoy-ozgurluk', isim: 'Bakırköy Özgürlük Meydanı' },
  { id: 'mecidiyekoy', isim: 'Mecidiyeköy Meydanı' },
  { id: 'sirinevler', isim: 'Şirinevler Meydanı' },
  { id: 'uskudar-mimar-sinan', isim: 'Üsküdar Mimar Sinan Meydanı' },
  { id: 'kartal-neyzen', isim: 'Kartal Neyzen Tevfik Meydanı' },
  { id: 'maltepe-cumhuriyet', isim: 'Maltepe Cumhuriyet Meydanı' },
  { id: 'umraniye-15temmuz', isim: 'Ümraniye 15 Temmuz Şehitler Meydanı' }
];

export async function seedMeydanlar() {
  const ref = collection(db, 'meydanlar');
  // Zaten ekli mi kontrolü
  const snap = await getDocs(ref);
  if (!snap.empty) {
    console.log('Meydanlar zaten ekli.');
    return false;
  }
  for (const m of MEYDANLAR) {
    await setDoc(doc(ref, m.id), { isim: m.isim });
  }
  console.log('Meydanlar başarıyla güncellendi');
  return true;
}
