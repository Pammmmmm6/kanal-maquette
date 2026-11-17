/* ==========================================================================
   Avis Kanal (« Claim my 20 € ») dans le design system. Script de la page avis.html.
   Repères [V0]…[V8] : voir les notes en tête de la page, et INTEGRATION.md §6
   (repères d'origine [R0] à [R3] de kanal/reviews.html).

   Deux cartes, Shopify et Trustpilot, qui passent par les mêmes états. L'état
   d'une carte est son attribut data-etat ; dans l'app, il vient du serveur.
   Ici, on avance en suivant le parcours, ou avec les cinq icônes du coin en
   haut à droite [V0], qui pilotent la carte Shopify et ne sont pas à porter.
   ========================================================================== */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];

  // [V5] Les états d'une carte : l'étape en cours (4 : les trois étapes sont cochées).
  const ETATS = {
    'a-faire':      { pas: 1 },   // rien n'est fait
    'lien':         { pas: 2 },   // la page d'avis a été ouverte : le lien de l'avis est attendu
    'verification': { pas: 3 },   // lien soumis : l'avis attend d'être publié et vérifié
    'credite':      { pas: 4 },   // PROPOSITION, état À CONCEVOIR : avis vérifié, crédit versé
    'deja':         { pas: 4 }    // un avis existait déjà sur la plateforme
  };

  // [V7] Ce qu'un lien d'avis doit contenir, par plateforme.
  // [V6] L'adresse de la page d'avis de Kanal sur chaque plateforme : URL À FOURNIR.
  const PLATEFORMES = {
    shopify:    { nom: 'Shopify',    lien: /shopify\.com\/\S+/i },
    trustpilot: { nom: 'Trustpilot', lien: /trustpilot\.com/i }
  };

  const cartes = $$('[data-av-carte]');
  const bascule = $('[data-av-etats]');

  // [V5] Affiche un état : les blocs data-av-si, puis les trois étapes.
  function afficher(carte, etat) {
    if (!ETATS[etat]) return;
    const pas = ETATS[etat].pas;
    carte.dataset.etat = etat;
    $$('[data-av-si]', carte).forEach((el) => { el.hidden = !el.dataset.avSi.split(' ').includes(etat); });
    $$('[data-av-pas]', carte).forEach((el) => {
      const p = +el.dataset.avPas;
      if (p === pas) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current');
      el.toggleAttribute('data-done', p < pas);
      $('.k-steps__num', el).innerHTML = p < pas ? '<k-icon name="check" set="micro"></k-icon>' : p;
    });
    if (etat !== 'lien') effacerErreur(carte);
  }

  // [V0] La bascule suit la carte Shopify quand on avance par le parcours. À ne pas porter.
  function suivreBascule(carte) {
    if (!bascule || carte.dataset.avCarte !== 'shopify') return;
    $$('.k-segmented__item', bascule).forEach((b) => {
      const choisi = b.dataset.etat === carte.dataset.etat;
      b.setAttribute('aria-selected', choisi ? 'true' : 'false');
      b.tabIndex = choisi ? 0 : -1;
    });
    if (window.KanalDS) KanalDS.refresh(bascule);
  }

  // [V7] L'erreur du champ : aria-invalid sur le champ, et son message.
  function montrerErreur(carte) {
    $('[data-av-lien]', carte).setAttribute('aria-invalid', 'true');
    $('[data-av-erreur]', carte).hidden = false;
  }
  function effacerErreur(carte) {
    $('[data-av-lien]', carte).removeAttribute('aria-invalid');
    $('[data-av-erreur]', carte).hidden = true;
  }

  cartes.forEach((carte) => {
    const plateforme = PLATEFORMES[carte.dataset.avCarte];
    const champ = $('[data-av-lien]', carte);

    // [V6] Écrire l'avis. Dans l'app : un lien vers la page d'avis de Kanal, dans un nouvel onglet (URL À FOURNIR).
    // Le bouton reste accessible ensuite ; le rouvrir ne fait pas revenir les étapes en arrière.
    $$('[data-av-ecrire]', carte).forEach((bouton) => {
      bouton.addEventListener('click', () => {
        KanalDS.toast(`Dans l'app, ce bouton ouvre la page d'avis de Kanal sur ${plateforme.nom}, dans un nouvel onglet`);
        if (carte.dataset.etat !== 'a-faire') return;
        afficher(carte, 'lien');
        suivreBascule(carte);
        champ.focus({ preventScroll: true });
      });
    });

    // [V7] Envoyer le lien pour vérification. Dans l'app : enregistrer le lien, puis vérifier la publication (à créer).
    $('[data-av-form]', carte).addEventListener('submit', (e) => {
      e.preventDefault();
      if (!plateforme.lien.test(champ.value.trim())) { montrerErreur(carte); champ.focus(); return; }
      champ.value = '';
      afficher(carte, 'verification');
      suivreBascule(carte);
      // Le bouton d'envoi vient de disparaître : le focus reste dans la carte, sur le bouton de l'étape affichée.
      const suite = $$('[data-av-ecrire]', carte).find((b) => !b.closest('[hidden]'));
      if (suite) suite.focus({ preventScroll: true });
      KanalDS.toast('Lien de l’avis envoyé', { tone: 'success' });   // toast de démonstration, à ne pas porter
    });
    champ.addEventListener('input', () => effacerErreur(carte));

    afficher(carte, carte.dataset.etat);
  });

  // [V0] Les cinq icônes du coin : l'état de la carte Shopify. À ne pas porter.
  if (bascule) {
    const shopify = $('[data-av-carte="shopify"]');
    bascule.addEventListener('k:change', (e) => afficher(shopify, e.detail.item.dataset.etat));
  }
})();
