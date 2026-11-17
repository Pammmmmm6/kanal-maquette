/* ==========================================================================
   Forfaits Kanal (« Plans ») dans le design system. Script de la page forfaits.html.
   Repères [F1]…[F8] : voir les notes en tête de la page.

   Deux états seulement : le forfait actuel, et un passage au forfait inférieur
   programmé pour la fin de la période (ou aucun). Dans l'app, les deux viennent
   du serveur. Tout le reste (boutons des cartes, bandeau, usage du mois, menus
   de la barre) en découle, dans afficher().
   ========================================================================== */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const F = ' ';   // espace fine insécable, avant € et %, et dans les milliers

  // Données de démo. Période en cours : du 1er au 30 novembre 2026 ; nous sommes le 16, il reste 15 jours sur 30.
  const FIN = '1er déc. 2026';              // fin de la période : date d'effet d'un passage au forfait inférieur
  const JOURS_RESTANTS = 15, JOURS_PERIODE = 30;

  // [F2] Les forfaits, du plus petit au plus grand. Prix repris de l'app.
  // [F8] Aucun forfait ne plafonne les messages : pas de quota dans ces données.
  const PLANS = {
    pro:      { rang: 1, nom: 'Pro',      prix: 89 },
    scale:    { rang: 2, nom: 'Scale',    prix: 149 },
    business: { rang: 3, nom: 'Business', prix: 350 }
  };

  // [F6] Ce qu'on perd en passant d'un forfait au forfait inférieur. L'équipe de la démo compte 3 personnes.
  const PERTES = {
    'scale>pro': [
      '2 des 3 membres de votre équipe : Pro ne comprend qu\'un utilisateur',
      'Le multi-marché',
      'Les segments',
      'Les automatisations illimitées et les automatisations avancées',
      'L\'intégration Klaviyo et les autres intégrations',
      'Kanal MCP et l\'agent IA'
    ],
    'business>scale': [
      'Les utilisateurs illimités : Scale en comprend 5',
      'La mise en place de vos automatisations par nos experts',
      'L\'optimisation continue',
      'Les campagnes à la demande',
      'Votre chargé de compte dédié'
    ]
  };
  PERTES['business>pro'] = [...PERTES['business>scale'].slice(1), ...PERTES['scale>pro']];

  let actuel = 'scale';   // le forfait actuel
  let prevu = null;       // le forfait inférieur programmé pour la fin de la période, ou rien
  let cible = null;       // le forfait de la confirmation ouverte

  const cartes = $$('[data-fo-plan]');
  const carte = (id) => cartes.find((c) => c.dataset.foPlan === id);
  const nombre = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+$)/g, F);
  const euros = (v) => (Number.isInteger(v) ? nombre(v) : v.toFixed(2).replace('.', ',')) + F + '€';

  // [F4] L'état de chaque carte, le bandeau d'un changement programmé, puis l'usage du mois.
  function afficher() {
    const a = PLANS[actuel];
    cartes.forEach((c) => {
      const id = c.dataset.foPlan, p = PLANS[id], bouton = $('[data-fo-choisir]', c);
      const estActuel = id === actuel, estPrevu = id === prevu, monte = p.rang > a.rang;
      $('[data-fo-actuel]', c).hidden = !estActuel;
      bouton.disabled = estActuel || estPrevu;
      bouton.classList.toggle('k-button--primary', !bouton.disabled && monte);
      bouton.classList.toggle('k-button--secondary', !bouton.disabled && !monte);
      bouton.innerHTML = estActuel ? '<k-icon name="check" set="micro"></k-icon>Forfait actuel'
        : estPrevu ? `<k-icon name="clock" set="micro"></k-icon>Prévu le ${FIN}`
        : `Passer à ${p.nom}`;
    });

    // [F6] Le bandeau au-dessus des cartes (PROPOSITION)
    $('[data-fo-prevu]').hidden = !prevu;
    if (prevu) $('[data-fo-prevu-texte]').innerHTML = `<span class="k-banner__title">Vous passerez au forfait ${PLANS[prevu].nom} le ${FIN}.</span> D'ici là, vous gardez tout le forfait ${a.nom}.`;

    usage();
  }

  // [F8] Aucun forfait ne plafonne les messages : il n'y a rien à recalculer. Seul le menu du compte dit le forfait.
  function usage() {
    const label = $('#menu-compte .k-menu__label'); if (label) label.textContent = `Maison Lumen · ${PLANS[actuel].nom} plan`;
  }

  // [F5] La confirmation d'un passage au forfait supérieur. Prorata simple : HYPOTHÈSE, c'est Shopify qui facture.
  function remplirMonter(p, a) {
    const ecart = p.prix - a.prix;
    const prorata = Math.round(ecart * JOURS_RESTANTS / JOURS_PERIODE * 100) / 100;
    const m = (cle) => $(`#fo-monter [data-fo-m="${cle}"]`);
    m('titre').textContent = `Passer à ${p.nom}`;
    m('forfait').textContent = `${p.nom}, ${euros(p.prix)} par mois`;
    m('prorata').textContent = euros(prorata);
    m('suite').textContent = `${euros(p.prix)}, à partir du ${FIN}`;
    m('note').textContent = `Il reste ${JOURS_RESTANTS} jours sur ${JOURS_PERIODE} dans la période en cours : vous ne réglez aujourd'hui que la différence entre les deux forfaits (${euros(ecart)} par mois), pour ces ${JOURS_RESTANTS} jours. Shopify s'ouvre ensuite pour valider le paiement.`;
  }

  // [F6] La confirmation d'un passage au forfait inférieur : ce qu'on perd, et quand.
  function remplirDescendre(p, a) {
    const d = (cle) => $(`#fo-descendre [data-fo-d="${cle}"]`);
    d('titre').textContent = `Passer à ${p.nom} ?`;
    d('phrase').textContent = `Le changement prendra effet le ${FIN}, à la fin de la période en cours. D'ici là, vous gardez tout le forfait ${a.nom}.`;
    d('quand').textContent = `Ce que vous perdez le ${FIN}`;
    const pertes = d('pertes');
    pertes.textContent = '';
    (PERTES[`${actuel}>${cible}`] || []).forEach((texte) => {
      const li = document.createElement('li');
      li.className = 'k-features__item k-features__item--lost';
      li.innerHTML = '<k-icon name="x-mark" set="micro"></k-icon><span class="k-features__text"></span>';
      li.lastChild.textContent = texte;
      pertes.appendChild(li);
    });
    d('prix').textContent = `À partir du ${FIN}, vous paierez ${euros(p.prix)} par mois au lieu de ${euros(a.prix)}.`;
    d('garder').textContent = `Garder ${a.nom}`;
    $('[data-fo-d-valider]').textContent = `Confirmer le passage à ${p.nom}`;
  }

  // [F4] Le bouton d'une carte ouvre la confirmation qui convient. Ouverte au clavier, elle ne s'anime pas.
  cartes.forEach((c) => {
    $('[data-fo-choisir]', c).addEventListener('click', (e) => {
      cible = c.dataset.foPlan;
      const p = PLANS[cible], a = PLANS[actuel], monte = p.rang > a.rang;
      if (monte) remplirMonter(p, a); else remplirDescendre(p, a);
      KanalDS.modal.open(monte ? 'fo-monter' : 'fo-descendre', { instant: e.detail === 0 });
    });
  });

  // [F5] Valider. Dans l'app : redirection vers Shopify, le forfait change au retour, une fois le paiement validé.
  $('[data-fo-m-valider]').addEventListener('click', () => {
    KanalDS.modal.close('fo-monter');
    actuel = cible; prevu = null;   // un changement programmé est abandonné
    afficher();
    // Le bouton qui a ouvert la confirmation vient de se désactiver : le focus va sur sa carte.
    carte(actuel).focus({ preventScroll: true });
    KanalDS.toast(`Vous êtes au forfait ${PLANS[actuel].nom}`, { tone: 'success' });   // toast de démonstration
  });

  // [F6] Confirmer : le changement est programmé pour la fin de la période, rien ne change d'ici là.
  $('[data-fo-d-valider]').addEventListener('click', () => {
    KanalDS.modal.close('fo-descendre');
    prevu = cible;
    afficher();
    $('[data-fo-annuler]').focus({ preventScroll: true });
    KanalDS.toast(`Passage à ${PLANS[prevu].nom} prévu le ${FIN}`, { tone: 'success', action: { label: 'Annuler', onClick: annuler } });
  });

  // [F6] Annuler le changement programmé, depuis le bandeau ou depuis le toast.
  function annuler() {
    if (!prevu) return;
    const id = prevu;
    prevu = null;
    afficher();
    $('[data-fo-choisir]', carte(id)).focus({ preventScroll: true });
    KanalDS.toast(`Changement annulé : vous restez au forfait ${PLANS[actuel].nom}`);
  }
  $('[data-fo-annuler]').addEventListener('click', annuler);

  afficher();
})();
