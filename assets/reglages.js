/* ==========================================================================
   Réglages Kanal dans le design system. Script de la page reglages.html.
   Il ne fait que trois choses : afficher la page choisie dans le menu,
   simuler l'enregistrement, et verrouiller une suppression tant que le nom
   n'est pas recopié. Repères [G1]…[G6] : voir les notes en tête de la page.
   ========================================================================== */
(function () {
  'use strict';
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const pages = $$('[data-rg-page]');
  const liens = $$('[data-rg-nav] .k-nav__item');
  const defilement = document.querySelector('[data-rg-defilement]');

  // [G1] Une page à la fois. Dans l'app, chaque entrée du menu est une route.
  function aller() {
    const id = (location.hash || '').slice(1);
    const page = pages.find((p) => p.id === id) || pages[0];
    pages.forEach((p) => { p.hidden = p !== page; });
    liens.forEach((a) => { if (a.getAttribute('href') === '#' + page.id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    defilement.scrollTop = 0;
    document.title = page.dataset.rgPage + ' · Réglages · Kanal';
    const coque = document.querySelector('.k-shell'); if (coque) coque.removeAttribute('data-nav-open');
    KanalDS.init(page);   // les segmentés d'une page cachée n'avaient pas de largeur : on les replace
    $$('.k-segmented', page).forEach((g) => KanalDS.refresh(g));
  }
  window.addEventListener('hashchange', aller);
  aller();

  // [G3] Un interrupteur enregistre tout de suite. Un champ active le bouton « Enregistrer » de sa page.
  document.addEventListener('change', (e) => {
    const page = e.target.closest('[data-rg-page]'); if (!page) return;
    if (e.target.matches('.k-switch')) { KanalDS.toast('Réglage enregistré', { tone: 'success', duration: 2000 }); return; }
    const bouton = page.querySelector('[data-enregistrer]'); if (bouton) bouton.disabled = false;
  });
  document.addEventListener('input', (e) => {
    const page = e.target.closest('[data-rg-page]'); if (!page || e.target.matches('.k-switch, [type="checkbox"], [type="radio"]')) return;
    const bouton = page.querySelector('[data-enregistrer]'); if (bouton) bouton.disabled = false;
  });
  document.addEventListener('k:change', (e) => {
    const page = e.target.closest('[data-rg-page]'); if (!page) return;
    const bouton = page.querySelector('[data-enregistrer]'); if (bouton) bouton.disabled = false;
  });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-enregistrer]'); if (!b || b.disabled) return;
    b.setAttribute('data-loading', '');
    setTimeout(() => { b.removeAttribute('data-loading'); b.disabled = true; KanalDS.toast('Modifications enregistrées', { tone: 'success' }); }, 700);
  });

  // [G4] Suppression de l'espace : le bouton reste désactivé tant que le nom n'est pas recopié
  $$('[data-rg-confirmer]').forEach((champ) => {
    const bouton = champ.closest('dialog').querySelector('[data-rg-confirmer-bouton]');
    champ.addEventListener('input', () => { bouton.disabled = champ.value.trim() !== champ.dataset.rgConfirmer; });
    champ.closest('dialog').addEventListener('close', () => { champ.value = ''; bouton.disabled = true; });
  });
})();
