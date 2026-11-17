/* ==========================================================================
   Inbox Kanal dans le design system. Script de la page inbox.html.
   Mêmes fonctions et mêmes repères [B0]…[B14] que kanal/assets/js/inbox-vues.js :
   seul le balisage produit change (classes .k-* du design system).

   Principe : rien n'est affiché tant qu'il ne sert pas. Les filtres sont
   derrière un bouton, les
   réponses enregistrées derrière « / », les raccourcis derrière « ? ».

   Maquette : les conversations sont des données fixes (CONVERSATIONS). Dans
   l'app, elles viennent de l'API et les compteurs sont calculés côté serveur.
   Les menus, toasts, infobulles et modales viennent de composants.js (KanalDS).
   ========================================================================== */
(function () {
  'use strict';

  // ---------- [B0] Équipe, listes, réponses enregistrées
  const MOI = 'cr';
  const EQUIPE = {
    cr: { nom: 'Camille Roux', prenom: 'Camille', init: 'CR', ton: 'ink' },
    tg: { nom: 'Théo Garnier', prenom: 'Théo', init: 'TG', ton: 'violet' }
  };
  const AGENT_IA = 'Lumi';
  const LISTES = { vip: 'Meilleurs clients', bf: 'Black Friday 2026', nouveaux: 'Nouveaux clients' };
  const REPONSES = [
    { titre: 'Délais de livraison', texte: 'Bonjour {prenom} ! Nos commandes partent sous 24 h et arrivent en 2 à 3 jours ouvrés en France 🚚' },
    { titre: 'Suivi de commande', texte: 'Bonjour {prenom}, vous pouvez suivre votre colis ici : {lien_suivi}. N\'hésitez pas si besoin !' },
    { titre: 'Colis abîmé', texte: 'Je suis vraiment désolée {prenom} 😔 Pouvez-vous m\'envoyer une photo du colis ? Je vous renvoie une bougie neuve dès réception.' },
    { titre: 'Retour et échange', texte: 'Vous avez 30 jours pour retourner un article, {prenom}. Je vous envoie l\'étiquette de retour par e-mail.' },
    { titre: 'Code de bienvenue', texte: 'Avec plaisir {prenom} ! Voici -10 % sur votre prochaine commande avec le code LUMEN10 ✨' }
  ];
  const REPORTS = [
    { cle: '1h', titre: 'Dans 1 heure', reveil: 'dans 1 h' },
    { cle: '3h', titre: 'Dans 3 heures', reveil: 'dans 3 h' },
    { cle: 'demain', titre: 'Demain 9 h', reveil: 'demain 9 h' },
    { cle: 'lundi', titre: 'Lundi 9 h', reveil: 'lundi 9 h' }
  ];

  // [B0] Données de démo. Temps en minutes depuis maintenant.
  //   recu   : dernier message de la conversation (client, nous ou l'IA)
  //   client : dernier message du client (fenêtre 24 h + « attend depuis »)
  //   de     : auteur du dernier message : client | vous | ia
  //   ia     : active (l'IA répond) | main (l'IA a passé la main) | coupee
  //   statut : ouverte | reportee | fermee
  //   messages : de = client | vous | ia | note | modele (modèle WhatsApp envoyé) | evenement (Shopify)
  const CONVERSATIONS = [
    { id: 'lea', nom: 'Léa Martin', init: 'LM', ton: 'blue', tel: '+33 6 00 00 00 01', apercu: '« Joyeux anniversaire Maman » ❤️', de: 'client', recu: 2, client: 2, nonLu: false, ia: 'coupee', assigne: 'cr', statut: 'ouverte', listes: ['vip', 'bf'],
      messages: [
        { de: 'evenement', icone: 'shopping-cart', texte: 'Panier abandonné · 86,00 € (n°38215904)', il: 1310 },
        { de: 'modele', modele: 'Panier abandonné', titre: 'Votre panier vous attend ✨', texte: 'Bonjour Léa, vous avez laissé la Bougie Ambre & Figue et le Photophore Céramique dans votre panier. Profitez de -10 % avec le code LUMEN10 pendant 24 h 🕯️', pied: 'Maison Lumen · Paris', boutons: ['Finaliser ma commande', 'Pas intéressée'], lu: true, il: 1280 },
        { de: 'client', texte: 'Bonjour ! Le code ne fonctionne pas sur le photophore 😕', il: 1252 },
        { de: 'ia', texte: 'Bonjour Léa ! Le code LUMEN10 s\'applique uniquement aux bougies. Le Photophore Céramique est déjà à prix réduit (29 €), les deux remises ne se cumulent pas.\nJe peux vous aider pour autre chose ?', lu: true, il: 1251 },
        { de: 'client', texte: 'Ah d\'accord, c\'est noté. Je finalise ma commande 🙂', il: 1247 },
        { de: 'evenement', icone: 'shopping-bag', texte: 'Commande finalisée · 86,00 € (n°10482)', il: 121 },
        { de: 'modele', modele: 'Confirmation de commande', titre: 'Commande confirmée 🎉', texte: 'Merci Léa ! Votre commande n°10482 (86 €) est bien enregistrée.\nNous la préparons avec soin, vous recevrez le lien de suivi dès l\'expédition.', pied: 'Maison Lumen', boutons: ['Suivre ma commande'], lu: true, il: 120 },
        { de: 'client', texte: 'Parfait, merci beaucoup ! Est-ce que je peux ajouter une carte cadeau ?', il: 13 },
        { de: 'vous', texte: 'Bien sûr Léa ! Je l\'ajoute à votre colis, dites-moi simplement le message que vous souhaitez y inscrire 🎁', lu: true, il: 9 },
        { de: 'client', texte: '« Joyeux anniversaire Maman » ❤️', il: 2 }
      ],
      fiche: { prenom: 'Léa', ville: 'Lyon', bougie: 'Ambre & Figue', anniv: '12/03', depense: '312,00 €', commandes: '4', panier: '78,00 €', derniere: '9 nov. 2026' } },
    { id: 'thomas', nom: 'Thomas Bernard', init: 'TB', ton: 'green', tel: '+33 6 00 00 00 02', apercu: 'Je voudrais changer l\'adresse de livraison de ma commande n°10481', de: 'client', recu: 8, client: 8, nonLu: true, ia: 'main', assigne: null, statut: 'ouverte', listes: ['bf'],
      motif: 'changement d\'adresse sur une commande déjà payée',
      resume: { demande: 'Changer l\'adresse de livraison de la commande n°10481, déjà payée.', fait: 'A vérifié que la commande n\'est pas encore expédiée.', raison: 'Modifier une commande payée n\'est pas autorisé à l\'IA.' },
      messages: [
        { de: 'client', texte: 'Bonjour, ma commande n°10481 est-elle expédiée ?', il: 12 },
        { de: 'ia', texte: 'Bonjour Thomas ! Votre commande n°10481 est en préparation, elle partira demain matin 📦', il: 11 },
        { de: 'client', texte: 'Je voudrais changer l\'adresse de livraison de ma commande n°10481', il: 8 }
      ],
      fiche: { prenom: 'Thomas', ville: 'Nantes', bougie: 'Bois de Cèdre', anniv: '—', depense: '154,00 €', commandes: '2', panier: '77,00 €', derniere: '15 nov. 2026' } },
    { id: 'ines', nom: 'Inès Robert', init: 'IR', ton: 'violet', tel: '+33 6 00 00 00 03', apercu: 'Votre Diffuseur Fleur d\'Oranger arrive demain avant 13 h 🌸', de: 'ia', recu: 32, client: 33, nonLu: false, ia: 'active', assigne: null, statut: 'ouverte', listes: ['nouveaux'],
      messages: [
        { de: 'client', texte: 'Bonjour, quand est-ce que je reçois mon diffuseur ?', il: 33 },
        { de: 'ia', texte: 'Votre Diffuseur Fleur d\'Oranger arrive demain avant 13 h 🌸', il: 32 }
      ],
      fiche: { prenom: 'Inès', ville: 'Bordeaux', bougie: 'Fleur d\'Oranger', anniv: '28/07', depense: '96,00 €', commandes: '1', panier: '96,00 €', derniere: '14 nov. 2026' } },
    { id: 'hugo', nom: 'Hugo Petit', init: 'HP', ton: 'orange', tel: '+33 6 00 00 00 04', apercu: 'Le colis est arrivé cassé, je veux un remboursement', de: 'client', recu: 45, client: 45, nonLu: true, ia: 'main', assigne: null, statut: 'ouverte', listes: ['nouveaux'],
      motif: 'demande de remboursement (colis cassé)',
      resume: { demande: 'Remboursement de la commande n°10466 : bougie reçue cassée.', fait: 'S\'est excusée et a demandé une photo du colis.', raison: 'Un remboursement demande une validation humaine.' },
      messages: [
        { de: 'client', texte: 'Bonjour, j\'ai reçu ma commande n°10466 ce matin', il: 52 },
        { de: 'ia', texte: 'Bonjour Hugo, merci pour votre message ! Tout est en ordre avec votre bougie ?', il: 51 },
        { de: 'client', texte: 'Le colis est arrivé cassé, je veux un remboursement', il: 45 }
      ],
      fiche: { prenom: 'Hugo', ville: 'Lille', bougie: '—', anniv: '—', depense: '64,00 €', commandes: '1', panier: '64,00 €', derniere: '12 nov. 2026' } },
    { id: 'sarah', nom: 'Sarah Fournier', init: 'SF', ton: 'rose', tel: '+33 6 00 00 00 05', apercu: 'Avec plaisir Sarah, à bientôt !', de: 'vous', recu: 60, client: 65, nonLu: false, ia: 'coupee', assigne: 'tg', statut: 'ouverte', listes: ['vip'],
      mentions: ['cr'], presence: 'tg',
      messages: [
        { de: 'client', texte: 'Est-ce que vous pouvez graver un prénom sur le couvercle du coffret ?', il: 65 },
        { de: 'note', auteur: 'tg', texte: '@Camille Roux tu peux confirmer qu\'on peut graver un prénom sur le coffret ? Je lui ai dit oui 🙏', il: 62 },
        { de: 'vous', texte: 'Avec plaisir Sarah, à bientôt !', il: 60 }
      ],
      fiche: { prenom: 'Sarah', ville: 'Paris', bougie: 'Thé Noir', anniv: '03/11', depense: '228,00 €', commandes: '3', panier: '76,00 €', derniere: '13 nov. 2026' } },
    { id: 'nicolas', nom: 'Nicolas Rousseau', init: 'NR', ton: 'blue', tel: '+33 6 00 00 00 06', apercu: 'Le Coffret Découverte est dispo en précommande ?', de: 'client', recu: 180, client: 180, nonLu: true, ia: 'coupee', assigne: 'cr', statut: 'ouverte', listes: [],
      messages: [{ de: 'client', texte: 'Le Coffret Découverte est dispo en précommande ?', il: 180 }],
      fiche: { prenom: 'Nicolas', ville: 'Rennes', bougie: 'Ambre & Figue', anniv: '—', depense: '0,00 €', commandes: '0', panier: '—', derniere: '—' } },
    { id: 'mila', nom: 'Mila Dupont', init: 'MD', ton: 'green', tel: '+33 6 00 00 00 07', apercu: 'Votre commande n°10470 vient d\'être expédiée 📦', de: 'ia', recu: 300, client: 310, nonLu: false, ia: 'active', assigne: null, statut: 'ouverte', listes: ['bf'],
      messages: [
        { de: 'client', texte: 'Coucou, des nouvelles de ma commande ?', il: 310 },
        { de: 'ia', texte: 'Votre commande n°10470 vient d\'être expédiée 📦', il: 300 }
      ],
      fiche: { prenom: 'Mila', ville: 'Marseille', bougie: 'Rose Ancienne', anniv: '19/05', depense: '182,00 €', commandes: '2', panier: '91,00 €', derniere: '15 nov. 2026' } },
    { id: 'manon', nom: 'Manon Leroy', init: 'ML', ton: 'violet', tel: '+33 6 00 00 00 08', apercu: 'La bougie Ambre & Figue existe en grand format ?', de: 'client', recu: 1320, client: 1320, nonLu: false, ia: 'main', assigne: null, statut: 'ouverte', listes: ['vip'],
      motif: 'question produit hors catalogue (grand format)',
      resume: { demande: 'Savoir si la bougie Ambre & Figue existe en grand format.', fait: 'A cherché dans le catalogue : pas de grand format en vente.', raison: 'Réponse à confirmer par l\'équipe (projet de nouveau format ?).' },
      messages: [{ de: 'client', texte: 'La bougie Ambre & Figue existe en grand format ?', il: 1320 }],
      fiche: { prenom: 'Manon', ville: 'Toulouse', bougie: 'Ambre & Figue', anniv: '—', depense: '42,00 €', commandes: '1', panier: '42,00 €', derniere: '2 oct. 2026' } },
    { id: 'zoe', nom: 'Zoé Thomas', init: 'ZT', ton: 'orange', tel: '+33 6 00 00 00 09', apercu: 'Merci pour votre retour Zoé !', de: 'vous', recu: 1440, client: 1500, nonLu: false, ia: 'active', assigne: 'cr', statut: 'fermee', listes: ['vip'],
      messages: [
        { de: 'client', texte: 'J\'adore la Figue Noire, elle sent divinement bon !', il: 1500 },
        { de: 'vous', texte: 'Merci pour votre retour Zoé !', il: 1440 }
      ],
      fiche: { prenom: 'Zoé', ville: 'Lyon', bougie: 'Figue Noire', anniv: '08/02', depense: '410,00 €', commandes: '5', panier: '82,00 €', derniere: '6 nov. 2026' } },
    { id: 'julien', nom: 'Julien Moreau', init: 'JM', ton: 'rose', tel: '+33 6 00 00 00 10', apercu: 'Super, merci ! Je reviens vers vous après réception.', de: 'client', recu: 2880, client: 2880, nonLu: false, ia: 'coupee', assigne: 'cr', statut: 'reportee', reveil: 'demain 9 h', listes: [],
      messages: [
        { de: 'vous', texte: 'Votre échange est validé Julien, la nouvelle bougie part aujourd\'hui.', il: 2890 },
        { de: 'client', texte: 'Super, merci ! Je reviens vers vous après réception.', il: 2880 }
      ],
      fiche: { prenom: 'Julien', ville: 'Strasbourg', bougie: '—', anniv: '—', depense: '58,00 €', commandes: '1', panier: '58,00 €', derniere: '11 nov. 2026' } },
    { id: 'chloe', nom: 'Chloé Lambert', init: 'CL', ton: 'blue', tel: '+33 6 00 00 00 11', apercu: 'Je vous laisse avec Camille pour la suite.', de: 'vous', recu: 4320, client: 4330, nonLu: false, ia: 'coupee', assigne: 'cr', statut: 'ouverte', listes: ['vip', 'bf'],
      messages: [
        { de: 'client', texte: 'Je voudrais un devis pour 40 bougies pour un mariage', il: 4330 },
        { de: 'vous', texte: 'Je vous laisse avec Camille pour la suite.', il: 4320 }
      ],
      fiche: { prenom: 'Chloé', ville: 'Nice', bougie: 'Vanille Tonka', anniv: '30/09', depense: '265,00 €', commandes: '3', panier: '88,33 €', derniere: '10 nov. 2026' } }
  ];

  // ---------- [B1] Vues par défaut. Elles ne regardent pas le statut :
  // le segmenté Ouvertes / Reportées / Fermées s'applique par-dessus.
  const VUES = [
    { cle: 'traiter', titre: 'À traiter', icone: 'inbox', tri: 'attente', aide: 'Le client attend une réponse humaine',
      test: (c) => c.ia === 'main' || (c.ia === 'coupee' && c.de === 'client') },
    { cle: 'miennes', titre: 'Mes conversations', icone: 'user', tri: 'recent', aide: 'Assignées à moi', test: (c) => c.assigne === MOI },
    // Mentions : la vue garde les conversations lues ; le compteur ne compte que les non lues,
    // et l'entrée n'apparaît que s'il y en a (ou si on est dessus).
    { cle: 'mentions', titre: 'Mentions', icone: 'at-symbol', tri: 'recent', aide: 'On vous a mentionnée dans une note', siVide: 'cacher',
      test: (c) => (c.mentions || []).includes(MOI), compte: (c) => (c.mentions || []).includes(MOI) && !c.mentionLue },
    { cle: 'non-assignees', titre: 'Non assignées', icone: 'user-plus', tri: 'recent', aide: 'Assignées à personne', test: (c) => !c.assigne },
    { cle: 'ia', titre: 'Gérées par l\'IA', icone: 'sparkles', tri: 'recent', aide: `${AGENT_IA} répond, rien à faire`, test: (c) => c.ia === 'active' },
    { cle: 'toutes', titre: 'Toutes', icone: 'rectangle-stack', tri: 'recent', aide: 'Toutes les conversations', test: () => true }
  ];
  const STATUTS = ['ouverte', 'reportee', 'fermee'];
  // [B3] Tris
  const TRIS = {
    attente: { titre: 'En attente depuis le plus longtemps', court: 'Attente la plus longue', f: (a, b) => attente(b) - attente(a) },
    recent: { titre: 'Plus récent', court: 'Plus récent', f: (a, b) => a.recu - b.recu },
    ancien: { titre: 'Plus ancien', court: 'Plus ancien', f: (a, b) => b.recu - a.recu },
    fenetre: { titre: 'Fenêtre de 24 h qui expire bientôt', court: 'Fenêtre de 24 h', f: (a, b) => fenetre(a) - fenetre(b) }
  };
  // [B8] Filtres : un choix par groupe (cliquer à nouveau désélectionne)
  const FILTRES = [
    { cle: 'assigne', titre: 'Assignée à', options: [['moi', 'Moi'], ['personne', 'Personne'], ['tg', 'Théo Garnier']],
      test: (c, v) => v === 'moi' ? c.assigne === MOI : v === 'personne' ? !c.assigne : c.assigne === v },
    { cle: 'ia', titre: 'IA', options: [['active', 'Active'], ['main', 'En pause'], ['coupee', 'Coupée']], test: (c, v) => c.ia === v },
    { cle: 'fenetre', titre: 'Fenêtre de 24 h', options: [['ouverte', 'Ouverte'], ['bientot', 'Expire sous 3 h'], ['expiree', 'Expirée']],
      test: (c, v) => v === 'ouverte' ? fenetre(c) > 0 : v === 'bientot' ? fenetre(c) > 0 && fenetre(c) < 180 : fenetre(c) <= 0 },
    { cle: 'liste', titre: 'Liste', options: Object.keys(LISTES).map((k) => [k, LISTES[k]]), test: (c, v) => (c.listes || []).includes(v) },
    { cle: 'lecture', titre: 'Lecture', options: [['non-lues', 'Non lues']], test: (c) => c.nonLu }
  ];

  // ---------- État
  const etat = { vue: 'traiter', statut: 'ouverte', tri: null, choisie: 'lea', filtres: {}, q: '', mode: 'reponse', auto: false };
  const memoire = {
    lire(k) { try { return JSON.parse(localStorage.getItem('kanal-inbox-' + k)); } catch (e) { return null; } },
    ecrire(k, v) { try { localStorage.setItem('kanal-inbox-' + k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } }
  };
  etat.tri = memoire.lire('tri'); if (etat.tri && !TRIS[etat.tri]) etat.tri = null;
  let VUES_PERSO = memoire.lire('vues') || []; // [{ cle, titre, base, filtres }]
  VUES_PERSO = VUES_PERSO.filter((p) => p && p.cle && VUES.some((v) => v.cle === p.base));

  // ---------- Outils
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;
  const duree = (min) => min < 1 ? 'à l\'instant' : min < 60 ? `${min} min` : min < 1440 ? `${Math.round(min / 60)} h` : `${Math.round(min / 1440)} j`;
  const fenetre = (c) => 1440 - c.client;              // minutes restantes de la fenêtre de 24 h (≤ 0 = expirée)
  const attente = (c) => (c.de === 'client' ? c.client : -1);
  const conv = (id) => CONVERSATIONS.find((c) => c.id === id);
  const vuePerso = (cle) => VUES_PERSO.find((v) => v.cle === cle);
  function vue() {
    const p = vuePerso(etat.vue);
    if (p) { const b = VUES.find((v) => v.cle === p.base); return { cle: p.cle, titre: p.titre, tri: b.tri, test: b.test, perso: p }; }
    return VUES.find((v) => v.cle === etat.vue);
  }
  const triActif = () => etat.tri || vue().tri;
  const filtresActifs = () => Object.keys(etat.filtres).filter((k) => etat.filtres[k]);
  const passeFiltres = (c, f) => FILTRES.every((g) => !f[g.cle] || g.test(c, f[g.cle]));
  const correspond = (c) => {
    if (!vue().test(c) || !passeFiltres(c, etat.filtres)) return false;
    if (!etat.q) return true;
    const q = etat.q.toLowerCase();
    return [c.nom, c.apercu, c.tel].some((t) => t.toLowerCase().includes(q));
  };
  const enSaisie = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  const ic = (nom, micro) => `<k-icon name="${nom}"${micro ? ' set="micro"' : ''}></k-icon>`;
  const avatar = (p, taille) => `<span class="k-avatar${taille ? ' k-avatar--' + taille : ''} k-avatar--${p.ton}" title="${esc(p.nom)}">${p.init}</span>`;
  const coche = '<span class="k-menu__end"><k-icon class="k-menu__check" name="check" set="micro"></k-icon></span>';
  const touche = (t) => `<span class="k-menu__end">${t.split(' ').map((x) => `<span class="k-kbd">${x}</span>`).join('')}</span>`;
  const avecMentions = (t) => esc(t).replace(/@(Camille Roux|Théo Garnier)/g, '<span class="k-mention">@$1</span>');
  const remplir = (t, c) => t.replace('{prenom}', c.fiche.prenom).replace('{lien_suivi}', 'maisonlumen.fr/suivi');
  const fermer = (id) => { const m = document.getElementById(id); if (m && m.matches(':popover-open')) m.hidePopover(); };
  const toast = (message, annuler) => KanalDS.toast(message, annuler ? { action: { label: 'Annuler', onClick: annuler } } : {});

  // ======================================================================
  // [B1] Vues dans le panneau de section (+ [B8] vues enregistrées)
  // ======================================================================
  const zoneVues = $('[data-ib-vues]');
  function rendreVues() {
    const ouv = CONVERSATIONS.filter((c) => c.statut === 'ouverte');
    let h = VUES.map((v) => {
      const n = ouv.filter(v.compte || v.test).length;
      const actif = v.cle === etat.vue;
      if (v.siVide === 'cacher' && !n && !actif) return '';
      const fin = !n ? '' : v.cle === 'traiter' ? `<span class="k-count k-count--danger">${n}</span>` : v.cle === 'mentions' ? `<span class="k-count k-count--accent">${n}</span>` : n;
      return `<button type="button" class="k-nav__item" data-vue="${v.cle}" data-k-tooltip="${esc(v.aide)}" data-k-tooltip-side="right"${actif ? ' aria-current="page"' : ''}>
        ${ic(v.icone)}<span>${esc(v.titre)}</span><span class="k-nav__end k-tabular">${fin}</span></button>`;
    }).join('');
    if (VUES_PERSO.length) {
      h += '<div class="k-nav__label">Mes vues</div>' + VUES_PERSO.map((p) => {
        const b = VUES.find((v) => v.cle === p.base);
        const n = ouv.filter((c) => b.test(c) && passeFiltres(c, p.filtres)).length;
        const actif = p.cle === etat.vue;
        return `<div class="k-nav__row"><button type="button" class="k-nav__item" data-vue="${p.cle}"${actif ? ' aria-current="page"' : ''}>
          ${ic('bookmark')}<span>${esc(p.titre)}</span><span class="k-nav__end k-tabular">${n || ''}</span></button>
          <button type="button" class="k-nav__remove" data-suppr-vue="${p.cle}" aria-label="Supprimer la vue ${esc(p.titre)}" data-k-tooltip="Supprimer la vue">${ic('x-mark', true)}</button></div>`;
      }).join('');
    }
    zoneVues.innerHTML = h;
  }
  zoneVues.addEventListener('click', (e) => {
    const s = e.target.closest('[data-suppr-vue]');
    if (s) {
      const p = vuePerso(s.dataset.supprVue);
      VUES_PERSO = VUES_PERSO.filter((v) => v.cle !== p.cle); memoire.ecrire('vues', VUES_PERSO);
      if (etat.vue === p.cle) etat.vue = p.base;
      toutRendre();
      toast(`Vue « ${p.titre} » supprimée`, () => { VUES_PERSO.push(p); memoire.ecrire('vues', VUES_PERSO); toutRendre(); });
      return;
    }
    const b = e.target.closest('[data-vue]'); if (!b) return;
    allerVue(b.dataset.vue);
  });
  function allerVue(cle) {
    etat.vue = cle; etat.statut = 'ouverte'; etat.q = ''; champRecherche.value = ''; zoneRecherche.hidden = true;
    const p = vuePerso(cle);
    etat.filtres = p ? Object.assign({}, p.filtres) : {};
    toutRendre();
  }

  // ======================================================================
  // [B2] Statut (segmenté), [B3] tri
  // ======================================================================
  const zoneStatuts = $('[data-ib-statuts]');
  function rendreStatuts() {
    $$('[data-statut]', zoneStatuts).forEach((b) => {
      const n = CONVERSATIONS.filter((c) => c.statut === b.dataset.statut && correspond(c)).length;
      b.querySelector('[data-n]').textContent = n;
      b.setAttribute('aria-selected', String(b.dataset.statut === etat.statut));
    });
    KanalDS.refresh(zoneStatuts);
  }
  zoneStatuts.addEventListener('k:change', (e) => { etat.statut = e.detail.item.dataset.statut; toutRendre(); });
  const menuTri = $('[data-ib-menu-tri]');
  function rendreTri() {
    $('[data-ib-tri]').setAttribute('data-k-tooltip', 'Tri : ' + TRIS[triActif()].court.toLowerCase());
    menuTri.innerHTML = '<div class="k-menu__label">Trier par</div>' + Object.keys(TRIS).map((k) =>
      `<button type="button" class="k-menu__item" role="menuitemradio" aria-checked="${k === triActif()}" data-tri="${k}"><span class="k-menu__text">${TRIS[k].titre}</span>${coche}</button>`).join('');
  }
  menuTri.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tri]'); if (!b) return;
    etat.tri = b.dataset.tri; memoire.ecrire('tri', etat.tri); toutRendre();
  });

  // ======================================================================
  // Recherche et [B8] filtres
  // ======================================================================
  const champRecherche = $('[data-ib-recherche]');
  const zoneRecherche = $('[data-ib-zone-recherche]');
  function ouvrirRecherche() { zoneRecherche.hidden = false; champRecherche.focus(); }
  function fermerRecherche() { champRecherche.value = ''; etat.q = ''; zoneRecherche.hidden = true; rendreListe(); rendreStatuts(); }
  $('[data-ib-ouvrir-recherche]').addEventListener('click', () => { if (zoneRecherche.hidden) ouvrirRecherche(); else if (!champRecherche.value) fermerRecherche(); else champRecherche.focus(); });
  champRecherche.addEventListener('input', () => { etat.q = champRecherche.value.trim(); rendreListe(); rendreStatuts(); });
  champRecherche.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); fermerRecherche(); } });
  champRecherche.addEventListener('blur', () => { if (!champRecherche.value) zoneRecherche.hidden = true; });
  const panneauFiltres = $('[data-ib-menu-filtres]');
  const zoneActifs = $('[data-ib-filtres-actifs]');
  const nettoyer = (f) => { const o = {}; Object.keys(f).sort().forEach((k) => { if (f[k]) o[k] = f[k]; }); return o; };
  function rendreFiltres() {
    const nb = CONVERSATIONS.filter((c) => c.statut === etat.statut && correspond(c)).length;
    panneauFiltres.innerHTML = '<div style="display:flex;flex-direction:column;gap:var(--k-space-4)">' + FILTRES.map((g) => `
      <div class="k-field"><span class="k-field__label">${g.titre}</span><div class="k-chips">${g.options.map(([v, t]) =>
        `<button type="button" class="k-chip" aria-pressed="${etat.filtres[g.cle] === v}" data-filtre="${g.cle}" data-valeur="${v}">${esc(t)}</button>`).join('')}</div></div>`).join('') +
      `<div style="display:flex;justify-content:space-between;align-items:center;gap:var(--k-space-2)"><button type="button" class="k-button k-button--ghost k-button--sm" data-effacer-filtres ${filtresActifs().length ? '' : 'disabled'}>Tout effacer</button>
       <button type="button" class="k-button k-button--primary k-button--sm" data-fermer-filtres>Voir ${pluriel(nb, 'conversation')}</button></div></div>`;
    const n = filtresActifs().length;
    const pastille = $('[data-ib-filtres-n]'); pastille.hidden = !n; pastille.textContent = n;
    // Étiquettes des filtres actifs + enregistrer la vue
    zoneActifs.hidden = !n;
    if (!n) { zoneActifs.innerHTML = ''; return; }
    const p = vue().perso;
    const dejaVue = p && JSON.stringify(p.filtres) === JSON.stringify(nettoyer(etat.filtres));
    zoneActifs.innerHTML = filtresActifs().map((k) => {
      const g = FILTRES.find((x) => x.cle === k); const o = g.options.find((x) => x[0] === etat.filtres[k]);
      return `<span class="k-tag">${esc(g.titre)} : ${esc(o[1])}<button type="button" class="k-tag__remove" data-retirer="${k}" aria-label="Retirer le filtre ${esc(g.titre)}">${ic('x-mark', true)}</button></span>`;
    }).join('') + (dejaVue ? '' : `<span data-zone-enregistrer style="display:inline-flex;gap:var(--k-space-1)"><button type="button" class="k-button k-button--ghost k-button--sm" data-enregistrer-vue>${ic('bookmark', false)}Enregistrer la vue</button></span>`);
  }
  panneauFiltres.addEventListener('click', (e) => {
    const o = e.target.closest('[data-filtre]');
    if (o) {
      const k = o.dataset.filtre, v = o.dataset.valeur;
      etat.filtres[k] = etat.filtres[k] === v ? null : v;
      quitterVuePersoSiModifiee(); toutRendre(); return;
    }
    if (e.target.closest('[data-effacer-filtres]')) { etat.filtres = {}; quitterVuePersoSiModifiee(); toutRendre(); return; }
    if (e.target.closest('[data-fermer-filtres]')) fermer('ib-filtres');
  });
  zoneActifs.addEventListener('click', (e) => {
    const r = e.target.closest('[data-retirer]');
    if (r) { etat.filtres[r.dataset.retirer] = null; quitterVuePersoSiModifiee(); toutRendre(); return; }
    if (e.target.closest('[data-enregistrer-vue]')) {
      const z = $('[data-zone-enregistrer]');
      const defaut = filtresActifs().map((k) => FILTRES.find((g) => g.cle === k).options.find((x) => x[0] === etat.filtres[k])[1]).join(' · ');
      z.innerHTML = `<input class="k-input k-input--sm" data-nom-vue aria-label="Nom de la vue" value="${esc(defaut)}" maxlength="40" style="width:170px"><button type="button" class="k-button k-button--primary k-button--sm" data-ok-vue>OK</button>`;
      const champNom = $('[data-nom-vue]'); champNom.focus(); champNom.select();
      return;
    }
    if (e.target.closest('[data-ok-vue]')) enregistrerVue();
  });
  zoneActifs.addEventListener('keydown', (e) => {
    if (!e.target.matches('[data-nom-vue]')) return;
    if (e.key === 'Enter') { e.preventDefault(); enregistrerVue(); }
    if (e.key === 'Escape') { e.stopPropagation(); rendreFiltres(); }
  });
  function enregistrerVue() {
    const titre = ($('[data-nom-vue]').value || '').trim() || 'Ma vue';
    const base = vue().perso ? vue().perso.base : etat.vue;
    const p = { cle: 'v' + Date.now().toString(36), titre, base, filtres: nettoyer(etat.filtres) };
    VUES_PERSO.push(p); memoire.ecrire('vues', VUES_PERSO);
    etat.vue = p.cle; toutRendre();
    toast(`Vue « ${titre} » enregistrée`);
  }
  function quitterVuePersoSiModifiee() {
    const p = vue().perso;
    if (p && JSON.stringify(p.filtres) !== JSON.stringify(nettoyer(etat.filtres))) etat.vue = p.base;
  }

  // ======================================================================
  // [B6] Liste (pas de sélection multiple : on agit sur la conversation ouverte)
  // ======================================================================
  const zoneListe = $('[data-ib-liste]');
  // Marques d'état : une icône de 14 px et son infobulle. Deux au plus, dans l'ordre d'urgence.
  const marque = (icone, ton, texte) => `<span data-tone="${ton}" data-k-tooltip="${esc(texte)}"><k-icon name="${icone}"></k-icon><span class="k-sr-only">${esc(texte)}</span></span>`;
  function marques(c) {
    const p = [];
    if (c.statut === 'reportee') p.push(marque('bell-snooze', 'accent', `Reportée · ${c.reveil}`));
    if (c.presence && c.statut === 'ouverte') p.push(`<span data-k-tooltip="${esc(EQUIPE[c.presence].prenom)} est en train de répondre"><span class="k-typing" aria-hidden="true"><i></i><i></i><i></i></span><span class="k-sr-only">${esc(EQUIPE[c.presence].prenom)} est en train de répondre</span></span>`);
    if (c.ia === 'main' && c.statut === 'ouverte') p.push(marque('exclamation-triangle', 'danger', `${AGENT_IA} a passé la main à un humain`));
    else if (c.ia === 'active' && c.statut === 'ouverte') p.push(marque('sparkles', 'violet', `${AGENT_IA} répond`));
    if ((c.mentions || []).includes(MOI) && !c.mentionLue) p.push(marque('at-symbol', 'accent', 'On vous a mentionnée'));
    const f = fenetre(c);
    if (c.statut !== 'fermee') {
      if (f <= 0) p.push(marque('lock-closed', '', 'Fenêtre de 24 h fermée : modèle seulement'));
      else if (f < 180) p.push(marque('clock', 'warning', `Fenêtre de 24 h : expire dans ${duree(f)}`));
    }
    return p.slice(0, 2).join('');
  }
  function ligne(c) {
    const choisie = c.id === etat.choisie;
    const enAttente = etat.vue === 'traiter' && c.de === 'client';
    const temps = enAttente ? duree(c.client) : duree(c.recu);
    const prefixe = c.de === 'vous' ? 'Vous : ' : c.de === 'ia' ? `${AGENT_IA} : ` : '';
    return `<div class="k-conv" role="button" tabindex="0" data-conv="${c.id}" aria-current="${choisie}"${c.nonLu ? ' data-unread' : ''}>
      <span class="k-conv__avatar">${avatar(c)}</span>
      <span class="k-conv__main">
        <span class="k-conv__top"><span class="k-conv__name" dir="auto">${esc(c.nom)}</span><span class="k-conv__marks">${marques(c)}${c.assigne ? avatar(EQUIPE[c.assigne]) : ''}</span></span>
        <span class="k-conv__line"><span class="k-conv__preview" dir="auto">${prefixe}${esc(c.apercu)}</span><span class="k-conv__time"${enAttente && c.client >= 60 ? ' data-late' : ''}${enAttente ? ` data-k-tooltip="Attend une réponse depuis ${duree(c.client)}"` : ''}>${temps}</span></span>
      </span>
    </div>`;
  }
  const liste = () => CONVERSATIONS.filter((c) => c.statut === etat.statut && correspond(c)).sort(TRIS[triActif()].f);
  function rendreListe() {
    const l = liste();
    let vide;
    if (etat.q || filtresActifs().length) vide = ['magnifying-glass', 'Aucun résultat', 'Essayez un autre mot, ou retirez un filtre.'];
    else if (etat.vue === 'traiter' && etat.statut === 'ouverte') vide = ['check-circle', 'Tout est traité', `${AGENT_IA} s'occupe du reste.`];
    else vide = ['inbox', 'Aucune conversation', 'Rien dans cette vue pour ce statut.'];
    zoneListe.innerHTML = l.length ? l.map(ligne).join('')
      : `<div class="k-empty"><span class="k-empty__icon"><k-icon name="${vide[0]}" size="24"></k-icon></span><p class="k-empty__title">${vide[1]}</p><p class="k-empty__desc">${vide[2]}</p></div>`;
  }
  zoneListe.addEventListener('click', (e) => {
    const r = e.target.closest('[data-conv]'); if (!r) return;
    choisir(r.dataset.conv);
  });
  zoneListe.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const r = e.target.closest('[data-conv]'); if (!r) return;
    e.preventDefault(); choisir(r.dataset.conv);
  });
  function choisir(id) {
    etat.choisie = id;
    const c = conv(id); c.nonLu = false; if ((c.mentions || []).includes(MOI)) c.mentionLue = true;
    etat.mode = 'reponse';
    toutRendre();
  }

  // ======================================================================
  // En-tête : [B4] assignation, [B5] IA, [B7] clôturer, [B9] reporter, non lue
  // ======================================================================
  const boutonAssigne = $('[data-ib-assigne]');
  const menuAssigne = $('[data-ib-menu-assigne]');
  const boutonIA = $('[data-ib-ia]');
  const boutonPlus = $('[data-ib-plus]');
  const menuPlus = $('[data-ib-menu-plus]');
  function menuAssignation(actuel) {
    const attr = 'data-assigner';
    const etatCoche = (v) => ` role="menuitemradio" aria-checked="${actuel === v}"`;
    const fin = (v, raccourci) => (raccourci && actuel !== v ? touche(raccourci) : coche);
    return '<div class="k-menu__label">Assigner à</div>' +
      `<button type="button" class="k-menu__item" ${attr}="${MOI}"${etatCoche(MOI)}>${avatar(EQUIPE[MOI], 'sm')}<span class="k-menu__text">Moi</span>${fin(MOI, 'A')}</button>` +
      Object.keys(EQUIPE).filter((k) => k !== MOI).map((k) => `<button type="button" class="k-menu__item" ${attr}="${k}"${etatCoche(k)}>${avatar(EQUIPE[k], 'sm')}<span class="k-menu__text">${esc(EQUIPE[k].nom)}</span>${fin(k)}</button>`).join('') +
      `<div class="k-menu__sep"></div><button type="button" class="k-menu__item" ${attr}=""${etatCoche(null)}>${ic('no-symbol')}<span class="k-menu__text">Personne</span>${fin(null)}</button>`;
  }
  function menuReport() {
    const attr = 'data-reporter';
    return '<div class="k-menu__label">Reporter jusqu\'à</div>' + REPORTS.map((r) => `<button type="button" class="k-menu__item" ${attr}="${r.cle}">${ic('bell-snooze')}<span class="k-menu__text">${r.titre}</span></button>`).join('') +
      '<div class="k-menu__label" style="font-weight:var(--k-weight-regular)">Revient plus tôt si le client répond.</div>';
  }
  function rendreEntete() {
    const c = conv(etat.choisie);
    const visage = $('[data-ib-entete-avatar]'); visage.className = `k-avatar k-avatar--${c.ton}`; visage.textContent = c.init;
    $('[data-ib-entete-nom]').textContent = c.nom;
    $('[data-ib-entete-tel]').textContent = c.tel;
    // Fiche contact
    $('[data-ib-fiche-tel]').textContent = c.tel;
    $$('[data-ib-fiche]').forEach((el) => { el.textContent = c.fiche[el.dataset.ibFiche] || '—'; });
    $('[data-ib-fiche-listes]').innerHTML = (c.listes || []).map((k) => `<span class="k-tag">${esc(LISTES[k])}</span>`).join('') ||
      '<span style="color:var(--k-ink-2);font-size:var(--k-text-small)">Dans aucune liste</span>';
    // Assignation : l'avatar de la personne, ou une icône quand personne n'est assigné
    const quiAssigne = c.assigne ? `Assignée à ${EQUIPE[c.assigne].nom}` : 'Non assignée. Assigner';
    boutonAssigne.setAttribute('data-k-tooltip', quiAssigne); boutonAssigne.setAttribute('aria-label', quiAssigne);
    if (!c.assigne) boutonAssigne.setAttribute('data-k-kbd', 'A'); else boutonAssigne.removeAttribute('data-k-kbd');
    boutonAssigne.innerHTML = c.assigne ? avatar(EQUIPE[c.assigne]) : ic('user-plus');
    menuAssigne.innerHTML = menuAssignation(c.assigne);
    // IA : le point dit l'état, l'infobulle le dit en mots
    const etatIA = c.ia === 'active' ? `IA active : ${AGENT_IA} répond. Cliquer pour la couper ici`
      : c.ia === 'main' ? `IA en pause : ${AGENT_IA} a passé la main. Cliquer pour lui rendre la conversation`
      : `IA coupée. Cliquer pour rendre la conversation à ${AGENT_IA}`;
    $('[data-ib-ia-point]').style.setProperty('--_dot', c.ia === 'active' ? 'var(--k-success)' : c.ia === 'main' ? 'var(--k-danger)' : 'var(--k-ink-disabled)');
    boutonIA.setAttribute('data-k-tooltip', etatIA); boutonIA.setAttribute('aria-label', etatIA);
    // Clôturer (ou rouvrir), reporter
    const fermee = c.statut === 'fermee';
    const boutonCloturer = $('[data-ib-cloturer]');
    boutonCloturer.setAttribute('data-k-tooltip', fermee ? 'Rouvrir la conversation' : 'Clôturer'); boutonCloturer.setAttribute('aria-label', fermee ? 'Rouvrir la conversation' : 'Clôturer');
    $('[data-ib-cloturer-icone]').setAttribute('name', fermee ? 'arrow-uturn-left' : 'check');
    boutonPlus.setAttribute('data-k-tooltip', c.statut === 'reportee' ? `Reportée · ${c.reveil}` : 'Reporter');
    menuPlus.innerHTML = c.statut === 'reportee'
      ? `<button type="button" class="k-menu__item" data-reveiller>${ic('bell')}<span class="k-menu__text">Ne plus reporter</span></button>`
      : menuReport();
  }
  menuAssigne.addEventListener('click', (e) => {
    const b = e.target.closest('[data-assigner]'); if (!b) return;
    assigner(b.dataset.assigner || null);
  });
  function assigner(v) {
    const c = conv(etat.choisie); if (c.assigne === v) return;
    c.assigne = v; toutRendre();
    toast(v ? (v === MOI ? 'Conversation assignée à vous' : `Assignée à ${EQUIPE[v].nom}`) : 'Conversation désassignée');
  }
  boutonIA.addEventListener('click', () => {
    const c = conv(etat.choisie);
    if (c.ia === 'active') { c.ia = 'coupee'; toast(`${AGENT_IA} est coupée sur cette conversation`); }
    else { c.ia = 'active'; toast(`Conversation rendue à ${AGENT_IA}`); }
    toutRendre();
  });
  $('[data-ib-cloturer]').addEventListener('click', cloturer);
  function cloturer() {
    const c = conv(etat.choisie);
    if (c.statut === 'fermee') { c.statut = 'ouverte'; toast('Conversation rouverte'); toutRendre(); return; }
    changerStatut(c, { statut: 'fermee' }, `Conversation avec ${c.nom} clôturée`);
  }
  function reporter(cle) {
    const c = conv(etat.choisie); const r = REPORTS.find((x) => x.cle === cle);
    changerStatut(c, { statut: 'reportee', reveil: r.reveil }, `Reportée · ${r.reveil}`);
  }
  // Clôturer ou reporter : la conversation quitte la liste, on ouvre la suivante
  function changerStatut(c, modif, message) {
    const avant = liste(); const i = avant.findIndex((x) => x.id === c.id);
    const ancien = { statut: c.statut, reveil: c.reveil, choisie: etat.choisie };
    Object.assign(c, modif);
    const apres = liste();
    if (apres.length && !apres.some((x) => x.id === etat.choisie)) etat.choisie = apres[Math.min(Math.max(i, 0), apres.length - 1)].id;
    toutRendre();
    toast(message, () => { c.statut = ancien.statut; c.reveil = ancien.reveil; etat.choisie = ancien.choisie; toutRendre(); });
  }
  menuPlus.addEventListener('click', (e) => {
    const r = e.target.closest('[data-reporter]');
    if (r) { reporter(r.dataset.reporter); return; }
    if (e.target.closest('[data-reveiller]')) { const c = conv(etat.choisie); c.statut = 'ouverte'; c.reveil = null; toutRendre(); toast('La conversation est de nouveau ouverte'); }
  });
  $('[data-ib-non-lue]').addEventListener('click', nonLue);
  function nonLue() { const c = conv(etat.choisie); c.nonLu = true; rendreListe(); toast('Marquée comme non lue'); }

  // ======================================================================
  // [B5] Bandeaux au-dessus de la zone de réponse, [B14] « est en train de répondre »
  // ======================================================================
  const bandeau = $('[data-ib-bandeau]');
  const champ = $('[data-ib-champ]');
  function rendreBandeau() {
    const c = conv(etat.choisie);
    let h = '';
    if (c.presence && c.statut === 'ouverte') {
      h += `<div class="k-banner">${avatar(EQUIPE[c.presence], 'sm')}<div class="k-banner__text"><span class="k-banner__title">${esc(EQUIPE[c.presence].nom)}</span> est en train de répondre <span class="k-typing" aria-hidden="true"><i></i><i></i><i></i></span></div></div>`;
    }
    if (c.statut === 'ouverte' && c.ia === 'active') {
      h += `<div class="k-banner k-banner--info">${ic('sparkles')}<div class="k-banner__text"><span class="k-banner__title">${AGENT_IA}</span> répond à cette conversation. Écrire à sa place la met en pause.</div>
        <div class="k-banner__actions"><button type="button" class="k-button k-button--outline k-button--sm" data-ib-reprendre>Reprendre la main</button></div></div>`;
    } else if (c.statut === 'ouverte' && c.ia === 'main' && c.assigne !== MOI) {
      h += `<div class="k-banner k-banner--danger">${ic('exclamation-triangle')}<div class="k-banner__text"><span class="k-banner__title">${AGENT_IA} a passé la main :</span> ${esc(c.motif)}.</div>
        <div class="k-banner__actions"><button type="button" class="k-button k-button--outline k-button--sm" data-ib-reprendre>Prendre la conversation</button></div></div>`;
    }
    if (fenetre(c) <= 0 && c.statut !== 'fermee' && etat.mode === 'reponse') {
      h += `<div class="k-banner k-banner--warning">${ic('clock')}<div class="k-banner__text"><span class="k-banner__title">La fenêtre de 24 heures est fermée.</span> Seul un modèle approuvé peut être envoyé. Les notes internes restent possibles.</div></div>`;
    }
    bandeau.innerHTML = h;
    rendreComposer();
  }
  bandeau.addEventListener('click', (e) => {
    if (!e.target.closest('[data-ib-reprendre]')) return;
    const c = conv(etat.choisie);
    c.ia = 'coupee'; c.assigne = MOI;
    toutRendre(); champ.focus();
    toast(`Vous avez la main · ${AGENT_IA} est coupée sur cette conversation`);
  });

  // ======================================================================
  // [B10] Zone de réponse : Répondre / Note ; [B11] « / » et « @ » ; envoi
  // ======================================================================
  const composer = $('[data-ib-composer]');
  const zoneModes = $('[data-ib-modes]');
  const boutonEnvoyer = $('[data-ib-envoyer]');
  const boutonEnvoiPlus = $('[data-ib-envoi-plus]');
  const menuEnvoi = $('[data-ib-menu-envoi]');
  const listeReponses = $('[data-ib-reponses]');
  let suggestions = []; let indexSugg = 0; let typeSugg = null;
  menuEnvoi.innerHTML = `<button type="button" class="k-menu__item" data-envoi="cloturer">${ic('check-circle')}<span class="k-menu__text">Envoyer et clôturer</span>${touche('⌘ ↵')}</button>
    <button type="button" class="k-menu__item" data-envoi="reporter">${ic('bell-snooze')}<span class="k-menu__text">Envoyer et reporter à demain 9 h</span></button>`;
  function rendreComposer() {
    const c = conv(etat.choisie);
    const note = etat.mode === 'note';
    const expiree = fenetre(c) <= 0 && !note;
    composer.classList.toggle('k-composer--note', note);
    $$('[data-ib-mode]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.ibMode === etat.mode)));
    KanalDS.refresh(zoneModes);
    champ.disabled = expiree;
    champ.placeholder = expiree ? 'Envoyez un modèle pour relancer la conversation'
      : note ? 'Note visible de l\'équipe seulement. @ pour mentionner quelqu\'un'
      : `Répondre à ${c.fiche.prenom}… « / » pour une réponse enregistrée`;
    const vide = !champ.value.trim() || expiree;
    boutonEnvoyer.disabled = vide; boutonEnvoiPlus.disabled = vide || note;
    boutonEnvoyer.textContent = note ? 'Ajouter la note' : 'Envoyer';
  }
  zoneModes.addEventListener('k:change', (e) => { etat.mode = e.detail.item.dataset.ibMode; rendreBandeau(); champ.focus(); });
  function passerEnMode(mode) { etat.mode = mode; rendreBandeau(); champ.focus(); }
  champ.addEventListener('input', () => { rendreComposer(); suggerer(); });
  champ.addEventListener('keydown', (e) => {
    if (!listeReponses.hidden && suggestions.length) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); indexSugg = (indexSugg + (e.key === 'ArrowDown' ? 1 : -1) + suggestions.length) % suggestions.length; rendreSuggestions(); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); choisirSuggestion(indexSugg); return; }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); listeReponses.hidden = true; return; }
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); envoyer('cloturer'); return; }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer(); return; }
    if (e.key === 'Escape') { e.stopPropagation(); champ.blur(); }
  });
  // « / » en début de mot (réponse) ou « @ » (note) : propose une liste
  function suggerer() {
    const avant = champ.value.slice(0, champ.selectionStart);
    const m = etat.mode === 'note' ? avant.match(/(?:^|\s)@([\wÀ-ÿ ]{0,20})$/) : avant.match(/(?:^|\s)\/([\wÀ-ÿ ]{0,20})$/);
    if (!m) { listeReponses.hidden = true; return; }
    const q = m[1].toLowerCase();
    typeSugg = etat.mode === 'note' ? 'mention' : 'reponse';
    suggestions = typeSugg === 'mention'
      ? Object.keys(EQUIPE).filter((k) => k !== MOI && EQUIPE[k].nom.toLowerCase().includes(q)).map((k) => ({ titre: EQUIPE[k].nom, cle: k }))
      : REPONSES.filter((r) => r.titre.toLowerCase().includes(q) || r.texte.toLowerCase().includes(q))
        .sort((a, b) => Number(!a.titre.toLowerCase().includes(q)) - Number(!b.titre.toLowerCase().includes(q))); // titres d'abord
    indexSugg = 0;
    if (!suggestions.length) { listeReponses.hidden = true; return; }
    rendreSuggestions(); listeReponses.hidden = false;
  }
  function rendreSuggestions() {
    const c = conv(etat.choisie);
    listeReponses.innerHTML = `<div class="k-menu__label">${typeSugg === 'mention' ? 'Mentionner' : 'Réponses enregistrées'}</div>` + suggestions.map((s, i) =>
      `<button type="button" class="k-menu__item" role="option" aria-selected="${i === indexSugg}" data-sugg="${i}">
        ${typeSugg === 'mention' ? `${avatar(EQUIPE[s.cle], 'sm')}<span class="k-menu__text">${esc(s.titre)}</span>`
          : `<span class="k-menu__text">${esc(s.titre)}<span class="k-menu__desc">${esc(remplir(s.texte, c))}</span></span>`}</button>`).join('') +
      `<div class="k-menu__label" style="font-weight:var(--k-weight-regular)">↑ ↓ pour choisir · Entrée pour insérer</div>`;
  }
  listeReponses.addEventListener('mousedown', (e) => { const b = e.target.closest('[data-sugg]'); if (!b) return; e.preventDefault(); choisirSuggestion(+b.dataset.sugg); });
  function choisirSuggestion(i) {
    const s = suggestions[i]; const c = conv(etat.choisie);
    const pos = champ.selectionStart; const avant = champ.value.slice(0, pos); const apres = champ.value.slice(pos);
    const debut = avant.search(typeSugg === 'mention' ? /@[\wÀ-ÿ ]{0,20}$/ : /\/[\wÀ-ÿ ]{0,20}$/);
    const insere = typeSugg === 'mention' ? `@${s.titre} ` : remplir(s.texte, c);
    champ.value = avant.slice(0, debut) + insere + apres;
    champ.selectionStart = champ.selectionEnd = debut + insere.length;
    listeReponses.hidden = true; champ.focus(); rendreComposer();
  }
  // Le bouton « Réponse enregistrée » fait la même chose que taper « / »
  $('[data-ib-inserer-slash]').addEventListener('click', () => {
    if (champ.disabled) return;
    if (etat.mode !== 'reponse') { etat.mode = 'reponse'; rendreBandeau(); }
    champ.focus();
    if (!/(^|\s)\/$/.test(champ.value)) champ.value += (champ.value && !/\s$/.test(champ.value) ? ' ' : '') + '/';
    champ.selectionStart = champ.selectionEnd = champ.value.length;
    rendreComposer(); suggerer();
  });
  boutonEnvoyer.addEventListener('click', () => envoyer());
  menuEnvoi.addEventListener('click', (e) => { const b = e.target.closest('[data-envoi]'); if (b) envoyer(b.dataset.envoi); });
  function envoyer(puis) {
    const texte = champ.value.trim(); if (!texte || champ.disabled) return;
    const c = conv(etat.choisie);
    listeReponses.hidden = true;
    if (etat.mode === 'note') {
      c.messages.push({ de: 'note', auteur: MOI, texte, il: 0 });
      const cites = Object.keys(EQUIPE).filter((k) => k !== MOI && texte.includes('@' + EQUIPE[k].nom));
      cites.forEach((k) => { c.mentions = (c.mentions || []).concat(k); });
      champ.value = ''; rendreFil(); rendreComposer();
      toast(cites.length ? `Note ajoutée · ${cites.map((k) => EQUIPE[k].prenom).join(', ')} sera notifié` : 'Note interne ajoutée');
      return;
    }
    c.messages.push({ de: 'vous', texte, il: 0 });
    Object.assign(c, { de: 'vous', apercu: texte, recu: 0, nonLu: false });
    let info = '';
    // [B4] Répondre à une conversation non assignée l'assigne ; répondre à la place de l'IA la coupe
    if (!c.assigne) { c.assigne = MOI; info = ' · assignée à vous'; }
    if (c.ia !== 'coupee') { c.ia = 'coupee'; info += ` · ${AGENT_IA} coupée`; }
    champ.value = '';
    if (puis === 'cloturer') { changerStatut(c, { statut: 'fermee' }, `Envoyé et clôturé${info}`); return; }
    if (puis === 'reporter') { changerStatut(c, { statut: 'reportee', reveil: 'demain 9 h' }, `Envoyé et reporté à demain 9 h${info}`); return; }
    toutRendre(); toast(`Message envoyé${info}`);
  }

  // ======================================================================
  // Fil de la conversation
  // ======================================================================
  const fil = $('[data-ib-fil]');
  const defilement = $('[data-ib-defilement]');
  const quand = (m) => m.il < 1 ? 'à l\'instant' : `il y a ${duree(m.il)}`;
  const jour = (m) => m.il < 900 ? 'Aujourd\'hui' : m.il < 2340 ? 'Hier' : `Il y a ${Math.round(m.il / 1440)} jours`;
  const meta = (m, envoye) => `<div class="k-bubble__meta">${quand(m)}${envoye ? ` ${ic(m.lu ? 'check-circle' : 'check', true)}${m.lu ? '<span class="k-sr-only">Lu</span>' : ''}` : ''}</div>`;
  const multiligne = (t) => esc(t).replace(/\n/g, '<br>');
  function bulle(m) {
    if (m.de === 'evenement') return `<span class="k-thread__event">${ic(m.icone)}${esc(m.texte)} · ${quand(m)}</span>`;
    if (m.de === 'note') return `<div class="k-bubble k-bubble--note"><div class="k-bubble__author">${ic('lock-closed', true)}Note de ${esc(m.auteur === MOI ? 'vous' : EQUIPE[m.auteur].prenom)}</div><span dir="auto">${avecMentions(m.texte)}</span>${meta(m)}</div>`;
    if (m.de === 'client') return `<div class="k-bubble k-bubble--in"><span dir="auto">${multiligne(m.texte)}</span>${meta(m)}</div>`;
    if (m.de === 'ia') return `<div class="k-bubble k-bubble--ai"><div class="k-bubble__author">${ic('sparkles', true)}${AGENT_IA}</div><span dir="auto">${multiligne(m.texte)}</span>${meta(m, true)}</div>`;
    if (m.de === 'modele') {
      return `<div class="k-bubble k-bubble--out k-bubble--template"><div class="k-bubble__author">${ic('document-text')}Modèle · ${esc(m.modele)}</div>
        <div class="k-bubble__title" dir="auto">${esc(m.titre)}</div><span dir="auto">${multiligne(m.texte)}</span>
        ${m.pied ? `<div class="k-bubble__footer">${esc(m.pied)}</div>` : ''}
        <div class="k-bubble__buttons">${m.boutons.map((b) => `<span class="k-bubble__button">${esc(b)}</span>`).join('')}</div>${meta(m, true)}</div>`;
    }
    return `<div class="k-bubble k-bubble--out"><span dir="auto">${multiligne(m.texte)}</span>${meta(m, true)}</div>`;
  }
  // [B10] Résumé de passation de l'IA, en tête du fil
  function resume(c) {
    if (!c.resume) return '';
    return `<div class="k-summary"><div class="k-summary__title">${ic('sparkles', true)}Résumé de ${AGENT_IA}</div>
      <dl><dt>Demande</dt><dd>${esc(c.resume.demande)}</dd><dt>Ce qu'elle a fait</dt><dd>${esc(c.resume.fait)}</dd><dt>Pourquoi elle s'arrête</dt><dd>${esc(c.resume.raison)}</dd></dl></div>`;
  }
  function rendreFil() {
    const c = conv(etat.choisie);
    let dernierJour = null;
    fil.innerHTML = resume(c) + c.messages.map((m) => {
      const j = jour(m); const sep = j !== dernierJour ? `<span class="k-badge k-thread__day">${j}</span>` : ''; dernierJour = j;
      return sep + bulle(m);
    }).join('');
    defilement.scrollTop = defilement.scrollHeight;
  }

  // ======================================================================
  // [B12] Réglages de l'inbox, [B13] raccourcis clavier
  // ======================================================================
  const panneauReglages = $('[data-ib-menu-reglages]');
  function rendreReglages() {
    panneauReglages.innerHTML = `<label class="k-check" style="display:flex;justify-content:space-between;gap:var(--k-space-4)">
        <span><span class="k-check__label">Répartition automatique</span><span class="k-check__hint">Les conversations que ${AGENT_IA} passe à un humain sont assignées à tour de rôle aux personnes en ligne.</span></span>
        <input type="checkbox" role="switch" class="k-switch" data-auto ${etat.auto ? 'checked' : ''}></label>
      ${etat.auto ? `<div style="display:flex;flex-wrap:wrap;gap:var(--k-space-2);margin-top:var(--k-space-3)">${Object.keys(EQUIPE).map((k) => `<span class="k-badge k-badge--success"><span class="k-badge__dot"></span>${esc(EQUIPE[k].prenom)} · en ligne</span>`).join('')}</div>` : ''}
      <a class="k-button k-button--secondary k-button--sm k-button--block" href="reglages.html#inbox" style="margin-top:var(--k-space-4)">Tous les réglages de l'inbox</a>`;
  }
  rendreReglages();
  panneauReglages.addEventListener('change', (e) => {
    if (!e.target.matches('[data-auto]')) return;
    etat.auto = e.target.checked; rendreReglages();
    toast(etat.auto ? 'Répartition automatique activée' : 'Répartition automatique désactivée');
  });
  const RACCOURCIS = [
    ['J K', 'Conversation suivante, précédente'], ['R', 'Répondre'], ['N', 'Note interne'], ['A', 'M\'assigner'],
    ['E', 'Clôturer'], ['Z', 'Reporter'], ['U', 'Marquer comme non lue'],
    ['/', 'Rechercher'], ['↵', 'Envoyer'], ['⌘ ↵', 'Envoyer et clôturer'], ['Échap', 'Fermer'], ['?', 'Cette aide']
  ];
  $('[data-ib-raccourcis]').innerHTML = RACCOURCIS.map(([k, t]) => `<dt style="gap:3px">${k.split(' ').map((x) => `<span class="k-kbd">${x}</span>`).join('')}</dt><dd style="font-weight:var(--k-weight-regular)">${t}</dd>`).join('');
  const aide = document.getElementById('ib-aide');
  const boutonAide = $('[data-ib-aide]'); if (boutonAide) boutonAide.addEventListener('click', () => KanalDS.modal.open(aide));   // l'entrée du panneau a été retirée : reste la touche « ? »

  const calqueOuvert = () => !!document.querySelector('.k-menu:popover-open, .k-popover:popover-open, dialog[open]');
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (calqueOuvert()) return;                               // le navigateur ferme le calque
      if (!listeReponses.hidden) { listeReponses.hidden = true; return; }
      return;
    }
    if (enSaisie(document.activeElement) || e.metaKey || e.ctrlKey || e.altKey || calqueOuvert()) return;
    const k = e.key.toLowerCase();
    const l = liste(); const i = l.findIndex((c) => c.id === etat.choisie);
    // Les actions au clavier ne s'animent pas : menus et modale s'ouvrent sans transition
    if (k === 'j') { if (l.length) choisir(l[Math.min(i + 1, l.length - 1)].id); }
    else if (k === 'k') { if (l.length) choisir(l[Math.max(i - 1, 0)].id); }
    else if (k === 'r') { e.preventDefault(); passerEnMode('reponse'); }
    else if (k === 'n') { e.preventDefault(); passerEnMode('note'); }
    else if (k === 'a') { assigner(MOI); }
    else if (k === 'e') { cloturer(); }
    else if (k === 'z') { e.preventDefault(); boutonPlus.click(); }   // clic sans souris : le menu s'ouvre sans animation
    else if (k === 'u') { nonLue(); }
    else if (e.key === '/') { e.preventDefault(); ouvrirRecherche(); }
    else if (e.key === '?') { KanalDS.modal.open(aide, { instant: true }); }
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-ib-composer]') && !e.target.closest('[data-ib-reponses]')) listeReponses.hidden = true;
  });

  // ---------- Tout
  function toutRendre() {
    $('[data-ib-titre]').textContent = vue().titre;
    rendreVues(); rendreStatuts(); rendreTri(); rendreFiltres(); rendreListe(); rendreEntete(); rendreBandeau(); rendreFil();
  }
  toutRendre();
})();
