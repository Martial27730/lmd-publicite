/* LMD Publicité : agrandissement des photos des cartes de prestations.
   N'affecte ni les liens "Découvrir", ni les galeries des réalisations. */
(() => {
  'use strict';
  const style = document.createElement('style');
  style.textContent = `
    #prestations .card img { cursor: zoom-in; }
    .lmd-modal-photo { position: fixed; inset: 0; z-index: 99999;
      display: flex; justify-content: center; align-items: center;
      padding: 56px 22px 24px; background: rgba(0,0,0,.92); }
    .lmd-modal-photo[hidden] { display: none; }
    .lmd-modal-photo img { display:block; max-width: 100%; max-height: 100%;
      width: auto; height: auto; object-fit: contain; border-radius: 5px; }
    .lmd-modal-fermer { position: absolute; right: 14px; top: 10px;
      color: white; background: rgba(255,255,255,.12); border: 1px solid #777;
      border-radius: 50%; width: 42px; height: 42px; cursor: pointer;
      font: 30px/38px Arial,sans-serif; text-align:center; }
    .lmd-modal-fermer:focus-visible, #prestations .card img:focus-visible {
      outline: 3px solid #f8cc49; outline-offset: 3px; }
  `;
  document.head.appendChild(style);

  const modal = document.createElement('div');
  modal.className = 'lmd-modal-photo';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Photo agrandie');
  modal.hidden = true;
  const close = document.createElement('button');
  close.className = 'lmd-modal-fermer';
  close.type = 'button';
  close.setAttribute('aria-label', 'Fermer la photo');
  close.textContent = '×';
  const large = document.createElement('img');
  modal.append(close, large);
  document.body.appendChild(modal);
  let lastFocus = null;
  let previousOverflow = '';
  function fermer() {
    if (modal.hidden) return;
    modal.hidden = true;
    large.removeAttribute('src');
    document.body.style.overflow = previousOverflow;
    if (lastFocus && lastFocus.isConnected) lastFocus.focus();
  }
  function ouvrir(img) {
    lastFocus = img;
    large.src = img.currentSrc || img.src;
    large.alt = img.alt || 'Photographie de prestation LMD Publicité';
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modal.hidden = false;
    close.focus();
  }
  // Délégation : fonctionne aussi pour les images ajoutées après chargement du JSON.
  document.addEventListener('click', (event) => {
    const img = event.target.closest?.('#prestations .card img');
    if (!img || !img.getAttribute('src')) return;
    event.preventDefault();
    event.stopPropagation();
    ouvrir(img);
  });
  document.addEventListener('keydown', (event) => {
    if (!modal.hidden && event.key === 'Escape') fermer();
    if (!modal.hidden && event.key === 'Tab') {
      event.preventDefault();
      close.focus();
    }
    if (modal.hidden && (event.key === 'Enter' || event.key === ' ') &&
        document.activeElement.matches?.('#prestations .card img')) {
      event.preventDefault();
      ouvrir(document.activeElement);
    }
  });
  // Permet l'ouverture au clavier pour les images non interactives.
  const observer = new MutationObserver(() => {
    document.querySelectorAll('#prestations .card img').forEach(img => {
      if (!img.hasAttribute('tabindex')) img.tabIndex = 0;
      if (!img.hasAttribute('role')) img.setAttribute('role', 'button');
      if (!img.hasAttribute('aria-label')) img.setAttribute('aria-label', 'Agrandir : ' + (img.alt || 'photo de prestation'));
    });
  });
  const prestations = document.querySelector('#prestations');
  if (prestations) {
    observer.observe(prestations, { childList: true, subtree: true });
    prestations.querySelectorAll('.card img').forEach(img => {
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', 'Agrandir : ' + (img.alt || 'photo de prestation'));
    });
  }
  close.addEventListener('click', fermer);
  modal.addEventListener('click', event => { if (event.target === modal) fermer(); });
})();
