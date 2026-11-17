/* ==========================================================================
   Automatisations dans le design system. Script de automatisations.html.
   Repères [T1]…[T7] : voir les notes en tête de la page.

   Maquette : six automatisations fixes. Les quatre premières sont celles du
   « Top automatisations » de l'accueil, avec les mêmes chiffres.
   ========================================================================== */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const F = ' ';   // espace fine insécable
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const milliers = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, F);
  const ic = (nom, micro) => `<k-icon name="${nom}"${micro ? ' set="micro"' : ''}></k-icon>`;

  const DECLENCHEURS = {
    panier: ['shopping-cart', 'Panier abandonné'], commande: ['shopping-bag', 'Commande passée'], abonnement: ['user-plus', 'Nouvel abonné'],
    livraison: ['cube', 'Commande livrée'], date: ['calendar', 'Date d\'anniversaire'], inactif: ['clock', 'Sans commande depuis 60 jours']
  };
  const STATUTS = { active: ['Active', ' k-badge--success'], pause: ['En pause', ''], brouillon: ['Brouillon', ' k-badge--outline'] };
  const AUTOMATISATIONS = [
    { id: 'panier', nom: 'Panier abandonné', declencheur: 'panier', statut: 'active', delivres: 2140, ca: 9860, roas: '18,2', modif: '5 nov. 2026', etapes: 7 },
    { id: 'confirmation', nom: 'Confirmation de commande', declencheur: 'commande', statut: 'active', delivres: 3020, ca: 3120, roas: '9,4', modif: '28 oct. 2026', etapes: 3 },
    { id: 'bienvenue', nom: 'Bienvenue aux nouveaux abonnés', declencheur: 'abonnement', statut: 'active', delivres: 1180, ca: 2040, roas: '7,1', modif: '1 oct. 2026', etapes: 4 },
    { id: 'avis', nom: 'Relance d\'avis client', declencheur: 'livraison', statut: 'pause', delivres: 640, ca: 410, roas: '2,3', modif: '1 oct. 2026', etapes: 3 },
    { id: 'anniversaire', nom: 'Anniversaire', declencheur: 'date', statut: 'pause', delivres: 0, ca: 0, roas: '', modif: '30 sept. 2026', etapes: 2 },
    { id: 'reconquete', nom: 'Reconquête, 60 jours', declencheur: 'inactif', statut: 'brouillon', delivres: 0, ca: 0, roas: '', modif: 'à l\'instant', etapes: 5 }
  ];
  const TOTAL_CA = AUTOMATISATIONS.reduce((s, a) => s + a.ca, 0);

  const etat = { statut: 'toutes', q: '', declencheur: '' };
  const corps = $('[data-at-lignes]');
  const normaliser = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const liste = () => AUTOMATISATIONS.filter((a) => (etat.statut === 'toutes' || a.statut === etat.statut) && (!etat.declencheur || a.declencheur === etat.declencheur) && (!etat.q || normaliser(a.nom).includes(normaliser(etat.q))));

  // [T4] Le tableau. Une ligne mène au builder ; l'interrupteur active ou met en pause sans y entrer.
  function ligne(a) {
    const d = DECLENCHEURS[a.declencheur], s = STATUTS[a.statut], part = TOTAL_CA ? a.ca / TOTAL_CA : 0;
    return `<tr data-k-row data-at="${a.id}" tabindex="0">
      <td><div class="k-table__primary">${esc(a.nom)}</div><div class="k-table__secondary">${a.etapes} étapes · modifiée ${a.modif === 'à l\'instant' ? a.modif : 'le ' + a.modif}</div></td>
      <td><span class="k-badge${s[1]}">${a.statut === 'brouillon' ? '' : '<span class="k-badge__dot"></span>'}${s[0]}</span></td>
      <td><div class="k-table__who">${ic(d[0])}<span>${d[1]}</span></div></td>
      <td class="k-table__num">${a.delivres ? milliers(a.delivres) : '—'}</td>
      <td class="k-table__num">${a.ca ? `<div class="k-table__who k-table__who--end"><span>${milliers(a.ca)}${F}€</span><span class="k-progress k-progress--ink k-progress--inline" style="--k-value:${part.toFixed(3)}" role="img" aria-label="${Math.round(part * 100)} % du chiffre d'affaires des automatisations"><span></span></span></div>` : '—'}</td>
      <td class="k-table__num">${a.roas ? '×' + a.roas : '—'}</td>
      <td class="k-table__actions"><div class="k-table__who k-table__who--end"><input type="checkbox" class="k-switch" role="switch" data-at-actif="${a.id}" ${a.statut === 'active' ? 'checked' : ''} ${a.statut === 'brouillon' ? 'disabled' : ''} aria-label="${esc(a.nom)} : active"><button type="button" class="k-button k-button--ghost k-button--icon k-button--sm" aria-label="Actions sur ${esc(a.nom)}" aria-haspopup="menu" data-k-menu="at-menu" data-k-placement="bottom-end">${ic('ellipsis-horizontal')}</button></div></td>
    </tr>`;
  }
  function rendre() {
    const l = liste();
    corps.innerHTML = l.length ? l.map(ligne).join('') : `<tr><td class="k-table__empty" colspan="7">Aucune automatisation ne correspond à cette recherche.</td></tr>`;
    const n = (st) => AUTOMATISATIONS.filter((a) => a.statut === st).length;
    $('[data-at-pied]').textContent = `${l.length} automatisation${l.length > 1 ? 's' : ''} · classées par chiffre d'affaires attribué`;
    $('[data-at-n="toutes"]').textContent = AUTOMATISATIONS.length;
    ['active', 'pause', 'brouillon'].forEach((st) => { $(`[data-at-n="${st}"]`).textContent = n(st); });
    $('[data-at-actives]').textContent = n('active');
    $('[data-at-actives-detail]').textContent = `sur ${AUTOMATISATIONS.length} · ${n('pause')} en pause · ${n('brouillon')} brouillon${n('brouillon') > 1 ? 's' : ''}`;
  }

  corps.addEventListener('click', (e) => {
    if (e.target.closest('button, a, input')) return;
    const r = e.target.closest('[data-at]'); if (r) location.href = 'automatisation.html';
  });
  corps.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('[data-at]')) location.href = 'automatisation.html'; });
  // [T5] Activer ou mettre en pause depuis la liste
  corps.addEventListener('change', (e) => {
    const sw = e.target.closest('[data-at-actif]'); if (!sw) return;
    const a = AUTOMATISATIONS.find((x) => x.id === sw.dataset.atActif), avant = a.statut;
    a.statut = sw.checked ? 'active' : 'pause'; rendre();
    KanalDS.toast(`« ${a.nom} » ${sw.checked ? 'activée' : 'mise en pause'}`, { action: { label: 'Annuler', onClick: () => { a.statut = avant; rendre(); } } });
  });

  // [T3] Statut, recherche, déclencheur
  $('[data-at-statuts]').addEventListener('k:change', (e) => { etat.statut = e.detail.item.dataset.statut; rendre(); });
  $('[data-at-recherche]').addEventListener('input', (e) => { etat.q = e.target.value.trim(); rendre(); });
  $('[data-at-declencheur]').addEventListener('change', (e) => { etat.declencheur = e.target.value; rendre(); });

  rendre();
})();
