import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import Header from '../Header';
import { db } from '../firebaseDb';
import { getMeydanReadingNote } from '../service/meydanReadingNotes';
import { normalizeMeydanInput } from '../utils/meydanNormalization';

export default function MeydanNoteRead({ onLogout }) {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [meydanName, setMeydanName] = useState('Meydan');
  const [note, setNote] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadNote() {
      try {
        const canonical = normalizeMeydanInput({ meydanId: id, isim: id, kisaAd: id, tamAd: id });
        if (!canonical.valid) {
          if (active) {
            setNote(null);
            setLoading(false);
          }
          return;
        }

        const snapshot = await getDoc(doc(db, 'meydanlar', id));
        const data = snapshot.exists() ? snapshot.data() : {};
        const meydan = {
          id,
          isim: data?.isim || canonical.isim,
          tamAd: data?.tamAd || canonical.tamAd,
        };

        if (!active) {
          return;
        }

        setMeydanName(meydan.isim || 'Meydan');
        setNote(getMeydanReadingNote(meydan));
      } catch {
        if (active) {
          setNote(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadNote();

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="app-shell">
      <Header onLogout={onLogout} />

      <main className="page page-detail page-note-read">
        <section className="panel-section note-read">
          <div className="note-read__nav">
            <Link to={`/meydan/${encodeURIComponent(id || '')}`} className="btn btn-ghost btn-inline">
              Meydana geri don
            </Link>
          </div>

          {loading ? <div className="message message-loading">Meydan notu yukleniyor...</div> : null}

          {!loading && !note ? (
            <div className="note-read__empty">
              <h1>{meydanName} icin detayli not henuz eklenmedi.</h1>
              <p>Bu meydan icin mevcut ozet karti ayni sekilde calismaya devam eder.</p>
            </div>
          ) : null}

          {!loading && note ? (
            <article className="note-read__article">
              <header className="note-read__header">
                <span className="section-kicker">Meydan Notu</span>
                <h1>{note.title}</h1>
                <p>{note.summary}</p>
              </header>

              <div className="note-read__sections">
                {note.sections.map((section) => (
                  <section key={section.heading} className="note-read__section">
                    <h2>{section.heading}</h2>
                    <p>{section.text}</p>
                  </section>
                ))}
              </div>
            </article>
          ) : null}
        </section>
      </main>
    </div>
  );
}
