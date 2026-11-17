/* ==========================================================================
   Liens magiques dans le design system. Script de la page liens.html, et
   données communes à lien.html (la page d'un lien), qui charge ce fichier
   avant assets/lien.js.
   Repères [K1]…[K8] : voir les notes en tête de liens.html.

   Un lien magique est un lien court getkanal.com qui ouvre WhatsApp avec un
   message déjà écrit : le client n'a plus qu'à envoyer. Ce message contient
   le mot-clé d'une automatisation, qui lui répond.
   Champs de l'API repris ici : name, short_url, pre_filled_message, is_active,
   click_count, matching_automations. Les cinq liens sont fictifs.

   Première partie : les liens et ce qu'on sait en dire (window.KanalLiens).
   Seconde partie : la liste, qui ne tourne que sur liens.html.
   ========================================================================== */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const F = ' ';   // espace fine insécable
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const milliers = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, F);
  const ic = (nom, micro) => `<k-icon name="${nom}"${micro ? ' set="micro"' : ''}></k-icon>`;
  const normaliser = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  // [K5] Les automatisations qui répondent à un mot-clé. Une automatisation en pause ne répond rien.
  const AUTOMATISATIONS = [
    { motCle: 'BIENVENUE', nom: 'Bienvenue aux nouveaux abonnés', active: true },
    { motCle: 'AVIS', nom: 'Relance d\'avis client', active: false }
  ];
  const repond = (message) => AUTOMATISATIONS.find((a) => message.toUpperCase().includes(a.motCle)) || null;

  // Les cinq liens de la maquette. creeLe sert au tracé des clics (aucun clic avant la création).
  const DEPART = [
    { id: 'insta', nom: 'Bio Instagram', slug: 'lumen-insta', message: 'Bonjour ! Je voudrais mes 10 % de BIENVENUE', actif: true, clics: 8420, clics30: 1240, evol: 14, cree: '2 févr. 2026', creeLe: '2026-02-02' },
    { id: 'colis', nom: 'QR code des colis', slug: 'lumen-colis', message: 'AVIS : je donne mon avis sur ma commande', actif: true, clics: 5310, clics30: 980, evol: 9, cree: '18 mars 2026', creeLe: '2026-03-18' },
    { id: 'boutique', nom: 'Affiche de la boutique', slug: 'lumen-boutique', message: 'BIENVENUE chez Maison Lumen', actif: true, clics: 2960, clics30: 610, evol: 21, cree: '4 juin 2026', creeLe: '2026-06-04' },
    { id: 'noel', nom: 'Jeu de Noël', slug: 'lumen-noel', message: 'Je participe au jeu de Noël', actif: true, clics: 350, clics30: 350, evol: 0, cree: '10 nov. 2026', creeLe: '2026-11-10' },
    { id: 'salon', nom: 'Flyer du salon de septembre', slug: 'lumen-salon', message: 'BIENVENUE, je viens du salon', actif: false, clics: 1420, clics30: 0, evol: 0, cree: '1 sept. 2026', creeLe: '2026-09-01' }
  ];
  const AVEC_QR = DEPART.map((l) => l.slug);   // les cinq QR codes de assets/img
  // Maquette : ce qu'on change (création, message, désactivation, suppression) tient le temps de l'onglet, pour que
  // la liste et la page d'un lien racontent la même histoire. Dans l'app, c'est l'API qui fait foi.
  const CLE = 'kanal-liens-1', CLE_ANNONCE = 'kanal-liens-annonce';
  let LIENS = DEPART;
  try { const garde = JSON.parse(sessionStorage.getItem(CLE)); if (Array.isArray(garde)) LIENS = garde; } catch (e) { /* pas de stockage : les cinq liens de départ */ }
  const garder = () => { try { sessionStorage.setItem(CLE, JSON.stringify(LIENS)); } catch (e) { /* idem */ } };

  const adresse = (l) => `getkanal.com/l/${l.slug}`;
  const lien = (id) => LIENS.find((l) => l.id === id);
  const page = (l) => `lien.html?id=${encodeURIComponent(l.id)}`;
  // Le QR code d'un lien créé dans la maquette n'a pas de fichier : il emprunte celui de la bio Instagram
  const qr = (l) => `assets/img/qr-${AVEC_QR.includes(l.slug) ? l.slug : 'lumen-insta'}.svg`;

  // Ce que le lien déclenche, en clair : une automatisation active, en pause, ou rien
  function suite(l) {
    const a = repond(l.message);
    if (!l.actif) return { ton: '', icone: 'no-symbol', texte: 'Lien désactivé', aide: 'Il affiche une page d\'erreur au lieu d\'ouvrir WhatsApp.' };
    if (!a) return { ton: ' k-badge--warning', icone: 'exclamation-triangle', texte: 'Aucune automatisation', aide: 'Personne ne répond à ce message : il arrive dans l\'inbox, à votre équipe.' };
    if (!a.active) return { ton: ' k-badge--warning', icone: 'pause', texte: `${a.nom}, en pause`, aide: 'Tant qu\'elle est en pause, le client n\'a pas de réponse automatique.' };
    return { ton: ' k-badge--success', icone: 'bolt', texte: a.nom, aide: 'Elle répond dès que le client envoie le message.' };
  }
  // Ce qui répondra à un message qu'on est en train d'écrire, dit dans un bandeau : la modale de création [K8]
  // et la page d'un lien s'en servent pendant la frappe.
  function reponse(texte) {
    const a = texte ? repond(texte) : null;
    if (!texte) return { ton: 'info', icone: 'information-circle', titre: '', texte: `Écrivez le message avec le mot-clé d'une automatisation : ${AUTOMATISATIONS.map((x) => `<b>${x.motCle}</b>`).join(', ')}.` };
    if (!a) return { ton: 'warning', icone: 'exclamation-triangle', titre: 'Aucune automatisation ne répond à ce message.', texte: 'Il arrivera dans l\'inbox, à votre équipe.' };
    if (!a.active) return { ton: 'warning', icone: 'pause', titre: `${esc(a.nom)}, en pause.`, texte: 'Activez-la, sinon le client n\'aura pas de réponse.', automatisation: a };
    return { ton: 'success', icone: 'bolt', titre: `${esc(a.nom)}.`, texte: 'Elle répondra à ce message.', automatisation: a };
  }
  const bandeau = (r, apres) => `<div class="k-banner k-banner--${r.ton}">${ic(r.icone)}<div class="k-banner__text">${r.titre ? `<span class="k-banner__title">${r.titre}</span> ` : ''}${r.texte}${apres || ''}</div></div>`;

  // Kanal fabrique le lien court : on ne le choisit pas. Ici, à partir du nom.
  function creer(nom, message) {
    const base = 'lumen-' + (normaliser(nom).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24) || 'lien');
    let slug = base, n = 2;
    while (LIENS.some((x) => x.slug === slug)) slug = `${base}-${n++}`;
    const l = { id: slug.slice(6), nom, slug, message, actif: true, clics: 0, clics30: 0, evol: 0, cree: '16 nov. 2026', creeLe: '2026-11-16' };
    LIENS.unshift(l); garder();
    return l;
  }
  function retirer(id) { LIENS = LIENS.filter((l) => l.id !== id); garder(); }
  // Un mot à dire sur la page suivante (« lien créé », « lien supprimé ») : on change de page avant le toast
  const annoncer = (texte) => { try { sessionStorage.setItem(CLE_ANNONCE, texte); } catch (e) { /* tant pis pour le toast */ } };
  function direAnnonce() {
    let texte = null;
    try { texte = sessionStorage.getItem(CLE_ANNONCE); sessionStorage.removeItem(CLE_ANNONCE); } catch (e) { /* rien à dire */ }
    if (texte) KanalDS.toast(texte, { tone: 'success' });
  }

  window.KanalLiens = { F, esc, milliers, ic, AUTOMATISATIONS, liens: () => LIENS, lien, adresse, page, qr, suite, reponse, bandeau, creer, retirer, garder, annoncer, direAnnonce };

  // ==========================================================================
  // La liste (liens.html). Sur lien.html, on s'arrête ici.
  // ==========================================================================
  const corps = $('[data-lk-lignes]');
  if (!corps) return;

  const etat = { statut: 'tous', q: '' };
  const liste = () => LIENS.filter((l) => (etat.statut === 'tous' || (etat.statut === 'actifs') === l.actif) && (!etat.q || normaliser(l.nom + ' ' + l.message + ' ' + l.slug).includes(normaliser(etat.q))));

  // ---------------------------------------------------------------- [K4] le tableau
  // [K6] Le nom est un lien vers la page du lien ; un clic ailleurs sur la ligne y mène aussi.
  function ligne(l) {
    const s = suite(l);
    return `<tr data-k-row data-lk="${esc(l.id)}">
      <td><a class="k-table__primary" href="${page(l)}">${esc(l.nom)}</a><div class="k-table__secondary">${adresse(l)}</div></td>
      <td><div class="k-table__clip">${esc(l.message)}</div></td>
      <td><span class="k-badge${s.ton}" data-k-tooltip="${esc(s.aide)}">${ic(s.icone, s.icone === 'bolt' || s.icone === 'exclamation-triangle')}${esc(s.texte)}</span></td>
      <td class="k-table__num">${milliers(l.clics)}</td>
      <td class="k-table__num">${l.clics30 ? milliers(l.clics30) : '—'}</td>
      <td class="k-table__actions"><div class="k-table__who k-table__who--end">
        <button type="button" class="k-button k-button--ghost k-button--icon k-button--sm" aria-label="Copier le lien ${esc(l.nom)}" data-k-tooltip="Copier le lien" data-k-copy="https://${adresse(l)}">${ic('document-duplicate')}</button>
        <input type="checkbox" class="k-switch" role="switch" data-lk-actif="${esc(l.id)}" ${l.actif ? 'checked' : ''} aria-label="${esc(l.nom)} : actif">
      </div></td>
    </tr>`;
  }
  // [K2] Les quatre chiffres se calculent sur les liens : ils suivent une création, une désactivation, un message réécrit
  function rendre() {
    const l = liste(), actifs = LIENS.filter((x) => x.actif);
    corps.innerHTML = l.length ? l.map(ligne).join('') : '<tr><td class="k-table__empty" colspan="6">Aucun lien ne correspond à cette recherche.</td></tr>';
    $('[data-lk-pied]').textContent = `${l.length} lien${l.length > 1 ? 's' : ''} · un lien court ne change jamais, même si vous réécrivez son message`;
    $('[data-lk-n="tous"]').textContent = LIENS.length; $('[data-lk-n="actifs"]').textContent = actifs.length; $('[data-lk-n="inactifs"]').textContent = LIENS.length - actifs.length;
    $('[data-lk-actifs]').textContent = actifs.length; $('[data-lk-actifs-detail]').textContent = `sur ${LIENS.length}`;
    $('[data-lk-clics30]').textContent = milliers(LIENS.reduce((n, x) => n + x.clics30, 0));
    $('[data-lk-clics]').textContent = milliers(LIENS.reduce((n, x) => n + x.clics, 0));
    $('[data-lk-sans]').textContent = actifs.filter((x) => { const a = repond(x.message); return !a || !a.active; }).length;
  }

  corps.addEventListener('click', (e) => {
    if (e.target.closest('button, a, input')) return;
    const r = e.target.closest('[data-lk]'); if (r) location.href = page(lien(r.dataset.lk));
  });
  // [K7] Désactiver plutôt que supprimer : le lien est peut-être déjà imprimé
  corps.addEventListener('change', (e) => {
    const sw = e.target.closest('[data-lk-actif]'); if (!sw) return;
    const l = lien(sw.dataset.lkActif); l.actif = sw.checked; garder(); rendre();
    KanalDS.toast(l.actif ? `« ${l.nom} » réactivé : il ouvre de nouveau WhatsApp` : `« ${l.nom} » désactivé : il affiche une page d'erreur`, { action: { label: 'Annuler', onClick: () => { l.actif = !l.actif; garder(); rendre(); } } });
  });

  // [K3] Statut et recherche
  $('[data-lk-statuts]').addEventListener('k:change', (e) => { etat.statut = e.detail.item.dataset.statut; rendre(); });
  $('[data-lk-recherche]').addEventListener('input', (e) => { etat.q = e.target.value.trim(); rendre(); });

  // ---------------------------------------------------------------- [K8] créer un lien
  // Une modale courte : un nom et le message. Pendant qu'on écrit, on dit quelle automatisation répondra.
  // Une fois créé, on arrive sur la page du lien : c'est là qu'on le copie, qu'on prend son QR code, qu'on le modifie.
  const form = $('[data-lk-form]'), nom = $('[data-lk-form-nom]'), message = $('[data-lk-form-message]'), valider = $('[data-lk-form-valider]');
  function verifier() {
    const texte = message.value.trim();
    $('[data-lk-form-compte]').textContent = `${message.value.length} sur 2${F}048`;
    $('[data-lk-form-apercu]').textContent = texte || 'Votre message apparaîtra ici.';
    $('[data-lk-form-suite]').innerHTML = bandeau(reponse(texte));
    valider.disabled = nom.value.trim().length < 2 || texte.length < 2;
  }
  form.addEventListener('input', verifier);
  form.addEventListener('submit', (e) => {
    e.preventDefault(); if (valider.disabled) return;
    const l = creer(nom.value.trim(), message.value.trim());
    annoncer(`Lien « ${l.nom} » créé : copiez-le pour le publier`);
    location.href = page(l);
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-lk-creer]')) return;
    nom.value = ''; message.value = ''; verifier(); KanalDS.modal.open('lk-modale');
  });

  rendre();
  direAnnonce();
})();
