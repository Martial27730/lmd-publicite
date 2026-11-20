
(async () => {
  try {
    const response = await fetch('/contenu/accueil.json', {
      cache: 'no-cache'
    });

    if (!response.ok) return;

    const data = await response.json();

    function texte(selecteur, valeur) {
      const element = document.querySelector(selecteur);
      if (element && typeof valeur === 'string') {
        element.textContent = valeur;
      }
    }

    texte('.hero .eyebrow', data.accroche);
    texte('.hero p', data.description);
    texte('.hero .btn', data.bouton);

    const titre = document.querySelector('.hero h1');

    if (titre && typeof data.titre === 'string' &&
        typeof data.soustitre === 'string') {
      titre.replaceChildren(
        document.createTextNode(data.titre),
        document.createElement('br'),
        document.createTextNode(data.soustitre)
      );
    }

    const image = document.querySelector('.hero img');

    if (image && data.image) {
      const url = new URL(data.image, location.origin);
      if (['http:', 'https:'].includes(url.protocol)) {
        image.src = url.href;
      }
    }

    if (image && typeof data.image_alt === 'string') {
      image.alt = data.image_alt;
    }

    texte('#prestations h2', data.prestations_titre);
    texte('#realisations h2', data.realisations_titre);
    texte('#contact h2', data.contact_titre);

    const categories = [
      'enseignes',
      'vehicules',
      'signaletique',
      'textiles',
      'imprimerie',
      'objets'
    ];

    categories.forEach(categorie => {
      const prestation = data.prestations?.[categorie];

      const lien = document.querySelector(
        `#prestations .card a[href="${categorie}.html"]`
      );

      const carte = lien?.closest('.card');

      if (!carte || !prestation) return;

      const titre = carte.querySelector('b');
      const description = carte.querySelector('p');

      if (titre && typeof prestation.titre === 'string') {
        titre.textContent = prestation.titre;
      }

      if (description &&
          typeof prestation.description === 'string') {
        description.textContent = prestation.description;
      }
    });

  } catch (error) {
    console.warn('Contenu indisponible', error);
  }
})();
