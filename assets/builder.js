/* ==========================================================================
   Builder d'automatisation dans le design system. Script de automatisation.html.
   Repères [U1]…[U12] : voir les notes en tête de la page.

   Le builder est un tableau blanc : des nœuds posés où l'on veut (NOEUDS, avec
   x et y), reliés par des flèches (LIENS). On déplace la vue, on zoome, on tire
   une flèche d'une sortie vers un autre nœud, on ajoute une action depuis la
   barre du bas ou depuis le « + » d'une flèche, et on revient en arrière.
   Rien n'est enregistré : dans l'app, le graphe vient de l'API et s'y enregistre
   (c'est déjà un canvas de ce type, vue-flow, dans le builder en place).
   ========================================================================== */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const F = ' ';   // espace fine insécable
  const NS = 'http://www.w3.org/2000/svg';
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ic = (nom, micro) => `<k-icon name="${nom}"${micro ? ' set="micro"' : ''}></k-icon>`;
  // {{Prénom}} dans un texte devient une variable visible
  const variables = (t) => esc(t).replace(/\{\{(.+?)\}\}/g, '<span class="k-var">$1</span>');

  // ---------------------------------------------------------------- référentiels
  const EVENEMENTS = {
    panier: ['Un panier est abandonné', 'shopping-cart'], commande: ['Une commande est passée', 'shopping-bag'],
    abonnement: ['Un contact s\'abonne', 'user-plus'], motcle: ['Un contact envoie un mot-clé', 'link'],
    livraison: ['Une commande est livrée', 'cube'], message: ['Un contact vous écrit', 'chat-bubble-left']
  };
  const MODELES = {
    relance1: { nom: 'Relance panier', categorie: 'Marketing', texte: 'Bonjour {{Prénom}}, votre panier vous attend chez Maison Lumen. La bougie Ambre & Figue est encore disponible, mais il n\'en reste que 3.', bouton: 'Reprendre mon panier', lu: '71', clic: '24' },
    relance2: { nom: 'Relance panier, code de 10 %', categorie: 'Marketing', texte: '{{Prénom}}, un petit coup de pouce : 10 % sur votre panier avec le code RETOUR10, valable 24 heures.', bouton: 'J\'en profite', lu: '68', clic: '31' },
    bienvenue: { nom: 'Bienvenue', categorie: 'Marketing', texte: 'Bienvenue chez Maison Lumen, {{Prénom}}. Voici 10 % sur votre première commande.', bouton: 'Découvrir la boutique', lu: '82', clic: '19' },
    avis: { nom: 'Demande d\'avis', categorie: 'Utilitaire', texte: '{{Prénom}}, votre commande est arrivée. Qu\'en avez-vous pensé ?', bouton: 'Donner mon avis', lu: '74', clic: '12' }
  };
  const TESTS = { commande: 'A passé commande ?', lu: 'A lu le message précédent ?', clic: 'A cliqué le bouton ?', vip: 'Fait partie de « Meilleurs clients » ?' };
  const UNITES = { minutes: ['minute', 'minutes'], heures: ['heure', 'heures'], jours: ['jour', 'jours'] };
  const LISTES = ['Meilleurs clients', 'Black Friday 2026', 'Abonnés à la newsletter'];
  const COLLECTIONS = ['Meilleures ventes', 'Nouveautés', 'Coffrets de Noël', 'Produits du panier'];
  const ATTRIBUTS = ['Client fidèle', 'Langue', 'Parfum préféré', 'Dernier avis'];
  const EQUIPES = ['Service client', 'Ventes', 'Toute l\'équipe'];
  // [U3] Les familles de nœuds : messages (modèle, carrousel, message libre), logique (délai, condition, test A/B),
  // actions (appel API, liste, attribut, agent IA, équipe)
  const NOMS = { declencheur: 'Déclencheur', message: 'Modèle WhatsApp', carrousel: 'Carrousel', texte: 'Message libre', attente: 'Délai', condition: 'Condition', ab: 'Test A/B',
    api: 'Appel API', liste: 'Ajouter à une liste', attribut: 'Attribut du contact', ia: 'Agent IA', equipe: 'Passer à l\'équipe' };
  // Ce que la barre d'actions propose, et le nœud créé
  const AJOUTS = {
    message: () => ({ type: 'message', modele: 'bienvenue' }), attente: () => ({ type: 'attente', duree: 1, unite: 'jours', calmes: true }),
    condition: () => ({ type: 'condition', test: 'commande' }), ia: () => ({ type: 'ia' }), liste: () => ({ type: 'liste', liste: LISTES[0] }),
    carrousel: () => ({ type: 'carrousel', collection: COLLECTIONS[0], cartes: 3 }),
    texte: () => ({ type: 'texte', texte: 'Merci {{Prénom}} ! Une question sur votre commande ? Répondez simplement à ce message.' }),
    ab: () => ({ type: 'ab', part: 50 }),
    api: () => ({ type: 'api', methode: 'POST', url: 'https://api.maisonlumen.fr/kanal/evenement' }),
    attribut: () => ({ type: 'attribut', attribut: ATTRIBUTS[0], valeur: 'Oui' }),
    equipe: () => ({ type: 'equipe', equipe: EQUIPES[0] })
  };
  const LARGEUR = 283, ECART = 80, COLONNE = 340;   // un nœud fait 283 px, comme dans l'app

  // [U3] L'automatisation « Panier abandonné ». Une condition a deux sorties, oui et non ; les autres nœuds, une seule.
  // Une sortie que rien ne suit termine l'automatisation pour la personne.
  let NOEUDS = [
    { id: 'n1', type: 'declencheur', evenement: 'panier', minimum: 20 },
    { id: 'n2', type: 'attente', duree: 1, unite: 'heures', calmes: true },
    { id: 'n3', type: 'condition', test: 'commande' },
    { id: 'n4', type: 'message', modele: 'relance1' },
    { id: 'n5', type: 'attente', duree: 24, unite: 'heures', calmes: true },
    { id: 'n6', type: 'condition', test: 'commande' },
    { id: 'n7', type: 'message', modele: 'relance2' }
  ].map((n) => Object.assign({ x: 0, y: 0 }, n));
  let LIENS = [
    { de: 'n1', sortie: 'suite', vers: 'n2' }, { de: 'n2', sortie: 'suite', vers: 'n3' }, { de: 'n3', sortie: 'non', vers: 'n4' },
    { de: 'n4', sortie: 'suite', vers: 'n5' }, { de: 'n5', sortie: 'suite', vers: 'n6' }, { de: 'n6', sortie: 'non', vers: 'n7' }
  ];
  let suivant = 8;
  const etat = { noeud: null, lien: null, modifie: false, active: true };
  const vue = { x: 0, y: 0, z: 1 };
  const tableau = $('[data-bd-editeur]'), zoneNoeuds = $('[data-bd-noeuds]'), zoneLiens = $('[data-bd-liens]'), zonePlus = $('[data-bd-plus]');
  const panneau = document.getElementById('bd-panneau');
  const noeud = (id) => NOEUDS.find((n) => n.id === id);
  // Une condition et un test A/B ont deux sorties (à gauche et à droite) ; les autres nœuds, une seule
  const sorties = (n) => (n.type === 'condition' || n.type === 'ab' ? ['oui', 'non'] : ['suite']);

  // ---------------------------------------------------------------- [U10] revenir en arrière
  // Avant chaque changement, on garde une copie du graphe. Annuler la reprend ; rétablir revient en avant.
  const passe = [], futur = [];
  const copie = () => JSON.stringify({ NOEUDS, LIENS });
  function retenir() { passe.push(copie()); if (passe.length > 60) passe.shift(); futur.length = 0; etat.modifie = true; }
  function reprendre(depuis, vers) {
    if (!depuis.length) return;
    vers.push(copie());
    const e = JSON.parse(depuis.pop()); NOEUDS = e.NOEUDS; LIENS = e.LIENS;
    if (etat.noeud && !noeud(etat.noeud)) { etat.noeud = null; fermerPanneau(); }
    etat.lien = null; etat.modifie = true;
    rendre(); if (etat.noeud) ouvrirPanneau();
  }
  const annuler = () => reprendre(passe, futur), retablir = () => reprendre(futur, passe);

  // ---------------------------------------------------------------- [U3] les nœuds
  const duree = (e) => `${e.duree} ${UNITES[e.unite][e.duree > 1 ? 1 : 0]}`;
  const entete = (icone, sur, titre, fin) => `<div class="k-node__header"><span class="k-node__icon">${icone}</span><div><div class="k-node__kicker">${sur}</div><div class="k-node__title">${titre}</div></div>${fin ? `<span class="k-node__end">${fin}</span>` : ''}</div>`;
  const suivi = (n, sortie) => LIENS.some((l) => l.de === n.id && l.sortie === sortie);
  function corps(n) {
    if (n.type === 'declencheur') {
      return ['', entete(ic('bolt'), 'Démarre quand', esc(EVENEMENTS[n.evenement][0]))
        + `<div class="k-node__body">${n.evenement === 'panier' ? `Panier de plus de ${n.minimum}${F}€, contacts abonnés seulement.` : 'Contacts abonnés seulement.'}</div>`
        + `<div class="k-node__footer"><span>1${F}240 entrées</span><span>30 jours</span></div>`];
    }
    if (n.type === 'attente') return [' k-node--wait', entete(ic('clock'), 'Délai', duree(n))];
    if (n.type === 'message') {
      const m = MODELES[n.modele];
      return [' k-node--whatsapp', entete(ic('chat-bubble-left'), 'Modèle WhatsApp', esc(m.nom), `<span class="k-badge">${m.categorie}</span>`)
        + `<div class="k-node__body"><p>${variables(m.texte)}</p><span class="k-tag">${ic('arrow-top-right-on-square')}${esc(m.bouton)}</span></div>`
        + `<div class="k-node__footer"><span>Lu à ${m.lu}${F}%</span><span>${m.clic}${F}% de clics</span></div>`];
    }
    if (n.type === 'condition') {
      return [' k-node--condition', entete(ic('arrows-up-down'), 'Condition', esc(TESTS[n.test]))
        + `<div class="k-node__exits"><span>Oui${suivi(n, 'oui') ? '' : '<small>fin</small>'}</span><span>Non${suivi(n, 'non') ? '' : '<small>fin</small>'}</span></div>`];
    }
    if (n.type === 'carrousel') {
      return [' k-node--whatsapp', entete(ic('view-columns'), 'Carrousel WhatsApp', `${n.cartes} cartes produits`, '<span class="k-badge">Marketing</span>')
        + `<div class="k-node__body">Collection « ${esc(n.collection)} » : une image, un prix et un bouton par carte.<div class="k-node__cards" aria-hidden="true">${'<span></span>'.repeat(Math.min(n.cartes, 4))}</div></div>`];
    }
    if (n.type === 'texte') {
      return [' k-node--whatsapp', entete(ic('pencil-square'), 'Message libre', 'Texte')
        + `<div class="k-node__body"><p>${variables(n.texte)}</p></div><div class="k-node__footer"><span>Dans les 24${F}h après un message du contact</span></div>`];
    }
    if (n.type === 'ab') {
      return [' k-node--condition', entete(ic('beaker'), 'Test A/B', 'Répartition au hasard')
        + `<div class="k-node__exits"><span>A · ${n.part}${F}%${suivi(n, 'oui') ? '' : '<small>fin</small>'}</span><span>B · ${100 - n.part}${F}%${suivi(n, 'non') ? '' : '<small>fin</small>'}</span></div>`];
    }
    if (n.type === 'api') {
      return ['', entete(ic('code-bracket'), 'Appel API', esc(n.methode + ' ' + n.url.replace(/^https?:\/\//, '').split('/')[0]))
        + `<div class="k-node__body" style="overflow-wrap:anywhere">${esc(n.url)}</div>`];
    }
    if (n.type === 'attribut') return ['', entete(ic('tag'), 'Action', 'Modifier un attribut') + `<div class="k-node__body">« ${esc(n.attribut)} » devient « ${esc(n.valeur)} ».</div>`];
    if (n.type === 'equipe') return ['', entete(ic('hand-raised'), 'Action', 'Passer à l\'équipe') + `<div class="k-node__body">La conversation arrive dans l'inbox, assignée à « ${esc(n.equipe)} ».</div>`];
    if (n.type === 'ia') return [' k-node--ai', entete(ic('sparkles'), 'Agent IA', 'Lumi répond') + '<div class="k-node__body">Répond à partir de vos contenus, et passe la main à l\'équipe si elle ne sait pas.</div>'];
    return ['', entete(ic('queue-list'), 'Action', 'Ajouter à une liste') + `<div class="k-node__body">Le contact rejoint « ${esc(n.liste)} ».</div>`];
  }
  function htmlNoeud(n) {
    const c = corps(n);
    const poignees = (n.type === 'declencheur' ? '' : '<span class="k-handle k-handle--in" aria-hidden="true"></span>')
      + sorties(n).map((s) => `<span class="k-handle k-handle--out" data-bd-sortie="${s}" role="button" tabindex="-1" aria-label="Tirer une flèche${s === 'suite' ? '' : ' depuis « ' + (n.type === 'ab' ? (s === 'oui' ? 'A' : 'B') : s) + ' »'}" data-k-tooltip="Tirer une flèche" data-k-tooltip-side="bottom"></span>`).join('');
    return `<div class="k-node${c[0]}" data-bd-etape="${n.id}" data-type="${n.type}" tabindex="0" role="button" aria-selected="${etat.noeud === n.id}" style="left:${n.x}px;top:${n.y}px">${c[1]}${poignees}</div>`;
  }

  // ---------------------------------------------------------------- [U4] les flèches
  // Où sont les poignées d'un nœud, dans le repère du tableau : l'entrée en haut, les sorties en bas.
  function ancres(n) {
    const el = $(`[data-bd-etape="${n.id}"]`, zoneNoeuds), h = el ? el.offsetHeight : 120;
    return { entree: [n.x + LARGEUR / 2, n.y], suite: [n.x + LARGEUR / 2, n.y + h], oui: [n.x + LARGEUR * 0.28, n.y + h], non: [n.x + LARGEUR * 0.72, n.y + h], h };
  }
  const courbe = (a, b) => { const d = Math.max(36, Math.abs(b[1] - a[1]) / 2); return `M${a[0]} ${a[1]} C${a[0]} ${a[1] + d} ${b[0]} ${b[1] - d} ${b[0]} ${b[1] - 4}`; };
  const milieu = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];   // le milieu de cette courbe est celui du segment
  const svg = (nom, attrs, parent) => { const el = document.createElementNS(NS, nom); Object.keys(attrs).forEach((k) => el.setAttribute(k, attrs[k])); parent.appendChild(el); return el; };
  function dessinerLiens() {
    $$('path', zoneLiens).forEach((p) => { if (!p.closest('defs')) p.remove(); }); zonePlus.textContent = '';
    LIENS.forEach((l, i) => {
      const de = noeud(l.de), vers = noeud(l.vers); if (!de || !vers) return;
      const a = ancres(de)[l.sortie], b = ancres(vers).entree, d = courbe(a, b), choisi = etat.lien === i;
      svg('path', { class: 'k-edge', d, 'marker-end': `url(#bd-fleche${choisi ? '-choisie' : ''})`, 'data-selected': choisi }, zoneLiens);
      svg('path', { class: 'k-edge__hit', d, 'data-bd-lien': i }, zoneLiens);   // une zone large, pour attraper la flèche
      const m = milieu(a, b);
      zonePlus.insertAdjacentHTML('beforeend', `<span class="k-edge__tools" style="left:${m[0]}px;top:${m[1]}px">`
        + `<button type="button" class="k-edge__add" aria-label="Ajouter une action sur cette flèche" aria-haspopup="menu" data-k-menu="bd-ajouter" data-k-placement="right-start" data-bd-sur="${i}" data-k-tooltip="Ajouter une action ici" data-k-tooltip-side="right">${ic('plus', true)}</button>`
        + (choisi ? `<button type="button" class="k-edge__add" aria-label="Supprimer cette flèche" data-bd-couper="${i}" data-k-tooltip="Supprimer la flèche" data-k-kbd="Suppr" data-k-tooltip-side="right">${ic('x-mark', true)}</button>` : '') + '</span>');
    });
  }
  function rendre() {
    zoneNoeuds.innerHTML = NOEUDS.map(htmlNoeud).join('');
    dessinerLiens();
    // [U2] La barre : état, modifications, annuler et rétablir
    $('[data-bd-statut]').innerHTML = etat.active ? '<span class="k-badge k-badge--success"><span class="k-badge__dot"></span>Active</span>' : '<span class="k-badge"><span class="k-badge__dot"></span>En pause</span>';
    $('[data-bd-modifie]').hidden = !etat.modifie;
    const enregistrer = $('[data-bd-enregistrer]'); enregistrer.disabled = !etat.modifie; enregistrer.textContent = etat.modifie ? 'Enregistrer' : 'Enregistré';
    $('[data-bd-annuler]').disabled = !passe.length; $('[data-bd-retablir]').disabled = !futur.length;
    $('[data-bd-pause]').querySelector('.k-menu__text').textContent = etat.active ? 'Mettre en pause' : 'Activer';
  }

  // ---------------------------------------------------------------- [U6] la vue : déplacer, zoomer, tout voir, ranger
  function poserVue() {
    tableau.style.setProperty('--k-board-x', vue.x + 'px'); tableau.style.setProperty('--k-board-y', vue.y + 'px'); tableau.style.setProperty('--k-board-z', vue.z);
    $('[data-bd-zoom]').textContent = Math.round(vue.z * 100) + F + '%';
  }
  const point = (e) => { const r = tableau.getBoundingClientRect(); return [(e.clientX - r.left - vue.x) / vue.z, (e.clientY - r.top - vue.y) / vue.z]; };
  function zoomer(z, cx, cy) {
    const r = tableau.getBoundingClientRect(); cx = cx == null ? r.width / 2 : cx; cy = cy == null ? r.height / 2 : cy;
    z = Math.min(1.5, Math.max(0.4, Math.round(z * 100) / 100));
    vue.x = cx - (cx - vue.x) * z / vue.z; vue.y = cy - (cy - vue.y) * z / vue.z; vue.z = z; poserVue();
  }
  function cadre() {
    const xs = NOEUDS.map((n) => n.x), ys = NOEUDS.map((n) => n.y), bas = NOEUDS.map((n) => n.y + ancres(n).h);
    return { x: Math.min(...xs), y: Math.min(...ys), l: Math.max(...xs) + LARGEUR - Math.min(...xs), h: Math.max(...bas) - Math.min(...ys) };
  }
  function toutVoir() {
    const c = cadre(), l = tableau.clientWidth, h = tableau.clientHeight;
    vue.z = Math.min(1, Math.max(0.4, Math.min((l - 96) / c.l, (h - 200) / c.h)));
    vue.x = (l - c.l * vue.z) / 2 - c.x * vue.z; vue.y = (h - 96 - c.h * vue.z) / 2 - c.y * vue.z + 16; poserVue();
  }
  // Ranger : chaque nœud sous celui qui le précède, la sortie « oui » d'une condition dans la colonne de droite
  function ranger() {
    const vus = new Set();
    (function placer(id, x, y) {
      const n = noeud(id); if (!n || vus.has(id)) return; vus.add(id);
      n.x = x; n.y = y;
      const el = $(`[data-bd-etape="${id}"]`, zoneNoeuds), bas = y + (el ? el.offsetHeight : 120) + ECART;
      const vers = (s) => (LIENS.find((l) => l.de === id && l.sortie === s) || {}).vers;
      if (n.type === 'condition') { placer(vers('non'), x, bas); placer(vers('oui'), x + COLONNE, bas); } else placer(vers('suite'), x, bas);
    })(NOEUDS[0].id, 0, 0);
    rendre();
  }

  // ---------------------------------------------------------------- [U7] le panneau de propriétés
  const champ = (id, libelle, controle, aide) => `<div class="k-field"><label class="k-field__label" for="${id}">${libelle}</label>${controle}${aide ? `<span class="k-field__hint">${aide}</span>` : ''}</div>`;
  const options = (liste, valeur) => Object.keys(liste).map((k) => `<option value="${k}"${k === String(valeur) ? ' selected' : ''}>${esc(Array.isArray(liste[k]) ? liste[k][0] : liste[k].nom || liste[k])}</option>`).join('');
  function formulaire(e) {
    if (e.type === 'declencheur') {
      return champ('bd-evenement', 'Démarre quand', `<select class="k-select" id="bd-evenement" data-bd-champ="evenement">${options(EVENEMENTS, e.evenement)}</select>`)
        + (e.evenement === 'panier' ? champ('bd-minimum', 'Montant minimum du panier', `<div class="k-input-addon"><span class="k-input-addon__text">€</span><input class="k-input" id="bd-minimum" type="number" min="0" value="${e.minimum}" data-bd-champ="minimum"></div>`, 'En dessous, la personne n\'entre pas.') : '')
        + `<div class="k-banner k-banner--info">${ic('information-circle')}<div class="k-banner__text">Qui peut y entrer, et combien de fois : voyez les <button type="button" class="k-link" data-k-open="bd-reglages">réglages de l'automatisation</button>.</div></div>`;
    }
    if (e.type === 'attente') {
      return `<div class="k-field"><span class="k-field__label" id="bd-duree-l">Attendre</span><div class="k-menu__form" style="padding:0"><input class="k-input" type="number" min="1" value="${e.duree}" aria-labelledby="bd-duree-l" data-bd-champ="duree"><select class="k-select" aria-label="Unité" data-bd-champ="unite">${options({ minutes: 'minutes', heures: 'heures', jours: 'jours' }, e.unite)}</select></div></div>`
        + `<label class="k-check"><input class="k-switch" type="checkbox" role="switch" data-bd-champ="calmes" ${e.calmes ? 'checked' : ''}><span class="k-check__label">Respecter les heures calmes<span class="k-check__hint">Si l'attente finit entre 21 h et 9 h, le message part à 9 h.</span></span></label>`;
    }
    if (e.type === 'message') {
      const m = MODELES[e.modele];
      return champ('bd-modele', 'Modèle', `<select class="k-select" id="bd-modele" data-bd-champ="modele">${options(MODELES, e.modele)}</select>`, `Modèle ${m.categorie.toLowerCase()}, validé par Meta.`)
        + `<div class="k-field"><span class="k-field__label">Aperçu</span><div class="k-wa"><div class="k-wa__bubble"><div class="k-wa__body">${variables(m.texte)}</div><div class="k-wa__time">10:42</div><div class="k-wa__button">${ic('arrow-top-right-on-square')}${esc(m.bouton)}</div></div></div></div>`
        + `<dl class="k-details k-details--compact k-details--wrap"><dt>Prénom</dt><dd><span>Prénom du contact, sinon « bonjour »</span></dd><dt>Bouton</dt><dd><span>Lien vers le panier du contact</span></dd></dl>`;
    }
    if (e.type === 'condition') {
      return champ('bd-test', 'Tester si le contact', `<select class="k-select" id="bd-test" data-bd-champ="test">${options(TESTS, e.test)}</select>`)
        + `<div class="k-banner k-banner--info">${ic('information-circle')}<div class="k-banner__text">Tirez une flèche depuis <b>Oui</b> et depuis <b>Non</b> vers ce qui doit suivre. Une sortie sans flèche termine l'automatisation pour la personne.</div></div>`;
    }
    if (e.type === 'carrousel') {
      return champ('bd-collection', 'Produits montrés', `<select class="k-select" id="bd-collection" data-bd-champ="collection">${COLLECTIONS.map((l) => `<option${l === e.collection ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`, 'Une collection Shopify, ou les produits du panier du contact.')
        + champ('bd-cartes', 'Nombre de cartes', `<input class="k-input" id="bd-cartes" type="number" min="2" max="10" value="${e.cartes}" data-bd-champ="cartes">`, 'De 2 à 10 cartes. Le contact les fait défiler du doigt.')
        + `<div class="k-banner k-banner--info">${ic('information-circle')}<div class="k-banner__text">Un carrousel est un modèle marketing : Meta le valide comme les autres, et il ne part qu'aux contacts abonnés.</div></div>`;
    }
    if (e.type === 'texte') {
      return champ('bd-texte', 'Message', `<textarea class="k-textarea" id="bd-texte" rows="5" data-bd-champ="texte">${esc(e.texte)}</textarea>`, 'Écrivez {{Prénom}} pour le prénom du contact.')
        + `<div class="k-banner k-banner--warning">${ic('exclamation-triangle')}<div class="k-banner__text">Un message libre ne part que dans les 24 heures qui suivent un message du contact. Hors de cette fenêtre, WhatsApp exige un modèle.</div></div>`;
    }
    if (e.type === 'ab') {
      return champ('bd-part', 'Part des contacts envoyés vers A', `<div class="k-input-addon"><span class="k-input-addon__text">%</span><input class="k-input" id="bd-part" type="number" min="10" max="90" value="${e.part}" data-bd-champ="part"></div>`, `Le reste, ${100 - e.part}${F}%, part vers B. Le tirage est fait au hasard, une fois par contact.`)
        + `<div class="k-banner k-banner--info">${ic('information-circle')}<div class="k-banner__text">Tirez une flèche depuis <b>A</b> et depuis <b>B</b> vers les deux versions à comparer. Les résultats de chaque branche sont dans l'onglet Résultats.</div></div>`;
    }
    if (e.type === 'api') {
      return `<div class="k-field"><span class="k-field__label" id="bd-api-l">Requête</span><div class="k-menu__form" style="padding:0;grid-template-columns:104px minmax(0,1fr)"><select class="k-select" aria-label="Méthode" data-bd-champ="methode">${['POST', 'GET', 'PUT'].map((m) => `<option${m === e.methode ? ' selected' : ''}>${m}</option>`).join('')}</select><input class="k-input" type="url" value="${esc(e.url)}" aria-labelledby="bd-api-l" data-bd-champ="url"></div><span class="k-field__hint">Kanal envoie le contact et l'événement en JSON.</span></div>`
        + `<dl class="k-details k-details--compact k-details--wrap"><dt>En-têtes</dt><dd><span>Authorization : clé de l'automatisation</span></dd><dt>Délai maximal</dt><dd><span>10 secondes</span></dd><dt>En cas d'erreur</dt><dd><span>L'automatisation continue</span></dd></dl>`;
    }
    if (e.type === 'attribut') {
      return champ('bd-attribut', 'Attribut', `<select class="k-select" id="bd-attribut" data-bd-champ="attribut">${ATTRIBUTS.map((l) => `<option${l === e.attribut ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`)
        + champ('bd-valeur', 'Nouvelle valeur', `<input class="k-input" id="bd-valeur" type="text" value="${esc(e.valeur)}" data-bd-champ="valeur">`, 'Elle sert ensuite dans vos segments et vos conditions.');
    }
    if (e.type === 'equipe') {
      return champ('bd-equipe', 'Assigner à', `<select class="k-select" id="bd-equipe" data-bd-champ="equipe">${EQUIPES.map((l) => `<option${l === e.equipe ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`, 'La conversation passe dans l\'inbox et l\'automatisation s\'arrête pour ce contact.');
    }
    if (e.type === 'ia') return `<div class="k-banner k-banner--info">${ic('sparkles')}<div class="k-banner__text">Lumi prend la conversation si le contact répond. Elle se règle dans la page AI Agent.</div></div>`;
    return champ('bd-liste', 'Liste', `<select class="k-select" id="bd-liste" data-bd-champ="liste">${LISTES.map((l) => `<option${l === e.liste ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`);
  }
  function ouvrirPanneau() {
    const e = noeud(etat.noeud); if (!e) return;
    $('[data-bd-p-titre]').textContent = NOMS[e.type];
    $('[data-bd-p-corps]').innerHTML = formulaire(e);
    // Le déclencheur ne se supprime pas et ne se duplique pas : une automatisation en a toujours un, et un seul
    $('[data-bd-p-pied]').hidden = e.type === 'declencheur';
    // Le panneau est flottant : il passe par-dessus le tableau, à toutes les largeurs (data-open)
    panneau.setAttribute('data-open', ''); panneau.removeAttribute('data-closed');
  }
  function choisir(id) { etat.noeud = id; etat.lien = null; rendre(); ouvrirPanneau(); }
  function fermerPanneau() { panneau.removeAttribute('data-open'); panneau.setAttribute('data-closed', ''); }
  new MutationObserver(() => {
    const ferme = !panneau.hasAttribute('data-open');
    if (ferme && etat.noeud) { etat.noeud = null; rendre(); }
  }).observe(panneau, { attributes: true, attributeFilter: ['data-open', 'data-closed'] });
  // Un champ modifié change le nœud tout de suite
  $('[data-bd-p-corps]').addEventListener('change', (ev) => {
    const c = ev.target.closest('[data-bd-champ]'), e = noeud(etat.noeud); if (!c || !e) return;
    retenir();
    e[c.dataset.bdChamp] = c.type === 'checkbox' ? c.checked : c.type === 'number' ? Math.min(+c.max || Infinity, Math.max(c.min === '' ? 1 : +c.min, +c.value || 1)) : c.value;
    rendre();
    if (['evenement', 'modele', 'part', 'cartes'].includes(c.dataset.bdChamp)) ouvrirPanneau();
  });

  // ---------------------------------------------------------------- [U5] ajouter, relier, supprimer
  const HAUTEURS = { message: 200, carrousel: 196, texte: 168, attente: 64, condition: 104, ab: 104, api: 124, ia: 124, liste: 108, attribut: 108, equipe: 124 };
  const enAval = (id, vus) => { vus = vus || new Set(); if (vus.has(id)) return vus; vus.add(id); LIENS.filter((l) => l.de === id).forEach((l) => enAval(l.vers, vus)); return vus; };
  function ajouter(type, surLien) {
    retenir();
    const n = Object.assign({ id: 'n' + suivant++, x: 0, y: 0 }, AJOUTS[type]());
    if (surLien != null && LIENS[surLien]) {
      // Sur une flèche : le nœud prend sa place entre les deux, et ce qui suit descend pour lui faire de la place
      const l = LIENS[surLien], de = noeud(l.de), vers = noeud(l.vers), a = ancres(de);
      n.x = sorties(de).length > 1 && l.sortie === 'oui' ? vers.x : de.x; n.y = de.y + a.h + ECART;
      const manque = n.y + HAUTEURS[type] + ECART - vers.y;
      if (manque > 0) enAval(vers.id).forEach((id) => { noeud(id).y += manque; });
      LIENS.splice(surLien, 1, { de: l.de, sortie: l.sortie, vers: n.id }, { de: n.id, sortie: sorties(n).length > 1 ? 'non' : 'suite', vers: l.vers });
    } else {
      // Depuis la barre : à la suite du nœud choisi si sa sortie est libre, sinon au milieu de ce qu'on voit
      const avant = noeud(etat.noeud), libre = avant && sorties(avant).find((s) => !suivi(avant, s));
      if (libre) { n.x = avant.x + (libre === 'oui' ? COLONNE : 0); n.y = avant.y + ancres(avant).h + ECART; LIENS.push({ de: avant.id, sortie: libre, vers: n.id }); }
      else {
        n.x = Math.round(((tableau.clientWidth / 2 - vue.x) / vue.z - LARGEUR / 2) / 8) * 8; n.y = Math.round(((tableau.clientHeight / 2 - vue.y) / vue.z - 60) / 8) * 8;
        // Jamais posé sur un autre nœud : on le décale d'une colonne vers la droite tant que la place est prise
        const pris = () => NOEUDS.some((m) => n.x < m.x + LARGEUR + 24 && n.x + LARGEUR + 24 > m.x && n.y < m.y + ancres(m).h + 24 && n.y + HAUTEURS[type] + 24 > m.y);
        while (pris()) n.x += COLONNE;
      }
    }
    NOEUDS.push(n); choisir(n.id); montrer(n);
  }
  // Le nœud qu'on vient d'ajouter reste visible : ni sous le panneau de propriétés, ni sous la barre d'actions
  function montrer(n) {
    const droite = n.x * vue.z + vue.x + LARGEUR * vue.z, bas = n.y * vue.z + vue.y + ancres(n).h * vue.z;
    const limiteX = tableau.clientWidth - panneau.offsetWidth - 32, limiteY = tableau.clientHeight - 96;
    if (droite > limiteX) vue.x -= droite - limiteX;
    if (bas > limiteY) vue.y -= bas - limiteY;
    poserVue();
  }
  function supprimerNoeud(id) {
    const i = NOEUDS.findIndex((n) => n.id === id); if (i < 1) return;   // jamais le déclencheur
    retenir();
    // S'il n'avait qu'une entrée et une sortie, on recoud la flèche par-dessus lui
    const entrees = LIENS.filter((l) => l.vers === id), sortiesDe = LIENS.filter((l) => l.de === id);
    LIENS = LIENS.filter((l) => l.de !== id && l.vers !== id);
    if (entrees.length === 1 && sortiesDe.length === 1) LIENS.push({ de: entrees[0].de, sortie: entrees[0].sortie, vers: sortiesDe[0].vers });
    const retire = NOEUDS.splice(i, 1)[0];
    etat.noeud = null; fermerPanneau(); rendre();
    KanalDS.toast(`« ${NOMS[retire.type]} » supprimé`, { action: { label: 'Annuler', onClick: annuler } });
  }
  function couper(i) { if (!LIENS[i]) return; retenir(); LIENS.splice(i, 1); etat.lien = null; rendre(); }
  function relier(de, sortie, vers) {
    if (de === vers || noeud(vers).type === 'declencheur' || enAval(vers).has(de)) return false;   // ni boucle, ni retour vers le déclencheur
    retenir();
    LIENS = LIENS.filter((l) => !(l.de === de && l.sortie === sortie));   // une sortie n'a qu'une flèche
    LIENS.push({ de, sortie, vers }); etat.lien = null; rendre(); return true;
  }
  const menuAjout = document.getElementById('bd-ajouter');
  menuAjout.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-bd-ajout]'); if (!b) return;
    const depuis = menuAjout.__bouton; ajouter(b.dataset.bdAjout, depuis && depuis.dataset.bdSur != null ? +depuis.dataset.bdSur : null);
  });
  $('[data-bd-dock]').addEventListener('click', (ev) => { const b = ev.target.closest('[data-bd-ajout]'); if (b) ajouter(b.dataset.bdAjout, null); });
  $('[data-bd-dupliquer]').addEventListener('click', () => {
    const n = noeud(etat.noeud); if (!n || n.type === 'declencheur') return;
    retenir();
    const c = Object.assign({}, n, { id: 'n' + suivant++, x: n.x + COLONNE, y: n.y }); NOEUDS.push(c); choisir(c.id);
  });
  $('[data-bd-supprimer]').addEventListener('click', () => supprimerNoeud(etat.noeud));

  // ---------------------------------------------------------------- [U4] [U6] gestes sur le tableau
  // Un seul geste à la fois : déplacer la vue (fond), déplacer un nœud, ou tirer une flèche depuis une sortie.
  let geste = null;
  tableau.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('.k-dock, .k-edge__tools')) return;
    const sortie = e.target.closest('[data-bd-sortie]'), n = e.target.closest('[data-bd-etape]'), lien = e.target.closest('[data-bd-lien]');
    if (sortie) {
      const de = noeud(n.dataset.bdEtape), a = ancres(de)[sortie.dataset.bdSortie];
      geste = { genre: 'fleche', de: de.id, sortie: sortie.dataset.bdSortie, a, trait: svg('path', { class: 'k-edge k-edge--draft', d: courbe(a, a) }, zoneLiens) };
    } else if (n) {
      const cible = noeud(n.dataset.bdEtape);
      geste = { genre: 'noeud', id: cible.id, el: n, x0: e.clientX, y0: e.clientY, nx: cible.x, ny: cible.y, bouge: false, avant: copie() };
    } else if (lien) { etat.lien = +lien.dataset.bdLien; etat.noeud = null; fermerPanneau(); rendre(); return; }
    else geste = { genre: 'vue', x0: e.clientX, y0: e.clientY, vx: vue.x, vy: vue.y, bouge: false };
    try { tableau.setPointerCapture(e.pointerId); } catch (err) {}   // le geste continue hors du tableau
    if (geste.genre !== 'noeud') e.preventDefault();
  });
  tableau.addEventListener('pointermove', (e) => {
    if (!geste) return;
    const dx = e.clientX - geste.x0, dy = e.clientY - geste.y0;
    if (geste.genre === 'vue') {
      if (!geste.bouge && Math.hypot(dx, dy) < 3) return;
      geste.bouge = true; tableau.setAttribute('data-panning', ''); vue.x = geste.vx + dx; vue.y = geste.vy + dy; poserVue();
    } else if (geste.genre === 'noeud') {
      if (!geste.bouge && Math.hypot(dx, dy) < 4) return;   // en dessous, c'est un clic
      geste.bouge = true; geste.el.setAttribute('data-dragging', '');
      const n = noeud(geste.id); n.x = Math.round((geste.nx + dx / vue.z) / 8) * 8; n.y = Math.round((geste.ny + dy / vue.z) / 8) * 8;   // aimanté sur 8 px
      geste.el.style.left = n.x + 'px'; geste.el.style.top = n.y + 'px'; dessinerLiens();
    } else {
      const p = point(e); geste.trait.setAttribute('d', courbe(geste.a, [p[0], p[1] + 4]));
      const sous = document.elementFromPoint(e.clientX, e.clientY), cible = sous && sous.closest('[data-bd-etape]');
      $$('[data-target]', zoneNoeuds).forEach((x) => x.removeAttribute('data-target'));
      if (cible && cible.dataset.bdEtape !== geste.de && cible.dataset.type !== 'declencheur') cible.setAttribute('data-target', '');
    }
  });
  function finir(e) {
    if (!geste) return;
    const g = geste; geste = null; tableau.removeAttribute('data-panning');
    if (g.genre === 'vue') { if (!g.bouge && (etat.noeud || etat.lien != null)) { etat.noeud = null; etat.lien = null; fermerPanneau(); rendre(); } }
    else if (g.genre === 'noeud') {
      if (g.bouge) { passe.push(g.avant); futur.length = 0; etat.modifie = true; rendre(); } else choisir(g.id);
    } else {
      g.trait.remove();
      const sous = document.elementFromPoint(e.clientX, e.clientY), cible = sous && sous.closest('[data-bd-etape]');
      if (!cible || !relier(g.de, g.sortie, cible.dataset.bdEtape)) rendre();
    }
  }
  tableau.addEventListener('pointerup', finir);
  tableau.addEventListener('pointercancel', finir);
  // La molette déplace la vue ; avec Ctrl ou un pincement, elle zoome sur le pointeur
  tableau.addEventListener('wheel', (e) => {
    if (e.target.closest('.k-dock')) return;
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) { const r = tableau.getBoundingClientRect(); zoomer(vue.z * (1 - e.deltaY * 0.004), e.clientX - r.left, e.clientY - r.top); }
    else { vue.x -= e.deltaX; vue.y -= e.deltaY; poserVue(); }
  }, { passive: false });
  zonePlus.addEventListener('click', (e) => { const b = e.target.closest('[data-bd-couper]'); if (b) couper(+b.dataset.bdCouper); });
  zoneNoeuds.addEventListener('keydown', (e) => {
    const n = e.target.closest('[data-bd-etape]'); if (!n || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault(); choisir(n.dataset.bdEtape);
  });
  $('[data-bd-zoom-moins]').addEventListener('click', () => zoomer(vue.z - 0.1));
  $('[data-bd-zoom-plus]').addEventListener('click', () => zoomer(vue.z + 0.1));
  $('[data-bd-tout-voir]').addEventListener('click', toutVoir);
  $('[data-bd-ranger]').addEventListener('click', () => { retenir(); ranger(); toutVoir(); });

  // ---------------------------------------------------------------- [U10] clavier
  const enSaisie = (el) => el && (el.matches('input, textarea, select') || el.isContentEditable);
  document.addEventListener('keydown', (e) => {
    if (document.querySelector('dialog[open], .k-menu:popover-open, .k-popover:popover-open') || tableau.hidden) return;
    const z = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z';
    if (z && !enSaisie(document.activeElement)) { e.preventDefault(); if (e.shiftKey) retablir(); else annuler(); return; }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y' && !enSaisie(document.activeElement)) { e.preventDefault(); retablir(); return; }
    if (enSaisie(document.activeElement)) return;
    if (e.key === 'Delete' || e.key === 'Backspace') { if (etat.lien != null) { e.preventDefault(); couper(etat.lien); } else if (etat.noeud) { e.preventDefault(); supprimerNoeud(etat.noeud); } }
    else if (e.key === 'Escape' && (etat.noeud || etat.lien != null)) { etat.noeud = null; etat.lien = null; fermerPanneau(); rendre(); }
  });
  $('[data-bd-annuler]').addEventListener('click', annuler);
  $('[data-bd-retablir]').addEventListener('click', retablir);

  // ---------------------------------------------------------------- [U2] enregistrer, mettre en pause, tester ; [U9] réglages
  $('[data-bd-enregistrer]').addEventListener('click', () => { etat.modifie = false; rendre(); KanalDS.toast('Modifications enregistrées', { tone: 'success' }); });
  $('[data-bd-pause]').addEventListener('click', () => { etat.active = !etat.active; rendre(); KanalDS.toast(etat.active ? 'Automatisation activée' : 'Automatisation en pause : plus personne n\'y entre'); });
  $('[data-bd-test]').addEventListener('submit', (ev) => {
    ev.preventDefault(); document.getElementById('bd-tester').close();
    KanalDS.toast(`Test envoyé : ${NOEUDS.filter((n) => n.type === 'message').length} messages partent vers votre numéro, sans attente`, { tone: 'success' });
  });
  const reglages = $('[data-bd-reglages]');
  const delai = () => { $('[data-bd-delai]').hidden = reglages.elements.reentree.value !== 'delai'; };
  reglages.addEventListener('change', delai); delai();
  reglages.addEventListener('submit', (ev) => { ev.preventDefault(); document.getElementById('bd-reglages').close(); etat.modifie = true; rendre(); KanalDS.toast('Réglages de l\'automatisation modifiés', { tone: 'success' }); });

  // ---------------------------------------------------------------- [U8] onglets : éditeur ou résultats
  $('[data-bd-onglets]').addEventListener('k:change', (ev) => {
    const resultats = ev.detail.item.dataset.onglet === 'resultats';
    tableau.hidden = resultats; $('[data-bd-resultats]').hidden = !resultats;
    $$('[data-bd-outil]').forEach((b) => { b.hidden = resultats; });
    if (resultats) { fermerPanneau(); tracer(serieResultats); }
  });
  // La courbe des résultats : 31 jours, du 17 oct. au 16 nov. 2026. Elle n'est tracée qu'une fois l'onglet ouvert.
  const JOURS = Array.from({ length: 31 }, (_, i) => new Date(2026, 9, 17 + i));
  const milliers = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, F);
  const forme = (a, b) => JOURS.map((d, i) => 1 + 0.25 * Math.sin(i * a) + 0.12 * Math.cos(i * b) + (d.getDay() % 6 === 0 ? 0.2 : 0) + (i >= 28 ? 0.5 : 0));   // le Black Friday remplit les paniers
  const SERIES = {
    entrees: { nom: 'Entrées', format: milliers, valeurs: KanalCourbe.repartir(1240, forme(1.3, 0.7)) },
    ca: { nom: 'Chiffre d’affaires', format: (n) => `${milliers(n)}${F}€`, valeurs: KanalCourbe.repartir(9860, forme(1.7, 0.6)) }
  };
  let serieResultats = 'entrees';
  function tracer(cle) {
    serieResultats = cle;
    KanalCourbe.tracer($('[data-bd-courbe]'), Object.assign({
      etiquettes: JOURS.map((d) => d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })),
      dates: JOURS.map((d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }))
    }, SERIES[cle]));
  }
  $('[data-bd-series]').addEventListener('k:change', (ev) => tracer(ev.detail.item.dataset.serie));

  // ---------------------------------------------------------------- au départ : on range, puis on cadre
  rendre(); ranger();
  vue.x = Math.round((tableau.clientWidth - LARGEUR) / 2); vue.y = 40; poserVue();
})();
