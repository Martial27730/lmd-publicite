(async () => {
  const main = document.querySelector('main');
  const gallery = main?.querySelector('.gallery');
  if (!gallery) return;

  const page = location.pathname.split('/').pop().replace(/\.html$/, '') || 'index';
  const categories = ['enseignes', 'vehicules', 'signaletique', 'textiles', 'imprimerie', 'objets'];

  // Visionneuse accessible : navigation clavier, fermeture et retour du focus.
  const overlay = document.createElement('div');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Photo agrandie');
  overlay.hidden = true;
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.94);display:none;align-items:center;justify-content:center;padding:60px 55px;box-sizing:border-box;';
  const enlarged = document.createElement('img');
  enlarged.style.cssText = 'display:block;max-width:100%;max-height:calc(100vh - 140px);object-fit:contain;';
  const close = document.createElement('button');
  const prev = document.createElement('button');
  const next = document.createElement('button');
  const caption = document.createElement('div');
  const commonButton = 'position:absolute;border:0;background:rgba(20,20,20,.6);color:#fff;font:32px/1 Arial,sans-serif;cursor:pointer;border-radius:6px;padding:8px 13px;';
  close.type = prev.type = next.type = 'button';
  close.setAttribute('aria-label', 'Fermer la photo');
  prev.setAttribute('aria-label', 'Photo précédente');
  next.setAttribute('aria-label', 'Photo suivante');
  close.textContent = '×';
  prev.textContent = '‹';
  next.textContent = '›';
  close.style.cssText = commonButton + 'top:12px;right:15px;';
  prev.style.cssText = commonButton + 'left:8px;top:50%;transform:translateY(-50%);';
  next.style.cssText = commonButton + 'right:8px;top:50%;transform:translateY(-50%);';
  caption.style.cssText = 'position:absolute;bottom:14px;left:50%;transform:translateX(-50%);width:calc(100% - 40px);text-align:center;color:white;font:16px/1.4 Arial,sans-serif;';
  overlay.append(enlarged, close, prev, next, caption);
  document.body.append(overlay);

  let currentIndex = -1;
  let lastFocused = null;
  let oldOverflow = '';
  const visibleImages = () => Array.from(gallery.querySelectorAll('figure')).filter(
    figure => figure.getClientRects().length && getComputedStyle(figure).visibility !== 'hidden'
  ).map(figure => figure.querySelector('img')).filter(Boolean);

  const show = (index) => {
    const images = visibleImages();
    if (!images.length) return;
    currentIndex = (index + images.length) % images.length;
    const source = images[currentIndex];
    enlarged.src = source.currentSrc || source.src;
    enlarged.alt = source.alt || 'Réalisation LMD Publicité';
    caption.textContent = source.closest('figure')?.querySelector('figcaption')?.textContent || source.alt || '';
    prev.hidden = next.hidden = images.length < 2;
    prev.style.display = next.style.display = images.length < 2 ? 'none' : 'block';
  };
  const open = (img) => {
    const images = visibleImages();
    const index = images.indexOf(img);
    if (index < 0) return;
    lastFocused = document.activeElement;
    oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    overlay.hidden = false;
    overlay.style.display = 'flex';
    show(index);
    close.focus();
  };
  const dismiss = () => {
    overlay.hidden = true;
    overlay.style.display = 'none';
    enlarged.removeAttribute('src');
    document.body.style.overflow = oldOverflow;
    if (lastFocused?.isConnected) lastFocused.focus();
  };
  close.addEventListener('click', dismiss);
  prev.addEventListener('click', () => show(currentIndex - 1));
  next.addEventListener('click', () => show(currentIndex + 1));
  overlay.addEventListener('click', e => { if (e.target === overlay) dismiss(); });
  document.addEventListener('keydown', e => {
    if (overlay.hidden) return;
    if (e.key === 'Escape') dismiss();
    else if (e.key === 'ArrowLeft') show(currentIndex - 1);
    else if (e.key === 'ArrowRight') show(currentIndex + 1);
    else if (e.key === 'Tab') {
      const controls = [close, prev, next].filter(button => !button.hidden);
      const index = controls.indexOf(document.activeElement);
      if (e.shiftKey && index <= 0) { e.preventDefault(); controls.at(-1).focus(); }
      else if (!e.shiftKey && index === controls.length - 1) { e.preventDefault(); controls[0].focus(); }
    }
  });
  gallery.addEventListener('click', e => {
    const img = e.target.closest('figure img');
    if (img && gallery.contains(img)) open(img);
  });
  gallery.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const figure = e.target.closest('figure');
    const img = figure?.querySelector('img');
    if (img && gallery.contains(figure)) { e.preventDefault(); open(img); }
  });
  const activateGalleryPhotos = () => {
    gallery.querySelectorAll('figure').forEach(figure => {
      figure.tabIndex = 0;
      figure.setAttribute('role', 'button');
      figure.setAttribute('aria-label', 'Agrandir : ' + (figure.querySelector('img')?.alt || 'photo'));
      figure.style.cursor = 'zoom-in';
    });
  };
  activateGalleryPhotos();

  try {
    const res = await fetch('/contenu/galerie.json');
    if (!res.ok) return;
    const { photos } = await res.json();
    if (!Array.isArray(photos)) return;
    let list = photos.filter(p => p && typeof p.title === 'string' && typeof p.image === 'string' && categories.includes(p.category));
    if (categories.includes(page)) list = list.filter(p => p.category === page);
    if (page === 'index') list = list.slice(0, 6);
    gallery.replaceChildren();
    for (const p of list) {
      const u = new URL(p.image, location.origin);
      if (!['http:', 'https:'].includes(u.protocol)) continue;
      const figure = document.createElement('figure');
      const img = document.createElement('img');
      const cap = document.createElement('figcaption');
      figure.dataset.category = p.category;
      img.src = u.href;
      img.alt = p.title;
      img.loading = 'lazy';
      cap.textContent = p.title;
      figure.append(img, cap);
      gallery.append(figure);
    }
    activateGalleryPhotos();
    const active = main.querySelector('[data-filter][aria-pressed=true]');
    if (active) active.click();
    if (!gallery.children.length && !active) {
      const msg = document.createElement('p');
      msg.textContent = 'Les photos de cette activité seront ajoutées prochainement.';
      gallery.append(msg);
    }
  } catch (e) {
    console.warn('Galerie indisponible', e);
  }
})();
