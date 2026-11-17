/* ==========================================================================
   La page d'un lien magique dans le design system. Script de lien.html.
   Repères [M1]…[M10] : voir les notes en tête de la page.

   Les liens, leurs automatisations et ce qu'on sait en dire viennent de
   assets/liens.js (window.KanalLiens), chargé avant ce fichier : la liste et
   cette page lisent les mêmes données. La courbe est tracée par
   assets/courbe.js. Seul le nombre de clics existe dans l'API : la série par
   jour est fictive, calculée pour retomber sur les clics des 30 jours.
   ========================================================================== */
(function () {
  'use strict';
  const K = window.KanalLiens, F = K.F, esc = K.esc, milliers = K.milliers, ic = K.ic;
  const $ = (s, r) => (r || document).querySelector(s);
  const tous = (s) => Array.from(document.querySelectorAll(s));

  // ---------------------------------------------------------------- [M1] le lien de la page
  // lien.html?id=colis ouvre un autre lien. Sans identifiant, ou s'il n'existe plus : la bio Instagram.
  const l = K.lien(new URLSearchParams(location.search).get('id')) || K.lien('insta') || K.liens()[0];
  if (!l) { location.replace('liens.html'); return; }

  const form = $('[data-ln-form]'), nom = $('[data-ln-nom]'), message = $('[data-ln-message]');
  const enregistrer = $('[data-ln-enregistrer]'), annuler = $('[data-ln-annuler]');

  // ---------------------------------------------------------------- [M2] la barre du haut, [M8] l'état
  function entete() {
    const url = 'https://' + K.adresse(l);
    document.title = `${l.nom} · Liens magiques · Kanal`;
    $('[data-ln-titre]').textContent = l.nom;
    $('[data-ln-cree]').textContent = `Lien magique · créé le ${l.cree}`;
    const etat = $('[data-ln-etat]');
    etat.className = l.actif ? 'k-badge k-badge--success' : 'k-badge';
    etat.innerHTML = l.actif ? '<span class="k-badge__dot"></span>Actif' : `${ic('no-symbol')}Désactivé`;
    $('[data-ln-bandeau]').hidden = l.actif;
    // Le menu ⋯ dit l'action possible, pas l'état
    const basculer = $('[data-ln-basculer]');
    basculer.querySelector('k-icon').setAttribute('name', l.actif ? 'pause' : 'play');
    basculer.querySelector('.k-menu__text').textContent = l.actif ? 'Désactiver le lien' : 'Réactiver le lien';
    // [M5] L'adresse courte et son QR code : ils ne changent jamais
    $('[data-ln-adresse]').textContent = K.adresse(l);
    tous('[data-ln-copier]').forEach((b) => b.setAttribute('data-k-copy', url));
    const qr = $('[data-ln-qr]'); qr.src = K.qr(l); qr.alt = `QR code du lien ${l.nom}`;
    // [M9] Ce que la suppression emporte
    $('[data-ln-suppr-titre]').textContent = `Supprimer « ${l.nom} » ?`;
    $('[data-ln-suppr-desc]').textContent = `${K.adresse(l)} affichera une page d'erreur, y compris sur les QR codes déjà imprimés`
      + (l.clics ? `, et ses ${milliers(l.clics)} clics ne seront plus comptés` : '') + '. Cette action ne s\'annule pas. Pour l\'arrêter sans le perdre, désactivez-le.';
  }

  // ---------------------------------------------------------------- [M3] [M4] la définition, modifiable sur la page
  const modifie = () => nom.value.trim() !== l.nom || message.value.trim() !== l.message;
  // [M4] Ce qui répond au message : une ligne de la carte (libellé et explication à gauche, état et lien à droite)
  function ligneReponse(texte, a) {
    const phrase = !texte ? `Écrivez dans le message le mot-clé d'une automatisation : ${K.AUTOMATISATIONS.map((x) => `<b>${K.esc(x.motCle)}</b>`).join(', ')}.`
      : !a ? 'Aucune automatisation n\'a son mot-clé dans ce message : il arrivera dans l\'inbox, à votre équipe.'
      : !a.active ? `Le mot-clé <b>${K.esc(a.motCle)}</b> déclenche cette automatisation, mais elle est en pause : le client n'aura pas de réponse.`
      : `Le mot-clé <b>${K.esc(a.motCle)}</b> déclenche cette automatisation : elle répond dès que le client envoie le message.`;
    const controle = !texte ? ''
      : !a ? '<span class="k-badge k-badge--warning"><span class="k-badge__dot"></span>Sans réponse</span><a class="k-button k-button--outline k-button--sm" href="automatisations.html">Voir les automatisations</a>'
      : `<span class="k-badge${a.active ? ' k-badge--success' : ''}"><span class="k-badge__dot"></span>${a.active ? 'Active' : 'En pause'}</span><a class="k-button k-button--outline k-button--sm" href="automatisation.html">${K.ic('bolt')}${K.esc(a.nom)}</a>`;
    return `<span class="k-settings__text"><span class="k-settings__label">Réponse automatique</span><span class="k-settings__desc">${phrase}</span></span><span class="k-settings__control">${controle}</span>`;
  }
  // Pendant la frappe : le compteur suit le message, et on dit quelle automatisation répondra
  function suivre() {
    const texte = message.value.trim(), r = K.reponse(texte), change = modifie();
    const nomCourt = nom.value.trim().length < 2, messageCourt = texte.length < 2;
    $('[data-ln-compte]').textContent = `${message.value.length} sur 2${F}048`;
    $('[data-ln-suite]').innerHTML = ligneReponse(texte, r.automatisation);
    if (nomCourt) nom.setAttribute('aria-invalid', 'true'); else nom.removeAttribute('aria-invalid');
    if (messageCourt) message.setAttribute('aria-invalid', 'true'); else message.removeAttribute('aria-invalid');
    $('[data-ln-nom-aide]').hidden = nomCourt; $('[data-ln-nom-erreur]').hidden = !nomCourt;
    $('[data-ln-compte]').hidden = messageCourt; $('[data-ln-message-erreur]').hidden = !messageCourt;
    // [M6] « Enregistrer » ne s'active que s'il y a quelque chose à enregistrer, et que c'est valable
    $('[data-ln-modifie]').hidden = !change; annuler.hidden = !change;
    enregistrer.disabled = !change || nomCourt || messageCourt;
    enregistrer.textContent = change ? 'Enregistrer' : 'Enregistré';
  }
  function remplir() { nom.value = l.nom; message.value = l.message; suivre(); }
  form.addEventListener('input', suivre);
  form.addEventListener('submit', (e) => {
    e.preventDefault(); if (enregistrer.disabled) return;
    l.nom = nom.value.trim(); l.message = message.value.trim(); K.garder();
    entete(); remplir();
    KanalDS.toast('Lien enregistré. Son adresse courte et son QR code n\'ont pas changé', { tone: 'success' });
  });
  annuler.addEventListener('click', remplir);
  // ⌘S ou Ctrl+S enregistre, comme dans le builder
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (!enregistrer.disabled) form.requestSubmit(); }
  });

  // ---------------------------------------------------------------- [M7] les résultats : les clics, et rien d'autre
  // Les 30 derniers jours, aujourd'hui compris (18 oct. au 16 nov. 2026). Aucun clic avant la création du lien.
  const JOURS = Array.from({ length: 30 }, (_, i) => new Date(2026, 10, i - 13));
  const creation = new Date(l.creeLe + 'T00:00');
  const court = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const long = (d) => d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  const VALEURS = l.clics30 ? KanalCourbe.repartir(l.clics30, JOURS.map((d, i) => (d < creation ? 0 : 1 + 0.3 * Math.sin(i * 1.3 + l.clics) + (d.getDay() % 6 === 0 ? 0.5 : 0)))) : [];
  const zone = $('[data-ln-courbe]');
  function tracer(n) {
    const v = VALEURS.slice(-n), j = JOURS.slice(-n), somme = v.reduce((a, b) => a + b, 0);
    $('[data-ln-courbe-desc]').textContent = `${milliers(somme)} clic${somme > 1 ? 's' : ''} du ${court(j[0])} au ${court(j[n - 1])}, jour par jour.`;
    KanalCourbe.tracer(zone, { valeurs: v, nom: 'Clics', format: milliers, hauteur: 220, etiquettes: j.map(long), dates: j.map(court) });
  }
  function resultats() {
    const jours = JOURS.filter((d) => d >= creation).length || 1, max = VALEURS.length ? Math.max(...VALEURS) : 0;
    $('[data-ln-clics]').textContent = milliers(l.clics);
    $('[data-ln-clics-detail]').textContent = `depuis le ${l.cree}`;
    $('[data-ln-clics30]').textContent = milliers(l.clics30);
    const evol = $('[data-ln-evol]');
    evol.className = l.evol > 0 ? 'k-delta k-delta--up' : 'k-delta';
    evol.innerHTML = l.evol > 0 ? `${ic('arrow-up-right', true)}${l.evol}${F}%` : !l.clics30 ? 'aucun clic' : jours < 30 ? 'depuis sa création' : 'stable';
    if (l.evol > 0) evol.setAttribute('data-k-tooltip', 'Par rapport aux 30 jours d\'avant'); else evol.removeAttribute('data-k-tooltip');
    $('[data-ln-moyenne]').textContent = l.clics30 ? milliers(l.clics30 / jours) : '0';
    $('[data-ln-moyenne-detail]').textContent = `sur ${jours} jour${jours > 1 ? 's' : ''}`;
    $('[data-ln-meilleur]').textContent = max ? milliers(max) : '—';
    $('[data-ln-meilleur-detail]').textContent = max ? long(JOURS[VALEURS.indexOf(max)]) : l.clics ? 'aucun sur 30 jours' : 'pas encore';
    // Sans clic sur la période, pas de courbe plate : on dit pourquoi
    const vide = !l.clics30;
    zone.hidden = vide; $('[data-ln-periodes]').hidden = vide; $('[data-ln-vide]').hidden = !vide;
    if (vide) {
      $('[data-ln-courbe-desc]').textContent = 'Jour par jour, sur les 30 derniers jours.';
      $('[data-ln-vide-titre]').textContent = l.clics ? 'Aucun clic depuis 30 jours' : 'Pas encore de clic';
      $('[data-ln-vide-desc]').textContent = !l.actif ? 'Le lien est désactivé : il affiche une page d\'erreur au lieu d\'ouvrir WhatsApp.'
        : l.clics ? 'Le lien marche toujours. Republiez-le pour le relancer.' : 'Publiez le lien ou imprimez son QR code : les clics apparaîtront ici, jour par jour.';
    }
  }
  $('[data-ln-periodes]').addEventListener('k:change', (e) => tracer(+e.detail.item.dataset.jours));

  // ---------------------------------------------------------------- [M8] désactiver ou réactiver
  // Désactiver plutôt que supprimer : le lien est peut-être déjà imprimé. L'état s'enregistre tout de suite,
  // sans attendre « Enregistrer », qui ne vaut que pour le nom et le message.
  function basculer(silence) {
    l.actif = !l.actif; K.garder(); entete(); resultats();
    if (silence !== true) KanalDS.toast(l.actif ? `« ${l.nom} » réactivé : il ouvre de nouveau WhatsApp` : `« ${l.nom} » désactivé : il affiche une page d'erreur`, { action: { label: 'Annuler', onClick: () => basculer(true) } });
  }
  $('[data-ln-basculer]').addEventListener('click', basculer);
  $('[data-ln-reactiver]').addEventListener('click', basculer);

  // ---------------------------------------------------------------- [M9] dupliquer, supprimer
  // La copie reprend le message enregistré ; elle a sa propre adresse courte, donc son propre QR code.
  $('[data-ln-dupliquer]').addEventListener('click', () => {
    const copie = K.creer(`${l.nom} (copie)`, l.message);
    K.annoncer(`Copie créée, avec sa propre adresse : ${K.adresse(copie)}`);
    location.href = K.page(copie);
  });
  $('[data-ln-supprimer]').addEventListener('click', () => {
    K.retirer(l.id); K.annoncer(`Lien « ${l.nom} » supprimé`);
    location.href = 'liens.html';
  });

  entete(); remplir(); resultats();
  if (VALEURS.length) tracer(30);
  K.direAnnonce();
})();
