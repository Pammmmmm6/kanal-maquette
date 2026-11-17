/* ==========================================================================
   Listes et segments dans le design system. Script de la page listes.html.
   Repères [L1]…[L7] : voir les notes en tête de la page.

   Maquette : huit audiences fixes (AUDIENCES). Dans l'app, la liste et les
   compteurs viennent de l'API. Le détail d'une audience n'est plus ici : une
   liste ouvre sa page (liste.html, script liste.js), un segment son éditeur
   (segment.html).
   ========================================================================== */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const F = ' ';   // espace fine insécable
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const milliers = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, F);
  const ic = (nom, micro) => `<k-icon name="${nom}"${micro ? ' set="micro"' : ''}></k-icon>`;
  const TOTAL = 12480;

  // [L3] Quatre sources. Une liste se remplit à la main ; un segment se calcule ; les deux dernières se synchronisent.
  const SOURCES = {
    liste:   { nom: 'Liste Kanal', famille: 'listes', icone: 'list-bullet', vignette: ic('list-bullet') },
    segment: { nom: 'Segment', famille: 'segments', icone: 'funnel', vignette: ic('funnel') },
    klaviyo: { nom: 'Klaviyo', famille: 'synchro', icone: 'arrow-path', vignette: '<img src="assets/img/klaviyo.png" alt="">' },
    shopify: { nom: 'Shopify', famille: 'synchro', icone: 'arrow-path', vignette: '<img src="assets/img/shopify.svg" alt="">' }
  };
  // Les mêmes audiences, avec leur détail, sont dans liste.js (listes et synchronisées) et segment.js (segments)
  const AUDIENCES = [
    { id: 'bf', nom: 'Black Friday 2026', source: 'liste', detail: 'Inscrits à l\'accès anticipé', contacts: 3210, evol: 12.4, modif: 'il y a 2 h', ordre: 1 },
    { id: 'vip', nom: 'Meilleurs clients', source: 'segment', detail: 'Total dépensé supérieur à 200' + F + '€', contacts: 845, evol: 8.9, modif: '8 juin', ordre: 6 },
    { id: 'tous', nom: 'Tous les contacts', source: 'liste', detail: 'Tous vos contacts, abonnés ou non', contacts: 12480, evol: 8.0, modif: 'hier', ordre: 2 },
    { id: 'newsletter', nom: 'Abonnés à la newsletter', source: 'liste', detail: 'Inscrits par la fenêtre du site', contacts: 9137, evol: 3.1, modif: '14 juin', ordre: 5 },
    { id: 'engages', nom: 'Engagés, 30 jours', source: 'segment', detail: 'A lu un message dans les 30 derniers jours', contacts: 5402, evol: 2.2, modif: 'En direct', direct: true, ordre: 3 },
    { id: 'panier', nom: 'Panier abandonné, 7 jours', source: 'segment', detail: 'A abandonné un panier dans les 7 derniers jours', contacts: 1126, evol: -4.0, modif: 'En direct', direct: true, ordre: 4 },
    { id: 'klaviyo', nom: 'Klaviyo · Newsletter', source: 'klaviyo', detail: 'Synchronisée il y a 10 min', contacts: 7950, evol: 1.4, modif: 'il y a 10 min', ordre: 0 },
    { id: 'shopify', nom: 'Shopify · Accepte le marketing', source: 'shopify', detail: 'Synchronisée il y a 1 h', contacts: 10214, evol: 0.8, modif: 'il y a 1 h', ordre: 1.5 }
  ];
  const audience = (id) => AUDIENCES.find((a) => a.id === id);
  const pourcent = (n) => (Math.abs(n) % 1 ? Math.abs(n).toFixed(1).replace('.', ',') : Math.abs(n)) + F + '%';
  const variation = (n) => `<span class="k-delta k-delta--${n >= 0 ? 'up' : 'down'}">${ic(n >= 0 ? 'arrow-up-right' : 'arrow-down-right', true)}${pourcent(n)}</span>`;
  const sourceBadge = (a) => `<span class="k-badge${a.source === 'segment' ? ' k-badge--accent' : a.source === 'liste' ? '' : ' k-badge--outline'}">${SOURCES[a.source].nom}</span>`;

  const TRIS = { modif: (x, y) => x.ordre - y.ordre, nom: (x, y) => x.nom.localeCompare(y.nom, 'fr'), contacts: (x, y) => y.contacts - x.contacts };
  const etat = { famille: 'toutes', q: '', tri: 'modif' };
  const corps = $('[data-ls-lignes]');
  // [L4] La page d'une audience : celle de la liste (ou de l'audience synchronisée), ou l'éditeur du segment
  const page = (a) => `${a.source === 'segment' ? 'segment' : 'liste'}.html?id=${a.id}`;
  const normaliser = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const liste = () => AUDIENCES.filter((a) => (etat.famille === 'toutes' || SOURCES[a.source].famille === etat.famille) && (!etat.q || normaliser(a.nom + ' ' + a.detail).includes(normaliser(etat.q)))).sort(TRIS[etat.tri]);

  // [L3] Le tableau
  function ligne(a) {
    return `<tr data-k-row data-ls="${a.id}">
      <td><div class="k-table__who"><span class="k-logo">${SOURCES[a.source].vignette}</span><div><a class="k-table__primary" href="${page(a)}">${esc(a.nom)}</a><div class="k-table__secondary">${esc(a.detail)}</div></div></div></td>
      <td>${sourceBadge(a)}</td>
      <td class="k-table__num"><div class="k-table__who k-table__who--end"><span>${milliers(a.contacts)}</span><span class="k-progress k-progress--ink k-progress--inline" style="--k-value:${(a.contacts / TOTAL).toFixed(3)}" role="img" aria-label="${Math.round(a.contacts / TOTAL * 100)} % de vos contacts"><span></span></span></div></td>
      <td class="k-table__num">${variation(a.evol)}</td>
      <td>${a.direct ? `<span class="k-badge k-badge--success"><span class="k-badge__dot"></span>En direct</span>` : `<span class="k-table__secondary">${a.modif}</span>`}</td>
      <td class="k-table__actions"><button type="button" class="k-button k-button--ghost k-button--icon k-button--sm" aria-label="Actions sur ${esc(a.nom)}" aria-haspopup="menu" data-k-menu="ls-menu" data-k-placement="bottom-end">${ic('ellipsis-horizontal')}</button></td>
    </tr>`;
  }
  function rendre() {
    const l = liste();
    corps.innerHTML = l.length ? l.map(ligne).join('') : `<tr><td class="k-table__empty" colspan="6">Aucune audience ne correspond à cette recherche.</td></tr>`;
    $('[data-ls-pied]').textContent = `${l.length} audience${l.length > 1 ? 's' : ''} · ${milliers(TOTAL)} contacts uniques · les segments se recalculent en continu`;
  }

  // [L4] Ouvrir une audience : le nom est un vrai lien, et un clic ailleurs sur la ligne mène à la même page.
  // Le menu de la ligne est le même pour toutes : on le fait pointer vers l'audience de la ligne avant qu'il s'ouvre.
  function preparerMenu(a) {
    const segment = a.source === 'segment', liste = a.source === 'liste';
    const ouvrir = $('[data-ls-m-ouvrir]'), membres = $('[data-ls-m-membres]');
    ouvrir.href = page(a);
    $('k-icon', ouvrir).setAttribute('name', segment || liste ? 'pencil-square' : 'eye');
    $('.k-menu__text', ouvrir).textContent = segment ? 'Modifier les conditions' : liste ? 'Modifier la liste' : 'Voir l\'audience';
    membres.href = segment ? 'contacts.html' : page(a) + '#membres';
    $('.k-menu__text', membres).textContent = segment ? 'Voir les contacts' : 'Voir les membres';
  }
  corps.addEventListener('click', (e) => {
    const r = e.target.closest('[data-ls]'); if (!r) return;
    const a = audience(r.dataset.ls);
    if (e.target.closest('[data-k-menu]')) { preparerMenu(a); return; }
    if (e.target.closest('button, a')) return;
    location.href = page(a);
  });

  // [L2] Famille, recherche, tri
  $('[data-ls-familles]').addEventListener('k:change', (e) => { etat.famille = e.detail.item.dataset.famille; rendre(); });
  $('[data-ls-recherche]').addEventListener('input', (e) => { etat.q = e.target.value.trim(); rendre(); });
  const NOMS_TRI = { modif: 'Dernière modification', nom: 'Nom', contacts: 'Nombre de contacts' };
  document.getElementById('ls-tri').addEventListener('k:change', (e) => { etat.tri = e.detail.value; $('[data-ls-tri-nom]').textContent = NOMS_TRI[etat.tri]; rendre(); });

  // [L5] Suggestions de l'agent IA : créer le segment proposé
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ls-suggestion]'); if (!b) return;
    b.disabled = true; b.textContent = 'Créé';
    KanalDS.toast(`Segment « ${b.dataset.lsSuggestion} » créé`, { tone: 'success' });
  });

  // [L6] Nouvelle audience : un nom suffit pour commencer
  const nouvelle = $('[data-ls-nouvelle]'), nom = $('[data-ls-nouvelle-nom]'), creer = $('[data-ls-nouvelle-creer]');
  nom.addEventListener('input', () => { creer.disabled = nom.value.trim().length < 2; });
  nouvelle.addEventListener('submit', (e) => {
    e.preventDefault(); if (creer.disabled) return;
    const segment = nouvelle.elements.type.value === 'segment';
    document.getElementById('ls-nouvelle').close();
    // Un segment se définit dans son éditeur : on y va, le nom viendra là-bas
    if (segment) { location.href = 'segment.html?nouveau'; return; }
    KanalDS.toast(`${segment ? 'Segment' : 'Liste'} « ${nom.value.trim()} » ${segment ? 'créé' : 'créée'}`, { tone: 'success' });
    nouvelle.reset(); creer.disabled = true;
  });

  rendre();
})();
