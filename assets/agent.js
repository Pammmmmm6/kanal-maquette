/* ==========================================================================
   Agent IA dans le design system. Script de la page agent.html.
   Repères [N1]…[N14] : voir les notes en tête de la page.

   Maquette : les questions sans réponse (QUESTIONS) et les réponses du test
   (REGLES) sont écrites à la main. Dans l'app, l'état et les réglages viennent
   de get_ai_agent, les questions de list_ai_knowledge_gaps, et chaque message
   du test part à test_ai_agent avec les tours précédents.
   ========================================================================== */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const F = ' ';   // espace fine insécable
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const multiligne = (t) => esc(t).replace(/\n/g, '<br>');
  const ic = (nom, micro) => `<k-icon name="${nom}"${micro ? ' set="micro"' : ''}></k-icon>`;
  const normaliser = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’]/g, '\'').trim();
  const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;
  const AGENT_IA = 'Lumi';
  const MAIL_SUPPORT = 'bonjour@maisonlumen.fr';

  // ---------------------------------------------------------------- [N1] [N8]
  // Un seul état, deux commandes : l'interrupteur de l'en-tête et les trois choix de l'onglet Réglages.
  const MODES = {
    seule:     { libelle: `${AGENT_IA} répond`, toast: `${AGENT_IA} répond seule à vos clients` },
    brouillon: { libelle: `${AGENT_IA} propose des brouillons`, toast: `${AGENT_IA} propose des brouillons, votre équipe envoie` },
    pause:     { libelle: `${AGENT_IA} est en pause`, toast: `${AGENT_IA} est en pause` }
  };
  const etat = { mode: 'seule', avantPause: 'seule', menuQuestion: null, reponsePour: null };
  const actif = $('[data-ag-actif]'), radiosMode = $$('input[name="ag-mode"]');
  function choisirMode(mode) {
    if (mode === etat.mode) return;
    if (mode !== 'pause') etat.avantPause = mode;
    etat.mode = mode;
    actif.checked = mode !== 'pause';
    $('[data-ag-etat]').textContent = MODES[mode].libelle;
    $$('[data-ag-bandeau]').forEach((b) => { b.hidden = b.dataset.agBandeau !== mode; });
    radiosMode.forEach((r) => { r.checked = r.value === mode; });
    KanalDS.toast(MODES[mode].toast, mode === 'pause' ? {} : { tone: 'success' });
  }
  actif.addEventListener('change', () => choisirMode(actif.checked ? etat.avantPause : 'pause'));
  radiosMode.forEach((r) => r.addEventListener('change', () => { if (r.checked) choisirMode(r.value); }));
  $('[data-ag-reactiver]').addEventListener('click', () => choisirMode(etat.avantPause));

  // ---------------------------------------------------------------- [N2]
  // Les onglets montrent et cachent leur panneau seuls (aria-controls). Un segmenté né caché n'avait pas de
  // largeur : on replace sa pastille quand son onglet s'ouvre.
  const onglets = $('[data-ag-onglets]');
  onglets.addEventListener('k:change', (e) => {
    const panneau = document.getElementById(e.detail.item.getAttribute('aria-controls'));
    if (panneau) $$('.k-segmented', panneau).forEach((g) => KanalDS.refresh(g));
  });
  function ouvrirOnglet(nom) {
    const item = $(`[data-onglet="${nom}"]`, onglets);
    if (item && item.getAttribute('aria-selected') !== 'true') item.click();
  }
  // agent.html#connaissances et agent.html#reglages ouvrent l'onglet (dans l'app : trois routes)
  const selonAdresse = () => { const nom = (location.hash || '').slice(1); if (/^[a-z]+$/.test(nom)) ouvrirOnglet(nom); };
  window.addEventListener('hashchange', selonAdresse);
  document.addEventListener('DOMContentLoaded', selonAdresse);

  // ---------------------------------------------------------------- [N4]
  // posee : nombre de fois sur 30 jours ; passees : dont finies chez un humain. Les sept « passees » font les
  // 118 « Réponse introuvable » de [N5]. mots : ce qui fait reconnaître la question dans le test [N12].
  const QUESTIONS = [
    { id: 'format', question: 'La bougie Ambre & Figue existe-t-elle en grand format ?', posee: 36, passees: 31, derniere: 'hier', mots: /grand format|grande taille|plus grande/, intention: 'Formats d\'un produit' },
    { id: 'suisse', question: 'Livrez-vous en Suisse ?', posee: 28, passees: 24, derniere: 'il y a 3 h', mots: /suisse|etranger|international|hors de france/, intention: 'Pays livrés' },
    { id: 'chats', question: 'Vos bougies sont-elles sans danger pour les chats ?', posee: 22, passees: 18, derniere: 'hier', mots: /\bchats?\b|\bchiens?\b|animal|animaux/, intention: 'Sécurité pour les animaux' },
    { id: 'message', question: 'Peut-on ajouter un message personnalisé au coffret ?', posee: 16, passees: 14, derniere: 'il y a 2 jours', mots: /personnalis|gravure|graver|un mot dans/, intention: 'Personnalisation d\'un cadeau' },
    { id: 'duree', question: 'Combien de temps brûle la bougie de 180 g ?', posee: 15, passees: 10, derniere: 'il y a 3 jours', mots: /combien de temps|brule|duree/, intention: 'Durée de combustion' },
    { id: 'pro', question: 'Proposez-vous des tarifs pour les entreprises ?', posee: 12, passees: 12, derniere: 'il y a 5 jours', mots: /entreprise|professionnel|devis|en gros/, intention: 'Vente aux entreprises' },
    { id: 'precommande', question: 'Le Coffret Découverte est-il disponible en précommande ?', posee: 11, passees: 9, derniere: 'il y a 4 h', mots: /precommande|pre-commande/, intention: 'Précommande' }
  ];
  const LIBRES = [];   // questions-réponses ajoutées sans partir d'une question de la liste
  const question = (id) => QUESTIONS.find((q) => q.id === id);
  const enAttente = () => QUESTIONS.filter((q) => !q.reponse && !q.ignoree);
  const corps = $('[data-ag-questions]');
  function rendreQuestions() {
    const l = enAttente();
    corps.innerHTML = l.length ? l.map((q) => `<tr data-ag-q="${q.id}">
      <td><div class="k-table__primary">${esc(q.question)}</div><div class="k-table__secondary">Dernière fois ${q.derniere}</div></td>
      <td class="k-table__num">${q.posee} fois</td>
      <td class="k-table__num">${q.passees} fois</td>
      <td class="k-table__actions"><div class="k-table__who k-table__who--end"><button type="button" class="k-button k-button--outline k-button--sm" data-ag-repondre="${q.id}">Répondre</button><button type="button" class="k-button k-button--ghost k-button--icon k-button--sm" aria-label="Autres actions sur « ${esc(q.question)} »" aria-haspopup="menu" data-k-menu="ag-menu-question" data-k-placement="bottom-end">${ic('ellipsis-horizontal')}</button></div></td>
    </tr>`).join('') : `<tr><td class="k-table__empty" colspan="4">Aucune question sans réponse : ${AGENT_IA} a trouvé de quoi répondre à tout le reste.</td></tr>`;
    $('[data-ag-q-total]').textContent = l.length;
    const somme = (cle) => l.reduce((n, q) => n + q[cle], 0);
    $('[data-ag-q-pied]').textContent = l.length
      ? `${pluriel(l.length, 'question')} · posées ${somme('posee')} fois · ${pluriel(somme('passees'), 'passation')} à l'équipe`
      : 'Sur les 30 derniers jours';
  }
  corps.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ag-repondre]');
    if (b) { ouvrirReponse(question(b.dataset.agRepondre)); return; }
    const m = e.target.closest('[data-k-menu="ag-menu-question"]');
    if (m) etat.menuQuestion = m.closest('[data-ag-q]').dataset.agQ;   // la ligne que vise le menu
  });
  document.getElementById('ag-menu-question').addEventListener('click', (e) => {
    const item = e.target.closest('[data-ag-q-action]'), q = question(etat.menuQuestion);
    if (!item || !q) return;
    if (item.dataset.agQAction === 'ignorer') {
      q.ignoree = true; rendreQuestions();
      KanalDS.toast('Question ignorée', { action: { label: 'Annuler', onClick: () => { q.ignoree = false; rendreQuestions(); } } });
    } else {
      KanalDS.toast(item.dataset.agQAction === 'page' ? 'L\'ajout d\'une page n\'est pas encore dans cette maquette' : 'Import : choisissez un fichier PDF');
    }
  });

  // ---------------------------------------------------------------- [N6]
  // Relancer la lecture des pages du site : la page en échec repasse
  $('[data-ag-relancer]').addEventListener('click', (e) => {
    const b = e.currentTarget;
    b.setAttribute('data-loading', '');
    setTimeout(() => {
      b.removeAttribute('data-loading');
      $('[data-ag-pages]').textContent = '24 pages';
      $('[data-ag-pages-detail]').textContent = 'maisonlumen.fr';
      $('[data-ag-pages-etat]').innerHTML = '<span class="k-badge k-badge--success"><span class="k-badge__dot"></span>À jour</span>';
      $('[data-ag-pages-date]').textContent = 'à l\'instant';
      KanalDS.toast('24 pages relues, aucune en échec', { tone: 'success' });
    }, 900);
  });

  // ---------------------------------------------------------------- [N13]
  // Une question-réponse. q : une question de la liste [N4] ; texte : une question venue du test [N12] ; rien : vide.
  let nombreReponses = 18;
  const dialogueReponse = document.getElementById('ag-reponse');
  const formReponse = $('[data-ag-r-form]'), champQuestion = $('[data-ag-r-question]'), champTexte = $('[data-ag-r-texte]'), boutonReponse = $('[data-ag-r-enregistrer]');
  function ouvrirReponse(q, texte) {
    etat.reponsePour = q ? q.id : null;
    $('[data-ag-r-titre]').textContent = q ? 'Répondre à cette question' : 'Nouvelle question-réponse';
    $('[data-ag-r-desc]').textContent = q
      ? `Posée ${q.posee} fois en 30 jours, dont ${q.passees} passées à votre équipe.`
      : `${AGENT_IA} s'en servira chaque fois qu'un client posera cette question.`;
    champQuestion.value = q ? q.question : (texte || '');
    champTexte.value = '';
    boutonReponse.disabled = true;
    KanalDS.modal.open('ag-reponse');
    (champQuestion.value ? champTexte : champQuestion).focus();
  }
  const reponsePrete = () => { boutonReponse.disabled = champQuestion.value.trim().length < 3 || champTexte.value.trim().length < 3; };
  champQuestion.addEventListener('input', reponsePrete);
  champTexte.addEventListener('input', reponsePrete);
  formReponse.addEventListener('submit', (e) => {
    e.preventDefault(); if (boutonReponse.disabled) return;
    const q = question(etat.reponsePour), texte = champTexte.value.trim();
    if (q) { q.reponse = texte; rendreQuestions(); }
    else LIBRES.push({ question: champQuestion.value.trim(), reponse: texte });
    nombreReponses += 1;
    $('[data-ag-qr]').textContent = `${nombreReponses} réponses`;
    $('[data-ag-qr-date]').textContent = 'à l\'instant';
    dialogueReponse.close();
    KanalDS.toast(`Réponse enregistrée : ${AGENT_IA} s'en sert d'ici 5 minutes`, { tone: 'success' });
  });
  document.addEventListener('click', (e) => { if (e.target.closest('[data-ag-nouvelle-reponse]')) ouvrirReponse(null); });

  // ---------------------------------------------------------------- [N14]
  // Un interrupteur, ou un choix dans une section sans bouton, s'enregistre tout de suite.
  // Le reste active le bouton « Enregistrer » de sa section.
  function modifie(cible, immediat) {
    const section = cible.closest('[data-ag-section]'); if (!section) return;
    const bouton = $('[data-ag-enregistrer]', section);
    if (immediat || !bouton) KanalDS.toast('Réglage enregistré', { tone: 'success', duration: 2000 });
    else bouton.disabled = false;
  }
  document.addEventListener('change', (e) => { if (e.target.matches('.k-switch, .k-select')) modifie(e.target, e.target.matches('.k-switch')); });
  document.addEventListener('input', (e) => { if (e.target.matches('.k-input, .k-textarea')) modifie(e.target); });
  document.addEventListener('k:change', (e) => { if (e.target.matches('.k-segmented')) modifie(e.target); });
  // Saisie de plusieurs valeurs : une adresse ajoutée (Entrée) ou retirée (la croix)
  // (en capture : composants.js vide le champ et retire l'étiquette avant que l'événement remonte jusqu'ici)
  document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.closest('.k-taginput') && e.target.value.trim()) modifie(e.target); }, true);
  document.addEventListener('click', (e) => {
    if (e.target.closest('.k-taginput .k-tag__remove')) { modifie(e.target); return; }
    const b = e.target.closest('[data-ag-enregistrer]'); if (!b || b.disabled) return;
    b.setAttribute('data-loading', '');
    setTimeout(() => { b.removeAttribute('data-loading'); b.disabled = true; KanalDS.toast(`Modifications enregistrées : ${AGENT_IA} les applique d'ici 5 minutes`, { tone: 'success' }); }, 700);
  }, true);

  // ---------------------------------------------------------------- [N12]
  // Le test. Chaque règle : ce qui la déclenche (sur le message sans accents ni majuscules), ce que Lumi a
  // compris, sa réponse, ses boutons, ses sources ([type, nom]), et s'il y a lieu la raison d'une passation.
  // Dans l'app, tout cela est la réponse de test_ai_agent ; rien n'est décidé dans la page.
  const REGLES = [
    { si: /^(stop|arret|arreter)\b|desabonn|ne plus recevoir/, intention: 'Désabonnement', desabonnement: true },
    { si: /humain|conseiller|quelqu.?un|une personne|un responsable/, intention: 'Parler à l\'équipe', passation: 'le client demande un humain',
      reponse: 'Bien sûr, je vous mets en relation avec l\'équipe. Camille ou Théo vous répond ici dès que possible.' },
    { si: /rembours|casse|abime|endommag|changer l.adresse|modifier ma commande/, intention: 'Remboursement ou modification d\'une commande', passation: 'une consigne réserve cette demande à l\'équipe',
      reponse: 'Je suis désolée pour ce désagrément. Je transmets tout de suite votre demande à l\'équipe, qui revient vers vous ici.', sources: [['Consignes', 'ne jamais promettre un remboursement ni modifier une commande payée']] },
    { si: /commande|colis|suivi/, intention: 'Suivi de commande',
      reponse: 'Je regarde ça tout de suite. Pouvez-vous me donner votre numéro de commande ? Il figure dans votre e-mail de confirmation.', emoji: '📦',
      sources: [['Commandes Shopify', 'aucune : dans un test, Lumi ne voit les commandes d\'aucun client']] },
    { si: /livr|delai|expedi|frais de port/, intention: 'Délais et frais de livraison',
      reponse: `Nos commandes partent sous 24 h et arrivent en 2 à 3 jours ouvrés en France. La livraison est offerte dès 60${F}€ d'achat.`,
      sources: [['L\'essentiel de la boutique', 'Livraison'], ['Page du site', 'Livraison et retours']] },
    { si: /retour|echange|renvoyer/, intention: 'Retour d\'un article',
      reponse: 'Vous avez 30 jours pour nous retourner un article qui n\'a pas été allumé, et le retour est gratuit en France. Voulez-vous la marche à suivre ?', boutons: ['Oui, la marche à suivre', 'Non merci'],
      sources: [['L\'essentiel de la boutique', 'Retours'], ['Page du site', 'Livraison et retours']] },
    { si: /code|promo|reduction|remise/, intention: 'Code de réduction',
      reponse: `Avec plaisir ! Le code LUMEN10 vous offre 10${F}% sur les bougies, hors articles déjà à prix réduit.`, emoji: '✨',
      sources: [['L\'essentiel de la boutique', 'Promotions en cours'], ['Consignes', 'ne donner le code que si le client demande une réduction']] },
    { si: /horaire|ouvert|joindre|telephone/, intention: 'Horaires de l\'équipe',
      reponse: 'L\'équipe répond du lundi au vendredi de 9 h à 18 h, et le samedi de 10 h à 13 h. Moi, je suis là à toute heure.',
      sources: [['L\'essentiel de la boutique', 'Horaires']] },
    { si: /ambre|figue/, intention: 'Renseignement sur un produit',
      reponse: `La bougie Ambre & Figue de 180 g est en stock, à 32${F}€. Elle sent la figue mûre et l'ambre chaud.`, boutons: ['Voir la bougie'],
      sources: [['Produit Shopify', 'Bougie Ambre & Figue, 180 g']] },
    { si: /bougie|parfum|cadeau|coffret|conseil/, intention: 'Conseil sur un produit',
      reponse: `Pour découvrir nos parfums, je vous conseille le Coffret Découverte : trois bougies de 70 g, à 39${F}€.`, boutons: ['Voir le coffret'],
      sources: [['Produit Shopify', 'Coffret Découverte']] },
    { si: /^(bonjour|bonsoir|salut|hello|coucou)[\s!.,]*$/, intention: 'Salutation', accueil: true, sources: [['Réglages', 'Message d\'accueil']] },
    { si: /^(merci|super|parfait|top)\b/, intention: 'Remerciement', reponse: 'Avec plaisir ! Très belle journée à vous.' }
  ];
  const fil = $('[data-ag-t-fil]'), vide = $('[data-ag-t-vide]'), defile = $('[data-ag-t-defile]');
  const formTest = $('[data-ag-t-form]'), champ = $('[data-ag-t-champ]'), envoyer = $('[data-ag-t-envoyer]'), recommencer = $('[data-ag-t-recommencer]');
  const test = { historique: [], essais: 0, termine: false, occupe: false, tour: 0 };

  // Ce que Lumi répondrait. Ordre : désabonnement, demande d'un humain, consigne ; puis une question de [N4]
  // (répondue ou non) ; puis ses connaissances ; sinon, elle ne sait pas.
  function repondre(message) {
    const m = normaliser(message);
    const regle = (r) => r.si.test(m);
    const prioritaire = REGLES.slice(0, 3).find(regle);
    if (prioritaire) return prioritaire;
    const libre = LIBRES.find((l) => normaliser(l.question) === m);
    if (libre) return { intention: 'Question connue', reponse: libre.reponse, sources: [['Question-réponse', libre.question]] };
    const q = QUESTIONS.find((x) => x.mots.test(m));
    if (q && q.reponse) return { intention: q.intention, reponse: q.reponse, sources: [['Question-réponse', q.question]] };
    if (q) return { intention: q.intention, inconnue: true, question: q };
    return REGLES.slice(3).find(regle) || { intention: 'Demande non reconnue', inconnue: true };
  }
  // Elle ne sait pas : elle demande une précision, puis passe la main au dernier essai permis [N10]
  function sansReponse(r) {
    const permis = Number($('[data-ag-essais]').value), parMail = $('[data-ag-escalade]').value === 'email';
    test.essais += 1;
    if (test.essais < permis) return Object.assign({}, r, { reponse: 'Je n\'ai pas encore cette information. Pouvez-vous m\'en dire un peu plus sur votre demande ?', attente: `Pas encore : essai ${test.essais} sur ${permis}` });
    const essais = pluriel(test.essais, 'essai'); test.essais = 0;
    return parMail
      ? Object.assign({}, r, { reponse: `Je n'ai pas la réponse à cette question. Écrivez-nous à ${MAIL_SUPPORT}, l'équipe vous répondra.`, attente: `Non : renvoi vers ${MAIL_SUPPORT} après ${essais}` })
      : Object.assign({}, r, { reponse: 'Je n\'ai pas la réponse à cette question. Je la transmets à l\'équipe, qui vous répond ici dès que possible.', passation: `rien dans ses connaissances après ${essais}` });
  }
  function pourquoi(r, message) {
    const sources = r.sources && r.sources.length
      ? r.sources.map((s) => `<div>${esc(s[0])} · ${esc(s[1])}</div>`).join('')
      : r.inconnue ? 'Aucune : rien trouvé dans ses connaissances' : 'Aucune : elle n\'en a pas eu besoin';
    const passation = r.passation ? `Oui : ${esc(r.passation)}` : r.attente ? esc(r.attente) : 'Non';
    return `<div class="k-summary"><div class="k-summary__title">${ic('information-circle', true)}Pourquoi cette réponse</div>
      <dl><dt>Compris</dt><dd>${esc(r.intention)}</dd><dt>Sources</dt><dd>${sources}</dd><dt>Passation</dt><dd>${passation}</dd>${r.desabonnement ? '<dt>Désabonnement</dt><dd>Oui : le contact sortirait de vos envois marketing</dd>' : ''}</dl>
      ${r.inconnue ? `<div style="margin-top:var(--k-space-3)"><button type="button" class="k-button k-button--outline k-button--sm" data-ag-t-ecrire="${esc(r.question ? r.question.id : '')}" data-ag-t-texte="${esc(message)}">Écrire la réponse</button></div>` : ''}</div>`;
  }
  function bulle(r) {
    if (r.desabonnement) return `<span class="k-thread__event">${ic('no-symbol')}${AGENT_IA} ne répond pas : elle traite ce message comme un désabonnement</span>`;
    const texte = r.accueil ? $('[data-ag-accueil]').value.trim() : r.reponse + (r.emoji && $('[data-ag-emojis]').checked ? ' ' + r.emoji : '');
    const boutons = r.boutons ? `<div class="k-bubble__buttons">${r.boutons.map((b) => `<span class="k-bubble__button">${esc(b)}</span>`).join('')}</div>` : '';
    return `<div class="k-bubble k-bubble--ai"><div class="k-bubble__author">${ic('sparkles', true)}${AGENT_IA}</div><span dir="auto">${multiligne(texte)}</span>${boutons}</div>`;
  }
  const ajouter = (html) => { fil.insertAdjacentHTML('beforeend', html); defile.scrollTop = defile.scrollHeight; };
  const etatSaisie = () => { envoyer.disabled = test.occupe || test.termine || !champ.value.trim(); champ.disabled = test.termine; recommencer.disabled = !test.historique.length; };
  function envoyerMessage(message) {
    if (test.occupe || test.termine || !message) return;
    vide.hidden = true; fil.hidden = false;
    test.occupe = true; champ.value = '';
    test.historique.push({ role: 'user', content: message });
    ajouter(`<div class="k-bubble k-bubble--in"><span dir="auto">${multiligne(message)}</span></div>`);
    ajouter(`<div class="k-bubble k-bubble--ai" data-ag-t-ecrit><div class="k-bubble__author">${ic('sparkles', true)}${AGENT_IA}</div><span class="k-typing" role="img" aria-label="${AGENT_IA} écrit"><i></i><i></i><i></i></span></div>`);
    etatSaisie();
    const tour = test.tour;
    setTimeout(() => {
      if (tour !== test.tour) return;   // « Recommencer » a été cliqué entre-temps
      let r = repondre(message);
      if (r.inconnue) r = sansReponse(r); else test.essais = 0;
      $('[data-ag-t-ecrit]', fil).remove();
      ajouter(bulle(r) + pourquoi(r, message));
      if (r.reponse || r.accueil) test.historique.push({ role: 'assistant', content: r.accueil ? $('[data-ag-accueil]').value.trim() : r.reponse });
      if (r.passation) {   // dans une vraie conversation, Lumi ne répond plus à un client qui attend un humain
        test.termine = true;
        ajouter(`<span class="k-thread__event">${ic('hand-raised')}${AGENT_IA} a passé la main et se tait : le client attend l'équipe</span>`);
      }
      test.occupe = false; etatSaisie();
      if (!test.termine) champ.focus();
    }, 700);
  }
  function remettreAZero() {
    test.historique = []; test.essais = 0; test.termine = false; test.occupe = false; test.tour += 1;
    fil.innerHTML = ''; fil.hidden = true; vide.hidden = false; champ.value = '';
    etatSaisie();
  }
  formTest.addEventListener('submit', (e) => { e.preventDefault(); envoyerMessage(champ.value.trim()); });
  champ.addEventListener('input', etatSaisie);
  champ.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); envoyerMessage(champ.value.trim()); } });
  recommencer.addEventListener('click', () => { remettreAZero(); champ.focus(); });
  $$('[data-ag-t-exemple]').forEach((b) => b.addEventListener('click', () => envoyerMessage(b.textContent.trim())));
  // « Écrire la réponse » : le test se ferme, la question-réponse s'ouvre avec la question testée (pas de modale sur une modale)
  fil.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ag-t-ecrire]'); if (!b) return;
    document.getElementById('ag-test').close();
    remettreAZero();
    ouvrirReponse(question(b.dataset.agTEcrire) || null, b.dataset.agTTexte);
  });

  rendreQuestions();
})();
