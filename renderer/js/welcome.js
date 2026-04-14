'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   welcome.js — Automated Genesis Protocol Slideshow
   ═══════════════════════════════════════════════════════════════════════════ */

window.WelcomeModule = (() => {
  let currentSlide = 0;
  let timer = null;
  const slideInterval = 8000; // 8 seconds per slide

  const slides = document.querySelectorAll('.genesis-slide');
  const dots   = document.querySelectorAll('.g-dot');

  function showSlide(index) {
    if (index >= slides.length) {
      if (timer) clearInterval(timer);
      timer = null;
      return;
    }
    if (index < 0) return;

    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));

    currentSlide = index;
    
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
    
    resetTimer();
  }

  function nextSlide() { showSlide(currentSlide + 1); }
  function prevSlide() { showSlide(currentSlide - 1); }

  function resetTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(nextSlide, slideInterval);
  }

  function init() {
    // Buttons
    document.getElementById('g-next').addEventListener('click', nextSlide);
    document.getElementById('g-prev').addEventListener('click', prevSlide);

    document.getElementById('btn-enter-protocol').addEventListener('click', () => window.navigateTo('dashboard'));
    document.getElementById('btn-skip-genesis').addEventListener('click', () => window.navigateTo('dashboard'));

    // Dots
    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => showSlide(idx));
    });

    resetTimer();
  }

  return { init, showSlide };
})();

// Auto-init if the welcome page is active
window.addEventListener('load', () => {
  if (window.AppState && window.AppState.currentPage === 'welcome') {
    window.WelcomeModule.init();
  }
});
