/* LMD Publicité — aperçu visuel des sujets dans l'éditeur Decap CMS.
   Ne modifie jamais les données ; le formulaire natif conserve les uploads. */
(function () {
  'use strict';
  if (!window.CMS || !window.createClass || !window.h) {
    console.warn('LMD : aperçu photothèque non initialisé (Decap indisponible).');
    return;
  }
  var h = window.h;
  var labels = {
    enseignes: 'Enseignes & totems',
    vehicules: 'Marquage de véhicules',
    signaletique: 'Signalétique & adhésifs',
    textiles: 'Textiles',
    imprimerie: 'Imprimerie',
    objets: 'Objets publicitaires'
  };
  var css = [
    '.lmd-pv{font-family:Arial,Helvetica,sans-serif;color:#17212b;max-width:1120px;margin:0 auto;padding:20px;background:#f5f7fa;min-height:100vh;box-sizing:border-box}',
    '.lmd-pv *{box-sizing:border-box}',
    '.lmd-pv__top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}',
    '.lmd-pv h1{font-size:23px;line-height:1.2;margin:0}',
    '.lmd-pv__hint{font-size:13px;color:#667280;margin:8px 0 18px;line-height:1.5}',
    '.lmd-pv__tag{font-size:12px;background:#e7edf3;padding:7px 12px;border-radius:20px}',
    '.lmd-pv__filters{display:flex;gap:7px;overflow-x:auto;padding:2px 1px 15px;flex-wrap:wrap}',
    '.lmd-pv__filter{cursor:pointer;white-space:nowrap;font:inherit;font-size:12px;padding:8px 10px;border:1px solid #cad4de;border-radius:9px;background:#fff;color:#30465a}',
    '.lmd-pv__filter[aria-pressed="true"]{background:#233448;color:#fff;border-color:#233448}',
    '.lmd-pv__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:15px}',
    '.lmd-pv__card{background:white;border:1px solid #dfe5ec;border-radius:13px;overflow:hidden;box-shadow:0 3px 10px rgba(0,0,0,.035)}',
    '.lmd-pv__hero{display:block;width:100%;height:150px;object-fit:cover;background:#e6eaee}',
    '.lmd-pv__placeholder{height:150px;display:flex;align-items:center;justify-content:center;color:#788697;background:#e8edf2;font-size:13px}',
    '.lmd-pv__meta{padding:12px}',
    '.lmd-pv__title{font-size:14px;font-weight:700;line-height:1.4;overflow-wrap:anywhere;margin:0 0 5px}',
    '.lmd-pv__category{font-size:12px;color:#657484}',
    '.lmd-pv__thumbs{display:flex;gap:5px;margin-top:10px;overflow:hidden}',
    '.lmd-pv__thumb{height:50px;min-width:0;flex:1;max-width:80px;object-fit:cover;border-radius:5px;background:#e7edf3}',
    '.lmd-pv__more{font-size:12px;background:#e7edf3;border-radius:5px;min-width:44px;display:flex;align-items:center;justify-content:center}',
    '.lmd-pv__empty{padding:28px;text-align:center;color:#657484;background:white;border:1px dashed #cad4de;border-radius:12px}'
  ].join('');

  function plain(value) {
    if (value && typeof value.toJS === 'function') return value.toJS();
    return value;
  }
  function safeImage(value, getAsset) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
      var asset = getAsset(value);
      var url = asset && typeof asset.toString === 'function' ? asset.toString() : String(asset || value);
      // Authorize only normal remote URLs, site-relative images, and Decap preview blobs.
      if (/^(https?:\/\/|\/|blob:)/i.test(url)) return url;
      return '';
    } catch (e) { return ''; }
  }
  var PhotoPreview = window.createClass({
    getInitialState: function () { return { category: 'all' }; },
    choose: function (cat) { this.setState({ category: cat }); },
    render: function () {
      var data = this.props.entry && this.props.entry.get('data');
      var photos = data && typeof data.get === 'function' ? plain(data.get('photos')) : [];
      if (!Array.isArray(photos)) photos = [];
      var category = this.state.category;
      var shown = photos.filter(function (p) {
        return p && (category === 'all' || p.category === category);
      });
      var total = photos.length;
      var self = this;
      var filters = [{ id: 'all', label: 'Toutes' }].concat(Object.keys(labels).map(function (k) { return { id: k, label: labels[k] }; }));
      return h('div', { className: 'lmd-pv' }, [
        h('style', { key: 'style' }, css),
        h('div', { className: 'lmd-pv__top', key: 'top' }, [
          h('h1', { key: 'title' }, 'Photothèque LMD Publicité'),
          h('span', { className: 'lmd-pv__tag', key: 'count' }, total + (total > 1 ? ' sujets' : ' sujet'))
        ]),
        h('p', { className: 'lmd-pv__hint', key: 'hint' }, 'Aperçu actualisé au fur et à mesure de vos modifications. Pour ajouter ou modifier une photo, ouvrez le sujet dans le formulaire à gauche puis enregistrez avec Decap CMS.'),
        h('div', { className: 'lmd-pv__filters', key: 'filters', role: 'group', 'aria-label': 'Filtrer les activités' },
          filters.map(function (f) {
            return h('button', { key: f.id, type: 'button', className: 'lmd-pv__filter', 'aria-pressed': category === f.id, onClick: function () { self.choose(f.id); } }, f.label);
          })
        ),
        shown.length ? h('div', { className: 'lmd-pv__grid', key: 'grid' }, shown.map(function (p, i) {
          var src = safeImage(p.image, self.props.getAsset);
          var extras = Array.isArray(p.additional_images) ? p.additional_images : [];
          var sources = extras.map(function (x) { return safeImage(typeof x === 'string' ? x : x && x.image, self.props.getAsset); }).filter(Boolean);
          var thumbnails = sources.slice(0, 3).map(function (x, k) { return h('img', { key: k, className: 'lmd-pv__thumb', src: x, alt: 'Vue complémentaire ' + (k + 1), loading: 'lazy' }); });
          if (sources.length > 3) thumbnails.push(h('span', { key: 'more', className: 'lmd-pv__more' }, '+' + (sources.length - 3)));
          return h('article', { className: 'lmd-pv__card', key: i }, [
            src ? h('img', { className: 'lmd-pv__hero', src: src, alt: p.title || 'Photo de réalisation', loading: 'lazy', key: 'image' }) : h('div', { className: 'lmd-pv__placeholder', key: 'empty' }, 'Aucune photo'),
            h('div', { className: 'lmd-pv__meta', key: 'meta' }, [
              h('p', { className: 'lmd-pv__title', key: 'title' }, p.title || 'Sujet sans titre'),
              h('div', { className: 'lmd-pv__category', key: 'category' }, (labels[p.category] || 'Sans catégorie') + ' · ' + (sources.length + (src ? 1 : 0)) + ' photo(s)'),
              sources.length ? h('div', { className: 'lmd-pv__thumbs', key: 'thumbs' }, thumbnails) : null
            ])
          ]);
        })) : h('div', { className: 'lmd-pv__empty', key: 'none' }, 'Aucun sujet dans cette activité.')
      ]);
    }
  });
  window.CMS.registerPreviewTemplate('galerie', PhotoPreview);
})();
