/* ==========================================================================
   Courbe du design system : le tracé commun aux pages de résultats
   (campagne, automatisation, liens magiques). Aide de maquette : dans l'app,
   prendre la bibliothèque de graphiques en place et lui appliquer les règles
   de la page « Données » (courbe lissée sans dépassement, échelle à pas ronds,
   repère du point survolé, flèches du clavier).

   KanalCourbe.tracer(zone, {
     valeurs: [..],                 une valeur par point
     etiquettes: [..],              ce que dit la bulle pour chaque point (« sam. 14 nov., 10 h »)
     dates: [..],                   texte de l'axe pour chaque point (seuls quelques-uns sont écrits)
     nom: 'Lectures',               le nom de la série, dans la bulle
     format: (n) => '…',            une valeur en clair
     axe: (n) => '…',               facultatif : un repère de l'axe, s'il s'écrit autrement
     hauteur: 200, sansZero: false  facultatifs
   })
   La zone est une .k-chart. Rappeler tracer() remplace le tracé ; il se refait seul quand la largeur change.
   ========================================================================== */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  let fondus = 0;   // un dégradé par tracé : son identifiant doit être unique dans la page
  const svg = (nom, attrs, parent) => {
    const el = document.createElementNS(NS, nom);
    Object.keys(attrs || {}).forEach((k) => el.setAttribute(k, attrs[k]));
    if (parent) parent.appendChild(el);
    return el;
  };
  // Une échelle à pas ronds (1, 2, 2,5, 5 ou 10 fois une puissance de dix), en quatre intervalles environ
  function echelle(min, max) {
    const brut = (max - min) / 4 || 1, p = Math.pow(10, Math.floor(Math.log10(brut))), n = brut / p;
    const pas = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
    const bas = Math.floor(min / pas) * pas, haut = Math.ceil(max / pas) * pas || pas, reperes = [];
    for (let k = 0; bas + k * pas <= haut + pas / 1000; k++) reperes.push(Math.round((bas + k * pas) * 100) / 100);
    return { bas, haut, reperes };
  }
  // Courbe lissée qui ne dépasse jamais ses points (interpolation cubique monotone)
  function lisser(p) {
    const n = p.length, c = (v) => v.toFixed(1);
    if (n < 3) return p.map((q, i) => `${i ? 'L' : 'M'}${c(q[0])} ${c(q[1])}`).join(' ');
    const m = [], t = [];
    for (let i = 0; i < n - 1; i++) m[i] = (p[i + 1][1] - p[i][1]) / (p[i + 1][0] - p[i][0]);
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : 2 * m[i - 1] * m[i] / (m[i - 1] + m[i]);
    let d = `M${c(p[0][0])} ${c(p[0][1])}`;
    for (let i = 0; i < n - 1; i++) {
      const h = (p[i + 1][0] - p[i][0]) / 3;
      d += ` C${c(p[i][0] + h)} ${c(p[i][1] + t[i] * h)} ${c(p[i + 1][0] - h)} ${c(p[i + 1][1] - t[i + 1] * h)} ${c(p[i + 1][0])} ${c(p[i + 1][1])}`;
    }
    return d;
  }

  function dessiner(zone, anime) {
    const o = zone.__courbe.options, v = o.valeurs, dernier = v.length - 1;
    zone.textContent = ''; zone.__courbe.repere = null;
    if (!zone.clientWidth || dernier < 1) return;
    const L = Math.max(280, zone.clientWidth), H = o.hauteur || 200, haut = 8, bas = 24, droite = 8;
    const axe = o.axe || o.format, e = echelle(o.sansZero ? Math.min(...v) : 0, Math.max(...v));
    const max = v.indexOf(Math.max(...v));
    const dessin = svg('svg', { viewBox: `0 0 ${L} ${H}`, width: L, height: H, role: 'img',
      'aria-label': `${o.nom}. Maximum : ${o.format(v[max])}, ${o.etiquettes[max]}. Dernier point : ${o.format(v[dernier])}.` }, zone);
    // Les libellés de l'axe d'abord : leur largeur réelle fixe la marge de gauche
    const libelles = e.reperes.map((r) => { const t = svg('text', { 'text-anchor': 'end' }, dessin); t.textContent = axe(r); return t; });
    const gauche = Math.ceil(Math.max(...libelles.map((t) => t.getComputedTextLength() || t.textContent.length * 7))) + 10;
    const pasX = (L - gauche - droite) / dernier, x = (i) => gauche + i * pasX;
    const y = (val) => haut + (e.haut - val) / (e.haut - e.bas) * (H - haut - bas);
    e.reperes.forEach((r, k) => {
      svg('line', { class: 'k-chart__grid', x1: gauche, x2: L - droite, y1: y(r), y2: y(r) }, dessin);
      libelles[k].setAttribute('x', gauche - 10); libelles[k].setAttribute('y', y(r) + 4);
    });
    const ligne = lisser(v.map((val, i) => [x(i), y(val)]));
    {
      // L'aire : un dégradé du bleu (au ras de la courbe) à presque rien (en bas). Voir .k-chart__fade-top et -bottom.
      // Toujours là, même quand l'axe ne part pas de zéro : elle descend alors jusqu'au bas de l'échelle.
      const id = 'k-fondu-' + (++fondus), fondu = svg('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, svg('defs', {}, dessin));
      svg('stop', { offset: 0, class: 'k-chart__fade-top' }, fondu); svg('stop', { offset: 1, class: 'k-chart__fade-bottom' }, fondu);
      svg('path', { class: 'k-chart__area', style: `fill:url(#${id})`, d: `${ligne} L${x(dernier).toFixed(1)} ${y(e.bas)} L${x(0)} ${y(e.bas)} Z` }, dessin);
    }
    svg('path', { class: 'k-chart__line', d: ligne, pathLength: 1 }, dessin);
    if (anime) dessin.setAttribute('data-draw', '');   // la courbe se dessine : voir .k-chart svg[data-draw]
    // Une date tous les n points, en partant du dernier : il est toujours écrit
    const pasDates = dernier <= 7 ? 1 : Math.ceil(dernier / 6);
    for (let i = dernier; i >= 0; i -= pasDates) {
      svg('text', { x: x(i), y: H - 4, 'text-anchor': i === dernier ? 'end' : i === 0 ? 'start' : 'middle' }, dessin).textContent = o.dates[i];
    }
    const curseur = svg('line', { class: 'k-chart__cursor', y1: haut, y2: H - bas, visibility: 'hidden' }, dessin);
    const point = svg('circle', { class: 'k-chart__point', r: 4, visibility: 'hidden' }, dessin);
    const bulle = document.createElement('div'); bulle.className = 'k-chart__tip'; bulle.hidden = true;
    bulle.innerHTML = '<div class="k-chart__tip-title"></div><div class="k-chart__tip-row"><span></span><b></b></div>';
    zone.appendChild(bulle);
    zone.__courbe.repere = { L, gauche, pasX, dernier, x, y, curseur, point, bulle, i: null };
  }
  // Le repère du point survolé : un trait, un point sur la courbe, et la valeur dans une bulle qui reste dans la zone
  function pointer(zone, i) {
    const r = zone.__courbe.repere, o = zone.__courbe.options; if (!r) return;
    r.i = i;
    const visible = i !== null;
    r.curseur.setAttribute('visibility', visible ? 'visible' : 'hidden'); r.point.setAttribute('visibility', visible ? 'visible' : 'hidden');
    r.bulle.hidden = !visible;
    if (!visible) return;
    const val = o.valeurs[i];
    r.curseur.setAttribute('x1', r.x(i)); r.curseur.setAttribute('x2', r.x(i));
    r.point.setAttribute('cx', r.x(i)); r.point.setAttribute('cy', r.y(val));
    r.bulle.firstChild.textContent = o.etiquettes[i];
    r.bulle.lastChild.firstChild.textContent = o.nom; r.bulle.lastChild.lastChild.textContent = o.format(val);
    const demi = r.bulle.offsetWidth / 2;
    r.bulle.style.left = Math.min(r.L - demi, Math.max(demi, r.x(i))) + 'px';
    r.bulle.style.top = r.y(val) + 'px';
  }
  function preparer(zone) {
    zone.__courbe = { options: null, repere: null, largeur: 0 };
    zone.tabIndex = 0;
    zone.addEventListener('pointermove', (e) => {
      const r = zone.__courbe.repere; if (!r) return;
      pointer(zone, Math.min(r.dernier, Math.max(0, Math.round((e.clientX - zone.getBoundingClientRect().left - r.gauche) / r.pasX))));
    });
    zone.addEventListener('pointerleave', () => pointer(zone, null));
    // Au clavier : la courbe prend le focus, les flèches passent d'un point à l'autre
    zone.addEventListener('keydown', (e) => {
      const r = zone.__courbe.repere; if (!r || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const i = r.i === null ? r.dernier : r.i;
      pointer(zone, e.key === 'Home' ? 0 : e.key === 'End' ? r.dernier : Math.min(r.dernier, Math.max(0, i + (e.key === 'ArrowLeft' ? -1 : 1))));
    });
    zone.addEventListener('blur', () => pointer(zone, null));
    // Tracée à la largeur réelle de la zone : on la refait quand cette largeur change (ou quand la zone apparaît)
    new ResizeObserver(() => { const l = zone.clientWidth; if (l && l !== zone.__courbe.largeur && zone.__courbe.options) { zone.__courbe.largeur = l; dessiner(zone); } }).observe(zone);
  }
  // Des entiers dont la somme fait exactement le total : pour des séries de démonstration qui recoupent les chiffres affichés
  function repartir(total, poids) {
    const somme = poids.reduce((a, b) => a + b, 0); let reste = total;
    const v = poids.map((p) => { const n = Math.round(total * p / somme); reste -= n; return n; });
    v[poids.indexOf(Math.max(...poids))] += reste; return v;
  }

  window.KanalCourbe = {
    tracer(zone, options) {
      if (!zone.__courbe) preparer(zone);
      zone.__courbe.options = options; zone.__courbe.largeur = zone.clientWidth;
      dessiner(zone, true);
    },
    repartir
  };
})();
