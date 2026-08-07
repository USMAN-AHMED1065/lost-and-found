document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const phone = btn.getAttribute('data-phone');
      navigator.clipboard.writeText(phone)
        .then(() => {
          const original = btn.textContent;
          btn.textContent = '✅ Copied!';
          setTimeout(() => { btn.textContent = original; }, 1500);
        })
        .catch(err => console.error('Copy failed:', err));
    });
  });
});
document.addEventListener('DOMContentLoaded', () => {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeBtn = document.getElementById('lightbox-close');

  document.querySelectorAll('.post-card img').forEach(img => {
    img.addEventListener('click', () => {
      lightboxImg.src = img.src;
      lightbox.classList.add('active');
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => lightbox.classList.remove('active'));
  }
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) lightbox.classList.remove('active');
    });
  }
});