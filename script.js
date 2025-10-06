// DIMA BIMA — script.js
document.addEventListener('DOMContentLoaded', () => {
  // Year in footer
  document.getElementById('year').textContent = new Date().getFullYear();

  // Mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  toggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  // Tarot card flip + random message
  const tarotBtn = document.querySelector('.tarot-card');
  const tarotText = document.getElementById('tarot-text');
  const messages = [
    "Наше сотрудничество принесёт ясность.",
    "В тепле внимания рождаются решения.",
    "Горизонталь — когда каждый слышим.",
    "Игрой и заботой мы строим будущее.",
    "Технологии становятся человечными рядом с нами.",
    "Сегодня — лучший день начать разговор.",
    "Тихая смелость ведёт к большим переменам.",
    "Уважение — главный инструмент медиатора.",
    "Детское творчество — мотор общих смыслов.",
    "Мы уже команда. Просто напиши «привет»."
  ];
  tarotBtn?.addEventListener('click', () => {
    const msg = messages[Math.floor(Math.random()*messages.length)];
    tarotText.textContent = msg;
    tarotBtn.classList.toggle('flipped');
  });

  // Share API fallback
  const shareBtn = document.getElementById('share-btn');
  shareBtn?.addEventListener('click', async () => {
    const shareData = {
      title: document.title,
      text: "Посмотри сайт Димы — фасилитатора будущего.",
      url: location.href
    };
    if (navigator.share) {
      try { await navigator.share(shareData); }
      catch { /* silently ignore */ }
    } else {
      await navigator.clipboard.writeText(shareData.url);
      shareBtn.textContent = "Ссылка скопирована";
      setTimeout(()=>shareBtn.textContent="Поделиться страницей", 1500);
    }
  });

  // Contact form -> mailto draft
  const form = document.getElementById('contact-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();
    const subject = encodeURIComponent("Запрос с dima-bima.ru");
    const body = encodeURIComponent(`Имя: ${name}
Контакт: ${email}
Сообщение:
${message}`);
    // TODO: Replace with your email
    const to = "hello@example.com";
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  });

  // Content JSON (optional dynamic copy)
  fetch('content.json')
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if(!data) return;
      // Example of dynamic replace (can be extended easily)
      const lead = document.querySelector('.lead');
      if (data.hero_subtitle) lead.textContent = data.hero_subtitle;
      if (data.cta_label) {
        const cta = document.querySelector('.nav .cta');
        if (cta) cta.textContent = data.cta_label;
      }
    })
    .catch(()=>{});
});
