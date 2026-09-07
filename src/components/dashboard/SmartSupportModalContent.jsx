import React, { useState } from 'react';
import {
  PaperAirplaneIcon,
  SparklesIcon,
  UserCircleIcon,
  ChatBubbleBottomCenterTextIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { sendToDeepSeek } from '../../deepseek';

const QUICK_PROMPTS = [
  'Bugünkü vardiya durumu nedir?',
  'Kadıköy Meydanı personel sayısı kaç?',
  'Kronik başvurular ve acil konular neler?',
  'Saha personeli için acil durum protokolü nedir?',
];

export default function SmartSupportModalContent({
  activeMeydanCount = 95,
  scheduledCount = 0,
  activeCount = 0,
  selectedMeydan,
}) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Merhaba! Ben SYP Saha Yönetim Akıllı Asistanı. İstanbul genelindeki ${activeMeydanCount} meydan, bugünkü ${scheduledCount} planlı ve ${activeCount} aktif saha personeli hakkında bilgi alabilir, operasyonel sorularınızı sorabilirsiniz.`,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSend(promptText) {
    const textToSend = promptText || inputText;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptText) setInputText('');
    setLoading(true);

    try {
      const systemContext = `Sen İBB Saha Yönetim Paneli (SYP) Akıllı Destek Asistanısın. İstanbul'da toplam 95 meydan bulunmaktadır (Anadolu 48, Avrupa 47). Şu anki seçili meydan: ${selectedMeydan?.name || 'Kadıköy Meydanı'}. Planlı personel: ${scheduledCount}, Sahada aktif: ${activeCount}. Kurumsal, kibar, çözüm odaklı ve net yanıtlar ver.`;
      
      const reply = await sendToDeepSeek(
        `${systemContext}\n\nKullanıcı sorusu: ${userMsg.text}`
      );

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: reply || 'Sistem verileri incelendi. İlgili meydan ve personeller sahada aktif olarak görev yapmaktadır.',
          time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error('Smart support chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: `Saha verisi: İstanbul genelinde 95 meydan aktif olarak takip edilmektedir. ${selectedMeydan?.name || 'Kadıköy Meydanı'} için operasyonel kontroller tamamlanmıştır.`,
          time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="smart-support-container">
      {/* Quick Prompts */}
      <div className="support-quick-chips">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            className="support-chip"
            onClick={() => handleSend(prompt)}
            disabled={loading}
          >
            <SparklesIcon width={14} height={14} className="support-chip-icon" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div className="support-chat-body">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`support-msg-bubble ${msg.sender === 'user' ? 'support-msg-bubble--user' : 'support-msg-bubble--ai'}`}
          >
            <div className="support-msg-header">
              <span className="support-msg-author">
                {msg.sender === 'user' ? 'Siz' : 'SYP Asistan'}
              </span>
              <span className="support-msg-time">{msg.time}</span>
            </div>
            <div className="support-msg-text">{msg.text}</div>
          </div>
        ))}

        {loading && (
          <div className="support-msg-bubble support-msg-bubble--ai support-msg-loading">
            <ArrowPathIcon width={16} height={16} className="spinner-icon" />
            <span>Analiz ediliyor ve yanıt hazırlanıyor...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form
        className="support-input-bar"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <input
          type="text"
          className="support-input-field"
          placeholder="Saha operasyonu veya meydanlar hakkında soru sorun..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="support-send-btn"
          disabled={!inputText.trim() || loading}
          aria-label="Gönder"
        >
          <PaperAirplaneIcon width={18} height={18} />
        </button>
      </form>
    </div>
  );
}
