/* ==========================================================================
   Kanal — design system · COMPORTEMENTS                            v1.0.0
   --------------------------------------------------------------------------
   Le strict nécessaire pour que les composants vivent dans une page statique.
   Dans l'app (Nuxt), ces comportements viennent des composants Vue : ce
   fichier sert de spécification, pas de dépendance.

   Déclaratif, par attributs :
     <k-icon name="inbox" [set="micro"] [size="16"]>       icône pleine
     data-k-menu="id"            ouvre le menu ou le popover #id sous le bouton
     data-k-placement="bottom-end|top-start|right-start…"
     data-k-open="id"            ouvre la modale <dialog id>
     data-k-close                ferme la modale parente
     data-k-tooltip="Texte"      infobulle (data-k-kbd="⌘K" pour un raccourci)
     data-k-rail-pin             l'épingle de la barre de navigation : la garde ouverte, et s'en souvient
     data-k-announce-toggle      montre ou cache le bandeau d'annonce (.k-announce), et s'en souvient
     data-k-toast="Texte"        toast au clic (data-k-toast-action="Annuler")
     data-k-copy="texte"         copie et confirme par un toast
     data-k-dismiss              retire l'ancêtre [data-k-dismissible]

   En script :
     KanalDS.toast('Enregistré', { tone: 'success', action: { label: 'Annuler', onClick } })
     KanalDS.modal.open('id', { instant: true })   // instant : ouvert au clavier
     KanalDS.init(racine)                          // après un ajout de balisage

   Règle de mouvement appliquée ici : une ouverture déclenchée au clavier
   pose [data-instant] et ne s'anime pas.
   ========================================================================== */
(function () {
  'use strict';
  /* Bandeau d'annonce : l'état est posé sur la racine avant le premier affichage, pour que rien ne saute */
  try { if (localStorage.getItem('kanal-ds-annonce') === '1') document.documentElement.setAttribute('data-k-announce', ''); } catch (e) { /* stockage indisponible */ }

  /* ---- MAQUETTE SEULEMENT : pas de page périmée -------------------------------------
     Un serveur de fichiers sans en-tête de cache laisse le navigateur ressortir une page HTML d'hier, avec ses
     feuilles de style et ses scripts d'hier : on navigue alors entre deux versions de la maquette, et une
     transition sur deux manque. Le serveur du dépôt (tools/serveur.py) règle le problème à la source. En renfort,
     chaque page redemande au réseau, une fois par version, les pages vers lesquelles elle mène : leur copie en
     cache est remplacée. Rien de tout cela ne concerne l'app. */
  var VERSION_MAQUETTE = (document.currentScript && (document.currentScript.src.split('?v=')[1] || '')) || '';
  function renouvelerCache() {
    try {
      var vues = {}, ici = location.pathname, cle = 'kanal-ds-cache:' + ici;   /* une fois par page et par version */
      if (location.protocol.indexOf('http') !== 0 || localStorage.getItem(cle) === VERSION_MAQUETTE) return;
      Array.prototype.forEach.call(document.querySelectorAll('a[href]'), function (a) {
        var u; try { u = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
        if (u.origin !== location.origin || !/\.html$/.test(u.pathname) || u.pathname === ici) return;
        vues[u.pathname] = true; vues[u.pathname + u.search] = true;
      });
      Object.keys(vues).forEach(function (chemin) { fetch(chemin, { cache: 'reload' }).catch(function () {}); });
      localStorage.setItem(cle, VERSION_MAQUETTE);
    } catch (err) { /* stockage ou réseau indisponible */ }
  }
  window.addEventListener('load', function () { setTimeout(renouvelerCache, 400); });

  /* ---- D'une page à l'autre ------------------------------------------------------
     La barre de navigation doit être, dès la première image de la nouvelle page, dans l'état où on l'a quittée :
     épinglée, ou ouverte au survol. Sinon elle se replie puis se rouvre à chaque changement de page.
     pagereveal arrive juste avant cette première image ; pageswap, juste avant de quitter la page. */
  var CLE_OUVERTE = 'kanal-ds-rail-ouverte';
  function barre() { return document.querySelector('.k-shell > .k-rail'); }
  function retenirBarre() {
    var rail = barre();
    try {
      if (rail && rail.hasAttribute('data-open') && !rail.hasAttribute('data-pinned')) sessionStorage.setItem(CLE_OUVERTE, String(Date.now()));
      else sessionStorage.removeItem(CLE_OUVERTE);
    } catch (err) { /* stockage indisponible */ }
  }
  window.addEventListener('pageswap', retenirBarre);
  window.addEventListener('pagehide', retenirBarre);
  function reprendreBarre() {
    var rail = barre(); if (!rail || rail.__reprise !== undefined) return;
    rail.__reprise = false;
    try {
      if (localStorage.getItem('kanal-ds-rail') === 'epinglee') { rail.setAttribute('data-instant', ''); rail.setAttribute('data-pinned', ''); }
      else if (Date.now() - (+sessionStorage.getItem(CLE_OUVERTE) || 0) < 4000) { rail.setAttribute('data-instant', ''); rail.setAttribute('data-open', ''); rail.__reprise = true; }
      sessionStorage.removeItem(CLE_OUVERTE);
    } catch (err) { /* stockage indisponible */ }
    if (rail.hasAttribute('data-instant')) requestAnimationFrame(function () { requestAnimationFrame(function () { rail.removeAttribute('data-instant'); }); });
  }
  /* Le sens d'un changement de page, comme dans une pile de navigation mobile :
       'avant'   on entre dans un objet depuis sa liste : sa page arrive par la droite ;
       'arriere' on en revient (flèche de retour, retour du navigateur) : elle repart vers la droite ;
       ''        deux pages de même niveau : simple fondu.
     Ici, la table dit de quelle liste dépend chaque page d'objet. Dans l'app, c'est la profondeur de la route. */
  var PARENTS = {
    'automatisation.html': 'automatisations.html', 'campagne.html': 'exemple.html', 'campagne-nouvelle.html': 'exemple.html',
    'lien.html': 'liens.html', 'liste.html': 'listes.html', 'segment.html': 'listes.html'
  };
  function nomPage(url) { try { return new URL(url, location.href).pathname.split('/').pop() || 'index.html'; } catch (err) { return ''; } }
  function sensDe(activation) {
    if (!activation || !activation.from || !activation.entry) return '';
    var de = nomPage(activation.from.url), vers = nomPage(activation.entry.url);
    if (!de || !vers || de === vers) return '';
    if (!PARENTS[de] && !PARENTS[vers]) return '';                                    /* deux pages de premier niveau */
    if (activation.navigationType === 'traverse') return activation.entry.index < activation.from.index ? 'arriere' : 'avant';
    if (PARENTS[de] === vers) return 'arriere';                                       /* retour à la liste */
    if (PARENTS[vers]) return 'avant';                                                /* on entre dans un objet */
    return '';                                                                        /* on quitte un objet pour une autre section */
  }
  /* Avant de quitter la page : si la transition a un sens, l'îlot prend un nom pour pouvoir glisser */
  window.addEventListener('pageswap', function (e) {
    if (e.viewTransition && sensDe(e.activation)) document.documentElement.setAttribute('data-k-vt', 'page');
  });
  /* Une page rendue par le cache du navigateur ne garde pas ces marques */
  window.addEventListener('pageshow', function (e) { if (e.persisted) { document.documentElement.removeAttribute('data-k-vt'); document.documentElement.removeAttribute('data-k-sens'); } });
  /* Filet : si pagereveal n'existe pas, les marques posées au chargement ne restent pas */
  if (!('onpagereveal' in window)) window.addEventListener('load', function () { if (html.hasAttribute('data-k-sens')) demarquer(); });
  /* Dès la lecture de ce script, avant que la page ne soit dessinée : si elle arrive par un glissement, la racine
     le dit tout de suite. L'îlot porte son nom avant la première image, et la page se dessine au calme
     (data-k-calme : ni entrée de blocs, ni courbe qui se trace), pour arriver complète. */
  var html = document.documentElement;
  function sensActuel() { try { return window.navigation && window.navigation.activation ? sensDe(window.navigation.activation) : ''; } catch (err) { return ''; } }
  function marquer(sens) { html.setAttribute('data-k-vt', 'page'); html.setAttribute('data-k-sens', sens); html.setAttribute('data-k-calme', ''); }
  function demarquer() {
    html.removeAttribute('data-k-vt'); html.removeAttribute('data-k-sens');
    setTimeout(function () { html.removeAttribute('data-k-calme'); }, 1500);   /* après la fin de toute animation d'entrée, pour qu'aucune ne reparte */
  }
  if (sensActuel()) marquer(sensActuel());
  window.addEventListener('pagereveal', function (e) {
    reprendreBarre();
    var sens = sensActuel();
    if (e.viewTransition && sens) { marquer(sens); e.viewTransition.finished.then(demarquer, demarquer); }
    else if (html.hasAttribute('data-k-sens')) demarquer();   /* pas de transition finalement (navigateur plus ancien, page cachée) */
    /* arrivée par une transition : les blocs de la page ne repartent pas de l'invisible (voir k-enter) */
    if (e.viewTransition) {
      var racine = document.documentElement;
      racine.setAttribute('data-k-arrivee', '');
      var finir = function () { setTimeout(function () { racine.removeAttribute('data-k-arrivee'); }, 800); };
      e.viewTransition.finished.then(finir, finir);
    }
  });

  /* ---- Icône ------------------------------------------------------------ */
  var PREFIXE = { micro: 'im' };  /* plein 20 par défaut, plein 16 avec set="micro" */
  if (!customElements.get('k-icon')) {
    customElements.define('k-icon', class extends HTMLElement {
      static get observedAttributes() { return ['name', 'set']; }
      connectedCallback() { this.rendre(); }
      attributeChangedCallback() { if (this.isConnected) this.rendre(); }
      rendre() {
        var nom = this.getAttribute('name');
        if (!nom) return;
        var id = (PREFIXE[this.getAttribute('set')] || 'i') + '-' + nom;
        this.setAttribute('aria-hidden', 'true');
        this.innerHTML = '<svg focusable="false"><use href="#' + id + '"></use></svg>';
      }
    });
  }

  var $$ = function (sel, racine) { return Array.prototype.slice.call((racine || document).querySelectorAll(sel)); };
  var auClavier = function (e) { return e && e.detail === 0; };  /* un clic sans souris : Entrée ou Espace */

  /* ---- Pastille d'un segmenté, barre des onglets ------------------------- */
  var SELECTION = '[aria-selected="true"], [aria-checked="true"]';
  function poserIndicateur(groupe, instant) {
    var marque = groupe.querySelector('.k-segmented__thumb, .k-tabs__bar');
    var actif = groupe.querySelector(SELECTION);
    if (!marque || !actif || !groupe.offsetWidth) return;
    if (instant) groupe.setAttribute('data-instant', '');
    marque.style.setProperty('--_x', actif.offsetLeft + 'px');
    marque.style.setProperty('--_w', actif.offsetWidth + 'px');
    groupe.setAttribute('data-ready', '');
    if (instant) requestAnimationFrame(function () { requestAnimationFrame(function () { groupe.removeAttribute('data-instant'); }); });
  }
  function choisir(groupe, item, instant) {
    var items = $$('.k-segmented__item, .k-tabs__item', groupe);
    var attribut = item.hasAttribute('aria-checked') ? 'aria-checked' : 'aria-selected';
    items.forEach(function (i) {
      i.setAttribute(attribut, i === item ? 'true' : 'false');
      i.tabIndex = i === item ? 0 : -1;
      var panneau = i.getAttribute('aria-controls') && document.getElementById(i.getAttribute('aria-controls'));
      if (panneau) panneau.hidden = i !== item;
    });
    poserIndicateur(groupe, instant);
    groupe.dispatchEvent(new CustomEvent('k:change', { bubbles: true, detail: { value: item.value || item.dataset.value || item.textContent.trim(), item: item } }));
  }
  function preparerGroupe(groupe) {
    if (groupe.__k) return; groupe.__k = true;
    var items = $$('.k-segmented__item, .k-tabs__item', groupe);
    items.forEach(function (i) { i.tabIndex = i.matches(SELECTION) ? 0 : -1; });
    groupe.addEventListener('click', function (e) {
      var item = e.target.closest('.k-segmented__item, .k-tabs__item');
      if (item && !item.matches(SELECTION)) choisir(groupe, item, auClavier(e));
    });
    groupe.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return;
      var liste = $$('.k-segmented__item, .k-tabs__item', groupe);
      var i = liste.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      var n = e.key === 'Home' ? 0 : e.key === 'End' ? liste.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + liste.length) % liste.length;
      liste[n].focus();
      choisir(groupe, liste[n], true);
    });
    if (window.ResizeObserver) new ResizeObserver(function () { poserIndicateur(groupe, true); }).observe(groupe);
    poserIndicateur(groupe, true);
  }

  /* ---- Placement d'un calque (menu, popover, infobulle) ------------------- */
  function placer(calque, ancre, placement, ecart) {
    var a = ancre.getBoundingClientRect();
    var l = calque.offsetWidth, h = calque.offsetHeight;
    var vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
    var p = (placement || 'bottom-start').split('-');
    var cote = p[0], alignement = p[1] || 'center';
    var marge = 8; ecart = ecart == null ? 6 : ecart;
    if (cote === 'bottom' && a.bottom + ecart + h > vh - marge && a.top - ecart - h > marge) cote = 'top';
    else if (cote === 'top' && a.top - ecart - h < marge) cote = 'bottom';
    else if (cote === 'right' && a.right + ecart + l > vw - marge) cote = 'left';
    else if (cote === 'left' && a.left - ecart - l < marge) cote = 'right';
    var x, y;
    if (cote === 'bottom' || cote === 'top') {
      y = cote === 'bottom' ? a.bottom + ecart : a.top - ecart - h;
      x = alignement === 'start' ? a.left : alignement === 'end' ? a.right - l : a.left + a.width / 2 - l / 2;
    } else {
      x = cote === 'right' ? a.right + ecart : a.left - ecart - l;
      y = alignement === 'start' ? a.top : alignement === 'end' ? a.bottom - h : a.top + a.height / 2 - h / 2;
    }
    x = Math.max(marge, Math.min(x, vw - l - marge));
    y = Math.max(marge, Math.min(y, vh - h - marge));
    calque.style.left = Math.round(x) + 'px';
    calque.style.top = Math.round(y) + 'px';
    /* le calque grandit depuis son bouton, pas depuis son centre */
    var ox = Math.round(Math.max(0, Math.min(l, a.left + a.width / 2 - x)));
    var oy = cote === 'top' ? '100%' : cote === 'bottom' ? '0px' : Math.round(Math.max(0, Math.min(h, a.top + a.height / 2 - y))) + 'px';
    calque.style.setProperty('--_origin', (cote === 'left' ? '100%' : cote === 'right' ? '0px' : ox + 'px') + ' ' + oy);
    return cote;
  }

  /* ---- Menu et popover ------------------------------------------------------ */
  var fermeA = new WeakMap();
  function ouvrirMenu(bouton, e) {
    var menu = document.getElementById(bouton.getAttribute('data-k-menu'));
    if (!menu) return;
    if (menu.matches(':popover-open')) { menu.hidePopover(); return; }
    /* le navigateur vient de le fermer en « clic dehors » sur ce même bouton : on ne le rouvre pas */
    if (fermeA.get(menu) && performance.now() - fermeA.get(menu).t < 80 && fermeA.get(menu).bouton === bouton) return;
    var clavier = auClavier(e);
    menu.toggleAttribute('data-instant', clavier);
    menu.__bouton = bouton;
    menu.showPopover();
    placer(menu, bouton, bouton.getAttribute('data-k-placement') || 'bottom-start');
    bouton.setAttribute('aria-expanded', 'true');
    if (clavier) { var premier = menu.querySelector('.k-menu__item:not([aria-disabled="true"]), input, button'); if (premier) premier.focus(); }
  }
  function preparerMenu(menu) {
    if (menu.__k) return; menu.__k = true;
    if (!menu.hasAttribute('popover')) return;
    menu.addEventListener('beforetoggle', function (e) {
      if (e.newState !== 'closed') return;
      fermeA.set(menu, { t: performance.now(), bouton: menu.__bouton });
      if (menu.__bouton) menu.__bouton.setAttribute('aria-expanded', 'false');
    });
    menu.addEventListener('click', function (e) {
      var item = e.target.closest('.k-menu__item');
      if (!item || item.hasAttribute('data-k-keep')) return;
      /* item.parentElement peut manquer : la page a pu redessiner le menu dans son propre écouteur */
      var groupe = item.getAttribute('role') === 'menuitemradio' && item.parentElement ? $$('[role="menuitemradio"]', item.parentElement) : null;
      if (groupe) {
        groupe.forEach(function (g) { g.setAttribute('aria-checked', g === item ? 'true' : 'false'); });
        menu.dispatchEvent(new CustomEvent('k:change', { bubbles: true, detail: { value: item.dataset.value || item.textContent.trim(), item: item } }));
      }
      menu.hidePopover();
    });
    menu.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return;
      if (e.target.closest('.k-menu__form')) return;   /* dans un champ du menu, les flèches sont au champ */
      var items = $$('.k-menu__item:not([aria-disabled="true"])', menu);
      if (!items.length) return;
      e.preventDefault();
      var i = items.indexOf(document.activeElement);
      var n = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : i < 0 ? 0 : (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[n].focus();
    });
  }

  /* ---- Modale et panneau latéral --------------------------------------------- */
  var modal = {
    open: function (id, options) {
      var d = typeof id === 'string' ? document.getElementById(id) : id;
      if (!d || d.open) return;
      d.toggleAttribute('data-instant', !!(options && options.instant));
      d.showModal();
    },
    close: function (id) {
      var d = typeof id === 'string' ? document.getElementById(id) : id;
      if (d && d.open) d.close();
    }
  };
  function preparerModale(d) {
    if (d.__k) return; d.__k = true;
    /* clic sur le voile : on ferme, sauf modale marquée data-k-static (action destructive à confirmer) */
    d.addEventListener('mousedown', function (e) { d.__voile = e.target === d; });
    d.addEventListener('click', function (e) {
      if (e.target === d && d.__voile && !d.hasAttribute('data-k-static')) d.close();
    });
    d.addEventListener('close', function () { d.removeAttribute('data-instant'); });
  }

  /* ---- Infobulle ----------------------------------------------------------------- */
  var bulle, minuteur, derniere = 0, cibleBulle, parSurvol = true, veille = 0, placeBulle = '';
  var pointeurX = -1, pointeurY = -1;   /* où est le pointeur, d'après le dernier événement reçu ; -1 : hors de la fenêtre */
  var cliquee = null;                   /* la cible qu'on vient de cliquer : sa bulle ne revient pas tant qu'on ne l'a pas quittée */
  var tabulation = 0;                   /* date de la dernière touche Tab : une bulle au focus ne vient que du clavier */
  var gel = null;                       /* où l'on vient de cliquer : aucune bulle tant que le pointeur n'a pas quitté cet endroit */
  var ouverteA = 0, garde = 0;          /* quand la bulle s'est ouverte ; minuteur de secours si les images ne tournent pas */
  var DUREE_MAX = 8000;                 /* une bulle est une aide brève : au-delà, elle s'efface d'elle-même */
  /* Une bulle ne tient que tant que sa cible est là, VISIBLE, dans la fenêtre, et réellement sous le pointeur (ou sous
     le focus clavier). On ne se fie pas à :hover : il reste vrai sur une cible qui a glissé ou qu'un panneau a
     emportée sous un pointeur immobile, et c'est ce qui laissait des bulles à l'écran. */
  function estVisible(cible) {
    if (!cible.isConnected) return false;
    var r = cible.getBoundingClientRect();
    if (!r.width && !r.height) return false;
    if (r.bottom <= 0 || r.right <= 0 || r.top >= window.innerHeight || r.left >= window.innerWidth) return false;
    return getComputedStyle(cible).visibility !== 'hidden';
  }
  function sousLePointeur(cible) {
    if (pointeurX < 0) return false;
    var el = document.elementFromPoint(pointeurX, pointeurY);
    return !!el && cible.contains(el);
  }
  function tientEncore(cible, survol) {
    if (!estVisible(cible)) return false;
    return survol ? sousLePointeur(cible) : cible === document.activeElement || cible.contains(document.activeElement);
  }
  function montrerBulle(cible, tout_de_suite) {
    clearTimeout(minuteur);
    var survol = !tout_de_suite;
    var chaud = performance.now() - derniere < 300;  /* une bulle vient de se fermer : la suivante arrive sans délai ni animation */
    minuteur = setTimeout(function () {
      /* le pointeur est peut-être parti sans prévenir (cible retirée, redessinée ou masquée entre-temps) */
      if (!tientEncore(cible, survol)) return;
      if (!bulle) { bulle = document.createElement('div'); bulle.className = 'k-tooltip'; bulle.setAttribute('popover', 'manual'); bulle.setAttribute('role', 'tooltip'); document.body.appendChild(bulle); }
      bulle.textContent = cible.getAttribute('data-k-tooltip');
      var touche = cible.getAttribute('data-k-kbd');
      if (touche) touche.split(' ').forEach(function (t) { var k = document.createElement('span'); k.className = 'k-kbd'; k.textContent = t; bulle.appendChild(k); });
      bulle.toggleAttribute('data-instant', chaud);
      cibleBulle = cible; parSurvol = survol; ouverteA = performance.now();   /* dès maintenant : quoi qu'il arrive ensuite, la bulle a une cible et sera refermée */
      try { if (bulle.matches(':popover-open')) bulle.hidePopover(); bulle.showPopover(); placer(bulle, cible, cible.getAttribute('data-k-tooltip-side') || 'top', 8); }
      catch (err) { cacherBulle(); return; }
      veiller();
    }, tout_de_suite || chaud ? 0 : 400);
  }
  /* Tant qu'une bulle est ouverte, on vérifie à chaque image qu'elle a encore lieu d'être. Les événements de sortie
     ne suffisent pas : aucun n'arrive quand la cible est retirée ou redessinée sous un pointeur immobile, quand un
     raccourci clavier change l'écran, ou quand la cible glisse hors du pointeur. La bulle suit aussi sa cible si
     elle bouge. */
  function controler() {
    if (!cibleBulle) return false;
    if (!tientEncore(cibleBulle, parSurvol)) { cacherBulle(); return false; }
    /* restée trop longtemps (pointeur parti sans qu'aucun événement n'arrive, fenêtre recouverte…) : elle s'efface,
       et ne reviendra que si le pointeur quitte la cible puis y revient */
    if (performance.now() - ouverteA > DUREE_MAX) { cliquee = cibleBulle; cacherBulle(); return false; }
    return true;
  }
  function veiller() {
    cancelAnimationFrame(veille); clearInterval(garde);
    placeBulle = '';
    veille = requestAnimationFrame(function tour() {
      if (!controler()) return;
      var r = cibleBulle.getBoundingClientRect(), place = Math.round(r.left) + ' ' + Math.round(r.top) + ' ' + Math.round(r.width);
      if (placeBulle && place !== placeBulle) placer(bulle, cibleBulle, cibleBulle.getAttribute('data-k-tooltip-side') || 'top', 8);
      placeBulle = place;
      veille = requestAnimationFrame(tour);
    });
    garde = setInterval(controler, 250);   /* le même contrôle, même si le navigateur ne dessine plus d'images */
  }
  /* Fermer : toujours possible, même si la bulle s'est ouverte sans que sa cible ait été retenue */
  function cacherBulle() {
    clearTimeout(minuteur); cancelAnimationFrame(veille); clearInterval(garde);
    var ouverte = false;
    try { ouverte = !!bulle && bulle.matches(':popover-open'); } catch (err) { /* navigateur sans popover */ }
    if (ouverte) { try { bulle.hidePopover(); } catch (err) { /* déjà fermée */ } derniere = performance.now(); }
    cibleBulle = null;
  }

  /* ---- Toast ------------------------------------------------------------------------ */
  var zone;
  function toast(message, options) {
    options = options || {};
    if (!zone) { zone = document.createElement('div'); zone.className = 'k-toasts'; zone.setAttribute('popover', 'manual'); zone.setAttribute('role', 'status'); zone.setAttribute('aria-live', 'polite'); document.body.appendChild(zone); }
    /* on le remontre à chaque fois : il repasse au-dessus d'une modale ouverte entre-temps */
    try { if (zone.matches(':popover-open')) zone.hidePopover(); zone.showPopover(); } catch (err) {}
    var t = document.createElement('div');
    t.className = 'k-toast' + (options.tone ? ' k-toast--' + options.tone : '');
    if (options.tone === 'success') { var i = document.createElement('k-icon'); i.setAttribute('name', 'check-circle'); i.setAttribute('set', 'micro'); t.appendChild(i); }
    var texte = document.createElement('span'); texte.textContent = message; t.appendChild(texte);
    var fin, reste = options.duration || 5000, debut;
    function partir() {
      clearTimeout(fin);
      t.setAttribute('data-leaving', '');
      setTimeout(function () { t.remove(); if (zone && !zone.children.length) { try { zone.hidePopover(); } catch (err) {} } }, 160);
    }
    if (options.action) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'k-toast__action'; b.textContent = options.action.label;
      b.addEventListener('click', function () { if (options.action.onClick) options.action.onClick(); partir(); });
      t.appendChild(b);
    }
    function lancer() { debut = performance.now(); fin = setTimeout(partir, reste); }
    t.addEventListener('pointerenter', function () { clearTimeout(fin); reste -= performance.now() - debut; });
    t.addEventListener('pointerleave', lancer);
    zone.appendChild(t);
    while (zone.children.length > 3) zone.firstElementChild.remove();
    lancer();
    return { close: partir };
  }

  /* ---- Copie ---------------------------------------------------------------------------
     Le presse-papiers moderne est refusé hors https (page ouverte en file://) :
     on retombe sur la sélection d'un champ caché. On ne dit « Copié » que si c'est vrai. */
  function copier(texte) {
    function ancienne() {
      var z = document.createElement('textarea'); z.value = texte; z.setAttribute('readonly', '');
      z.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      (document.querySelector('dialog[open]') || document.body).appendChild(z); z.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (err) {}
      z.remove(); return ok;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(texte).then(function () { return true; }, ancienne);
    return Promise.resolve(ancienne());
  }
  function copierEtDire(texte, message) {
    return copier(texte).then(function (ok) {
      if (ok) toast(message || 'Copié', { tone: 'success', duration: 2000 });
      else toast('Copie impossible ici. Sélectionnez le texte à la main.');
      return ok;
    });
  }

  /* ---- Saisie de plusieurs valeurs ------------------------------------------------------ */
  function creerTag(texte) {
    var tag = document.createElement('span'); tag.className = 'k-tag';
    tag.appendChild(document.createTextNode(texte));
    var b = document.createElement('button'); b.type = 'button'; b.className = 'k-tag__remove'; b.setAttribute('aria-label', 'Retirer ' + texte);
    b.innerHTML = '<k-icon name="x-mark" set="micro"></k-icon>';
    tag.appendChild(b);
    return tag;
  }
  function preparerTagInput(zoneTags) {
    if (zoneTags.__k) return; zoneTags.__k = true;
    var champ = zoneTags.querySelector('input');
    zoneTags.addEventListener('click', function (e) {
      var retirer = e.target.closest('.k-tag__remove');
      if (retirer) retirer.parentElement.remove(); else if (champ) champ.focus();
    });
    if (!champ) return;
    champ.addEventListener('keydown', function (e) {
      var v = champ.value.trim().replace(/,$/, '');
      if ((e.key === 'Enter' || e.key === ',') && v) { e.preventDefault(); zoneTags.insertBefore(creerTag(v), champ); champ.value = ''; }
      else if (e.key === 'Backspace' && !champ.value) { var dernier = champ.previousElementSibling; if (dernier) dernier.remove(); }
    });
  }

  /* ---- Barre de navigation : ouverte au survol, épinglée au clic sur l'épingle -------------- */
  var CLE_RAIL = 'kanal-ds-rail';
  function preparerRail(rail) {
    if (rail.__k) return; rail.__k = true;
    /* hors de la coquille (une démonstration), la barre reste dans l'état que dit son balisage */
    if (!rail.parentElement || !rail.parentElement.classList.contains('k-shell')) return;
    var epingle = rail.querySelector('[data-k-rail-pin]'), minuteur;
    function dire() {
      if (!epingle) return;
      var oui = rail.hasAttribute('data-pinned'), texte = oui ? 'Détacher la navigation' : 'Épingler la navigation';
      epingle.setAttribute('aria-pressed', oui); epingle.setAttribute('aria-label', texte); epingle.setAttribute('data-k-tooltip', texte);
    }
    function ouvrir(instant) {
      clearTimeout(minuteur);
      if (rail.hasAttribute('data-pinned')) return;
      rail.toggleAttribute('data-instant', !!instant);
      rail.setAttribute('data-open', '');
      if (instant) sansAnimation();
    }
    /* on ne referme pas sous le pointeur, ni tant qu'un menu de la barre est ouvert, ni pendant qu'on y navigue au clavier */
    /* data-instant coupe les transitions le temps d'un changement d'état, puis les rend */
    function sansAnimation() {
      rail.setAttribute('data-instant', '');
      requestAnimationFrame(function () { requestAnimationFrame(function () { rail.removeAttribute('data-instant'); }); });
    }
    function fermerSiLibre() {
      var actif = document.activeElement;
      if (rail.matches(':hover') || rail.querySelector('[aria-expanded="true"]')) return;
      if (actif && rail.contains(actif) && actif.matches(':focus-visible')) return;
      rail.removeAttribute('data-open');
    }
    rail.addEventListener('pointerenter', function (e) {
      if (e.pointerType === 'touch') return;
      clearTimeout(minuteur); minuteur = setTimeout(function () { ouvrir(false); }, 140);   /* un passage rapide n'ouvre rien */
    });
    rail.addEventListener('pointerleave', function () { clearTimeout(minuteur); minuteur = setTimeout(fermerSiLibre, 120); });
    rail.addEventListener('focusin', function (e) { if (e.target.matches(':focus-visible')) ouvrir(true); });
    rail.addEventListener('focusout', function () { setTimeout(fermerSiLibre, 0); });
    document.addEventListener('toggle', function (e) {
      if (e.newState === 'closed' && e.target.__bouton && rail.contains(e.target.__bouton)) setTimeout(fermerSiLibre, 0);
    }, true);
    if (epingle) epingle.addEventListener('click', function (e) {
      var oui = !rail.hasAttribute('data-pinned');
      clearTimeout(minuteur);
      /* D'un état à l'autre, la barre garde la même place à l'écran : on change d'état sans transition... */
      rail.setAttribute('data-instant', '');
      rail.toggleAttribute('data-pinned', oui);
      rail.toggleAttribute('data-open', !oui);
      void rail.offsetWidth;
      rail.removeAttribute('data-instant');
      /* ...puis, détachée à la souris, elle se replie tout de suite, même sous le pointeur : elle ne se rouvrira
         que si le pointeur ressort et revient. Au clavier, elle reste ouverte tant que le focus y est. */
      if (!oui && e.detail !== 0) rail.removeAttribute('data-open');
      try { localStorage.setItem(CLE_RAIL, oui ? 'epinglee' : 'repliee'); } catch (err) {}
      dire(); cacherBulle();
      window.dispatchEvent(new Event('resize'));   /* la largeur du contenu vient de changer */
    });
    reprendreBarre();   /* si pagereveal n'est pas passé (navigateur plus ancien) */
    try { if (localStorage.getItem(CLE_RAIL) === 'epinglee' && !rail.hasAttribute('data-pinned')) { sansAnimation(); rail.setAttribute('data-pinned', ''); } } catch (err) {}
    /* Barre reprise ouverte de la page précédente : elle le reste tant que le pointeur est dessus. On ne le sait
       qu'au premier mouvement de la souris ; sans mouvement, on vérifie au bout de 2,5 s. */
    if (rail.__reprise) {
      var attente, verifier = function () {
        document.removeEventListener('pointermove', verifier, true); clearTimeout(attente);
        setTimeout(fermerSiLibre, 60);
      };
      document.addEventListener('pointermove', verifier, true);
      attente = setTimeout(verifier, 2500);
    }
    dire();
  }

  /* ---- Délégation globale ------------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target : e.target.parentElement;
    if (!el) return;
    var b;
    if ((b = el.closest('[data-k-menu]'))) ouvrirMenu(b, e);
    if ((b = el.closest('[data-k-open]'))) modal.open(b.getAttribute('data-k-open'));
    if ((b = el.closest('[data-k-close]'))) { var d = b.closest('dialog'); if (d) d.close(); }
    if ((b = el.closest('[data-k-toast]'))) {
      var action = b.getAttribute('data-k-toast-action');
      toast(b.getAttribute('data-k-toast'), { tone: b.getAttribute('data-k-toast-tone') || undefined, action: action ? { label: action } : undefined });
    }
    if ((b = el.closest('[data-k-copy]'))) {
      copierEtDire(b.getAttribute('data-k-copy'));
    }
    if ((b = el.closest('[data-k-dismiss]'))) { var parent = b.closest('[data-k-dismissible]'); if (parent) parent.remove(); }
    var coque = document.querySelector('.k-shell[data-nav-open]');
    if ((b = el.closest('[data-k-nav-toggle]'))) { coque = document.querySelector('.k-shell'); if (coque) coque.toggleAttribute('data-nav-open'); }
    else if (coque && !el.closest('.k-sidebar')) coque.removeAttribute('data-nav-open');
    if ((b = el.closest('[data-k-aside-toggle]'))) {
      var volet = document.getElementById(b.getAttribute('data-k-aside-toggle'));
      /* fenêtre étroite : le panneau est replié, on l'ouvre par-dessus (data-open). Sinon il est ouvert, on le ferme (data-closed). */
      /* panneau flottant : un seul état, data-open, à toutes les largeurs */
      if (volet && volet.classList.contains('k-aside--float')) { var ouvert = volet.hasAttribute('data-open'); volet.toggleAttribute('data-open', !ouvert); volet.toggleAttribute('data-closed', ouvert); }
      else if (volet) volet.toggleAttribute(window.matchMedia('(max-width: 1399px)').matches ? 'data-open' : 'data-closed');
    }
    if (el.closest('[data-k-announce-toggle]')) {
      /* Le bandeau d'annonce apparaît ou disparaît ; l'îlot et la barre suivent d'un seul mouvement (transition de vue) */
      var racine = document.documentElement, basculer = function () {
        var visible = racine.toggleAttribute('data-k-announce');
        try { localStorage.setItem('kanal-ds-annonce', visible ? '1' : '0'); } catch (err) { /* stockage indisponible */ }
      };
      if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && e.detail !== 0) {
        racine.setAttribute('data-k-vt', 'annonce');   /* l'îlot a un nom le temps de ce mouvement : il descend ou remonte d'un bloc */
        var fini = function () { racine.removeAttribute('data-k-vt'); };
        document.startViewTransition(basculer).finished.then(fini, fini);
      } else basculer();
    }
  });
  var horsFenetre = function () { pointeurX = pointeurY = -1; cliquee = null; gel = null; cacherBulle(); };
  var degele = function (e) { if (gel && Math.abs(e.clientX - gel.x) + Math.abs(e.clientY - gel.y) > 8) gel = null; return !gel; };
  document.addEventListener('pointermove', function (e) {
    pointeurX = e.clientX; pointeurY = e.clientY; degele(e);
    if (cibleBulle && !parSurvol) cacherBulle();   /* une bulle venue du clavier s'efface dès que la souris bouge */
  }, { passive: true });
  document.addEventListener('pointerover', function (e) {
    if (e.pointerType === 'touch') return;
    pointeurX = e.clientX; pointeurY = e.clientY;
    /* juste après un clic, rien ne revient sous un pointeur resté sur place, même si le bouton a été redessiné */
    if (!degele(e)) return;
    var c = e.target.closest && e.target.closest('[data-k-tooltip]');
    if (c && c !== cibleBulle && c !== cliquee) montrerBulle(c);
  });
  document.addEventListener('pointerout', function (e) {
    var c = e.target.closest && e.target.closest('[data-k-tooltip]');
    if (c && !c.contains(e.relatedTarget)) { if (c === cliquee) cliquee = null; cacherBulle(); }
    if (!e.relatedTarget) horsFenetre();           /* le pointeur a quitté la page */
  });
  /* Au focus : seulement quand on y arrive avec Tab. Le focus qu'une modale ou un menu rend à son bouton en se
     fermant n'ouvre pas de bulle : elle resterait là tant qu'on ne clique pas ailleurs. */
  document.addEventListener('keydown', function (e) { if (e.key === 'Tab') tabulation = performance.now(); else cacherBulle(); }, true);
  document.addEventListener('focusin', function (e) {
    var c = e.target.closest && e.target.closest('[data-k-tooltip]');
    if (c && performance.now() - tabulation < 400 && e.target.matches(':focus-visible')) montrerBulle(c, true);
  });
  document.addEventListener('focusout', cacherBulle);
  /* Un clic ferme la bulle, et elle ne revient pas tant que le pointeur n'a pas quitté le bouton */
  document.addEventListener('pointerdown', function (e) { gel = { x: e.clientX, y: e.clientY }; cliquee = e.target.closest ? e.target.closest('[data-k-tooltip]') : null; cacherBulle(); }, true);
  document.addEventListener('click', cacherBulle, true);
  ['pointercancel', 'dragstart', 'wheel'].forEach(function (nom) { document.addEventListener(nom, cacherBulle, { capture: true, passive: true }); });
  window.addEventListener('scroll', cacherBulle, true);
  window.addEventListener('resize', cacherBulle);
  window.addEventListener('blur', horsFenetre);
  window.addEventListener('pagehide', horsFenetre);
  document.addEventListener('visibilitychange', function () { if (document.hidden) horsFenetre(); });
  document.documentElement.addEventListener('pointerleave', horsFenetre);
  document.documentElement.addEventListener('mouseleave', horsFenetre);

  /* ---- Mise en route --------------------------------------------------------------------------- */
  function init(racine) {
    racine = racine || document;
    $$('.k-segmented, .k-tabs', racine).forEach(preparerGroupe);
    $$('.k-menu, .k-popover', racine).forEach(preparerMenu);
    $$('.k-rail', racine).forEach(preparerRail);
    $$('dialog.k-modal', racine).forEach(preparerModale);
    $$('.k-taginput', racine).forEach(preparerTagInput);
    $$('.k-checkbox[data-indeterminate]', racine).forEach(function (c) { c.indeterminate = true; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); }); else init();

  /* refresh(groupe) : replacer la pastille d'un segmenté ou la barre d'onglets après un changement fait par script */
  window.KanalDS = { init: init, toast: toast, modal: modal, placer: placer, copier: copierEtDire, refresh: function (g) { poserIndicateur(g, true); }, version: '1.0.0' };
})();
