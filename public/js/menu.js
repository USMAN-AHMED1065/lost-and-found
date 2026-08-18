document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');
  const overlay = document.getElementById('nav-overlay');

  if (!menuToggle || !navLinks || !overlay) return;

  function openMenu() {
    navLinks.classList.add('open');
    overlay.classList.add('active');
  }
  function closeMenu() {
    navLinks.classList.remove('open');
    overlay.classList.remove('active');
  }

  menuToggle.addEventListener('click', openMenu);
  overlay.addEventListener('click', closeMenu);

  // Close the menu automatically after tapping any link inside it
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });
});