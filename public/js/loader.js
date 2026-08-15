// Hide the loader once this page has fully finished loading
window.addEventListener('load', function () {
  var loader = document.getElementById('page-loader');
  if (loader) {
    loader.classList.add('hidden');
  }
});

// Show the loader again the moment the user clicks a link to leave this page
document.addEventListener('click', function (event) {
  var link = event.target.closest('a');
  if (!link) return;
  if (!link.href) return;
  if (link.target === '_blank') return;
  if (link.href.indexOf('tel:') === 0) return;
  if (link.href.indexOf('https://wa.me') === 0) return;
  if (link.getAttribute('href') === '#') return;

  var loader = document.getElementById('page-loader');
  if (loader) {
    loader.classList.remove('hidden');
  }
});

// Also show the loader when a form is submitted (e.g. login, submit post)
document.addEventListener('submit', function () {
  var loader = document.getElementById('page-loader');
  if (loader) {
    loader.classList.remove('hidden');
  }
});