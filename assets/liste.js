/* ==========================================================================
   Page d'une liste dans le design system. Script de la page liste.html.
   Repères [D1]…[D11] : voir les notes en tête de la page.

   Maquette : cinq audiences fixes (LISTES), reprises de listes.js (nom, source,
   nombre de contacts, évolution), avec leurs membres, leurs origines et leurs
   campagnes. Dans l'app, tout vient de l'API : la liste, ses compteurs par
   consentement, sa série sur 30 jours, ses membres page par page.
   liste.html?id=<identifiant> ouvre une autre audience (newsletter par défaut).
   ========================================================================== */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const F = ' ';   // espace fine insécable
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const milliers = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, F);
  const euros = (n) => milliers(n) + F + '€';
  const taux = (n) => String(n).replace('.', ',') + F + '%';
  const pluriel = (n, mot) => `${milliers(n)} ${mot}${n > 1 ? 's' : ''}`;
  const ic = (nom, micro) => `<k-icon name="${nom}"${micro ? ' set="micro"' : ''}></k-icon>`;
  const TOTAL = 12480;
  const AUJOURDHUI = '16 nov. 2026';

  // ---------------------------------------------------------------- les données de la maquette
  // [D7] Les contacts de contacts.js (même nom, même numéro, même consentement), plus deux numéros importés
  // sans consentement, déjà vus dans les destinataires de campagne.js.
  const CONTACTS = {
    lea:     { nom: 'Léa Martin', ton: 'blue', tel: '+33 6 00 00 00 01', email: 'lea.martin@example.com', consent: 'abonne' },
    thomas:  { nom: 'Thomas Bernard', ton: 'green', tel: '+33 6 00 00 00 02', email: 'thomas.bernard@example.com', consent: 'abonne' },
    ines:    { nom: 'Inès Robert', ton: 'violet', tel: '+33 6 00 00 00 03', email: 'ines.robert@example.com', consent: 'abonne' },
    hugo:    { nom: 'Hugo Petit', ton: 'orange', tel: '+33 6 00 00 00 04', email: 'hugo.petit@example.com', consent: 'abonne' },
    sarah:   { nom: 'Sarah Fournier', ton: 'rose', tel: '+33 6 00 00 00 05', email: 'sarah.fournier@example.com', consent: 'abonne' },
    nicolas: { nom: 'Nicolas Rousseau', ton: 'blue', tel: '+33 6 00 00 00 06', email: 'nicolas.rousseau@example.com', consent: 'abonne' },
    mila:    { nom: 'Mila Dupont', ton: 'green', tel: '+33 6 00 00 00 07', email: 'mila.dupont@example.com', consent: 'abonne' },
    manon:   { nom: 'Manon Leroy', ton: 'violet', tel: '+33 6 00 00 00 08', email: 'manon.leroy@example.com', consent: 'abonne' },
    zoe:     { nom: 'Zoé Thomas', ton: 'orange', tel: '+33 6 00 00 00 09', email: 'zoe.thomas@example.com', consent: 'abonne' },
    chloe:   { nom: 'Chloé Lambert', ton: 'violet', tel: '+33 6 00 00 00 10', email: '', consent: 'inconnu' },
    camille: { nom: 'Camille Garnier', ton: 'rose', tel: '+32 400 00 00 11', email: 'camille.garnier@example.com', consent: 'abonne' },
    julien:  { nom: 'Julien Moreau', ton: 'orange', tel: '+33 6 00 00 00 12', email: 'julien.moreau@example.com', consent: 'desabonne' },
    antoine: { nom: 'Antoine Faure', ton: 'blue', tel: '+41 70 000 00 13', email: '', consent: 'inconnu' },
    emma:    { nom: 'Emma Girard', ton: 'green', tel: '+32 400 00 00 14', email: 'emma.girard@example.com', consent: 'abonne' },
    paul:    { nom: 'Paul Mercier', ton: 'violet', tel: '+33 6 00 00 00 15', email: 'paul.mercier@example.com', consent: 'abonne' },
    lucas:   { nom: 'Lucas Benoit', ton: 'blue', tel: '+33 6 00 00 00 16', email: '', consent: 'inconnu' },
    nina:    { nom: 'Nina Caron', ton: 'rose', tel: '+33 6 00 00 00 17', email: '', consent: 'inconnu' }
  };
  // Consentement : trois états, les mêmes partout dans l'app (voir contacts.js)
  const CONSENTEMENTS = {
    abonne:    { nom: 'Abonné', badge: ' k-badge--success' },
    inconnu:   { nom: 'Inconnu', badge: '' },
    desabonne: { nom: 'Désabonné', badge: ' k-badge--danger' }
  };
  const STATUTS = { envoyee: ['Envoyée', ' k-badge--success'], programmee: ['Programmée', ' k-badge--violet'], encours: ['En cours', ' k-badge--orange'] };
  const SOURCES = { liste: 'Liste Kanal', klaviyo: 'Klaviyo', shopify: 'Shopify' };

  // membres : [contact, ajouté le, entré par], du plus récent au plus ancien.
  // origines : [d'où viennent les contacts, combien] ; la somme fait le nombre de contacts.
  // campagnes : [nom, statut, date, délivrés, lus, clics, chiffre d'affaires]. automatisations : [nom, ce qu'elle fait, statut].
  const LISTES = {
    newsletter: {
      nom: 'Abonnés à la newsletter', source: 'liste', description: 'Inscrits par la fenêtre du site', contacts: 9137, evol: 3.1,
      abonnes: 9012, inconnus: 94, desabonnes: 31, creeLe: '2 févr. 2026', par: 'Camille Roux', modif: '14 juin 2026',
      origines: [['Fenêtre du site', 7412], ['Import CSV', 1240], ['Lien magique', 385], ['Ajoutés à la main', 100]],
      automatisations: [['Bienvenue aux nouveaux abonnés', 'Part quand un contact entre dans la liste', 'Active']],
      campagnes: [['Coffrets de Noël', 'programmee', '1 déc. 2026 à 9:00'], ['Ventes privées d\'automne', 'envoyee', '9 oct. 2026', 8512, 70.1, 21.6, 6940], ['Lettre de rentrée', 'envoyee', '4 sept. 2026', 8264, 68.4, 17.2, 3760]],
      membres: [['emma', '10 nov. 2026', 'Fenêtre du site'], ['nicolas', '9 nov. 2026', 'Fenêtre du site'], ['manon', '30 sept. 2026', 'Fenêtre du site'], ['lea', '13 sept. 2026', 'Fenêtre du site'],
        ['camille', '4 juin 2026', 'Fenêtre du site'], ['lucas', '3 mars 2026', 'Import CSV'], ['nina', '3 mars 2026', 'Import CSV'], ['zoe', '8 févr. 2026', 'Fenêtre du site']]
    },
    bf: {
      nom: 'Black Friday 2026', source: 'liste', description: 'Inscrits à l\'accès anticipé', contacts: 3210, evol: 12.4,
      abonnes: 3164, inconnus: 38, desabonnes: 8, creeLe: '20 sept. 2026', par: 'Camille Roux', modif: AUJOURDHUI,
      origines: [['Lien magique', 2486], ['Fenêtre du site', 612], ['Ajoutés à la main', 112]],
      automatisations: [],
      campagnes: [['Black Friday, ouverture des ventes', 'programmee', '27 nov. 2026 à 8:00']],
      membres: [['sarah', '2 nov. 2026', 'Lien magique'], ['ines', '29 oct. 2026', 'Lien magique'], ['thomas', '24 oct. 2026', 'Fenêtre du site'], ['mila', '22 oct. 2026', 'Lien magique'], ['lea', '21 oct. 2026', 'Lien magique']]
    },
    tous: {
      nom: 'Tous les contacts', source: 'liste', fixe: true, description: 'Tous vos contacts, abonnés ou non', contacts: 12480, evol: 8.0, gain: 920,
      abonnes: 11640, inconnus: 792, desabonnes: 48, creeLe: '12 janv. 2026', par: 'Kanal, avec votre compte', modif: '15 nov. 2026',
      origines: [['Shopify', 7306], ['Fenêtre du site', 3848], ['Import CSV', 1240], ['Conversation WhatsApp', 86]],
      automatisations: [['Confirmation de commande', 'Part à chaque commande', 'Active']],
      campagnes: [['Black Friday, accès anticipé', 'envoyee', '14 nov. 2026', 13428, 71.4, 24.8, 21820]],
      membres: [['chloe', '16 nov. 2026', 'Conversation WhatsApp'], ['antoine', '12 nov. 2026', 'Conversation WhatsApp'], ['emma', '10 nov. 2026', 'Fenêtre du site'], ['nicolas', '9 nov. 2026', 'Fenêtre du site'],
        ['hugo', '28 oct. 2026', 'Shopify'], ['thomas', '2 oct. 2026', 'Shopify'], ['manon', '30 sept. 2026', 'Fenêtre du site'], ['lea', '13 sept. 2026', 'Fenêtre du site'], ['ines', '21 août 2026', 'Shopify'],
        ['paul', '25 juil. 2026', 'Shopify'], ['sarah', '3 juil. 2026', 'Fenêtre du site'], ['mila', '18 juin 2026', 'Shopify'], ['camille', '4 juin 2026', 'Fenêtre du site'], ['julien', '12 mai 2026', 'Shopify'], ['zoe', '8 févr. 2026', 'Fenêtre du site']]
    },
    // [D9] Deux audiences synchronisées : en lecture seule, avec leur source et l'heure de la dernière synchronisation
    klaviyo: {
      nom: 'Klaviyo · Newsletter', source: 'klaviyo', contacts: 7950, evol: 1.4,
      abonnes: 7702, inconnus: 236, desabonnes: 12, creeLe: '5 sept. 2026', par: 'Camille Roux',
      origine: 'Liste « Newsletter »', synchro: 'aujourd\'hui à 14:32', ilYA: 'il y a 10 min',
      automatisations: [], campagnes: [],
      membres: [['emma', '10 nov. 2026', 'Klaviyo'], ['nicolas', '9 nov. 2026', 'Klaviyo'], ['manon', '30 sept. 2026', 'Klaviyo'], ['lea', '13 sept. 2026', 'Klaviyo'], ['camille', '5 sept. 2026', 'Klaviyo'], ['zoe', '5 sept. 2026', 'Klaviyo']]
    },
    shopify: {
      nom: 'Shopify · Accepte le marketing', source: 'shopify', contacts: 10214, evol: 0.8,
      abonnes: 10098, inconnus: 88, desabonnes: 28, creeLe: '12 janv. 2026', par: 'Kanal, à l\'installation',
      origine: 'Clients qui acceptent le marketing', synchro: 'aujourd\'hui à 13:42', ilYA: 'il y a 1 h',
      automatisations: [], campagnes: [],
      membres: [['hugo', '28 oct. 2026', 'Shopify'], ['thomas', '2 oct. 2026', 'Shopify'], ['ines', '21 août 2026', 'Shopify'], ['paul', '25 juil. 2026', 'Shopify'], ['mila', '18 juin 2026', 'Shopify']]
    }
  };

  // [D1] L'audience ouverte. Un segment a son propre éditeur : on y va.
  const demande = new URLSearchParams(location.search).get('id');
  if (['vip', 'engages', 'panier'].includes(demande)) { location.replace('segment.html?id=' + demande); return; }
  const l = LISTES[demande] || LISTES.newsletter;
  const synchronisee = l.source !== 'liste';
  const lectureSeule = synchronisee || !!l.fixe;
  const source = SOURCES[l.source];
  // Ce que la liste a gagné en 30 jours : c'est la courbe [D5] et le dernier chiffre de [D3]
  const gain = l.gain || l.contacts - Math.round(l.contacts / (1 + l.evol / 100));
  const depart = l.contacts - gain;
  l.membres = l.membres.map((m) => Object.assign({ id: m[0], ajout: m[1], par: m[2] }, CONTACTS[m[0]]));

  const initiales = (nom) => nom.split(' ').map((m) => m[0]).join('').slice(0, 2);
  const badge = (c) => `<span class="k-badge${CONSENTEMENTS[c.consent].badge}"><span class="k-badge__dot"></span>${CONSENTEMENTS[c.consent].nom}</span>`;
  const nonAbonnes = () => l.inconnus + l.desabonnes;
  const normaliser = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  // ---------------------------------------------------------------- [D2] la barre : nom, type, actions
  const nom = $('[data-ld-nom]');
  nom.value = l.nom; nom.readOnly = lectureSeule;
  document.title = `${l.nom} · Kanal`;
  const type = $('[data-ld-type]');
  type.textContent = synchronisee ? `Synchronisée · ${source}` : 'Liste Kanal'; type.classList.toggle('k-badge--outline', synchronisee);
  $('[data-ld-verrou]').hidden = !synchronisee;
  // Le nom s'enregistre à la sortie du champ ; un nom vide revient à l'ancien
  nom.addEventListener('change', () => {
    const v = nom.value.trim();
    if (!v || v === l.nom) { nom.value = l.nom; return; }
    l.nom = v; nom.value = v; document.title = `${v} · Kanal`; confirmation();
    KanalDS.toast('Nom enregistré', { tone: 'success' });
  });
  nom.addEventListener('keydown', (e) => { if (e.key === 'Enter') nom.blur(); if (e.key === 'Escape') { nom.value = l.nom; nom.blur(); } });
  // Une audience synchronisée ne se remplit pas dans Kanal
  $('[data-ld-ajouter]').hidden = synchronisee;

  // ---------------------------------------------------------------- [D3] les chiffres
  function chiffres() {
    const evol = Math.abs(l.evol), variation = `<span class="k-delta k-delta--${gain >= 0 ? 'up' : 'down'}">${ic(gain >= 0 ? 'arrow-up-right' : 'arrow-down-right', true)}${taux(evol % 1 ? evol.toFixed(1) : evol)}</span>`;
    const valeurs = {
      contacts: milliers(l.contacts), part: `${Math.round(l.contacts / TOTAL * 100)}${F}% de vos contacts`,
      abonnes: milliers(l.abonnes), non: milliers(nonAbonnes()),
      'non-detail': `${pluriel(l.inconnus, 'inconnu')} · ${pluriel(l.desabonnes, 'désabonné')}`,
      gain: (gain >= 0 ? '+' : '−') + milliers(Math.abs(gain))
    };
    Object.keys(valeurs).forEach((k) => { $(`[data-ld-k="${k}"]`).textContent = valeurs[k]; });
    $('[data-ld-k-evol]').innerHTML = variation;
    $('[data-ld-envoyer]').setAttribute('data-k-tooltip', `${pluriel(l.abonnes, 'abonné')} la recevront`);
    // [D7] Les compteurs du filtre des membres suivent
    $('[data-ld-n="tous"]').textContent = milliers(l.contacts);
    $('[data-ld-n="abonne"]').textContent = milliers(l.abonnes);
    $('[data-ld-n="non"]').textContent = milliers(nonAbonnes());
    KanalDS.refresh($('[data-ld-statuts]'));
  }

  // ---------------------------------------------------------------- [D4] la définition
  const description = $('[data-ld-description]');
  function definition() {
    $('[data-ld-def-phrase]').textContent = synchronisee
      ? `Kanal reprend cette audience depuis ${source} et la met à jour seul. Pour changer ses membres, modifiez-la dans ${source}.`
      : l.fixe ? 'Tous vos contacts y sont d\'office. Elle ne se renomme pas et ne se supprime pas.'
        : 'Une liste se remplit : les contacts y entrent par un import, à la main, ou par une automatisation. Ils n\'en sortent que si vous les retirez.';
    $('[data-ld-edition]').hidden = synchronisee; $('[data-ld-synchro-details]').hidden = !synchronisee;
    if (synchronisee) {
      $('[data-ld-s="source"]').textContent = source; $('[data-ld-s="origine"]').textContent = l.origine;
      return;
    }
    description.value = l.description; description.readOnly = !!l.fixe;
    $('[data-ld-origines]').innerHTML = l.origines.map((o) => `<li class="k-bars__row" style="--k-value:${(o[1] / l.contacts).toFixed(3)}"><span class="k-bars__label">${esc(o[0])}</span><span class="k-bars__bar"><span></span></span><span class="k-bars__value">${milliers(o[1])}</span><span class="k-bars__rate">${Math.round(o[1] / l.contacts * 100)}${F}%</span></li>`).join('');
  }
  description.addEventListener('change', () => {
    const v = description.value.trim(); if (v === l.description) return;
    l.description = v; description.value = v;
    KanalDS.toast('Description enregistrée', { tone: 'success' });
  });

  // [D9] Audience synchronisée : le bandeau dit d'où elle vient et quand elle a été mise à jour
  const bandeau = $('[data-ld-synchro]');
  bandeau.hidden = !synchronisee;
  function synchro() {
    $('[data-ld-synchro-texte]').textContent = `Cette audience vient de ${source}. Dernière synchronisation ${l.synchro}${l.ilYA ? ', ' + l.ilYA : ''}. Elle est en lecture seule dans Kanal.`;
    $('[data-ld-s="synchro"]').textContent = l.synchro; $('[data-ld-d="modif"]').textContent = l.synchro;
  }
  $('[data-ld-synchro-bouton]').addEventListener('click', () => {
    l.synchro = 'à l\'instant'; l.ilYA = ''; synchro();
    KanalDS.toast(`Synchronisée avec ${source} : aucun changement`, { tone: 'success' });
  });

  // ---------------------------------------------------------------- [D5] la croissance sur 30 jours
  // Un point par jour, du 17 oct. au 16 nov. 2026. Le dernier point est le nombre de contacts d'aujourd'hui.
  function croissance() {
    const jours = Array.from({ length: 31 }, (_, i) => new Date(2026, 9, 17 + i));
    const poids = jours.slice(1).map((d, i) => (d.getDay() % 6 ? 1 : 1.5) * (i > 23 ? 1.8 : 1) * (1 + 0.25 * Math.sin(i * 1.7)));
    const parJour = KanalCourbe.repartir(Math.abs(gain), poids);
    const valeurs = [depart]; parJour.forEach((n) => valeurs.push(valeurs[valeurs.length - 1] + (gain >= 0 ? n : -n)));
    const date = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    $('[data-ld-courbe-desc]').textContent = `De ${milliers(depart)} à ${milliers(depart + gain)} contacts entre le 17 oct. et le 16 nov. 2026.`;
    KanalCourbe.tracer($('[data-ld-courbe]'), {
      valeurs, nom: 'Contacts', format: milliers, sansZero: true,
      etiquettes: jours.map((d) => `${d.toLocaleDateString('fr-FR', { weekday: 'short' })} ${date(d)}`),
      dates: jours.map(date)
    });
  }

  // ---------------------------------------------------------------- [D6] détails et automatisations
  function details() {
    $('[data-ld-d-cree]').textContent = synchronisee ? 'Reliée le' : 'Créée le';
    const d = { type: synchronisee ? `Synchronisée depuis ${source}` : 'Liste Kanal', cree: l.creeLe, par: l.par, modif: synchronisee ? l.synchro : l.modif };
    $('[data-ld-d-modif]').textContent = synchronisee ? 'Synchronisée' : 'Modifiée';
    Object.keys(d).forEach((k) => { $(`[data-ld-d="${k}"]`).textContent = d[k]; });
    $('[data-ld-automatisations]').innerHTML = l.automatisations.length
      ? l.automatisations.map((a) => `<li class="k-timeline__item"><span class="k-timeline__icon">${ic('bolt')}</span><div><div class="k-timeline__title">${esc(a[0])}</div><div class="k-timeline__meta">${esc(a[1])}</div></div><span class="k-badge k-badge--success">${a[2]}</span></li>`).join('')
      : '<li class="k-table__secondary">Aucune automatisation ne s\'en sert encore.</li>';
  }

  // ---------------------------------------------------------------- [D7] les membres
  const etat = { statut: 'tous', q: '' };
  const corps = $('[data-ld-membres]');
  let membreDuMenu = null;   // la ligne dont on a ouvert le menu
  function membres() {
    const q = normaliser(etat.q);
    return l.membres.filter((m) => (etat.statut === 'tous' || (etat.statut === 'abonne') === (m.consent === 'abonne'))
      && (!q || normaliser(m.nom + ' ' + m.tel + ' ' + m.email).includes(q)));
  }
  function ligne(m) {
    return `<tr data-k-row data-ld-membre="${m.id}">
      <td><div class="k-table__who"><span class="k-avatar k-avatar--${m.ton}">${esc(initiales(m.nom))}</span><div><a class="k-table__primary" href="contacts.html">${esc(m.nom)}</a><div class="k-table__secondary">${m.email ? esc(m.email) : 'Pas d\'e-mail'}</div></div></div></td>
      <td><span class="k-tabular">${esc(m.tel)}</span></td>
      <td>${badge(m)}</td>
      <td><div class="k-tabular">${m.ajout}</div><div class="k-table__secondary">${esc(m.par)}</div></td>
      <td class="k-table__actions"><button type="button" class="k-button k-button--ghost k-button--icon k-button--sm" aria-label="Actions sur ${esc(m.nom)}" aria-haspopup="menu" data-k-menu="ld-menu-membre" data-k-placement="bottom-end">${ic('ellipsis-horizontal')}</button></td>
    </tr>`;
  }
  function rendre() {
    const liste = membres(), sur = etat.statut === 'tous' ? l.contacts : etat.statut === 'abonne' ? l.abonnes : nonAbonnes();
    corps.innerHTML = liste.length ? liste.map(ligne).join('')
      : `<tr><td class="k-table__empty" colspan="5">${etat.q ? 'Aucun membre ne correspond à cette recherche.' : 'Aucun membre dans ce cas.'}</td></tr>`;
    $('[data-ld-pied]').textContent = `${liste.length} contact${liste.length > 1 ? 's' : ''} affiché${liste.length > 1 ? 's' : ''} sur ${milliers(sur)}`;
  }
  // Un clic sur un contact mène à sa fiche, dans Contacts. Le nom est un vrai lien ; le reste de la ligne suit.
  corps.addEventListener('click', (e) => {
    const b = e.target.closest('[data-k-menu]');
    if (b) { membreDuMenu = b.closest('[data-ld-membre]').dataset.ldMembre; return; }
    if (e.target.closest('button, a')) return;
    if (e.target.closest('[data-ld-membre]')) location.href = 'contacts.html';
  });
  $('[data-ld-statuts]').addEventListener('k:change', (e) => { etat.statut = e.detail.item.dataset.statut; rendre(); });
  $('[data-ld-recherche]').addEventListener('input', (e) => { etat.q = e.target.value.trim(); rendre(); });

  // Retirer un contact de la liste : il reste dans Kanal. Les chiffres suivent, et le toast permet d'annuler.
  const CLE = { abonne: 'abonnes', inconnu: 'inconnus', desabonne: 'desabonnes' };
  const retirer = $('[data-ld-m-retirer]');
  retirer.hidden = lectureSeule;
  $('[data-ld-m-sep]').hidden = lectureSeule;
  retirer.addEventListener('click', () => {
    const i = l.membres.findIndex((m) => m.id === membreDuMenu); if (i < 0) return;
    const m = l.membres.splice(i, 1)[0];
    l.contacts--; l[CLE[m.consent]]--; chiffres(); rendre(); confirmation();
    KanalDS.toast(`${m.nom} ne fait plus partie de la liste`, { action: { label: 'Annuler', onClick: () => { l.membres.splice(i, 0, m); l.contacts++; l[CLE[m.consent]]++; chiffres(); rendre(); confirmation(); } } });
  });

  // ---------------------------------------------------------------- [D8] les campagnes envoyées à cette liste
  function campagnes() {
    $('[data-ld-campagnes]').innerHTML = l.campagnes.length ? l.campagnes.map((c) => {
      const envoyee = c[3] != null, s = STATUTS[c[1]];
      return `<tr>
        <td>${envoyee ? `<a class="k-table__primary" href="campagne.html">${esc(c[0])}</a>` : `<div class="k-table__primary">${esc(c[0])}</div>`}<div class="k-table__secondary">${c[2]}</div></td>
        <td><span class="k-badge${s[1]}">${s[0]}</span></td>
        <td class="k-table__num">${envoyee ? milliers(c[3]) : '—'}</td>
        <td class="k-table__num">${envoyee ? taux(c[4].toFixed(1)) : '—'}</td>
        <td class="k-table__num">${envoyee ? taux(c[5].toFixed(1)) : '—'}</td>
        <td class="k-table__num">${envoyee ? euros(c[6]) : '—'}</td>
      </tr>`;
    }).join('') : '<tr><td class="k-table__empty" colspan="6">Aucune campagne n\'a encore été envoyée à cette liste.</td></tr>';
  }

  // ---------------------------------------------------------------- [D10] ajouter des contacts, à la main
  // Un numéro suffit. Sans accord connu, le contact entre avec un consentement « Inconnu » : il ne recevra pas de campagne.
  const ajout = $('[data-ld-ajout]'), numero = $('[data-ld-ajout-tel]'), ajouter = $('[data-ld-ajout-ok]');
  let ajoutes = 0;
  numero.addEventListener('input', () => { ajouter.disabled = numero.value.replace(/\D/g, '').length < 9; });
  ajout.addEventListener('submit', (e) => {
    e.preventDefault(); if (ajouter.disabled) return;
    const accord = $('[data-ld-ajout-accord]').checked, consent = accord ? 'abonne' : 'inconnu';
    l.membres.unshift({ id: 'ajout-' + (++ajoutes), nom: $('[data-ld-ajout-nom]').value.trim() || 'Nouveau contact', ton: 'blue', tel: numero.value.trim(), email: '', consent, ajout: AUJOURDHUI, par: 'Ajouté à la main' });
    l.contacts++; l[CLE[consent]]++;
    document.getElementById('ld-ajouter-main').close(); ajout.reset(); ajouter.disabled = true;
    chiffres(); rendre(); confirmation();
    KanalDS.toast(accord ? 'Contact ajouté à la liste' : 'Contact ajouté. Sans son accord, il ne recevra pas vos campagnes', { tone: 'success' });
  });

  // ---------------------------------------------------------------- [D11] dupliquer, supprimer
  // La confirmation dit ce qui disparaît et ce qui reste. Elle se réécrit quand le nom ou les chiffres changent.
  function confirmation() {
    const programmees = l.campagnes.filter((c) => c[1] === 'programmee').length, autos = l.automatisations.length;
    const usages = [autos ? pluriel(autos, 'automatisation') : '', programmees ? `${programmees} campagne${programmees > 1 ? 's' : ''} programmée${programmees > 1 ? 's' : ''}` : ''].filter(Boolean);
    $('[data-ld-suppr-titre]').textContent = synchronisee ? `Arrêter la synchronisation de « ${l.nom} » ?` : `Supprimer « ${l.nom} » ?`;
    $('[data-ld-suppr-desc]').textContent = (synchronisee
      ? `Kanal ne reprendra plus cette audience depuis ${source}. Ses ${milliers(l.contacts)} contacts restent dans Kanal, et rien ne change dans ${source}.`
      : `La liste disparaît. Ses ${milliers(l.contacts)} contacts restent dans Kanal.`)
      + (usages.length ? ` ${usages.join(' et ')} ${autos + programmees > 1 ? 's\'en servent' : 's\'en sert'} et n'${autos + programmees > 1 ? 'auront' : 'aura'} plus d'audience.` : '')
      + ' Cette action ne s\'annule pas.';
    $('[data-ld-suppr-garder]').textContent = synchronisee ? 'Garder la synchronisation' : 'Garder la liste';
    $('[data-ld-suppr-ok]').textContent = synchronisee ? 'Arrêter la synchronisation' : 'Supprimer la liste';
  }
  const supprimer = $('[data-ld-supprimer]');
  $('.k-menu__text', supprimer).textContent = synchronisee ? 'Arrêter la synchronisation' : 'Supprimer';
  if (l.fixe) { supprimer.setAttribute('aria-disabled', 'true'); supprimer.removeAttribute('data-k-open'); }
  // Dans l'app : la liste est supprimée, puis on revient à Listes et segments
  $('[data-ld-suppr-ok]').addEventListener('click', () => { location.href = 'listes.html'; });
  const dupliquer = $('[data-ld-dupliquer]');
  $('.k-menu__text', dupliquer).textContent = synchronisee ? 'Copier dans une liste Kanal' : 'Dupliquer';
  dupliquer.addEventListener('click', () => {
    KanalDS.toast(synchronisee ? `Liste Kanal créée : « ${l.nom} (copie) », avec ses ${milliers(l.contacts)} contacts` : `Liste dupliquée : « ${l.nom} (copie) »`, { tone: 'success' });
  });

  chiffres(); definition(); details(); rendre(); campagnes(); confirmation(); croissance();
  if (synchronisee) synchro();
})();
