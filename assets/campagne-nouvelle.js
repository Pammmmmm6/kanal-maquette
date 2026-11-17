/* ==========================================================================
   Créer une campagne dans le design system. Script de campagne-nouvelle.html.
   Repères [P1]…[P11] : voir les notes en tête de la page.

   Un seul état (etat), et une fonction, mettreAJour(), qui en tire tout ce que
   l'écran affiche : la barre, les étapes, l'aperçu, le résumé, le
   récapitulatif et la modale. Les destinataires, les messages et le coût
   sortent du même calcul (compte()) : ils ne peuvent pas se contredire.

   Maquette : audiences, modèles, prix et date du jour sont fixes. Dans l'app,
   ils viennent de l'API, et le brouillon s'enregistre à chaque changement.
   ========================================================================== */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const F = ' ';   // espace fine insécable
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const milliers = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, F);
  const euros = (centimes) => milliers(Math.floor(centimes / 100)) + ',' + String(centimes % 100).padStart(2, '0') + F + '€';
  const ic = (nom, micro) => `<k-icon name="${nom}"${micro ? ' set="micro"' : ''}></k-icon>`;
  const ALERTE = '<k-icon name="exclamation-triangle" set="micro" size="14"></k-icon>';
  const entre = (t) => '« ' + t + ' »';
  const contacts = (n) => `${milliers(n)} contact${n > 1 ? 's' : ''}`;
  const majuscule = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const normaliser = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const lignes = (l) => l.map((x) => `<dt>${x[0]}</dt><dd><span>${x[1]}</span></dd>`).join('');

  // ---------------------------------------------------------------- référentiels
  // HYPOTHÈSES DE MAQUETTE : la date du jour, le prix d'un message et le forfait sont figés ici.
  const AUJOURDHUI = { date: '2026-11-16', heure: '10:42' };
  const PRIX = 28;   // centimes par message marketing
  const META = { limite: 100000, envoyes: 4812 };   // [P11] la limite d'envoi de Meta sur 24 h et ce qui est déjà parti (modale de qualité)
  const CALMES = { debut: '21:00', fin: '09:00' };
  const TEMOIN = { prenom: 'Léa', complet: 'Léa Martin' };   // le contact dont l'aperçu prend les valeurs

  // [P4] Les mêmes sources et les mêmes audiences que la page Listes et segments (assets/listes.js).
  // abonnes : ceux qui recevront le message. Seul celui de « Tous les contacts » vient d'une autre page.
  const SOURCES = {
    liste:   { nom: 'Liste Kanal', famille: 'listes', badge: '', vignette: ic('list-bullet') },
    segment: { nom: 'Segment', famille: 'segments', badge: ' k-badge--accent', vignette: ic('funnel') },
    klaviyo: { nom: 'Klaviyo', famille: 'synchro', badge: ' k-badge--outline', vignette: '<img src="assets/img/klaviyo.png" alt="">' },
    shopify: { nom: 'Shopify', famille: 'synchro', badge: ' k-badge--outline', vignette: '<img src="assets/img/shopify.svg" alt="">' }
  };
  const AUDIENCES = [
    { id: 'tous', nom: 'Tous les contacts', source: 'liste', detail: 'Tous vos contacts, abonnés ou non', contacts: 12480, abonnes: 11640 },
    { id: 'newsletter', nom: 'Abonnés à la newsletter', source: 'liste', detail: 'Inscrits par la fenêtre du site', contacts: 9137, abonnes: 8512 },
    { id: 'bf', nom: 'Black Friday 2026', source: 'liste', detail: 'Inscrits à l\'accès anticipé', contacts: 3210, abonnes: 3098 },
    { id: 'vip', nom: 'Meilleurs clients', source: 'segment', detail: 'Total dépensé supérieur à 200' + F + '€', contacts: 845, abonnes: 812 },
    { id: 'engages', nom: 'Engagés, 30 jours', source: 'segment', detail: 'A lu un message dans les 30 derniers jours', contacts: 5402, abonnes: 5371 },
    { id: 'panier', nom: 'Panier abandonné, 7 jours', source: 'segment', detail: 'A abandonné un panier dans les 7 derniers jours', contacts: 1126, abonnes: 934 },
    { id: 'klaviyo', nom: 'Klaviyo · Newsletter', source: 'klaviyo', detail: 'Synchronisée il y a 10 min', contacts: 7950, abonnes: 6380 },
    { id: 'shopify', nom: 'Shopify · Accepte le marketing', source: 'shopify', detail: 'Synchronisée il y a 1 h', contacts: 10214, abonnes: 9486 }
  ];

  // [P5] Modèles marketing validés. {{cle}} dans le texte renvoie à une variable.
  // Une variable de type « contact » se remplit pour chaque contact ; les autres ont la même valeur pour tous.
  const PRENOM = { cle: 'prenom', nom: 'Prénom', type: 'contact' };
  const PIED = 'Répondez STOP pour ne plus recevoir nos messages';
  const MODELES = [
    { id: 'coffrets', nom: 'Coffrets de Noël', image: true,
      texte: 'Bonjour {{prenom}}, nos coffrets de Noël sont arrivés : trois bougies coulées à la main, prêtes à offrir. La livraison est offerte avec le code {{code}} jusqu\'au {{fin}}.',
      boutons: [['Voir les coffrets', 'maisonlumen.com/collections/coffrets-noel']],
      variables: [PRENOM, { cle: 'code', nom: 'Code promo', defaut: 'NOEL26', max: 20, aide: 'Le code doit exister dans Shopify.' }, { cle: 'fin', nom: 'Fin de l\'offre', defaut: 'dimanche 13 décembre', max: 30 }] },
    { id: 'blackfriday', nom: 'Black Friday, accès anticipé', image: true,
      texte: 'Bonjour {{prenom}}, le Black Friday commence pour vous avec un jour d\'avance : {{remise}} sur toute la boutique jusqu\'à {{fin}}.',
      boutons: [['J\'en profite', 'maisonlumen.com/black-friday'], ['Voir la collection', 'maisonlumen.com/collections']],
      variables: [PRENOM, { cle: 'remise', nom: 'Remise', defaut: '20' + F + '%', max: 20 }, { cle: 'fin', nom: 'Fin de l\'offre', defaut: 'dimanche minuit', max: 30 }] },
    { id: 'collection', nom: 'Nouvelle collection', image: true,
      texte: 'Bonjour {{prenom}}, la collection {{collection}} vient de sortir de l\'atelier. Elle est en ligne dès aujourd\'hui, en petites quantités.',
      boutons: [['Découvrir la collection', 'maisonlumen.com/collections/nouveautes']],
      variables: [PRENOM, { cle: 'collection', nom: 'Nom de la collection', defaut: 'Hiver', max: 30 }] },
    { id: 'stock', nom: 'Retour en stock', image: false,
      texte: 'Bonjour {{prenom}}, la bougie {{produit}} est de retour en stock. La dernière fois, elle est partie en deux jours.',
      boutons: [['Commander', 'maisonlumen.com/products']],
      variables: [PRENOM, { cle: 'produit', nom: 'Produit', defaut: 'Ambre & Figue', max: 30 }] }
  ];
  const SOURCES_PRENOM = { prenom: 'Prénom du contact', complet: 'Prénom et nom du contact' };
  const STATUTS = { brouillon: ['', 'Brouillon'], programmee: [' k-badge--violet', 'Programmée'], envoi: [' k-badge--orange', 'En cours'] };

  // ---------------------------------------------------------------- état
  // L'exemple : « Coffrets de Noël », en brouillon, déjà réglée pour le 1er décembre 2026 à 9:00.
  const etat = {
    etape: 0, atteinte: 0, statut: 'brouillon',
    famille: 'toutes', q: '', audience: 'newsletter',
    modele: 'coffrets', prenom: { source: 'prenom', repli: 'à vous' }, valeurs: {},
    quand: 'programme', date: '2026-12-01', heure: '09:00', calmes: true, nom: 'Coffrets de Noël'
  };
  MODELES.forEach((m) => { etat.valeurs[m.id] = {}; m.variables.forEach((v) => { if (v.type !== 'contact') etat.valeurs[m.id][v.cle] = v.defaut; }); });
  // [P3] Une erreur ne s'affiche sous un champ qu'après une tentative de passer l'étape
  const essai = [false, false, false];
  const audience = () => AUDIENCES.find((a) => a.id === etat.audience);
  const modele = () => MODELES.find((m) => m.id === etat.modele);
  // Un message par destinataire : les trois nombres sortent d'ici
  function compte() {
    const a = audience();
    return { destinataires: a.abonnes, ecartes: a.contacts - a.abonnes, messages: a.abonnes, cout: a.abonnes * PRIX };
  }

  // ---------------------------------------------------------------- dates
  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const temps = (iso) => { const p = iso.split('-').map(Number); return Date.UTC(p[0], p[1] - 1, p[2]); };
  const quantieme = (j) => (j === 1 ? '1er' : String(j));
  const dateLongue = (iso) => { const d = new Date(temps(iso)); return `${JOURS[d.getUTCDay()]} ${quantieme(d.getUTCDate())} ${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
  const dateCourte = (iso) => { const d = new Date(temps(iso)); return `${quantieme(d.getUTCDate())} ${MOIS_COURTS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
  const heureLue = (h) => Number(h.slice(0, 2)) + ':' + h.slice(3, 5);   // 09:00 se lit 9:00
  const lendemain = (iso) => new Date(temps(iso) + 864e5).toISOString().slice(0, 10);
  const dans = (iso) => { const n = Math.round((temps(iso) - temps(AUJOURDHUI.date)) / 864e5); return n === 0 ? 'aujourd\'hui' : n === 1 ? 'demain' : `dans ${n} jours`; };

  // [P6] Le moment réel du départ. Heures calmes respectées : un envoi prévu entre 21 h et 9 h part à 9 h.
  function envoi() {
    const programme = etat.quand === 'programme';
    const demandee = programme ? etat.heure : AUJOURDHUI.heure;
    let date = programme ? etat.date : AUJOURDHUI.date, heure = demandee;
    const complet = /^\d{4}-\d{2}-\d{2}$/.test(date) && /^\d{2}:\d{2}/.test(heure);
    const futur = complet && (date + ' ' + heure) > (AUJOURDHUI.date + ' ' + AUJOURDHUI.heure);
    const calme = complet && (heure >= CALMES.debut || heure < CALMES.fin);
    const reporte = calme && etat.calmes;
    if (reporte) { if (heure >= CALMES.debut) date = lendemain(date); heure = CALMES.fin; }
    const differe = programme || reporte;   // « Programmer » plutôt qu'« Envoyer »
    const ok = !programme || futur;
    return {
      programme, complet, futur, calme, reporte, differe, ok, date, heure, demandee,
      court: !ok ? 'Date à choisir' : differe ? `${dateCourte(date)} à ${heureLue(heure)}` : 'Maintenant',
      long: !ok ? '' : differe ? `${dateLongue(date)} à ${heureLue(heure)}` : 'maintenant'
    };
  }
  // [P11] Kanal ne plafonne rien. La seule limite est celle de Meta, sur 24 heures : ce qui la dépasse
  function depassement(e, n) {
    return e.ok ? Math.max(0, n - (META.limite - (e.differe ? 0 : META.envoyes))) : 0;
  }

  // ---------------------------------------------------------------- [P4] audience
  const visibles = () => AUDIENCES.filter((a) => (etat.famille === 'toutes' || SOURCES[a.source].famille === etat.famille) && (!etat.q || normaliser(a.nom + ' ' + a.detail).includes(normaliser(etat.q))));
  function ligneAudience(a) {
    const s = SOURCES[a.source], choisie = a.id === etat.audience, part = a.abonnes / a.contacts;
    return `<tr data-k-row data-cn-audience="${a.id}" aria-selected="${choisie}">
      <td class="k-table__check"><input class="k-radio" type="radio" name="cn-audience" value="${a.id}" aria-label="${esc(a.nom)}"${choisie ? ' checked' : ''}></td>
      <td><div class="k-table__who"><span class="k-logo">${s.vignette}</span><div><div class="k-table__primary">${esc(a.nom)}</div><div class="k-table__secondary">${esc(a.detail)}</div></div></div></td>
      <td><span class="k-badge${s.badge}">${s.nom}</span></td>
      <td class="k-table__num">${milliers(a.contacts)}</td>
      <td class="k-table__num"><div class="k-table__who k-table__who--end"><span class="k-table__primary">${milliers(a.abonnes)}</span><span class="k-progress k-progress--ink k-progress--inline" style="--k-value:${part.toFixed(3)}" role="img" aria-label="${Math.round(part * 100)} % de l'audience"><span></span></span></div></td>
    </tr>`;
  }
  function rendreAudiences() {
    const l = visibles();
    $('[data-cn-audiences]').innerHTML = l.length ? l.map(ligneAudience).join('') : '<tr><td class="k-table__empty" colspan="5">Aucune audience ne correspond à cette recherche.</td></tr>';
  }
  function choisirAudience(id) {
    if (id === etat.audience) return;
    etat.audience = id;
    // on ne redessine pas le tableau : le bouton radio garde le focus
    $$('[data-cn-audience]').forEach((tr) => { const oui = tr.dataset.cnAudience === id; tr.setAttribute('aria-selected', oui); $('input', tr).checked = oui; });
    mettreAJour();
  }

  // ---------------------------------------------------------------- [P5] message
  function composition(m) {
    const n = m.variables.length, b = m.boutons.length;
    return [m.image ? 'Image et texte' : 'Texte seul', `${b} bouton${b > 1 ? 's' : ''}`, `${n} variable${n > 1 ? 's' : ''}`].join(' · ');
  }
  function rendreModeles() {
    $('[data-cn-modeles]').innerHTML = MODELES.map((m) => `<label class="k-choice"><input class="k-radio" type="radio" name="cn-modele" value="${m.id}"${m.id === etat.modele ? ' checked' : ''}><span><span class="k-check__label">${esc(m.nom)}</span><span class="k-check__hint">${composition(m)}</span></span></label>`).join('');
  }
  const champ = (id, libelle, controle, aide, erreur) => `<div class="k-field"><label class="k-field__label" for="${id}">${esc(libelle)}</label>${controle}${aide ? `<span class="k-field__hint">${aide}</span>` : ''}${erreur ? `<span class="k-field__error" id="${id}-err" hidden>${ALERTE}${erreur}</span>` : ''}</div>`;
  function rendreVariables() {
    const m = modele();
    $('[data-cn-variables]').innerHTML = m.variables.map((v) => {
      if (v.type === 'contact') {
        return champ('cn-v-source', v.nom, `<select class="k-select" id="cn-v-source" data-cn-prenom="source">${Object.keys(SOURCES_PRENOM).map((k) => `<option value="${k}"${k === etat.prenom.source ? ' selected' : ''}>${SOURCES_PRENOM[k]}</option>`).join('')}</select>`, 'Rempli pour chaque contact.')
          + champ('cn-v-repli', 'Si le prénom manque', `<input class="k-input" id="cn-v-repli" type="text" value="${esc(etat.prenom.repli)}" maxlength="30" autocomplete="off" data-cn-prenom="repli">`, 'Ce texte prend sa place dans le message.');
      }
      const id = 'cn-v-' + v.cle;
      return champ(id, v.nom, `<input class="k-input" id="${id}" type="text" value="${esc(etat.valeurs[m.id][v.cle])}" maxlength="${v.max}" autocomplete="off" aria-describedby="${id}-err" data-cn-variable="${v.cle}">`, v.aide, 'Remplissez cette variable : un modèle ne part pas avec une variable vide.');
    }).join('');
    const boutons = m.boutons.map((b) => `${esc(b[0])} · ${esc(b[1])}`).join('<br>');
    $('[data-cn-fixe]').innerHTML = lignes([[m.boutons.length > 1 ? 'Boutons' : 'Bouton', boutons], ['Pied du message', esc(PIED)], ['Langue', 'Français']]);
  }
  // Ce que l'aperçu montre à la place d'une variable : la valeur saisie, ou celle du contact témoin
  function valeur(m, cle) {
    const v = m.variables.find((x) => x.cle === cle);
    if (!v) return cle;
    if (v.type === 'contact') return TEMOIN[etat.prenom.source];
    return etat.valeurs[m.id][cle].trim() || v.nom;
  }
  const variableVide = () => modele().variables.find((v) => v.type !== 'contact' && !etat.valeurs[etat.modele][v.cle].trim());
  // [P8] L'aperçu WhatsApp. L'heure de la bulle est celle du départ.
  function apercu(m, e) {
    const corps = esc(m.texte).replace(/\{\{(\w+)\}\}/g, (tout, cle) => `<span class="k-var">${esc(valeur(m, cle))}</span>`);
    return `<div class="k-wa"><div class="k-wa__bubble">${m.image ? '<div class="k-wa__media"><k-icon name="photo" size="24"></k-icon></div>' : ''}<div class="k-wa__body">${corps}</div><div class="k-wa__footer">${esc(PIED)}</div><div class="k-wa__time">${e.ok ? e.heure : etat.heure || CALMES.fin}</div>${m.boutons.map((b) => `<div class="k-wa__button">${ic('arrow-top-right-on-square')}${esc(b[0])}</div>`).join('')}</div></div>`;
  }

  // ---------------------------------------------------------------- [P3] étapes
  // Le champ à corriger avant de quitter l'étape i, ou rien
  function erreur(i) {
    if (i === 1) { const v = variableVide(); return v ? '#cn-v-' + v.cle : null; }
    if (i === 2) {
      if (!etat.nom.trim()) return '#cn-nom';
      const e = envoi();
      if (!e.ok) return etat.date && !etat.heure ? '#cn-heure' : '#cn-date';
    }
    return null;
  }
  function montrerErreurs() {
    $$('[data-cn-variable]').forEach((c) => {
      const vide = essai[1] && !c.value.trim();
      c.setAttribute('aria-invalid', vide); document.getElementById(c.id + '-err').hidden = !vide;
    });
    const sansNom = essai[2] && !etat.nom.trim();
    $('#cn-nom').setAttribute('aria-invalid', sansNom); $('#cn-nom-err').hidden = !sansNom;
    // une date passée se signale tout de suite ; une date incomplète, seulement après une tentative
    const e = envoi(), passee = e.programme && e.complet && !e.futur, incomplete = e.programme && !e.complet && essai[2];
    const boite = $('[data-cn-date-erreur]');
    $('#cn-date').setAttribute('aria-invalid', passee || incomplete); $('#cn-heure').setAttribute('aria-invalid', passee || incomplete);
    boite.hidden = !(passee || incomplete);
    boite.innerHTML = ALERTE + (passee ? `Ce moment est déjà passé : nous sommes le ${dateLongue(AUJOURDHUI.date)}, il est ${heureLue(AUJOURDHUI.heure)}.` : 'Choisissez une date et une heure.');
  }
  function aller(n) {
    for (let i = 0; i < n; i++) {
      const champFautif = erreur(i);
      if (champFautif) {   // on s'arrête à l'étape incomplète, le curseur dans le champ à corriger
        essai[i] = true; etat.etape = i; afficherEtape();
        const c = $(champFautif); if (c) c.focus();
        return false;
      }
    }
    etat.etape = n; etat.atteinte = Math.max(etat.atteinte, n); afficherEtape();
    return true;
  }
  function afficherEtape() {
    $$('[data-cn-etape]').forEach((s) => { s.hidden = Number(s.dataset.cnEtape) !== etat.etape; });
    $('[data-cn-defile]').scrollTop = 0;
    // le segmenté des familles a pu être préparé pendant que son étape était cachée : on replace sa pastille
    if (etat.etape === 0 && KanalDS.refresh) KanalDS.refresh($('[data-cn-familles]'));
    mettreAJour();
  }

  // ---------------------------------------------------------------- tout ce qui dépend de l'état
  function bandeauForfait(e, c) {
    const trop = depassement(e, c.messages);
    if (!trop) return '';
    return `<div class="k-banner k-banner--warning">${ic('exclamation-triangle')}<div class="k-banner__text"><span class="k-banner__title">Cet envoi dépasse votre limite Meta.</span> Meta vous laisse écrire à ${milliers(META.limite)} contacts par 24 heures, et la campagne en compte ${milliers(c.messages)} : ${milliers(trop)} messages partiront le lendemain. Kanal, lui, ne limite rien.</div><div class="k-banner__actions"><button type="button" class="k-button k-button--outline k-button--sm" data-k-open="mod-qualite">Voir ma limite</button></div></div>`;
  }
  function bandeauCalmes(e) {
    if (!e.programme || !e.calme || !e.futur) return '';
    return e.reporte
      ? `<div class="k-banner k-banner--info">${ic('clock')}<div class="k-banner__text">${heureLue(e.demandee)} tombe dans les heures calmes. Les messages partiront le ${dateLongue(e.date)} à ${heureLue(e.heure)}.</div></div>`
      : `<div class="k-banner k-banner--warning">${ic('exclamation-triangle')}<div class="k-banner__text">À ${heureLue(e.demandee)}, vos contacts recevront le message pendant les heures calmes, entre 21 h et 9 h.</div></div>`;
  }
  // [P9] L'état de la campagne une fois confirmée, en tête du récapitulatif
  function bandeauBilan(e, c) {
    if (etat.statut === 'programmee') {
      return `<div class="k-banner k-banner--success">${ic('check-circle')}<div class="k-banner__text"><span class="k-banner__title">Campagne programmée.</span> Elle partira le ${e.long} vers ${contacts(c.destinataires)}. Vous pouvez la modifier ou l'annuler jusqu'à l'envoi.</div><div class="k-banner__actions"><button type="button" class="k-button k-button--outline k-button--sm" data-cn-annuler>Annuler la programmation</button></div></div>`;
    }
    if (etat.statut === 'envoi') {
      return `<div class="k-banner k-banner--success">${ic('check-circle')}<div class="k-banner__text"><span class="k-banner__title">Envoi en cours.</span> ${milliers(c.messages)} messages partent vers ${entre(esc(audience().nom))}. Les résultats arrivent dans la page Campagnes au fil des lectures.</div></div>`;
    }
    return '';
  }
  function poser(selecteur, html) { $$(selecteur).forEach((b) => { b.innerHTML = html; b.hidden = !html; }); }

  function mettreAJour() {
    const a = audience(), m = modele(), e = envoi(), c = compte(), s = SOURCES[a.source];
    // [P9] une campagne programmée dont on défait un réglage (date passée, variable vidée, « Maintenant ») redevient un brouillon
    if (etat.statut === 'programmee' && (!e.ok || !e.differe || erreur(1) || erreur(2))) etat.statut = 'brouillon';
    const nom = etat.nom.trim() || 'Campagne sans nom', brouillon = etat.statut === 'brouillon';

    // [P2] barre : nom, statut, étapes, bouton principal
    $('[data-cn-titre]').textContent = nom;
    const badge = $('[data-cn-statut]'); badge.className = 'k-badge' + STATUTS[etat.statut][0]; badge.textContent = STATUTS[etat.statut][1];
    $$('[data-cn-etapes] [data-cn-aller]').forEach((b) => {
      const i = Number(b.dataset.cnAller), ouverte = i === etat.etape;
      const faite = !ouverte && !erreur(i) && (i < etat.atteinte || !brouillon);
      if (ouverte) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      b.toggleAttribute('data-done', faite);
      $('.k-steps__num', b).innerHTML = faite ? ic('check', true) : String(i + 1);
    });
    const suivant = $('[data-cn-suivant]');
    suivant.hidden = !brouillon; $('[data-cn-fini]').hidden = brouillon;
    suivant.innerHTML = etat.etape < 3 ? 'Continuer' : e.differe ? ic('calendar') + 'Programmer' : ic('paper-airplane') + 'Envoyer';

    // [P4] pied du tableau : le calcul pour l'audience choisie
    $('[data-cn-audience-pied]').textContent = `${a.nom} : ${milliers(c.destinataires)} destinataires, ${milliers(c.ecartes)} non abonnés laissés de côté`;

    // [P6] envoi
    $('[data-cn-programme]').hidden = !e.programme;
    const lue = $('[data-cn-date-lue]');
    lue.hidden = !(e.programme && e.futur);
    if (!lue.hidden) lue.textContent = `${majuscule(dateLongue(etat.date))} à ${heureLue(etat.heure)}, ${dans(etat.date)}.`;
    poser('[data-cn-calmes-info]', bandeauCalmes(e));
    poser('[data-cn-forfait]', bandeauForfait(e, c));
    montrerErreurs();

    // [P8] aperçu et résumé
    $('[data-cn-a-modele]').textContent = m.nom;
    $('[data-cn-apercu]').innerHTML = apercu(m, e);
    $('[data-cn-r="destinataires"]').textContent = milliers(c.destinataires);
    $('[data-cn-r="detail"]').textContent = `destinataires, sur ${contacts(a.contacts)}`;
    $('[data-cn-r="audience"]').textContent = a.nom;
    $('[data-cn-r="envoi"]').textContent = e.court;
    $('[data-cn-r="cout"]').textContent = euros(c.cout);

    // [P7] récapitulatif
    const mouvante = a.source !== 'liste' && e.differe;
    $('[data-cn-recap="audience"]').innerHTML = lignes([
      ['Audience', esc(a.nom)], ['Type', s.nom], ['Contacts', milliers(a.contacts)],
      ['Recevront le message', `<b>${milliers(c.destinataires)}</b> abonnés`], ['Laissés de côté', `${milliers(c.ecartes)} non abonnés`]
    ].concat(mouvante ? [['À savoir', 'L\'audience est recalculée au moment de l\'envoi : le nombre peut bouger d\'ici là.']] : []));
    $('[data-cn-recap="message"]').innerHTML = lignes([['Modèle', esc(m.nom)], ['Catégorie', 'Marketing, validé par Meta']].concat(m.variables.map((v) => (v.type === 'contact'
      ? [v.nom, `${SOURCES_PRENOM[etat.prenom.source]}${etat.prenom.repli.trim() ? ', sinon ' + entre(esc(etat.prenom.repli.trim())) : ''}`]
      : [esc(v.nom), esc(etat.valeurs[m.id][v.cle].trim()) || 'À remplir'])), [[m.boutons.length > 1 ? 'Boutons' : 'Bouton', m.boutons.map((b) => esc(b[0])).join(', ')]]));
    $('[data-cn-recap="envoi"]').innerHTML = lignes([['Nom interne', esc(nom)], ['Départ', e.ok ? (e.differe ? majuscule(e.long) : 'Maintenant, dès la confirmation') : 'Date à choisir']]
      .concat(e.differe && e.ok ? [['Fuseau', 'Heure de Paris']] : [], e.reporte && e.ok ? [['Heure demandée', `${heureLue(e.demandee)}, reportée par les heures calmes`]] : [],
        [['Heures calmes', etat.calmes ? 'Respectées, de 21 h à 9 h' : 'Non respectées']]));
    $('[data-cn-recap="cout"]').innerHTML = lignes([['Messages', milliers(c.messages)], ['Prix par message', euros(PRIX)], ['Total estimé', `<b>${euros(c.cout)}</b>`]]);
    poser('[data-cn-bilan]', bandeauBilan(e, c));
    // [P9] une campagne partie ne se modifie plus
    $$('[data-cn-etape]').forEach((x) => { x.toggleAttribute('inert', etat.statut === 'envoi' && x.dataset.cnEtape !== '3'); });
    $$('[data-cn-modifier]').forEach((b) => { b.hidden = etat.statut === 'envoi'; });
  }

  // ---------------------------------------------------------------- [P9] confirmation
  function demanderConfirmation() {
    if (!aller(3)) return;   // une étape incomplète : on y est ramené
    const a = audience(), m = modele(), e = envoi(), c = compte(), nom = entre(esc(etat.nom.trim()));
    $('[data-cn-c="titre"]').textContent = e.differe ? 'Programmer cette campagne ?' : 'Envoyer cette campagne maintenant ?';
    $('[data-cn-c="phrase"]').innerHTML = e.differe
      ? `${nom} partira le ${e.long} vers <b>${contacts(c.destinataires)}</b>. Vous pourrez l'annuler jusqu'à l'envoi.`
      : `${nom} part tout de suite vers <b>${contacts(c.destinataires)}</b>. Un envoi lancé ne se rattrape pas.`;
    $('[data-cn-c="details"]').innerHTML = lignes([
      ['Audience', `${esc(a.nom)}, ${milliers(c.destinataires)} abonnés sur ${contacts(a.contacts)}`],
      ['Modèle', esc(m.nom)], ['Messages', milliers(c.messages)], ['Coût estimé', euros(c.cout)]
    ]);
    $('[data-cn-confirmer]').innerHTML = e.differe ? `${ic('calendar')}Programmer pour ${contacts(c.destinataires)}` : `${ic('paper-airplane')}Envoyer à ${contacts(c.destinataires)}`;
    KanalDS.modal.open('cn-confirmer');
  }
  function remettreEnBrouillon() {
    etat.statut = 'brouillon'; mettreAJour();
    KanalDS.toast('Programmation annulée : la campagne est de nouveau un brouillon');
  }
  $('[data-cn-confirmer]').addEventListener('click', () => {
    const e = envoi(), c = compte();
    KanalDS.modal.close('cn-confirmer');
    etat.statut = e.differe ? 'programmee' : 'envoi';
    mettreAJour();
    if (e.differe) KanalDS.toast(`Campagne programmée pour le ${e.court}`, { tone: 'success', action: { label: 'Annuler', onClick: remettreEnBrouillon } });
    else KanalDS.toast(`Campagne envoyée à ${contacts(c.destinataires)}`, { tone: 'success' });
  });

  // ---------------------------------------------------------------- écoutes
  // [P2] [P3] Le bouton principal, les étapes de la barre, les « Modifier » du récapitulatif
  $('[data-cn-suivant]').addEventListener('click', () => {
    if (etat.etape < 3) { essai[etat.etape] = true; aller(etat.etape + 1); } else demanderConfirmation();
  });
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-cn-aller]');
    if (b) aller(Number(b.dataset.cnAller));
    if (ev.target.closest('[data-cn-annuler]')) remettreEnBrouillon();
  });

  // [P4] Audience : familles, recherche, choix (la ligne entière se clique)
  $('[data-cn-familles]').addEventListener('k:change', (ev) => { etat.famille = ev.detail.item.dataset.famille; rendreAudiences(); });
  $('[data-cn-recherche]').addEventListener('input', (ev) => { etat.q = ev.target.value.trim(); rendreAudiences(); });
  $('[data-cn-audiences]').addEventListener('click', (ev) => {
    const tr = ev.target.closest('[data-cn-audience]'); if (tr) choisirAudience(tr.dataset.cnAudience);
  });
  $('[data-cn-audiences]').addEventListener('change', (ev) => { if (ev.target.name === 'cn-audience') choisirAudience(ev.target.value); });

  // [P5] Message : modèle, variables
  $('[data-cn-modeles]').addEventListener('change', (ev) => { etat.modele = ev.target.value; essai[1] = false; rendreVariables(); mettreAJour(); });
  $('[data-cn-variables]').addEventListener('input', (ev) => {
    const c = ev.target;
    if (c.dataset.cnVariable) etat.valeurs[etat.modele][c.dataset.cnVariable] = c.value;
    if (c.dataset.cnPrenom) etat.prenom[c.dataset.cnPrenom] = c.value;
    mettreAJour();
  });

  // [P6] Envoi : moment, date et heure, heures calmes, nom
  $('[data-cn-quand]').addEventListener('change', (ev) => { etat.quand = ev.target.value; mettreAJour(); });
  $('[data-cn-date]').addEventListener('input', (ev) => { etat.date = ev.target.value; mettreAJour(); });
  $('[data-cn-heure]').addEventListener('input', (ev) => { etat.heure = ev.target.value; mettreAJour(); });
  $('[data-cn-calmes]').addEventListener('change', (ev) => { etat.calmes = ev.target.checked; mettreAJour(); });
  $('[data-cn-nom]').addEventListener('input', (ev) => { etat.nom = ev.target.value; mettreAJour(); });

  // [P10] Envoyer un test
  $('[data-cn-test]').addEventListener('submit', (ev) => {
    ev.preventDefault();
    KanalDS.modal.close('cn-tester');
    KanalDS.toast(`Test envoyé à ${$('#cn-test-num').value.split(' · ')[0]}`, { tone: 'success' });
  });

  // ---------------------------------------------------------------- départ
  rendreAudiences(); rendreModeles(); rendreVariables();
  // Pour montrer une étape précise : campagne-nouvelle.html#message, #envoi ou #recapitulatif
  const depart = { '#message': 1, '#envoi': 2, '#recapitulatif': 3 }[window.location.hash] || 0;
  etat.atteinte = depart;
  aller(depart);
})();
