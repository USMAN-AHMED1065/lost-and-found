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