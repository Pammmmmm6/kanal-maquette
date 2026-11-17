/* ==========================================================================
   Contacts dans le design system. Script de la page contacts.html.
   Repères [C1]…[C8] : voir les notes en tête de la page.

   Maquette : quinze contacts fixes (CONTACTS). Dans l'app, la liste, les
   compteurs et la fiche viennent de l'API, page par page.
   ========================================================================== */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const F = ' ';   // espace fine insécable
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const euros = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, F) + F + '€';
  const ic = (nom, micro) => `<k-icon name="${nom}"${micro ? ' set="micro"' : ''}></k-icon>`;

  // [C4] Consentement : trois états, les mêmes partout dans l'app
  const CONSENTEMENTS = {
    abonne:    { nom: 'Abonné', badge: ' k-badge--success' },
    inconnu:   { nom: 'Inconnu', badge: '' },
    desabonne: { nom: 'Désabonné', badge: ' k-badge--danger' }
  };
  const PAYS = { FR: 'France', BE: 'Belgique', CH: 'Suisse' };
  // activite : [icône, ce qui s'est passé, quand]
  const CONTACTS = [
    { id: 'lea', nom: 'Léa Martin', ton: 'blue', email: 'lea.martin@example.com', pays: 'FR', tel: '+33 6 00 00 00 01', consent: 'abonne', commandes: 4, depense: 312, viaKanal: 198, ville: 'Lyon', cree: '13 sept. 2026', source: 'fenêtre du site', listes: ['Meilleurs clients', 'Black Friday 2026', 'Abonnés à la newsletter'], activite: ['chat-bubble-left', 'A répondu « Joyeux anniversaire Maman »', 'il y a 2 min'],
      historique: [['chat-bubble-left', 'A répondu « Joyeux anniversaire Maman »', 'Conversation avec Camille', 'il y a 2 min'], ['shopping-bag', 'Commande n°10482 · 86' + F + '€', 'Attribuée à Panier abandonné', 'il y a 2 h'], ['cursor-arrow-rays', 'A cliqué « J\'en profite »', 'Black Friday, accès anticipé', '14 nov.'], ['eye', 'A lu la campagne', 'Black Friday, accès anticipé', '14 nov.']] },
    { id: 'thomas', nom: 'Thomas Bernard', ton: 'green', email: 'thomas.bernard@example.com', pays: 'FR', tel: '+33 6 00 00 00 02', consent: 'abonne', commandes: 2, depense: 154, viaKanal: 142, ville: 'Nantes', cree: '2 oct. 2026', source: 'case à cocher du paiement', listes: ['Black Friday 2026'], activite: ['chat-bubble-left', 'A écrit à propos de sa livraison', 'il y a 8 min'] },
    { id: 'hugo', nom: 'Hugo Petit', ton: 'orange', email: 'hugo.petit@example.com', pays: 'FR', tel: '+33 6 00 00 00 04', consent: 'abonne', commandes: 1, depense: 64, viaKanal: 0, ville: 'Lille', cree: '28 oct. 2026', source: 'case à cocher du paiement', listes: [], activite: ['chat-bubble-left', 'A signalé un colis cassé', 'il y a 45 min'] },
    { id: 'chloe', nom: 'Chloé Lambert', ton: 'violet', email: '', pays: 'FR', tel: '+33 6 00 00 00 10', consent: 'inconnu', commandes: 0, depense: 0, viaKanal: 0, ville: 'Rennes', cree: '16 nov. 2026', source: '', listes: [], activite: ['chat-bubble-left', 'A écrit pour la première fois', 'il y a 1 h'] },
    { id: 'nicolas', nom: 'Nicolas Rousseau', ton: 'blue', email: 'nicolas.rousseau@example.com', pays: 'FR', tel: '+33 6 00 00 00 06', consent: 'abonne', commandes: 0, depense: 0, viaKanal: 0, ville: 'Rennes', cree: '9 nov. 2026', source: 'fenêtre du site', listes: ['Abonnés à la newsletter'], activite: ['chat-bubble-left', 'A demandé une précommande', 'il y a 3 h'] },
    { id: 'camille', nom: 'Camille Garnier', ton: 'rose', email: 'camille.garnier@example.com', pays: 'BE', tel: '+32 400 00 00 11', consent: 'abonne', commandes: 5, depense: 690, viaKanal: 388, ville: 'Bruxelles', cree: '4 juin 2026', source: 'fenêtre du site', listes: ['Meilleurs clients', 'Abonnés à la newsletter'], activite: ['shopping-bag', 'A commandé pour 142' + F + '€', 'il y a 5 h'] },
    { id: 'ines', nom: 'Inès Robert', ton: 'violet', email: 'ines.robert@example.com', pays: 'FR', tel: '+33 6 00 00 00 03', consent: 'abonne', commandes: 1, depense: 96, viaKanal: 59, ville: 'Bordeaux', cree: '21 août 2026', source: 'case à cocher du paiement', listes: ['Black Friday 2026'], activite: ['cursor-arrow-rays', 'A cliqué un lien de suivi', 'hier'] },
    { id: 'manon', nom: 'Manon Leroy', ton: 'violet', email: 'manon.leroy@example.com', pays: 'FR', tel: '+33 6 00 00 00 08', consent: 'abonne', commandes: 1, depense: 42, viaKanal: 0, ville: 'Toulouse', cree: '30 sept. 2026', source: 'fenêtre du site', listes: ['Abonnés à la newsletter'], activite: ['chat-bubble-left', 'A posé une question sur un produit', 'hier'] },
    { id: 'julien', nom: 'Julien Moreau', ton: 'orange', email: 'julien.moreau@example.com', pays: 'FR', tel: '+33 6 00 00 00 12', consent: 'desabonne', commandes: 1, depense: 39, viaKanal: 0, ville: 'Paris', cree: '12 mai 2026', source: 'a répondu STOP le 14 nov. 2026', listes: [], activite: ['no-symbol', 'S\'est désabonné (STOP)', '14 nov.'] },
    { id: 'sarah', nom: 'Sarah Fournier', ton: 'rose', email: 'sarah.fournier@example.com', pays: 'FR', tel: '+33 6 00 00 00 05', consent: 'abonne', commandes: 3, depense: 228, viaKanal: 118, ville: 'Paris', cree: '3 juil. 2026', source: 'fenêtre du site', listes: ['Meilleurs clients', 'Black Friday 2026'], activite: ['eye', 'A lu la campagne Black Friday', '14 nov.'] },
    { id: 'mila', nom: 'Mila Dupont', ton: 'green', email: 'mila.dupont@example.com', pays: 'FR', tel: '+33 6 00 00 00 07', consent: 'abonne', commandes: 2, depense: 182, viaKanal: 91, ville: 'Marseille', cree: '18 juin 2026', source: 'case à cocher du paiement', listes: ['Black Friday 2026'], activite: ['shopping-bag', 'Commande expédiée', '13 nov.'] },
    { id: 'antoine', nom: 'Antoine Faure', ton: 'blue', email: '', pays: 'CH', tel: '+41 70 000 00 13', consent: 'inconnu', commandes: 0, depense: 0, viaKanal: 0, ville: 'Genève', cree: '12 nov. 2026', source: '', listes: [], activite: ['chat-bubble-left', 'A écrit pour la première fois', '12 nov.'] },
    { id: 'zoe', nom: 'Zoé Thomas', ton: 'orange', email: 'zoe.thomas@example.com', pays: 'FR', tel: '+33 6 00 00 00 09', consent: 'abonne', commandes: 5, depense: 410, viaKanal: 246, ville: 'Lyon', cree: '8 févr. 2026', source: 'fenêtre du site', listes: ['Meilleurs clients', 'Abonnés à la newsletter'], activite: ['star', 'A laissé un avis 5 étoiles', '11 nov.'] },
    { id: 'emma', nom: 'Emma Girard', ton: 'green', email: 'emma.girard@example.com', pays: 'BE', tel: '+32 400 00 00 14', consent: 'abonne', commandes: 0, depense: 0, viaKanal: 0, ville: 'Liège', cree: '10 nov. 2026', source: 'fenêtre du site', listes: ['Abonnés à la newsletter'], activite: ['eye', 'A lu le message de bienvenue', '10 nov.'] },
    { id: 'paul', nom: 'Paul Mercier', ton: 'violet', email: 'paul.mercier@example.com', pays: 'FR', tel: '+33 6 00 00 00 15', consent: 'abonne', commandes: 2, depense: 128, viaKanal: 64, ville: 'Strasbourg', cree: '25 juil. 2026', source: 'case à cocher du paiement', listes: [], activite: ['shopping-bag', 'A commandé pour 64' + F + '€', '7 nov.'] }
  ];
  const TOTAL = `12${F}480`;
  const initiales = (nom) => nom.split(' ').map((m) => m[0]).join('').slice(0, 2);
  const avatar = (c, taille) => `<span class="k-avatar k-avatar--${c.ton}${taille ? ' k-avatar--' + taille : ''}">${initiales(c.nom)}</span>`;
  const contact = (id) => CONTACTS.find((c) => c.id === id);
  const badge = (c) => `<span class="k-badge${CONSENTEMENTS[c.consent].badge}"><span class="k-badge__dot"></span>${CONSENTEMENTS[c.consent].nom}</span>`;

  const etat = { statut: 'tous', q: '', pays: '', commandes: '', selection: new Set(), ouvert: null };
  const corps = $('[data-ct-lignes]'), fiche = document.getElementById('ct-fiche');
  const normaliser = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  function liste() {
    const q = normaliser(etat.q);
    return CONTACTS.filter((c) => (etat.statut === 'tous' || c.consent === etat.statut)
      && (!etat.pays || c.pays === etat.pays)
      && (!etat.commandes || (etat.commandes === 'oui' ? c.commandes > 0 : c.commandes === 0))
      && (!q || normaliser(c.nom + ' ' + c.email + ' ' + c.tel).includes(q)));
  }

  // [C4] Le tableau
  function ligne(c) {
    return `<tr data-k-row data-ct="${c.id}" tabindex="0" aria-selected="${etat.selection.has(c.id)}"${etat.ouvert === c.id ? ' aria-current="true"' : ''}>
      <td class="k-table__check"><input type="checkbox" class="k-checkbox" data-ct-cocher="${c.id}" ${etat.selection.has(c.id) ? 'checked' : ''} aria-label="Sélectionner ${esc(c.nom)}"></td>
      <td><div class="k-table__who">${avatar(c)}<div><div class="k-table__primary">${esc(c.nom)}</div><div class="k-table__secondary">${c.email ? esc(c.email) : 'Pas d\'e-mail'}</div></div></div></td>
      <td><div class="k-table__who"><span class="k-badge" data-k-tooltip="${PAYS[c.pays]}">${c.pays}</span><span class="k-tabular">${c.tel}</span></div></td>
      <td>${badge(c)}</td>
      <td class="k-table__num">${c.commandes ? `${c.commandes}${F}·${F}${euros(c.depense)}` : '—'}</td>
      <td><div class="k-table__who k-table__secondary" data-k-tooltip="${esc(c.activite[1])}">${ic(c.activite[0])}<span>${c.activite[2]}</span></div></td>
      <td class="k-table__actions"><button type="button" class="k-button k-button--ghost k-button--icon k-button--sm" aria-label="Actions sur ${esc(c.nom)}" aria-haspopup="menu" data-k-menu="ct-menu" data-k-placement="bottom-end">${ic('ellipsis-horizontal')}</button></td>
    </tr>`;
  }
  function rendre() {
    const l = liste();
    corps.innerHTML = l.length ? l.map(ligne).join('')
      : `<tr><td class="k-table__empty" colspan="7">Aucun contact ne correspond. Essayez un autre mot, ou retirez un filtre.</td></tr>`;
    $('[data-ct-pied]').textContent = `${l.length} contact${l.length > 1 ? 's' : ''} affiché${l.length > 1 ? 's' : ''} sur ${TOTAL}`;
    // [C6] La barre d'actions groupées prend la place de la barre d'outils
    const n = etat.selection.size, tout = $('[data-ct-tout]');
    $('[data-ct-outils]').hidden = !!n; $('[data-ct-masse]').hidden = !n;
    $('[data-ct-masse-n]').textContent = `${n} sélectionné${n > 1 ? 's' : ''}`;
    tout.checked = l.length > 0 && l.every((c) => etat.selection.has(c.id));
    tout.indeterminate = !tout.checked && l.some((c) => etat.selection.has(c.id));
    const actifs = (etat.pays ? 1 : 0) + (etat.commandes ? 1 : 0), compte = $('[data-ct-filtres-n]');
    compte.hidden = !actifs; compte.textContent = actifs;
  }

  // [C5] La fiche du contact, à droite
  function ouvrirFiche(id) {
    const c = contact(id); etat.ouvert = id;
    $('[data-ct-f-avatar]').innerHTML = avatar(c, 'lg');
    $('[data-ct-f-nom]').textContent = c.nom;
    $('[data-ct-f-tel]').textContent = c.tel;
    $('[data-ct-f-badge]').innerHTML = badge(c);
    const champs = {
      email: c.email || '—', pays: `${PAYS[c.pays]} · ${c.ville}`,
      consent: c.consent === 'abonne' ? `Abonné · ${c.cree}, par la ${c.source}` : c.consent === 'desabonne' ? `Désabonné : ${c.source}` : 'Inconnu : n\'a encore rien accepté',
      cree: c.cree, commandes: c.commandes, depense: c.commandes ? euros(c.depense) : '—',
      panier: c.commandes ? euros(Math.round(c.depense / c.commandes)) : '—', kanal: c.viaKanal ? euros(c.viaKanal) : '—'
    };
    Object.keys(champs).forEach((k) => { $(`[data-ct-f="${k}"]`).textContent = champs[k]; });
    $('[data-ct-f-listes]').innerHTML = c.listes.length ? c.listes.map((l) => `<span class="k-tag">${esc(l)}</span>`).join('') : '<span class="k-table__secondary">Dans aucune liste pour l\'instant.</span>';
    const histoire = c.historique || [[c.activite[0], c.activite[1], '', c.activite[2]], ['user-plus', 'Contact créé', c.consent === 'abonne' ? 'Abonné par la ' + c.source : 'Sans consentement', c.cree]];
    $('[data-ct-f-activite]').innerHTML = histoire.map((h) => `<li class="k-timeline__item"><span class="k-timeline__icon">${ic(h[0])}</span><div><div class="k-timeline__title">${esc(h[1])}</div>${h[2] ? `<div class="k-timeline__meta">${esc(h[2])}</div>` : ''}</div><span class="k-timeline__time">${h[3]}</span></li>`).join('');
    // Un contact désabonné ne peut plus recevoir de message : on le dit, et l'action change
    $('[data-ct-f-ecrire]').hidden = c.consent === 'desabonne';
    $('[data-ct-f-bloque]').hidden = c.consent !== 'desabonne';
    // La fiche est un panneau flottant : elle passe par-dessus le tableau, à toutes les largeurs (data-open)
    fiche.setAttribute('data-open', ''); fiche.removeAttribute('data-closed');
    rendre();
  }
  // La fiche se ferme par son bouton (data-k-aside-toggle) : on retire alors la marque de la ligne ouverte
  new MutationObserver(() => {
    const fermee = !fiche.hasAttribute('data-open');
    if (fermee && etat.ouvert) { etat.ouvert = null; rendre(); }
  }).observe(fiche, { attributes: true, attributeFilter: ['data-open', 'data-closed'] });

  corps.addEventListener('click', (e) => {
    const cb = e.target.closest('[data-ct-cocher]');
    if (cb) { if (cb.checked) etat.selection.add(cb.dataset.ctCocher); else etat.selection.delete(cb.dataset.ctCocher); rendre(); return; }
    if (e.target.closest('button, a, .k-table__check')) return;
    const r = e.target.closest('[data-ct]'); if (r) ouvrirFiche(r.dataset.ct);
  });
  corps.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || !e.target.matches('[data-ct]')) return;
    e.preventDefault(); ouvrirFiche(e.target.dataset.ct);
  });
  $('[data-ct-tout]').addEventListener('change', (e) => { liste().forEach((c) => { if (e.target.checked) etat.selection.add(c.id); else etat.selection.delete(c.id); }); rendre(); });

  // [C3] Statut, recherche, filtres
  $('[data-ct-statuts]').addEventListener('k:change', (e) => { etat.statut = e.detail.item.dataset.statut; etat.selection.clear(); rendre(); });
  $('[data-ct-recherche]').addEventListener('input', (e) => { etat.q = e.target.value.trim(); rendre(); });
  const filtres = $('[data-ct-filtres]');
  filtres.addEventListener('submit', (e) => {
    e.preventDefault();
    etat.pays = $('[data-ct-pays]').value; etat.commandes = $('[data-ct-commandes]').value;
    document.getElementById('ct-filtres').hidePopover(); rendre();
  });
  $('[data-ct-filtres-effacer]').addEventListener('click', () => { filtres.reset(); etat.pays = ''; etat.commandes = ''; document.getElementById('ct-filtres').hidePopover(); rendre(); });

  // [C6] Actions groupées : la maquette confirme par un toast
  $('[data-ct-masse]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-ct-action]'); if (!b) return;
    const n = etat.selection.size, s = n > 1 ? 's' : '';
    if (b.dataset.ctAction === 'annuler') { etat.selection.clear(); rendre(); return; }
    const messages = { liste: `${n} contact${s} ajouté${s} à « Meilleurs clients »`, exporter: `Export de ${n} contact${s} lancé : le fichier arrive par e-mail`, supprimer: `${n} contact${s} supprimé${s}` };
    KanalDS.toast(messages[b.dataset.ctAction], b.dataset.ctAction === 'supprimer' ? { action: { label: 'Annuler' } } : { tone: 'success' });
    etat.selection.clear(); rendre();
  });

  // [C7] Nouveau contact : il faut un numéro pour créer
  const nouveau = $('[data-ct-nouveau]'), numero = $('[data-ct-nouveau-tel]'), creer = $('[data-ct-nouveau-creer]');
  numero.addEventListener('input', () => { creer.disabled = numero.value.replace(/\D/g, '').length < 9; });
  nouveau.addEventListener('submit', (e) => {
    e.preventDefault(); if (creer.disabled) return;
    document.getElementById('ct-nouveau').close(); nouveau.reset(); creer.disabled = true;
    KanalDS.toast('Contact ajouté', { tone: 'success' });
  });

  rendre();
})();
