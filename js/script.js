/* Vanilla JavaScript: без библиотеки и без мрежно испраќање. */
'use strict';
const english = document.documentElement.lang === 'en';
const text = (mk, en) => english ? en : mk;
const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* Приватниот режим може да го блокира складирањето. */ } },
  remove(key) { try { localStorage.removeItem(key); } catch { /* Страницата работи и без складирање. */ } }
};
const consentKey = 'dolphin-consent-v1';
let consent = null;
try { consent = JSON.parse(storage.get(consentKey)); } catch { consent = null; }
if (!consent || !['necessary', 'preferences'].includes(consent.choice) || !(consent.expires > Date.now())) {
  consent = null;
  storage.remove(consentKey);
  storage.remove('dolphin-theme');
}
const savedTheme = consent?.choice === 'preferences' ? storage.get('dolphin-theme') : null;
if (['dark', 'light'].includes(savedTheme)) document.documentElement.dataset.theme = savedTheme;
const banner = document.querySelector('#consent');
banner.hidden = Boolean(consent);
document.querySelector('#cookie-settings').addEventListener('click', () => {
  banner.hidden = false;
  banner.querySelector('button').focus();
});
document.querySelectorAll('[data-consent]').forEach(button => button.addEventListener('click', () => {
  consent = { choice: button.dataset.consent, expires: Date.now() + 180 * 86400000 };
  storage.set(consentKey, JSON.stringify(consent));
  if (consent.choice === 'necessary') storage.remove('dolphin-theme');
  else storage.set('dolphin-theme', document.documentElement.dataset.theme || 'dark');
  banner.hidden = true;
}));
document.querySelector('#theme').addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  if (consent?.choice === 'preferences') storage.set('dolphin-theme', theme);
});
const menu = document.querySelector('#menu');
const navigation = document.querySelector('#navigation');
function closeMenu() { navigation.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }
menu.addEventListener('click', () => {
  const open = navigation.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
});
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
document.addEventListener('click', event => { if (!event.target.closest('header')) closeMenu(); });
window.addEventListener('resize', () => { if (window.innerWidth > 820) closeMenu(); });
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  document.querySelectorAll('[data-category]').forEach(figure => { figure.hidden = button.dataset.filter !== 'all' && figure.dataset.category !== button.dataset.filter; });
}));
const lightbox = document.querySelector('#lightbox');
document.querySelectorAll('[data-lightbox]').forEach(link => link.addEventListener('click', event => {
  if (!lightbox.showModal) return; // Постарите прелистувачи ја отвораат самата слика.
  event.preventDefault();
  lightbox.querySelector('img').src = link.href;
  lightbox.querySelector('img').alt = link.dataset.caption;
  lightbox.querySelector('p').textContent = link.dataset.caption;
  lightbox.showModal();
}));
document.querySelector('#close-lightbox').addEventListener('click', () => lightbox.close());
lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
const form = document.querySelector('#contact-form');
if (form) {
  let downloadUrl = null;
  const download = document.querySelector('#download-enquiry');
  function clearDownload() {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = null; download.hidden = true; download.removeAttribute('href');
    document.querySelector('#form-status').textContent = '';
  }
  // Без JavaScript формата е оневозможена преку HTML noscript стил, за да нема GET испраќање.
  form.addEventListener('input', clearDownload);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const body = ['Dolphin Detailing — DEMO / НЕ Е ИСПРАТЕНО', ...['name', 'email', 'phone', 'service', 'message'].map(key => `${key}: ${data.get(key) || ''}`)].join('\n\n');
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = URL.createObjectURL(new Blob([body], { type: 'text/plain;charset=utf-8' }));
    download.href = downloadUrl; download.hidden = false;
    document.querySelector('#form-status').textContent = text('Барањето е проверено. НЕ е испратено. Преземете го или јавете се за термин.', 'Enquiry validated. It has NOT been sent. Download it or call to book.');
  });
  window.addEventListener('pagehide', () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); });
}
