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
  // Une carte par réalisation, avec une ou plusieurs photos dans la visionneuse.
  const projectImages = new WeakMap();
  const visibleFigures = () => Array.from(gallery.querySelectorAll('figure')).filter(
    figure => figure.getClientRects().length && getComputedStyle(figure).visibility !== 'hidden'
  );
  const visiblePhotos = () => visibleFigures().flatMap(figure => {
    const stored = projectImages.get(figure);
    if (stored?.length) return stored;
    const img = figure.querySelector('img');
    if (!img) return [];
    return [{ src: img.currentSrc || img.src, title: figure.querySelector('figcaption')?.textContent || img.alt || '' }];
  });

  const show = index => {
    const photos = visiblePhotos();
    if (!photos.length) return;
    currentIndex = (index + photos.length) % photos.length;
    const photo = photos[currentIndex];
    enlarged.src = photo.src;
    enlarged.alt = photo.title || 'Réalisation LMD Publicité';
    caption.textContent = (photo.title || 'Réalisation LMD Publicité') + ' — ' + (currentIndex + 1) + ' / ' + photos.length;
    prev.hidden = next.hidden = photos.length < 2;
    prev.style.display = next.style.display = photos.length < 2 ? 'none' : 'block';
  };
  const open = (figure, photoOffset = 0) => {
    const figures = visibleFigures();
    if (!figures.includes(figure)) return;
    let index = 0;
    for (const item of figures) {
      if (item === figure) break;
      index += projectImages.get(item)?.length || (item.querySelector('img') ? 1 : 0);
    }
    lastFocused = document.activeElement;
    oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    overlay.hidden = false;
    overlay.style.display = 'flex';
    show(index + photoOffset);
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
    const figure = e.target.closest('figure');
    if (figure && gallery.contains(figure)) {
      const thumb = e.target.closest('[data-photo-offset]');
      open(figure, thumb ? Number(thumb.dataset.photoOffset) || 0 : 0);
    }
  });
  gallery.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const figure = e.target.closest('figure');
    const img = figure?.querySelector('img');
    if (img && gallery.contains(figure) && (e.target === figure || e.target === img || e.target.tagName === 'FIGCAPTION')) { e.preventDefault(); open(figure); }
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
      const normalize = value => {
        const raw = typeof value === 'string' ? value : value?.image;
        if (typeof raw !== 'string' || !raw.trim()) return null;
        try {
          const u = new URL(raw, location.origin);
          return ['http:', 'https:'].includes(u.protocol) ? u.href : null;
        } catch (_) { return null; }
      };
      const primary = normalize(p.image);
      if (!primary) continue;
      const extras = Array.isArray(p.additional_images)
        ? p.additional_images.map(normalize).filter(Boolean)
        : [];
      const figure = document.createElement('figure');
      const img = document.createElement('img');
      const cap = document.createElement('figcaption');
      figure.dataset.category = p.category;
      img.src = primary;
      img.alt = p.title;
      img.loading = 'lazy';
      cap.textContent = p.title;
      figure.append(img, cap);
      projectImages.set(figure, [primary, ...extras].map(src => ({ src, title: p.title })));
      if (extras.length) {
        // Trois miniatures visibles, puis +N si d'autres vues sont disponibles.
        // Chaque miniature ouvre la photo correspondante dans la visionneuse.
        const allPhotos = [primary, ...extras];
        const thumbs = document.createElement('div');
        thumbs.className = 'lmd-project-thumbnails';
        thumbs.style.cssText = 'display:flex;gap:7px;margin-top:10px;align-items:stretch;flex-wrap:wrap;';
        allPhotos.slice(0, 3).forEach((src, index) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.dataset.photoOffset = String(index);
          button.setAttribute('aria-label', 'Voir la photo ' + (index + 1) + ' de ' + p.title);
          button.style.cssText = 'position:relative;display:block;width:66px;height:54px;flex:none;border:1px solid rgba(255,255,255,.3);padding:0;overflow:hidden;background:transparent;border-radius:5px;cursor:zoom-in;';
          const thumbnail = document.createElement('img');
          thumbnail.src = src;
          thumbnail.alt = '';
          thumbnail.loading = 'lazy';
          thumbnail.style.cssText = 'width:100%;height:100%;display:block;object-fit:cover;';
          button.append(thumbnail);
          thumbs.append(button);
        });
        const remaining = allPhotos.length - 3;
        if (remaining > 0) {
          const more = document.createElement('button');
          more.type = 'button';
          more.dataset.photoOffset = '3';
          more.textContent = '+' + remaining;
          more.setAttribute('aria-label', 'Voir les ' + remaining + ' autres photos de ' + p.title);
          more.style.cssText = 'width:66px;height:54px;flex:none;border:1px solid rgba(255,255,255,.3);border-radius:5px;background:rgba(20,20,20,.85);color:white;font:600 18px Arial,sans-serif;cursor:pointer;';
          thumbs.append(more);
        }
        figure.append(thumbs);
      }
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
