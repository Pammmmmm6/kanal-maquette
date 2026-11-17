/* ==========================================================================
   Script de la PAGE DE DOCUMENTATION. À ne pas intégrer dans l'app.
   - construit la navigation à partir des <section class="doc-page">
   - affiche une page à la fois (#nom dans l'adresse)
   - fabrique le panneau « Code » de chaque démonstration à partir de son
     balisage réel : le code affiché ne peut pas diverger de ce qu'on voit
   - lit les valeurs des jetons dans le CSS : un chiffre affiché ici est
     toujours celui de jetons.css
   ========================================================================== */
(function () {
  'use strict';
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var echapper = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };

  /* ---- Code d'une démonstration ---------------------------------------- */
  var VIDES = { input: 1, img: 1, br: 1, hr: 1, use: 1 };
  function balise(el) {
    var nom = el.tagName.toLowerCase();
    var s = '<span class="b">&lt;' + nom + '</span>';
    Array.prototype.forEach.call(el.attributes, function (a) {
      if (/^data-doc-/.test(a.name) || (nom === 'k-icon' && a.name === 'aria-hidden')) return;
      s += ' <span class="a">' + a.name + '</span>' + (a.value === '' ? '' : '=<span class="v">"' + echapper(a.value).replace(/"/g, '&quot;') + '"</span>');
    });
    return s + '<span class="b">&gt;</span>';
  }
  function fin(el) { return '<span class="b">&lt;/' + el.tagName.toLowerCase() + '&gt;</span>'; }
  function enfants(el) {
    if (el.tagName.toLowerCase() === 'k-icon') return [];
    return Array.prototype.filter.call(el.childNodes, function (n) {
      return n.nodeType === 1 || (n.nodeType === 3 && n.textContent.trim());
    });
  }
  function enLigne(el) {
    /* tient sur une ligne : que du texte et des éléments sans enfants, et court */
    var k = enfants(el);
    if (el.textContent.replace(/\s+/g, ' ').length > 80 || el.outerHTML.length > 240) return false;
    return k.every(function (n) { return n.nodeType === 3 || enfants(n).every(function (m) { return m.nodeType === 3; }) && k.length <= 5; });
  }
  function ecrire(n, niveau, sur_une_ligne) {
    var retrait = sur_une_ligne ? '' : new Array(niveau + 1).join('  ');
    if (n.nodeType === 3) return retrait + echapper(n.textContent.replace(/\s+/g, ' ').trim());
    var nom = n.tagName.toLowerCase();
    if (VIDES[nom]) return retrait + balise(n);
    var k = enfants(n);
    if (!k.length) return retrait + balise(n) + fin(n);
    if (sur_une_ligne || enLigne(n)) {
      var dedans = '', precedent = null;
      k.forEach(function (c) {
        var espace = precedent && (/\s$/.test(precedent.textContent) && precedent.nodeType === 3 || /^\s/.test(c.textContent) && c.nodeType === 3 || (precedent.nodeType === 1 && c.nodeType === 1)) ? ' ' : '';
        dedans += espace + ecrire(c, 0, true);
        precedent = c;
      });
      return retrait + balise(n) + dedans + fin(n);
    }
    return retrait + balise(n) + '\n' + k.map(function (c) { return ecrire(c, niveau + 1); }).join('\n') + '\n' + retrait + fin(n);
  }
  function codeDe(source) {
    return enfants(source).map(function (c) { return ecrire(c, 0); }).join('\n');
  }

  function preparerDemos() {
    $$('.doc-demo').forEach(function (demo) {
      var scene = document.createElement('div');
      scene.className = 'doc-demo__scene';
      while (demo.firstChild) scene.appendChild(demo.firstChild);
      demo.appendChild(scene);
      if (demo.hasAttribute('data-sans-code')) return;
      var html = codeDe(scene);  /* lu AVANT que les scripts n'ajoutent leurs attributs */
      var barre = document.createElement('div');
      barre.className = 'doc-demo__barre';
      barre.innerHTML = '<b>' + echapper(demo.getAttribute('data-titre') || 'Exemple') + '</b>' +
        '<button type="button" class="k-button k-button--ghost k-button--sm" aria-expanded="false"><k-icon name="code-bracket"></k-icon>Code</button>';
      var code = document.createElement('div');
      code.className = 'doc-code';
      code.innerHTML = '<button type="button" class="k-button k-button--outline k-button--sm doc-code__copier">Copier</button><pre>' + html + '</pre>';
      demo.appendChild(barre); demo.appendChild(code);
      barre.querySelector('button').addEventListener('click', function () {
        var ouvert = code.toggleAttribute('data-open');
        this.setAttribute('aria-expanded', ouvert);
      });
      code.querySelector('button').addEventListener('click', function () {
        KanalDS.copier(code.querySelector('pre').textContent, 'Code copié');
      });
    });
  }

  /* ---- Valeurs des jetons ---------------------------------------------- */
  var racine = getComputedStyle(document.documentElement);
  function jeton(nom) { return racine.getPropertyValue(nom).trim(); }
  function rgb(couleur, fond) {
    /* une teinte translucide (--k-ink-2) est posée sur son fond réel avant d'être mesurée */
    var c = document.createElement('canvas'); c.width = c.height = 1;
    var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 1, 1);
    if (fond) { x.fillStyle = fond; x.fillRect(0, 0, 1, 1); }
    x.fillStyle = couleur; x.fillRect(0, 0, 1, 1);
    var d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]];
  }
  function luminance(c) { var v = c.map(function (n) { n /= 255; return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; }
  function contraste(a, b) { var x = luminance(rgb(a, b)), y = luminance(rgb(b)); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function fr(n) { return n.toFixed(1).replace('.', ','); }

  function preparerJetons() {
    $$('[data-val]').forEach(function (el) { el.textContent = jeton(el.getAttribute('data-val')); el.classList.add('doc-val'); });
    $$('.doc-couleur').forEach(function (b) {
      var nom = b.getAttribute('data-jeton'), valeur = jeton(nom), sur = b.getAttribute('data-sur'), texte = b.getAttribute('data-texte');
      var note = '';
      /* data-sur : ce jeton est un TEXTE posé sur ce fond. data-texte : ce jeton est un FOND qui porte ce texte. */
      var paire = sur ? [valeur, jeton(sur)] : texte ? [jeton(texte), valeur] : null;
      if (paire) { var r = contraste(paire[0], paire[1]); note = fr(r) + ':1'; }
      var clair = luminance(rgb(valeur)) > 0.45;
      b.type = 'button';
      b.title = 'Copier var(' + nom + ')';
      var fond = sur ? jeton(sur) : valeur, encre = sur ? valeur : texte ? jeton(texte) : clair ? jeton('--k-ink') : '#fff';
      b.innerHTML = '<span class="doc-couleur__teinte" style="background:' + fond + ';color:' + encre + '"><span>' + (texte || sur ? 'Aa' : '') + '</span><span>' + note + '</span></span>' +
        '<span class="doc-couleur__info"><span class="doc-couleur__nom">' + nom + '</span><span class="doc-couleur__valeur">' + echapper(valeur) + '</span>' +
        '<span class="doc-couleur__usage">' + echapper(b.getAttribute('data-usage') || '') + '</span></span>';
      b.addEventListener('click', function () { copier('var(' + nom + ')'); });
    });
  }
  function copier(texte) { KanalDS.copier(texte, texte + ' copié'); }

  /* ---- Navigation et pages ------------------------------------------------ */
  var pages = [], conteneur, defilement;
  function construireNav() {
    var nav = $('[data-doc-nav]'); if (!nav) return;
    var groupe = null;
    pages.forEach(function (p) {
      var g = p.getAttribute('data-groupe');
      if (g !== groupe) { groupe = g; var l = document.createElement('div'); l.className = 'k-nav__label'; l.textContent = g; nav.appendChild(l); }
      var a = document.createElement('a');
      a.className = 'k-nav__item'; a.href = '#' + p.id;
      a.setAttribute('data-mots', (p.getAttribute('data-titre') + ' ' + (p.getAttribute('data-mots') || '') + ' ' + $$('.doc-bloc > h2', p).map(function (h) { return h.textContent; }).join(' ')).toLowerCase());
      a.innerHTML = '<k-icon name="' + (p.getAttribute('data-icone') || 'cube') + '"></k-icon><span>' + echapper(p.getAttribute('data-titre')) + '</span>';
      nav.appendChild(a);
    });
  }
  function construirePage(p, i) {
    var corps = $('.doc-corps', p); if (!corps) return;
    var blocs = $$('.doc-bloc > h2', p);
    if (blocs.length > 1) {
      var s = document.createElement('nav'); s.className = 'doc-sommaire'; s.setAttribute('aria-label', 'Sur cette page');
      s.innerHTML = '<b>Sur cette page</b>';
      blocs.forEach(function (h) {
        var a = document.createElement('a'); a.textContent = h.textContent; a.tabIndex = 0;
        a.addEventListener('click', function () { h.scrollIntoView({ block: 'start' }); });
        s.appendChild(a);
      });
      corps.appendChild(s);
    }
    var suite = document.createElement('div'); suite.className = 'doc-suite';
    var avant = pages[i - 1], apres = pages[i + 1];
    suite.innerHTML = (avant ? '<a href="#' + avant.id + '"><small>Précédent</small><b>' + echapper(avant.getAttribute('data-titre')) + '</b></a>' : '<span></span>') +
      (apres ? '<a href="#' + apres.id + '"><small>Suivant</small><b>' + echapper(apres.getAttribute('data-titre')) + '</b></a>' : '');
    corps.firstElementChild.appendChild(suite);
  }
  function aller(instant) {
    var id = (location.hash || '').slice(1);
    var page = document.getElementById(id);
    if (!page || !page.classList.contains('doc-page')) page = pages[0];
    conteneur.toggleAttribute('data-instant', !!instant);
    pages.forEach(function (p) { p.toggleAttribute('data-active', p === page); });
    $$('[data-doc-nav] .k-nav__item').forEach(function (a) {
      if (a.getAttribute('href') === '#' + page.id) { a.setAttribute('aria-current', 'page'); if (a.scrollIntoViewIfNeeded) a.scrollIntoViewIfNeeded(false); }
      else a.removeAttribute('aria-current');
    });
    defilement.scrollTop = 0;
    document.title = page.getAttribute('data-titre') + ' · Design system Kanal';
    var coque = $('.k-shell'); if (coque) coque.removeAttribute('data-nav-open');
    window.dispatchEvent(new CustomEvent('doc:page', { detail: page }));
  }

  function preparerRecherche() {
    var champ = $('[data-doc-recherche]'); if (!champ) return;
    var vide = $('[data-doc-nav-vide]');
    function filtrer() {
      var q = champ.value.trim().toLowerCase(), n = 0;
      $$('[data-doc-nav] .k-nav__item').forEach(function (a) { var ok = !q || a.getAttribute('data-mots').indexOf(q) > -1; a.hidden = !ok; if (ok) n++; });
      $$('[data-doc-nav] .k-nav__label').forEach(function (l) {
        var e = l.nextElementSibling, visible = false;
        while (e && !e.classList.contains('k-nav__label')) { if (!e.hidden) visible = true; e = e.nextElementSibling; }
        l.hidden = !visible;
      });
      if (vide) vide.hidden = n > 0;
    }
    champ.addEventListener('input', filtrer);
    champ.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { var a = $('[data-doc-nav] .k-nav__item:not([hidden])'); if (a) { location.hash = a.getAttribute('href'); champ.value = ''; filtrer(); champ.blur(); } }
      if (e.key === 'Escape') { champ.value = ''; filtrer(); champ.blur(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) && !document.activeElement.isContentEditable) { e.preventDefault(); champ.focus(); }
    });
  }

  /* ---- Galerie d'icônes ------------------------------------------------------ */
  function preparerIcones() {
    var zone = $('[data-doc-icones]'); if (!zone || !window.KanalIcones) return;
    var jeux = { i: ['plein 20', ''], im: ['plein 16', ' set="micro"'] };
    var champ = $('[data-doc-icones-recherche]'), choix = $('[data-doc-icones-jeu]'), jeu = 'i';
    function rendre() {
      var q = champ ? champ.value.trim().toLowerCase() : '';
      zone.innerHTML = '';
      KanalIcones[jeu].filter(function (n) { return n.indexOf(q) > -1; }).forEach(function (n) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'doc-icone'; b.title = 'Copier le balisage';
        b.innerHTML = '<k-icon name="' + n + '"' + jeux[jeu][1] + (jeu === 'im' ? ' size="16"' : '') + '></k-icon><span>' + n + '</span>';
        b.addEventListener('click', function () { copier('<k-icon name="' + n + '"' + jeux[jeu][1] + '></k-icon>'); });
        zone.appendChild(b);
      });
      var total = $('[data-doc-icones-total]'); if (total) total.textContent = zone.children.length + ' icônes';
    }
    if (champ) champ.addEventListener('input', rendre);
    if (choix) choix.addEventListener('k:change', function (e) { jeu = e.detail.item.dataset.value; rendre(); });
    rendre();
  }

  /* ---- Graphiques de démonstration ----------------------------------------------- */
  var NS = 'http://www.w3.org/2000/svg';
  function svg(nom, attrs) { var e = document.createElementNS(NS, nom); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function preparerCourbes() {
    $$('[data-doc-courbe]').forEach(function (zone) {
      var v = zone.getAttribute('data-doc-courbe').split(',').map(Number), L = 300, H = 56, max = Math.max.apply(null, v), min = Math.min.apply(null, v);
      var pts = v.map(function (n, i) { return [i * L / (v.length - 1), H - 6 - (n - min) / (max - min || 1) * (H - 18)]; });
      /* lissée sans dépassement, comme la courbe de l'accueil (interpolation cubique monotone) */
      var m = [], t = [], d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1), k;
      for (k = 0; k < pts.length - 1; k++) m[k] = (pts[k + 1][1] - pts[k][1]) / (pts[k + 1][0] - pts[k][0]);
      t[0] = m[0]; t[pts.length - 1] = m[pts.length - 2];
      for (k = 1; k < pts.length - 1; k++) t[k] = m[k - 1] * m[k] <= 0 ? 0 : 2 * m[k - 1] * m[k] / (m[k - 1] + m[k]);
      for (k = 0; k < pts.length - 1; k++) {
        var h = (pts[k + 1][0] - pts[k][0]) / 3;
        d += ' C' + (pts[k][0] + h).toFixed(1) + ' ' + (pts[k][1] + t[k] * h).toFixed(1) + ' ' + (pts[k + 1][0] - h).toFixed(1) + ' ' + (pts[k + 1][1] - t[k + 1] * h).toFixed(1) + ' ' + pts[k + 1][0].toFixed(1) + ' ' + pts[k + 1][1].toFixed(1);
      }
      var s = svg('svg', { viewBox: '0 0 ' + L + ' ' + H, preserveAspectRatio: 'none', 'aria-hidden': 'true' });
      s.appendChild(svg('path', { d: d + ' L' + L + ' ' + H + ' L0 ' + H + ' Z', fill: 'var(--k-chart-area)' }));
      s.appendChild(svg('path', { d: d, fill: 'none', stroke: 'var(--k-chart-1)', 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke' }));
      zone.appendChild(s);
    });
  }
  function preparerBarres() {
    $$('[data-doc-barres]').forEach(function (zone) {
      var series = [['Clients', '--k-chart-1'], ['Équipe', '--k-chart-2'], ['Lumi (IA)', '--k-chart-3']];
      var jours = ['3 nov.', '4 nov.', '5 nov.', '6 nov.', '7 nov.', '8 nov.', '9 nov.', '10 nov.', '11 nov.', '12 nov.', '13 nov.', '14 nov.', '15 nov.', '16 nov.'];
      var data = [[42, 18, 61], [38, 22, 55], [51, 25, 72], [47, 19, 66], [58, 31, 84], [24, 6, 41], [19, 4, 33], [49, 27, 70], [63, 34, 96], [55, 29, 81], [61, 30, 88], [66, 36, 102], [28, 8, 47], [44, 21, 64]];
      var L = 720, H = 240, g = 44, b = 28, haut = 10, max = 240, pas = 60, larg = (L - g) / jours.length, lb = Math.min(22, larg - 14);
      var s = svg('svg', { viewBox: '0 0 ' + L + ' ' + H, role: 'img', 'aria-label': 'Messages par jour et par émetteur, du 3 au 16 novembre' });
      for (var y = 0; y <= max; y += pas) {
        var py = H - b - y / max * (H - b - haut);
        s.appendChild(svg('line', { x1: g, x2: L, y1: py, y2: py, 'class': 'k-chart__grid' }));
        var t = svg('text', { x: g - 10, y: py + 4, 'text-anchor': 'end' }); t.textContent = y; s.appendChild(t);
      }
      var tip = document.createElement('div'); tip.className = 'k-chart__tip'; tip.hidden = true;
      data.forEach(function (jour, i) {
        var x = g + i * larg + (larg - lb) / 2, base = H - b, grp = svg('g', { 'class': 'k-chart__bar' });
        jour.forEach(function (v, k) {
          var h = v / max * (H - b - haut), dernier = k === jour.length - 1, r = dernier ? 4 : 0, y0 = base - h + (k ? 0 : 0);
          var hh = Math.max(1, h - 2);  /* 2 px de blanc entre deux segments */
          grp.appendChild(svg('path', { fill: 'var(' + series[k][1] + ')', d: 'M' + x + ' ' + (y0 + hh) + ' V' + (y0 + r) + ' Q' + x + ' ' + y0 + ' ' + (x + r) + ' ' + y0 + ' H' + (x + lb - r) + ' Q' + (x + lb) + ' ' + y0 + ' ' + (x + lb) + ' ' + (y0 + r) + ' V' + (y0 + hh) + ' Z' }));
          base -= h;
        });
        var cible = svg('rect', { x: g + i * larg, y: 0, width: larg, height: H - b, fill: 'transparent' });
        cible.addEventListener('pointerenter', function () {
          zone.setAttribute('data-hover', ''); grp.setAttribute('data-on', '');
          tip.innerHTML = '<div class="k-chart__tip-title">' + jours[i] + '</div>' + series.map(function (se, k) { return '<div class="k-chart__tip-row"><span class="k-legend__key"><i class="k-legend__swatch" style="--_c:var(' + se[1] + ')"></i>' + se[0] + '</span><b>' + jour[k] + '</b></div>'; }).join('');
          tip.hidden = false;
          tip.style.left = ((x + lb / 2) / L * 100) + '%';
          tip.style.top = (base / H * 100) + '%';
        });
        cible.addEventListener('pointerleave', function () { zone.removeAttribute('data-hover'); grp.removeAttribute('data-on'); tip.hidden = true; });
        s.appendChild(grp); s.appendChild(cible);
        if (i % 2 === 0) { var e = svg('text', { x: x + lb / 2, y: H - 8, 'text-anchor': 'middle' }); e.textContent = jours[i]; s.appendChild(e); }
      });
      zone.appendChild(s); zone.appendChild(tip);
    });
  }

  /* ---- Écrans : la même page à trois largeurs ------------------------------------ */
  function preparerEcrans() {
    $$('[data-doc-ecran]').forEach(function (bloc) {
      var cadre = $('.doc-ecran__cadre', bloc), iframe = $('iframe', bloc), mesure = $('[data-doc-ecran-mesure]', bloc), l = 1512, h = 860;
      function poser() {
        var dispo = cadre.clientWidth; if (!dispo) return;
        var e = dispo / l;
        iframe.style.width = l + 'px'; iframe.style.height = h + 'px'; iframe.style.transform = 'scale(' + e + ')';
        cadre.style.height = Math.round(h * e) + 'px';
        if (mesure) mesure.textContent = l + ' × ' + h + ' px, affiché à ' + Math.round(e * 100) + ' %';
      }
      bloc.addEventListener('k:change', function (e) { var d = e.detail.item.dataset; l = +d.l; h = +d.h; poser(); });
      if (window.ResizeObserver) new ResizeObserver(poser).observe(cadre);
      window.addEventListener('doc:page', function (e) { if (e.detail.contains(bloc) && !iframe.src) iframe.src = iframe.getAttribute('data-src'); poser(); });
    });
  }

  /* ---- Petites démonstrations -------------------------------------------------------- */
  function preparerDivers() {
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-doc-charger]');
      if (b) { b.setAttribute('data-loading', ''); setTimeout(function () { b.removeAttribute('data-loading'); KanalDS.toast('Modifications enregistrées', { tone: 'success' }); }, 1400); }
      var p = e.target.closest('[data-doc-rejouer]');
      if (p) {
        var piste = document.getElementById(p.getAttribute('data-doc-rejouer')), i = piste.querySelector('i');
        piste.style.setProperty('--_l', piste.clientWidth + 'px');
        i.style.transition = 'none'; piste.removeAttribute('data-go'); void i.offsetWidth;
        i.style.transition = 'transform ' + p.getAttribute('data-duree') + ' ' + p.getAttribute('data-courbe'); piste.setAttribute('data-go', '');
      }
      var g = e.target.closest('[data-doc-progression]');
      if (g) { var barre = document.getElementById(g.getAttribute('data-doc-progression')); barre.style.setProperty('--k-value', Math.random().toFixed(2)); }
      var l = e.target.closest('.k-conv, .doc-selection > *');
      if (l && l.parentElement.hasAttribute('data-doc-choix')) { $$('[aria-current]', l.parentElement).forEach(function (x) { x.removeAttribute('aria-current'); }); l.setAttribute('aria-current', 'true'); l.removeAttribute('data-unread'); }
      var n = e.target.closest('.k-node');
      if (n && n.closest('[data-doc-choix-noeud]')) { $$('.k-node', n.closest('[data-doc-choix-noeud]')).forEach(function (x) { x.setAttribute('aria-selected', x === n ? 'true' : 'false'); }); }
    });
    document.addEventListener('k:change', function (e) {
      var menu = e.target; if (!menu.classList || !menu.classList.contains('k-menu') || !menu.__bouton) return;
      var v = menu.__bouton.querySelector('[data-doc-valeur]'), t = e.detail.item.querySelector('.k-menu__text');
      if (v && t) v.textContent = t.firstChild.textContent.trim();
    });
    /* composer : l'onglet Note change la teinte du champ */
    $$('[data-doc-composer]').forEach(function (c) {
      c.addEventListener('k:change', function (e) {
        var note = e.detail.item.dataset.value === 'note';
        c.classList.toggle('k-composer--note', note);
        $('.k-composer__input', c).placeholder = note ? 'Note interne, visible de l’équipe seulement. @ pour mentionner.' : 'Répondre à Léa… « / » pour une réponse enregistrée';
      });
    });
    /* case « tout sélectionner » d'un tableau */
    $$('[data-doc-tableau]').forEach(function (t) {
      var tout = $('thead .k-checkbox', t), cases = $$('tbody .k-checkbox', t), barre = document.getElementById(t.getAttribute('data-doc-tableau'));
      function maj() {
        var n = cases.filter(function (c) { return c.checked; }).length;
        cases.forEach(function (c) { c.closest('tr').setAttribute('aria-selected', c.checked); });
        tout.checked = n === cases.length; tout.indeterminate = n > 0 && n < cases.length;
        if (barre) { barre.hidden = n === 0; var cpt = $('.k-bulk__count', barre); if (cpt) cpt.textContent = n + (n > 1 ? ' sélectionnées' : ' sélectionnée'); }
      }
      tout.addEventListener('change', function () { cases.forEach(function (c) { c.checked = tout.checked; }); maj(); });
      cases.forEach(function (c) { c.addEventListener('change', maj); });
      maj();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    pages = $$('.doc-page'); conteneur = $('.doc-pages'); defilement = $('[data-doc-defilement]');
    preparerDemos();
    construireNav();
    pages.forEach(construirePage);
    preparerJetons();
    preparerRecherche();
    preparerIcones();
    preparerCourbes();
    preparerBarres();
    preparerEcrans();
    preparerDivers();
    if (window.KanalDS) KanalDS.init();
    aller(true);
    window.addEventListener('hashchange', function () { aller(false); });
  });
})();
