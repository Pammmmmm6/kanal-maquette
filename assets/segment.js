/* ==========================================================================
   Éditeur de segment dans le design system. Script de la page segment.html.
   Repères [S1]…[S9] : voir les notes en tête de la page.

   Un segment est fait de groupes de conditions. Dans un groupe, les conditions
   se relient par « ou » ; les groupes entre eux, par « et » (ou par « ou », au
   choix). L'aperçu à droite se recalcule à chaque changement.
   Maquette : le nombre de contacts vient d'une part estimée par condition
   (PROPRIETES[..].part). Dans l'app, c'est l'API qui compte.
   ========================================================================== */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const F = ' ';   // espace fine insécable
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const milliers = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, F);
  const ic = (nom, micro) => `<k-icon name="${nom}"${micro ? ' set="micro"' : ''}></k-icon>`;
  const TOTAL = 12480;

  // ---------------------------------------------------------------- [S4] ce sur quoi on peut filtrer
  // Trois familles. Chaque propriété dit ses opérateurs, la forme de sa valeur, sa phrase, et la part des contacts qu'elle garde.
  const FAMILLES = { profil: 'Propriétés du contact', liste: 'Appartenance à une liste', engagement: 'Engagement' };
  const LISTES = { 'Meilleurs clients': 845, 'Black Friday 2026': 3210, 'Abonnés à la newsletter': 9137 };
  const PAYS = { 'France': 0.86, 'Belgique': 0.10, 'Suisse': 0.04, 'France, Belgique': 0.96 };
  const PROPRIETES = {
    depense:   { famille: 'profil', nom: 'Total dépensé', ops: { sup: 'est supérieur à', inf: 'est inférieur à' }, valeur: 'euros', defaut: 200,
                 phrase: (r) => `a dépensé ${r.op === 'sup' ? 'plus' : 'moins'} de ${r.val}${F}€`, part: (r) => { const p = Math.min(0.9, 15.124 / Math.max(1, r.val)); return r.op === 'sup' ? p : 1 - p; } },
    commandes: { famille: 'profil', nom: 'Nombre de commandes', ops: { egal: 'est égal à', min: 'est au moins' }, valeur: 'nombre', defaut: 0,
                 phrase: (r) => (r.op === 'egal' ? (+r.val === 0 ? 'n\'a jamais commandé' : `a commandé ${r.val} fois`) : `a commandé au moins ${r.val} fois`),
                 part: (r) => { const v = +r.val; return r.op === 'egal' ? (v === 0 ? 0.39 : 0.37 / v) : (v <= 0 ? 1 : 0.61 / v); } },
    marketing: { famille: 'profil', nom: 'Accepte le marketing', ops: { est: 'est' }, valeur: { Oui: 'Oui', Non: 'Non' }, defaut: 'Oui',
                 phrase: (r) => (r.val === 'Oui' ? 'accepte le marketing' : 'n\'accepte pas le marketing'), part: (r) => (r.val === 'Oui' ? 0.9327 : 0.0673) },
    pays:      { famille: 'profil', nom: 'Pays', ops: { dans: 'est l\'un de', hors: 'n\'est pas' }, valeur: Object.keys(PAYS).reduce((o, k) => (o[k] = k, o), {}), defaut: 'France, Belgique',
                 phrase: (r) => `${r.op === 'dans' ? 'vit en' : 'ne vit pas en'} ${r.val.replace(', ', ' ou en ')}`, part: (r) => (r.op === 'dans' ? PAYS[r.val] : 1 - PAYS[r.val]) },
    liste:     { famille: 'liste', nom: 'Le contact', ops: { dans: 'fait partie de', hors: 'ne fait pas partie de' }, valeur: Object.keys(LISTES).reduce((o, k) => (o[k] = k, o), {}), defaut: 'Black Friday 2026',
                 phrase: (r) => `${r.op === 'dans' ? 'fait partie de' : 'ne fait pas partie de'} « ${r.val} »`, part: (r) => (r.op === 'dans' ? LISTES[r.val] / TOTAL : 1 - LISTES[r.val] / TOTAL) },
    lu:        { famille: 'engagement', nom: 'A lu un message WhatsApp', ops: { derniers: 'dans les derniers', pas: 'pas depuis' }, valeur: 'jours', defaut: 30,
                 phrase: (r) => (r.op === 'derniers' ? `a lu un message dans les ${r.val} derniers jours` : `n'a rien lu depuis ${r.val} jours`), part: (r) => { const p = Math.min(0.8, 0.079 * Math.sqrt(+r.val || 1)); return r.op === 'derniers' ? p : 1 - p; } },
    clic:      { famille: 'engagement', nom: 'A cliqué un lien', ops: { derniers: 'dans les derniers', pas: 'pas depuis' }, valeur: 'jours', defaut: 30,
                 phrase: (r) => (r.op === 'derniers' ? `a cliqué un lien dans les ${r.val} derniers jours` : `n'a rien cliqué depuis ${r.val} jours`), part: (r) => { const p = Math.min(0.5, 0.031 * Math.sqrt(+r.val || 1)); return r.op === 'derniers' ? p : 1 - p; } },
    panier:    { famille: 'engagement', nom: 'A abandonné un panier', ops: { derniers: 'dans les derniers' }, valeur: 'jours', defaut: 7,
                 phrase: (r) => `a abandonné un panier dans les ${r.val} derniers jours`, part: (r) => Math.min(0.4, 0.0341 * Math.sqrt(+r.val || 1)) }
  };
  const premiere = (famille) => Object.keys(PROPRIETES).find((k) => PROPRIETES[k].famille === famille);
  const regle = (prop) => ({ prop, op: Object.keys(PROPRIETES[prop].ops)[0], val: PROPRIETES[prop].defaut });

  // [S1] Le segment ouvert. « ?nouveau » dans l'adresse : un segment vide, à nommer.
  const nouveau = location.search.includes('nouveau');
  const segment = nouveau
    ? { nom: '', mode: 'tous', exclure24h: false, groupes: [{ famille: 'profil', regles: [regle('commandes')] }] }
    : { nom: 'Meilleurs clients', mode: 'tous', exclure24h: false, groupes: [
        { famille: 'profil', regles: [regle('depense')] },
        { famille: 'profil', regles: [regle('marketing')] },
        { famille: 'profil', regles: [regle('pays')] }
      ] };
  let modifie = nouveau;

  // ---------------------------------------------------------------- [S6] le calcul de l'aperçu
  // Dans un groupe, « ou » : on garde ceux qui passent au moins une condition. Entre groupes : « et » ou « ou ».
  const partGroupe = (g) => 1 - g.regles.reduce((p, r) => p * (1 - PROPRIETES[r.prop].part(r)), 1);
  function calculer() {
    const parts = segment.groupes.map(partGroupe);
    let cumul = segment.mode === 'tous' ? 1 : 0;
    const etapes = parts.map((p, i) => { cumul = segment.mode === 'tous' ? cumul * p : 1 - (1 - cumul) * (1 - p); return { seul: Math.round(TOTAL * p), apres: Math.round(TOTAL * cumul), i }; });
    const avant = etapes.length ? etapes[etapes.length - 1].apres : TOTAL;
    // Toujours exclus : les désabonnés (déjà écartés si une condition demande l'accord marketing), et au choix ceux écrits depuis moins de 24 h
    const marketing = segment.groupes.some((g) => g.regles.some((r) => r.prop === 'marketing' && r.val === 'Oui'));
    const exclus = (marketing ? 0 : Math.round(48 * avant / TOTAL)) + (segment.exclure24h ? Math.round(38 * avant / TOTAL) : 0);
    return { etapes, exclus, membres: Math.max(0, avant - exclus) };
  }
  const phraseGroupe = (g) => g.regles.map((r) => PROPRIETES[r.prop].phrase(r)).join(' ou ');

  // ---------------------------------------------------------------- [S4] les groupes de conditions
  const select = (cles, valeur, attrs) => `<select class="k-select" ${attrs}>${Object.keys(cles).map((k) => `<option value="${esc(k)}"${k === String(valeur) ? ' selected' : ''}>${esc(cles[k])}</option>`).join('')}</select>`;
  function controleValeur(r, g, i) {
    const p = PROPRIETES[r.prop], attrs = `data-sg-val="${g}:${i}" aria-label="Valeur"`;
    if (typeof p.valeur === 'object') return select(p.valeur, r.val, attrs);
    const champ = `<input class="k-input" type="number" min="0" value="${esc(r.val)}" ${attrs}>`;
    return p.valeur === 'euros' ? `<div class="k-input-addon"><span class="k-input-addon__text">€</span>${champ}</div>` : p.valeur === 'jours' ? `<div class="k-rule__unit">${champ}<span>jours</span></div>` : champ;
  }
  function htmlGroupe(g, gi, calc) {
    const proprietes = Object.keys(PROPRIETES).filter((k) => PROPRIETES[k].famille === g.famille).reduce((o, k) => (o[k] = PROPRIETES[k].nom, o), {});
    return `<div class="k-card k-rules" data-sg-groupe="${gi}">
      <div class="k-rules__head">
        <span class="k-count k-count--accent">${gi + 1}</span>
        ${select(FAMILLES, g.famille, `data-sg-famille="${gi}" aria-label="Famille de conditions du groupe ${gi + 1}"`)}
        <span class="k-rules__count">${ic('users')}${milliers(calc.etapes[gi].seul)} correspondent</span>
        <button type="button" class="k-button k-button--ghost k-button--icon k-button--sm" aria-label="Dupliquer le groupe ${gi + 1}" data-sg-dupliquer="${gi}" data-k-tooltip="Dupliquer le groupe">${ic('document-duplicate')}</button>
        <button type="button" class="k-button k-button--ghost k-button--icon k-button--sm" aria-label="Supprimer le groupe ${gi + 1}" data-sg-supprimer="${gi}" data-k-tooltip="Supprimer le groupe" ${segment.groupes.length < 2 ? 'disabled' : ''}>${ic('trash')}</button>
      </div>
      ${g.regles.map((r, ri) => `<div class="k-rule">
        <span class="k-rule__mot">${ri ? 'ou' : 'Où'}</span>
        ${select(proprietes, r.prop, `data-sg-prop="${gi}:${ri}" aria-label="Propriété"`)}
        ${select(PROPRIETES[r.prop].ops, r.op, `data-sg-op="${gi}:${ri}" aria-label="Opérateur"`)}
        ${controleValeur(r, gi, ri)}
        <button type="button" class="k-button k-button--ghost k-button--icon k-button--sm" aria-label="Retirer cette condition" data-sg-retirer="${gi}:${ri}" data-k-tooltip="Retirer" ${g.regles.length < 2 ? 'disabled' : ''}>${ic('x-mark', true)}</button>
      </div>`).join('')}
      <div><button type="button" class="k-button k-button--ghost k-button--sm" data-sg-ou="${gi}">${ic('plus', true)}Ajouter « ou »</button></div>
    </div>`;
  }
  function rendre(garderFocus) {
    const calc = calculer(), liaison = segment.mode === 'tous' ? 'ET' : 'OU';
    const focus = garderFocus && document.activeElement && Object.keys(document.activeElement.dataset || {}).filter((k) => k.startsWith('sg'))[0];
    const cle = focus ? `[data-${focus.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}="${document.activeElement.dataset[focus]}"]` : null;
    $('[data-sg-groupes]').innerHTML = segment.groupes.map((g, i) => (i ? `<div class="k-rules__join"><span class="k-badge k-badge--solid k-badge--neutral">${liaison}</span></div>` : '') + htmlGroupe(g, i, calc)).join('');
    if (cle) { const el = $(cle); if (el) el.focus(); }
    // [S3] La phrase qui résume le segment
    const liaisonTexte = segment.mode === 'tous' ? ' · et ' : ' · ou ';
    $('[data-sg-resume]').textContent = 'Le contact ' + segment.groupes.map(phraseGroupe).join(liaisonTexte) + '.';
    // [S6] L'aperçu
    $('[data-sg-membres]').textContent = milliers(calc.membres);
    $('[data-sg-part]').textContent = `${(calc.membres / TOTAL * 100).toFixed(1).replace('.', ',')}${F}% de vos ${milliers(TOTAL)} contacts`;
    const ligne = (nom, valeur, ecart, part) => `<li class="k-bars__row" style="--k-value:${Math.max(0, part).toFixed(3)}"><span class="k-bars__label">${esc(nom)}</span><span class="k-bars__bar"><span></span></span><span class="k-bars__value">${milliers(valeur)}</span><span class="k-bars__rate">${ecart}</span></li>`;
    let precedent = TOTAL;
    $('[data-sg-entonnoir]').innerHTML = ligne('Tous les contacts', TOTAL, '', 1)
      + calc.etapes.map((e, i) => { const ecart = e.apres - precedent; precedent = e.apres; return ligne(`${i + 1} · ${phraseGroupe(segment.groupes[i])}`, e.apres, (ecart > 0 ? '+' : '−') + milliers(Math.abs(ecart)), e.apres / TOTAL); }).join('')
      + ligne('Exclusions', calc.membres, '−' + milliers(calc.exclus), calc.membres / TOTAL);
    $('[data-sg-voir]').textContent = `Voir les ${milliers(calc.membres)} membres`;
    $('[data-sg-envoyer]').innerHTML = `${ic('paper-airplane')}Envoyer à ${milliers(calc.membres)} contacts`;
    $('[data-sg-exemples-n]').textContent = `${Math.min(4, calc.membres)} sur ${milliers(calc.membres)}`;
    $('[data-sg-exemples]').hidden = !calc.membres; $('[data-sg-vide]').hidden = !!calc.membres;
    // [S2] La barre : nom, modifications, enregistrer
    $('[data-sg-modifie]').hidden = !modifie;
    const ok = $('[data-sg-enregistrer]'); ok.disabled = !modifie || !$('[data-sg-nom]').value.trim(); ok.textContent = modifie ? (nouveau ? 'Créer le segment' : 'Enregistrer') : 'Enregistré';
  }
  const changer = (garderFocus) => { modifie = true; rendre(garderFocus); };

  // ---------------------------------------------------------------- [S4] [S5] modifier les groupes
  const zone = $('[data-sg-groupes]');
  const ou = (cle) => cle.split(':').map(Number);
  zone.addEventListener('change', (e) => {
    const d = e.target.dataset;
    if (d.sgFamille != null) { const g = segment.groupes[+d.sgFamille]; g.famille = e.target.value; g.regles = [regle(premiere(g.famille))]; }
    else if (d.sgProp) { const [g, r] = ou(d.sgProp); segment.groupes[g].regles[r] = regle(e.target.value); }
    else if (d.sgOp) { const [g, r] = ou(d.sgOp); segment.groupes[g].regles[r].op = e.target.value; }
    else if (d.sgVal) { const [g, r] = ou(d.sgVal); segment.groupes[g].regles[r].val = e.target.type === 'number' ? Math.max(0, +e.target.value || 0) : e.target.value; }
    else return;
    changer(true);
  });
  zone.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const d = b.dataset;
    if (d.sgOu != null) { const g = segment.groupes[+d.sgOu]; g.regles.push(regle(premiere(g.famille))); }
    else if (d.sgRetirer) { const [g, r] = ou(d.sgRetirer); segment.groupes[g].regles.splice(r, 1); }
    else if (d.sgDupliquer != null) segment.groupes.splice(+d.sgDupliquer + 1, 0, JSON.parse(JSON.stringify(segment.groupes[+d.sgDupliquer])));
    else if (d.sgSupprimer != null) segment.groupes.splice(+d.sgSupprimer, 1);
    else return;
    changer();
  });
  $('[data-sg-ajouter]').addEventListener('click', () => { segment.groupes.push({ famille: 'engagement', regles: [regle('lu')] }); changer(); });
  $('[data-sg-mode]').addEventListener('k:change', (e) => { segment.mode = e.detail.item.dataset.mode; changer(); });
  $('[data-sg-24h]').addEventListener('change', (e) => { segment.exclure24h = e.target.checked; changer(); });

  // ---------------------------------------------------------------- [S7] décrire le segment à l'agent IA
  // On écrit ce qu'on cherche ; l'agent propose les groupes. Ici, une réponse toute faite.
  const lumi = $('[data-sg-lumi]');
  lumi.addEventListener('submit', (e) => {
    e.preventDefault();
    segment.mode = 'tous';
    segment.groupes = [
      { famille: 'profil', regles: [Object.assign(regle('commandes'), { op: 'min', val: 1 })] },
      { famille: 'engagement', regles: [Object.assign(regle('lu'), { op: 'pas', val: 60 }), Object.assign(regle('clic'), { op: 'pas', val: 60 })] }
    ];
    document.getElementById('sg-lumi').hidePopover(); lumi.reset();
    KanalDS.refresh($('[data-sg-mode]')); changer();
    KanalDS.toast('Lumi a proposé deux groupes : vérifiez-les avant d\'enregistrer');
  });

  // ---------------------------------------------------------------- [S2] nom, enregistrer, annuler
  const nom = $('[data-sg-nom]');
  nom.value = segment.nom;
  nom.addEventListener('input', () => { modifie = true; rendre(); });
  $('[data-sg-enregistrer]').addEventListener('click', () => {
    modifie = false; rendre();
    KanalDS.toast(nouveau ? `Segment « ${nom.value.trim()} » créé` : 'Segment enregistré : il se recalcule', { tone: 'success' });
  });

  rendre();
  if (nouveau) nom.focus();
})();
