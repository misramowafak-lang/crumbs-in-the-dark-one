'use strict';

// Mobile navigation
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
menuToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
}));

// Entity and location detail modal
const modal = document.getElementById('detailModal');
const closeModal = () => { modal.classList.remove('show'); modal.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; };
function openDetails(card, isMonster) {
  const title = card.dataset.title;
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalRole').textContent = isMonster ? card.dataset.role : 'معلومات الموقع';
  document.getElementById('modalDescription').textContent = card.dataset.desc;
  const image = document.getElementById('modalImage'); image.src = card.dataset.image; image.alt = title;
  const abilities = document.getElementById('modalAbilities'); abilities.replaceChildren();
  if (isMonster && card.dataset.abilities) {
    card.dataset.abilities.split('|').forEach(item => {
      const row = document.createElement('span'); row.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
      row.append(document.createTextNode(item)); abilities.append(row);
    });
  } else {
    const row = document.createElement('span'); row.innerHTML = '<i class="fa-solid fa-crosshairs"></i> Objective: explore, complete the tasks, and find the exit.'; abilities.append(row);
  }
  modal.classList.add('show'); modal.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
}
document.querySelectorAll('.monster-card').forEach(card => {
  card.addEventListener('click', () => openDetails(card, true));
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetails(card, true); } });
});
document.querySelectorAll('.world-card').forEach(card => {
  card.addEventListener('click', () => openDetails(card, false));
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetails(card, false); } });
});
document.querySelector('.modal-close').addEventListener('click', closeModal);
document.querySelector('.modal-backdrop').addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// Supabase Edge Function endpoint. Public project URL is safe to expose; never put service-role keys here.
const SUPABASE_SUBSCRIBE_ENDPOINT = 'https://huejpnjwciemevyuwqtv.supabase.co/functions/v1/subscribe';
const subscribeForm = document.getElementById('subscribeForm');
const emailInput = document.getElementById('emailInput');
const formMessage = document.getElementById('formMessage');
subscribeForm.addEventListener('submit', async event => {
  event.preventDefault();
  const email = emailInput.value.trim().toLowerCase();
  formMessage.classList.remove('error');
  if (!emailInput.checkValidity()) {
    formMessage.textContent = 'يرجى إدخال بريد إلكتروني صحيح.'; formMessage.classList.add('error'); return;
  }
  const submitButton = subscribeForm.querySelector('button');
  const original = submitButton.innerHTML;
  submitButton.disabled = true; submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جارٍ الإرسال...';
  formMessage.textContent = '';
  try {
    // text/plain is a CORS-safelisted content type. It avoids the browser's JSON preflight OPTIONS request.
    const response = await fetch(SUPABASE_SUBSCRIBE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({ email })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Subscription failed (${response.status}).`);
    formMessage.textContent = payload.message || 'تم تسجيل بريدك بنجاح. سنراسلك عند إطلاق اللعبة.';
    subscribeForm.reset();
  } catch (error) {
    console.error('CRUMBS subscription error:', error);
    formMessage.textContent = error.message.includes('Failed to fetch')
      ? 'تعذر الاتصال بخادم التسجيل. حاول مرة أخرى بعد قليل.'
      : error.message;
    formMessage.classList.add('error');
  } finally {
    submitButton.disabled = false; submitButton.innerHTML = original;
  }
});

// Reveal subtle entrance motion when sections enter the viewport
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); }
  }), { threshold: 0.12 });
  document.querySelectorAll('.section-heading,.intro-main,.feature-list>div,.monster-card,.world-card').forEach(el => observer.observe(el));
}
console.info('%c CRUMBS IN THE DARK ', 'background:#ed1b2f;color:#fff;padding:7px 12px;font-weight:900');
