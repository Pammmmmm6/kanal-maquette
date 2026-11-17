/* ==========================================================================
   Accueil Kanal dans le design system. Script de la page accueil.html.
   Repères [A0]…[A13] : voir les notes en tête de la page, et INTEGRATION.md §5.

   Trois états, selon deux signaux de l'app : « un agent IA est connecté au
   MCP » puis « le compte est configuré ». Ici, on passe de l'un à l'autre
   avec les trois icônes du coin en haut à droite [A0], qui ne sont pas à porter.
   ========================================================================== */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const F = ' ';   // espace fine insécable
  const page = $('[data-ac-page]');

  const ACCROCHES = {
    1: 'Prêt à découvrir le marketing WhatsApp ?',
    2: 'Votre agent IA est connecté. Il ne reste qu’à configurer votre compte.',
    3: ''   // compte actif : pas d'accroche, les chiffres parlent
  };

  // [A3] Salutation selon l'heure. Les seuils existent déjà dans l'app : garder les siens.
  const h = new Date().getHours();
  $('[data-ac-salut]').textContent = (h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir') + ', Camille';

  // [A12] Données de démonstration --------------------------------------------
  // 217 jours, du 14 avr. au 16 nov. 2026 (« aujourd'hui » dans la maquette), en sept blocs de 31 jours.
  // Tout est déduit des automatisations et des campagnes ci-dessous, pour que le bandeau, la courbe et les
  // tops se recoupent quelle que soit la période. Rien de ceci n'est à porter : dans l'app, l'API renvoie
  // les chiffres, la série par jour et les tops de la période demandée, avec ceux de la période précédente.
  const NB = 217, AUJ = NB - 1, BLOCS = 7, JOUR = 86400000;
  const dateDe = (i) => new Date(2026, 10, 16 - (AUJ - i));
  const indexDe = (d) => AUJ - Math.round((new Date(2026, 10, 16) - d) / JOUR);
  const bloc = (i) => Math.floor((AUJ - i) / 31);   // 0 : les 31 derniers jours
  const onde = (i, a, b) => 1 + 0.22 * Math.sin(i * a) + 0.12 * Math.cos(i * b);
  function repartir(total, poids) {   // des entiers dont la somme fait exactement le total
    const somme = poids.reduce((x, y) => x + y, 0); let reste = total;
    const v = poids.map((p) => { const n = Math.round(total * p / somme); reste -= n; return n; });
    v[poids.indexOf(Math.max(...poids))] += reste; return v;
  }
  function parBloc(total, poids) {   // une série par jour à partir d'un total par bloc
    let v = [];
    for (let b = BLOCS - 1; b >= 0; b--) { const debut = NB - 31 * (b + 1); v = v.concat(repartir(total(b), Array.from({ length: 31 }, (_, k) => poids(debut + k)))); }
    return v;
  }
  const somme = (v, a, b) => { let s = 0; for (let i = a; i <= b; i++) s += v[i]; return s; };

  // e : l'évolution d'un bloc de 31 jours au suivant
  const AUTOS = [
    { nom: 'Panier abandonné', badge: ' k-badge--success', statut: 'Active', d: 2140, ca: 9860, roas: 18.2, e: 0.12 },
    { nom: 'Confirmation de commande', badge: ' k-badge--success', statut: 'Active', d: 3020, ca: 3120, roas: 9.4, e: 0.04 },
    { nom: 'Bienvenue aux nouveaux abonnés', badge: ' k-badge--success', statut: 'Active', d: 1180, ca: 2040, roas: 7.1, e: -0.03 },
    { nom: 'Relance d\'avis client', badge: '', statut: 'Désactivée', d: 640, ca: 410, roas: 2.3, e: 0 }
  ];
  AUTOS.forEach((a, k) => {
    a.caJ = parBloc((b) => Math.round(a.ca / Math.pow(1 + a.e, b)), (i) => onde(i, 1.7 + k * 0.4, 0.6 + k * 0.3) * (dateDe(i).getDay() % 6 === 0 ? 1.15 : 1));
    a.dJ = parBloc((b) => Math.round(a.d / Math.pow(1 + a.e, b)), (i) => onde(i, 1.1 + k * 0.5, 2.4 - k * 0.3));
  });
  const agentJ = parBloc((b) => Math.round(1250 / Math.pow(1.2, b)), (i) => onde(i, 2.2, 0.9));   // commandes de l'agent IA
  // jour : [jour, mois]. Le chiffre d'affaires d'une campagne tombe sur trois jours (parts).
  const CAMPAGNES = [
    { nom: 'Black Friday, accès anticipé', badge: ' k-badge--success', statut: 'Envoyée', jour: [14, 11], messages: 13428, ca: 21820, parts: [0.62, 0.26, 0.12], roas: 5.8, evol: 22 },
    { nom: 'Retour en stock, bougie Ambre', badge: ' k-badge--orange', statut: 'En cours', jour: [12, 11], messages: 4812, ca: 6120, parts: [0.6, 0.28, 0.12], roas: 4.1, evol: 8 },
    { nom: 'Nouvelle collection d\'automne', badge: ' k-badge--success', statut: 'Envoyée', jour: [2, 10], messages: 9604, ca: 11480, parts: [0.55, 0.3, 0.15], roas: 5.2, evol: 5 },
    { nom: 'Ventes privées d\'automne', badge: ' k-badge--success', statut: 'Envoyée', jour: [24, 9], messages: 6210, ca: 7940, parts: [0.6, 0.27, 0.13], roas: 5.6, evol: -4 },
    { nom: 'Rentrée, 15 % sur les coffrets', badge: ' k-badge--success', statut: 'Envoyée', jour: [3, 9], messages: 8120, ca: 8660, parts: [0.58, 0.28, 0.14], roas: 4.7, evol: 9 },
    { nom: 'Bougies d\'été, dernières pièces', badge: ' k-badge--success', statut: 'Envoyée', jour: [11, 8], messages: 5480, ca: 4310, parts: [0.6, 0.26, 0.14], roas: 3.4, evol: -11 },
    { nom: 'Soldes d\'été', badge: ' k-badge--success', statut: 'Envoyée', jour: [24, 6], messages: 9940, ca: 10280, parts: [0.57, 0.29, 0.14], roas: 4.5, evol: 14 },
    { nom: 'Fête des mères', badge: ' k-badge--success', statut: 'Envoyée', jour: [20, 5], messages: 8760, ca: 12140, parts: [0.56, 0.3, 0.14], roas: 6.1, evol: 6 }
  ];
  CAMPAGNES.forEach((c) => { c.i = indexDe(new Date(2026, c.jour[1] - 1, c.jour[0])); c.caJ = repartir(c.ca, c.parts); });

  // Les six séries par jour
  const J = { ca: [], messages: [], effet: [] };   // effet : 1 le jour d'une campagne, puis 0,6 et 0,3
  for (let i = 0; i < NB; i++) {
    let ca = agentJ[i], messages = 0, effet = 0;
    AUTOS.forEach((a) => { ca += a.caJ[i]; messages += a.dJ[i]; });
    CAMPAGNES.forEach((c) => { const k = i - c.i; if (k >= 0 && k < 3) { ca += c.caJ[k]; effet = Math.max(effet, [1, 0.6, 0.3][k]); } if (k === 0) messages += c.messages; });
    J.ca.push(ca); J.messages.push(messages); J.effet.push(effet);
  }
  J.commandes = parBloc((b) => (b === 0 ? 518 : Math.round(somme(J.ca, NB - 31 * (b + 1), NB - 31 * b - 1) / 86)), (i) => J.ca[i] * onde(i, 2.9, 1.3));
  function caler(forme, cibles) {   // la moyenne de chaque bloc vaut sa cible
    const moyennes = cibles.map((_, b) => somme(forme, NB - 31 * (b + 1), NB - 31 * b - 1) / 31);
    return forme.map((v, i) => v * cibles[bloc(i)] / moyennes[bloc(i)]);
  }
  J.roas = caler(J.effet.map((e, i) => (13.6 + 1.8 * Math.sin(i * 0.9) + 0.9 * Math.cos(i * 2.3)) * (1 - 0.5 * e)), [12.4, 11.7, 11.3, 11, 10.8, 10.5, 10.2]);
  J.conversion = caler(J.effet.map((e, i) => (4.5 + 0.5 * Math.sin(i * 0.8 + 1) + 0.3 * Math.cos(i * 2.1)) * (1 + 0.3 * e)), [4.8, 4.4, 4.3, 4.2, 4.1, 4.1, 4]);
  const gains = parBloc((b) => [920, 840, 760, 700, 640, 600, 560][b], (i) => (i === NB - 31 ? 0 : onde(i, 1.3, 0.7) + 3 * J.effet[i]));
  J.contacts = []; J.contacts[AUJ] = 12480;
  for (let i = AUJ; i > 0; i--) J.contacts[i - 1] = J.contacts[i] - gains[i];

  function milliers(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, F); }
  function virgule(n, d) { return n.toFixed(d || 1).replace('.', ','); }
  const SERIES = {
    ca:         { titre: 'Chiffre d’affaires par jour', nom: 'Chiffre d’affaires', f: (n) => `${milliers(n)}${F}€` },
    roas:       { titre: 'ROAS par jour', nom: 'ROAS', moyenne: true, f: (n) => '×' + virgule(n), axe: (n) => '×' + n },
    conversion: { titre: 'Taux de conversion par jour', nom: 'Taux de conversion', moyenne: true, points: true, f: (n) => `${virgule(n)}${F}%`, axe: (n) => `${String(n).replace('.', ',')}${F}%` },
    commandes:  { titre: 'Commandes par jour', nom: 'Commandes', f: milliers },
    messages:   { titre: 'Messages envoyés par jour', nom: 'Messages envoyés', f: milliers },
    // Un total qui monte : l'axe ne part pas de zéro (la pente serait illisible) ; l'aire descend au bas de l'échelle
    contacts:   { titre: 'Contacts, total en fin de journée', nom: 'Contacts', total: true, f: milliers }
  };
  const jourLong = (d) => d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  const jourCourt = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const plage = (a, b) => (a === b ? '' : `${jourCourt(dateDe(a))} – `) + `${jourCourt(dateDe(b))} 2026`;

  // [A12] Période ---------------------------------------------------------------
  // Une seule période pour toute la page : le bandeau, sa courbe et les deux tops. 30 derniers jours par défaut.
  const PERIODES = {
    '7j':     { nom: '7 derniers jours', a: AUJ - 7, b: AUJ },
    '30j':    { nom: '30 derniers jours', a: AUJ - 30, b: AUJ },
    '90j':    { nom: '90 derniers jours', a: AUJ - 90, b: AUJ },
    'mois':   { nom: 'Ce mois-ci', a: AUJ - 15, b: AUJ },
    'mois-1': { nom: 'Le mois dernier', a: AUJ - 46, b: AUJ - 16 }
  };
  let periode = Object.assign({ cle: '30j' }, PERIODES['30j']);
  const valeur = (cle, a, b) => (SERIES[cle].total ? J[cle][b] : SERIES[cle].moyenne ? somme(J[cle], a, b) / (b - a + 1) : somme(J[cle], a, b));
  // L'écart avec la période précédente, de même durée. Sans période précédente, pas d'écart.
  function ecart(v, avant, points) {
    if (!avant) return '';
    const p = points ? Math.round((v - avant) * 10) / 10 : Math.round((v / avant - 1) * 100);
    if (!p) return '<span class="k-delta">Stable</span>';
    return `<span class="k-delta k-delta--${p > 0 ? 'up' : 'down'}"><k-icon name="arrow-${p > 0 ? 'up' : 'down'}-right" set="micro"></k-icon>${points ? virgule(Math.abs(p)) + F + 'pt' : Math.abs(p) + F + '%'}</span>`;
  }
  function rendrePeriode() {
    const { a, b } = periode, n = b - a + 1, actif = page.dataset.etat === '3';
    $('[data-ac-periode-nom]').textContent = periode.nom || plage(a, b);
    $$('[data-ac-periode-plage]').forEach((el) => { el.textContent = plage(a, b); });
    $('[data-ac-periode-dates]').hidden = !periode.nom;   // une période choisie à la main est déjà écrite dans le bouton
    $('[data-ac-chiffres]').setAttribute('aria-label', 'Chiffres, ' + (periode.nom || plage(a, b)).toLowerCase());
    // [A1] Un compte neuf n'a que ses contacts, importés de Shopify, et pas d'écart faute de période précédente
    cases.forEach((c) => {
      const cle = c.dataset.acSerie, s = SERIES[cle], v = actif ? valeur(cle, a, b) : cle === 'contacts' ? 12480 : 0;
      $('[data-ac-kpi]', c).textContent = actif ? s.f(v) : (s.axe || s.f)(v);   // compte neuf : « ×0 », « 0 % »
      const d = $('[data-ac-delta]', c); if (!d) return;
      d.innerHTML = actif && a - n >= 0 ? ecart(v, valeur(cle, a - n, a - 1), s.points) : '';
      d.hidden = !d.innerHTML;
      d.dataset.kTooltip = `Par rapport aux ${n} jours d’avant (${plage(a - n, a - 1)})`;
    });
    if (actif) rendreTops();
    tracer();
  }
  // [A10] Les tops de la période
  function rendreTops() {
    const { a, b } = periode, n = b - a + 1;
    const ligne = (x) => `<tr><td class="k-table__primary">${x.nom}</td><td><span class="k-badge${x.badge}">${x.statut}</span></td><td class="k-table__num">${milliers(x.d)}</td>`
      + `<td class="k-table__num">${x.d ? `<div>${milliers(x.caP)}${F}€</div><div class="k-table__secondary">${virgule(x.caP / x.d, 2)}${F}€ par destinataire</div>` : `${milliers(x.caP)}${F}€`}</td>`
      + `<td class="k-table__num">×${x.roasP ? virgule(x.roasP) : 0}</td><td class="k-table__num">${x.evolution}</td></tr>`;
    $('[data-ac-top-autos]').innerHTML = AUTOS.map((x) => {
      const caP = somme(x.caJ, a, b), d = somme(x.dJ, a, b);
      return Object.assign({}, x, { caP, d, roasP: d ? x.roas * (caP / x.ca) / (d / x.d) : 0, evolution: a - n >= 0 ? ecart(caP, somme(x.caJ, a - n, a - 1)) : '—' });
    }).sort((x, y) => y.caP - x.caP).map(ligne).join('');
    // Une campagne compte dès qu'une part de son chiffre d'affaires tombe dans la période
    const envoyees = CAMPAGNES.filter((c) => c.i + 2 >= a && c.i <= b).map((c) => {
      const caP = c.caJ.reduce((s, v, k) => s + (c.i + k >= a && c.i + k <= b ? v : 0), 0);
      return Object.assign({}, c, { caP, d: c.i >= a ? c.messages : 0, roasP: c.roas * caP / c.ca, evolution: ecart(100 + c.evol, 100) });
    }).sort((x, y) => y.caP - x.caP).slice(0, 3);
    let lignes = envoyees.map(ligne).join('');
    if (envoyees.length < 3 && b === AUJ) lignes += '<tr><td class="k-table__primary">Coffrets de Noël</td><td><span class="k-badge k-badge--violet">Programmée</span></td><td class="k-table__num">0</td><td class="k-table__num">0' + F + '€</td><td class="k-table__num">×0</td><td class="k-table__num"><span class="k-delta">À venir</span></td></tr>';
    $('[data-ac-top-campagnes]').innerHTML = lignes || '<tr><td class="k-table__empty" colspan="6">Aucune campagne envoyée sur cette période</td></tr>';
  }
  // Le menu : cinq périodes toutes faites, ou deux dates
  const menuPeriode = $('[data-ac-periode-menu]'), formPeriode = $('[data-ac-periode-perso]'), du = $('[data-ac-du]'), au = $('[data-ac-au]');
  const iso = (i) => { const d = dateDe(i); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const lire = (champ) => { const p = champ.value.split('-').map(Number); return champ.value ? indexDe(new Date(p[0], p[1] - 1, p[2])) : NaN; };
  [du, au].forEach((c) => { c.min = iso(0); c.max = iso(AUJ); });
  function verifierDates() {
    const a = lire(du), b = lire(au), ok = a >= 0 && b <= AUJ && a <= b;
    au.toggleAttribute('aria-invalid', !isNaN(a) && !isNaN(b) && a > b);
    if (au.hasAttribute('aria-invalid')) au.setAttribute('aria-invalid', 'true');
    $('button', formPeriode).disabled = !ok;
    return ok;
  }
  menuPeriode.addEventListener('toggle', (e) => { if (e.newState === 'open') { du.value = iso(periode.a); au.value = iso(periode.b); verifierDates(); } });
  formPeriode.addEventListener('input', verifierDates);
  menuPeriode.addEventListener('k:change', (e) => { const cle = e.detail.value; periode = Object.assign({ cle }, PERIODES[cle]); rendrePeriode(); });
  formPeriode.addEventListener('submit', (e) => {
    e.preventDefault(); if (!verifierDates()) return;
    periode = { cle: 'perso', a: lire(du), b: lire(au) };
    $$('[role="menuitemradio"]', menuPeriode).forEach((r) => r.setAttribute('aria-checked', 'false'));
    menuPeriode.hidePopover(); rendrePeriode();
  });

  // [A11] Graphique du chiffre choisi -----------------------------------------
  // Une échelle à pas ronds (1, 2, 2,5, 5 ou 10 fois une puissance de dix), en quatre intervalles environ
  function echelle(min, max) {
    const brut = (max - min) / 4 || 1, p = Math.pow(10, Math.floor(Math.log10(brut))), n = brut / p;
    const pas = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
    const bas = Math.floor(min / pas) * pas, haut = Math.ceil(max / pas) * pas || pas, reperes = [];
    for (let k = 0; bas + k * pas <= haut + pas / 1000; k++) reperes.push(Math.round((bas + k * pas) * 100) / 100);
    return { bas, haut, reperes };
  }
  // Une courbe lissée qui ne dépasse jamais ses points (interpolation cubique monotone) : arrondie aux pics,
  // sans jamais passer sous zéro ni inventer un sommet entre deux jours
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

  const kpis = $('[data-ac-kpis]'), panneau = $('[data-ac-graphique]'), trace = $('[data-ac-trace]'), bouton = $('[data-ac-graphique-bouton]');
  const cases = $$('[data-ac-serie]', kpis);
  let serie = 'ca', survol = null, largeur = 0;   // survol : ce qu'il faut pour placer le repère du jour pointé
  const svg = (nom, attrs, parent) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', nom);
    Object.keys(attrs || {}).forEach((k) => el.setAttribute(k, attrs[k]));
    if (parent) parent.appendChild(el);
    return el;
  };

  function tracer(sansAnimation) {
    if (panneau.hidden) return;
    const s = SERIES[serie], vide = page.dataset.etat !== '3';
    $('[data-ac-graphique-titre]').textContent = s.titre;
    $('[data-ac-graphique-vide]').hidden = !vide; trace.hidden = vide;
    trace.textContent = ''; survol = null;
    if (vide) return;
    const v = J[serie].slice(periode.a, periode.b + 1), n = v.length, dernier = n - 1;
    largeur = trace.clientWidth;   // ce tracé est à la bonne largeur : l'observateur n'a pas à le refaire
    const L = Math.max(320, trace.clientWidth), H = 200, haut = 8, bas = 24, droite = 8;
    const axe = s.axe || s.f, e = echelle(s.total ? Math.min(...v) : 0, Math.max(...v));
    const max = v.indexOf(Math.max(...v));
    const dessin = svg('svg', { viewBox: `0 0 ${L} ${H}`, width: L, height: H, role: 'img',
      'aria-label': `${s.titre}, ${plage(periode.a, periode.b)}. Maximum : ${s.f(v[max])} le ${jourCourt(dateDe(periode.a + max))} Dernier jour : ${s.f(v[dernier])}.` }, trace);
    // Les libellés de l'axe d'abord : leur largeur réelle fixe la marge de gauche
    const libelles = e.reperes.map((r) => { const t = svg('text', { 'text-anchor': 'end' }, dessin); t.textContent = axe(r); return t; });
    const gauche = Math.ceil(Math.max(...libelles.map((t) => t.getComputedTextLength() || t.textContent.length * 7))) + 10;
    const pasX = dernier ? (L - gauche - droite) / dernier : 0, x = (i) => (dernier ? gauche + i * pasX : (gauche + L - droite) / 2);
    const y = (val) => haut + (e.haut - val) / (e.haut - e.bas) * (H - haut - bas);
    e.reperes.forEach((r, k) => {
      svg('line', { class: 'k-chart__grid', x1: gauche, x2: L - droite, y1: y(r), y2: y(r) }, dessin);
      libelles[k].setAttribute('x', gauche - 10); libelles[k].setAttribute('y', y(r) + 4);
    });
    const ligne = lisser(v.map((val, i) => [x(i), y(val)]));
    if (dernier) {   // même pour un total qui monte (axe qui ne part pas de zéro) : l'aire descend au bas de l'échelle
      // L'aire : un dégradé du bleu (au ras de la courbe) à presque rien (en bas). Voir .k-chart__fade-top et -bottom.
      const fondu = svg('linearGradient', { id: 'ac-fondu', x1: 0, y1: 0, x2: 0, y2: 1 }, svg('defs', {}, dessin));
      svg('stop', { offset: 0, class: 'k-chart__fade-top' }, fondu); svg('stop', { offset: 1, class: 'k-chart__fade-bottom' }, fondu);
      svg('path', { class: 'k-chart__area', style: 'fill:url(#ac-fondu)', d: `${ligne} L${x(dernier).toFixed(1)} ${y(e.bas)} L${x(0)} ${y(e.bas)} Z` }, dessin);
    }
    if (dernier) svg('path', { class: 'k-chart__line', d: ligne, pathLength: 1 }, dessin);
    if (!sansAnimation) dessin.setAttribute('data-draw', '');   // la courbe se dessine quand le chiffre ou la période change
    // Une date tous les n jours, en partant d'aujourd'hui : le dernier jour est toujours écrit
    const pasDates = dernier <= 7 ? 1 : Math.ceil(dernier / 6);
    for (let i = dernier; i >= 0; i -= pasDates) {
      svg('text', { x: x(i), y: H - 4, 'text-anchor': !dernier ? 'middle' : i === dernier ? 'end' : i === 0 ? 'start' : 'middle' }, dessin).textContent = jourCourt(dateDe(periode.a + i));
    }
    const curseur = svg('line', { class: 'k-chart__cursor', y1: haut, y2: H - bas, visibility: 'hidden' }, dessin);
    const point = svg('circle', { class: 'k-chart__point', r: 4, visibility: dernier ? 'hidden' : 'visible', cx: x(0), cy: y(v[0]) }, dessin);
    const bulle = document.createElement('div'); bulle.className = 'k-chart__tip'; bulle.hidden = true;
    bulle.innerHTML = '<div class="k-chart__tip-title"></div><div class="k-chart__tip-row"><span></span><b></b></div>';
    trace.appendChild(bulle);
    survol = { s, v, L, gauche, pasX, dernier, x, y, curseur, point, bulle, i: null };
  }

  // Le repère du jour pointé : un trait, un point sur la courbe, et la valeur dans une bulle qui reste dans la carte
  function pointer(i) {
    if (!survol) return;
    const o = survol; o.i = i;
    const visible = i !== null;
    o.curseur.setAttribute('visibility', visible ? 'visible' : 'hidden');
    if (o.dernier) o.point.setAttribute('visibility', visible ? 'visible' : 'hidden');
    o.bulle.hidden = !visible;
    if (!visible) return;
    const val = o.v[i];
    o.curseur.setAttribute('x1', o.x(i)); o.curseur.setAttribute('x2', o.x(i));
    o.point.setAttribute('cx', o.x(i)); o.point.setAttribute('cy', o.y(val));
    o.bulle.firstChild.textContent = jourLong(dateDe(periode.a + i));
    o.bulle.lastChild.firstChild.textContent = o.s.nom; o.bulle.lastChild.lastChild.textContent = o.s.f(val);
    const demi = o.bulle.offsetWidth / 2;
    o.bulle.style.left = Math.min(o.L - demi, Math.max(demi, o.x(i))) + 'px';
    o.bulle.style.top = o.y(val) + 'px';
  }
  trace.addEventListener('pointermove', (e) => {
    if (!survol) return;
    const i = survol.dernier ? Math.round((e.clientX - trace.getBoundingClientRect().left - survol.gauche) / survol.pasX) : 0;
    pointer(Math.min(survol.dernier, Math.max(0, i)));
  });
  trace.addEventListener('pointerleave', () => pointer(null));
  // Au clavier : la courbe prend le focus, les flèches passent d'un jour à l'autre
  trace.tabIndex = 0;
  trace.addEventListener('keydown', (e) => {
    if (!survol || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const fin = survol.dernier, i = survol.i === null ? fin : survol.i;
    pointer(e.key === 'Home' ? 0 : e.key === 'End' ? fin : Math.min(fin, Math.max(0, i + (e.key === 'ArrowLeft' ? -1 : 1))));
  });
  trace.addEventListener('blur', () => pointer(null));

  function ouvrirGraphique(ouvert, auClavier) {
    panneau.toggleAttribute('data-instant', !!auClavier);   // une ouverture au clavier ne s'anime pas
    panneau.hidden = !ouvert;
    bouton.setAttribute('aria-expanded', ouvert);
    const texte = ouvert ? 'Masquer le graphique' : 'Afficher le graphique';
    bouton.setAttribute('aria-label', texte); bouton.dataset.kTooltip = texte;
    cases.forEach((c) => c.setAttribute('aria-pressed', ouvert && c.dataset.acSerie === serie));
    tracer();
  }
  bouton.addEventListener('click', (e) => ouvrirGraphique(panneau.hidden, e.detail === 0));
  cases.forEach((c) => c.addEventListener('click', (e) => { serie = c.dataset.acSerie; ouvrirGraphique(true, e.detail === 0); }));
  // La courbe est tracée à la largeur réelle de la carte : on la refait quand cette largeur change
  new ResizeObserver(() => { const l = trace.clientWidth; if (l && l !== largeur) tracer(true); }).observe(trace);

  function afficher(etat) {
    page.dataset.etat = etat;
    $$('[data-ac-etat]').forEach((el) => { el.hidden = !el.dataset.acEtat.split(' ').includes(String(etat)); });
    const accroche = $('[data-ac-accroche]'); accroche.textContent = ACCROCHES[etat]; accroche.hidden = !ACCROCHES[etat];
    // La modale de qualité suit l'état du compte : un compte neuf est au premier palier de Meta (250), sans envoi
    const q = (s) => $('#mod-qualite ' + s), neuf = etat !== 3;
    if (q('[data-q-envoyes]')) {
      q('[data-q-envoyes]').textContent = neuf ? '0' : `4${F}812`;
      q('[data-q-limite]').textContent = neuf ? '250' : `100${F}000`;
      q('[data-q-jauge]').style.setProperty('--k-value', neuf ? 0 : 0.05); q('[data-q-jauge]').setAttribute('aria-valuenow', neuf ? 0 : 5);
      q('[data-q-suite]').textContent = neuf
        ? 'Vous démarrez à 250 contacts par jour. Cette limite augmente toute seule à mesure que vous envoyez.'
        : 'Cette limite augmente toute seule à mesure que vous envoyez.';
      const entree = $('.k-rail [data-k-open="mod-qualite"]');
      if (entree) entree.setAttribute('aria-label', neuf ? 'Qualité du numéro : élevée. Aucun message sur 250 en 24 h' : `Qualité du numéro : élevée. 4${F}812 messages sur 100${F}000 en 24 h`);
    }
    rendrePeriode();   // [A1] [A10] [A11] chiffres, tops et courbe de la période
  }
  // [A0] Bascule de démonstration
  $('[data-ac-etats]').addEventListener('k:change', (e) => afficher(+e.detail.item.dataset.etat));
  afficher(+page.dataset.etat);

  // [A5] Bannière : ouvre la mise en route, sauf sans agent, où elle secoue l'encart [A7]
  const setup = document.getElementById('ac-setup');
  $('[data-ac-banniere]').addEventListener('click', () => {
    if (page.dataset.etat === '1') {
      const encart = $('[data-ac-encart]');
      encart.classList.remove('k-shake'); void encart.offsetWidth; encart.classList.add('k-shake');
      encart.scrollIntoView({ block: 'nearest' });
      return;
    }
    allerEtape(1); KanalDS.modal.open(setup);
  });

  // [A6] Mise en route en trois étapes
  const DESCRIPTIONS = {
    1: 'Choisissez les automatisations dont vous avez besoin. Claude les construit par le MCP Kanal.',
    2: 'Facultatif. Claude règle ces options en même temps que vos automatisations.',
    3: 'Copiez ce prompt, complétez les [crochets] sur votre marque, puis collez-le dans Claude.'
  };
  let etape = 1;
  const suivant = $('[data-ac-suivant]'), retour = $('[data-ac-retour]'), ouvrirClaude = $('[data-ac-ouvrir-claude]'), note = $('[data-ac-setup-note]');
  function allerEtape(n) {
    etape = n;
    $$('[data-ac-etape]', setup).forEach((el) => { el.hidden = +el.dataset.acEtape !== n; });
    $$('[data-ac-pas]', setup).forEach((el) => {
      const p = +el.dataset.acPas;
      if (p === n) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current');
      el.toggleAttribute('data-done', p < n);
      el.querySelector('.k-steps__num').innerHTML = p < n ? '<k-icon name="check" set="micro"></k-icon>' : p;
    });
    $('[data-ac-setup-desc]').textContent = DESCRIPTIONS[n];
    retour.textContent = n === 1 ? 'Annuler' : 'Retour';
    suivant.textContent = n === 3 ? 'Copier le prompt' : 'Suivant';
    ouvrirClaude.hidden = n !== 3;
    const choisies = $$('[data-ac-etape="1"] input:checked', setup).length;
    note.textContent = n === 1 ? '' : `${choisies} automatisation${choisies > 1 ? 's' : ''} choisie${choisies > 1 ? 's' : ''}`;
    suivant.disabled = n === 1 && choisies === 0;
    if (n === 3) $('[data-ac-prompt]').textContent = window.KANAL_SETUP_PROMPT || '';
    $('.k-modal__body', setup).scrollTop = 0;
  }
  $('[data-ac-etape="1"]', setup).addEventListener('change', () => { suivant.disabled = !$$('[data-ac-etape="1"] input:checked', setup).length; });
  suivant.addEventListener('click', () => {
    if (etape < 3) { allerEtape(etape + 1); return; }
    KanalDS.copier(window.KANAL_SETUP_PROMPT || '', 'Prompt copié. Collez-le dans Claude.');
  });
  retour.addEventListener('click', () => { if (etape === 1) setup.close(); else allerEtape(etape - 1); });

  // [A8] Connexion d'un agent : l'adresse du serveur MCP, puis la marche à suivre de chaque client
  const CLIENTS = {
    Claude: { logo: 'claude.svg', note: 'Il faut un forfait Claude Pro ou supérieur.',
      etapes: ['Dans Claude, ouvrez Réglages, puis Connecteurs.', 'Cliquez « Ajouter un connecteur personnalisé », nommez-le « Kanal » et collez l’adresse du serveur MCP.', 'Cliquez Connecter, connectez-vous à Kanal, choisissez votre boutique et autorisez l’accès.'],
      ouvrir: ['Ouvrir Claude', 'https://claude.ai/settings/connectors'] },
    ChatGPT: { logo: 'chatgpt.svg', note: 'Il faut ChatGPT Plus, Pro ou Business. Sur le web seulement, pas sur mobile.',
      etapes: ['Ouvrez le plugin officiel Kanal dans ChatGPT et installez-le.', 'Connectez-vous à Kanal, choisissez votre boutique, puis autorisez l’accès.'],
      ouvrir: ['Ouvrir le plugin Kanal', 'https://chatgpt.com'] },
    Codex: { logo: 'codex.svg', note: 'Ou ajoutez le serveur dans ~/.codex/config.toml, sous [mcp_servers.kanal].',
      etapes: ['Dans votre terminal, lancez : codex mcp add kanal --url https://api.getkanal.com/mcp', 'Démarrez Codex et connectez-vous à Kanal quand il le demande.'],
      ouvrir: ['Ouvrir la documentation de Codex', 'https://developers.openai.com/codex'] }
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ac-connecter]'); if (!b) return;
    const nom = b.dataset.acConnecter, c = CLIENTS[nom];
    $('[data-ac-cx-titre]').textContent = 'Connecter ' + nom;
    $('[data-ac-cx-note]').textContent = c.note;
    $('[data-ac-cx-logo]').src = 'assets/img/' + c.logo;
    const liste = $('[data-ac-cx-etapes]'); liste.textContent = '';
    c.etapes.forEach((t) => { const li = document.createElement('li'); li.textContent = t; liste.appendChild(li); });
    const lien = $('[data-ac-cx-ouvrir]'); lien.textContent = c.ouvrir[0]; lien.href = c.ouvrir[1];
    KanalDS.modal.open('ac-connexion');
  });

  // [A13] Parrainer un ami : l'invitation par e-mail part quand l'adresse est valide
  const parrainage = $('[data-ac-parrainage]'), emailAmi = $('[data-ac-parrainage-email]'), inviter = $('[data-ac-parrainage-envoyer]');
  const emailValide = () => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailAmi.value.trim());
  emailAmi.addEventListener('input', () => { inviter.disabled = !emailValide(); });
  parrainage.addEventListener('submit', (e) => {
    e.preventDefault(); if (!emailValide()) return;
    KanalDS.toast('Invitation envoyée à ' + emailAmi.value.trim(), { tone: 'success' });
    parrainage.reset(); inviter.disabled = true;
  });

  // [A2] Suggérer une idée : il faut au moins 4 caractères pour envoyer
  const idee = $('[data-ac-idee]'), resume = $('[data-ac-idee-resume]'), envoyer = $('[data-ac-idee-envoyer]');
  resume.addEventListener('input', () => { envoyer.disabled = resume.value.trim().length < 4; });
  idee.addEventListener('submit', (e) => {
    e.preventDefault(); if (envoyer.disabled) return;
    document.getElementById('ac-idee').hidePopover(); idee.reset(); envoyer.disabled = true;
    KanalDS.toast('Merci, votre idée est envoyée', { tone: 'success' });
  });
})();
