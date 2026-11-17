/* ==========================================================================
   Résultats d'une campagne dans le design system. Script de campagne.html.
   Repères [R1]…[R9] : voir les notes en tête de la page.

   Maquette : la campagne « Black Friday, accès anticipé », avec les chiffres
   déjà montrés sur l'accueil et la page Campagnes. La courbe et la liste des
   destinataires sont fictives.
   ========================================================================== */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const F = ' ';   // espace fine insécable
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const milliers = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, F);
  const ic = (nom) => `<k-icon name="${nom}"></k-icon>`;

  // ---------------------------------------------------------------- [R4] ce qui se passe après l'envoi
  // 48 heures, heure par heure, à partir de l'envoi (samedi 14 nov., 10 h). Le rappel part le dimanche à 18 h (point 32).
  const HEURES = Array.from({ length: 48 }, (_, i) => new Date(2026, 10, 14, 10 + i));
  const jour = (d) => d.toLocaleDateString('fr-FR', { weekday: 'short' });
  const nuit = (d) => (d.getHours() < 7 ? 0.25 : d.getHours() < 9 ? 0.6 : 1);   // on lit peu la nuit
  const vague = (i, depart, demiVie) => (i < depart ? 0 : Math.pow(0.5, (i - depart) / demiVie));
  const SERIES = {
    lectures: { nom: 'Lectures', format: milliers, valeurs: KanalCourbe.repartir(9300, HEURES.map((d, i) => (vague(i, 0, 2.2) + 0.03 + 0.09 * vague(i, 32, 2)) * nuit(d))) },
    clics:    { nom: 'Clics', format: milliers, valeurs: KanalCourbe.repartir(3230, HEURES.map((d, i) => (vague(i, 0, 2.8) + 0.04 + 0.12 * vague(i, 32, 2.2)) * nuit(d))) },
    ca:       { nom: 'Chiffre d’affaires', format: (n) => `${milliers(n)}${F}€`, valeurs: KanalCourbe.repartir(19200, HEURES.map((d, i) => (vague(i, 1, 4.5) + 0.08 + 0.2 * vague(i, 33, 3)) * nuit(d) * (d.getHours() >= 19 && d.getHours() <= 22 ? 1.5 : 1))) }
  };
  const zone = $('[data-cp-courbe]');
  function tracer(cle) {
    const s = SERIES[cle];
    KanalCourbe.tracer(zone, {
      valeurs: s.valeurs, nom: s.nom, format: s.format,
      etiquettes: HEURES.map((d) => `${jour(d)} ${d.getDate()} nov., ${d.getHours()}${F}h`),
      dates: HEURES.map((d) => `${jour(d)} ${d.getHours()}${F}h`)
    });
  }
  $('[data-cp-series]').addEventListener('k:change', (e) => tracer(e.detail.item.dataset.serie));
  tracer('lectures');

  // ---------------------------------------------------------------- [R8] les destinataires
  // Le statut le plus avancé de chacun : commandé > cliqué > lu > délivré. Un message non délivré dit pourquoi.
  const STATUTS = {
    commande: ['A commandé', ' k-badge--success'], clic: ['A cliqué', ' k-badge--accent'], lu: ['A lu', ''],
    delivre: ['Délivré', ' k-badge--outline'], echec: ['Non délivré', ' k-badge--danger']
  };
  const DESTINATAIRES = [
    { nom: 'Camille Garnier', ton: 'rose', tel: '+32 400 00 00 11', statut: 'commande', envoi: 'Principal', quand: '14 nov., 10:04', detail: `142${F}€` },
    { nom: 'Thomas Bernard', ton: 'green', tel: '+33 6 00 00 00 02', statut: 'commande', envoi: 'Principal', quand: '14 nov., 10:31', detail: `142${F}€` },
    { nom: 'Zoé Thomas', ton: 'orange', tel: '+33 6 00 00 00 09', statut: 'commande', envoi: 'Rappel', quand: '15 nov., 18:12', detail: `96${F}€` },
    { nom: 'Léa Martin', ton: 'blue', tel: '+33 6 00 00 00 01', statut: 'clic', envoi: 'Principal', quand: '14 nov., 10:02', detail: 'J\'en profite' },
    { nom: 'Sarah Fournier', ton: 'rose', tel: '+33 6 00 00 00 05', statut: 'clic', envoi: 'Principal', quand: '14 nov., 11:47', detail: 'Voir la collection' },
    { nom: 'Inès Robert', ton: 'violet', tel: '+33 6 00 00 00 03', statut: 'lu', envoi: 'Principal', quand: '14 nov., 10:15', detail: '' },
    { nom: 'Mila Dupont', ton: 'green', tel: '+33 6 00 00 00 07', statut: 'lu', envoi: 'Rappel', quand: '15 nov., 19:40', detail: '' },
    { nom: 'Paul Mercier', ton: 'violet', tel: '+33 6 00 00 00 15', statut: 'delivre', envoi: 'Rappel', quand: '15 nov., 18:00', detail: '' },
    { nom: 'Emma Girard', ton: 'green', tel: '+32 400 00 00 14', statut: 'delivre', envoi: 'Rappel', quand: '15 nov., 18:00', detail: '' },
    { nom: 'Julien Moreau', ton: 'orange', tel: '+33 6 00 00 00 12', statut: 'lu', envoi: 'Principal', quand: '14 nov., 10:22', detail: 'S\'est désabonné (STOP)' },
    { nom: 'Lucas Benoit', ton: 'blue', tel: '+33 6 00 00 00 16', statut: 'echec', envoi: 'Principal', quand: '14 nov., 10:00', detail: 'Numéro sans WhatsApp' },
    { nom: 'Nina Caron', ton: 'rose', tel: '+33 6 00 00 00 17', statut: 'echec', envoi: 'Principal', quand: '14 nov., 10:00', detail: 'Numéro invalide' }
  ];
  const initiales = (nom) => nom.split(' ').map((m) => m[0]).join('').slice(0, 2);
  const corps = $('[data-cp-lignes]');
  let filtre = 'tous';
  function rendre() {
    const l = DESTINATAIRES.filter((d) => filtre === 'tous' || d.statut === filtre);
    corps.innerHTML = l.length ? l.map((d) => `<tr>
      <td><div class="k-table__who"><span class="k-avatar k-avatar--${d.ton}">${initiales(d.nom)}</span><div><div class="k-table__primary">${esc(d.nom)}</div><div class="k-table__secondary k-tabular">${d.tel}</div></div></div></td>
      <td><span class="k-badge${STATUTS[d.statut][1]}">${STATUTS[d.statut][0]}</span></td>
      <td>${d.envoi}</td>
      <td class="k-table__secondary">${d.quand}</td>
      <td class="k-table__num">${d.detail ? esc(d.detail) : '—'}</td>
      <td class="k-table__actions"><a class="k-button k-button--ghost k-button--icon k-button--sm" href="contacts.html" aria-label="Voir la fiche de ${esc(d.nom)}" data-k-tooltip="Voir la fiche">${ic('arrow-right')}</a></td>
    </tr>`).join('') : '<tr><td class="k-table__empty" colspan="6">Personne dans ce cas.</td></tr>';
    $('[data-cp-pied]').textContent = `${l.length} destinataire${l.length > 1 ? 's' : ''} affiché${l.length > 1 ? 's' : ''} sur 13${F}694`;
  }
  $('[data-cp-statuts]').addEventListener('k:change', (e) => { filtre = e.detail.item.dataset.statut; rendre(); });
  rendre();

  // ---------------------------------------------------------------- [R2] onglets
  $('[data-cp-onglets]').addEventListener('k:change', (e) => {
    const destinataires = e.detail.item.dataset.onglet === 'destinataires';
    $('[data-cp-resultats]').hidden = destinataires; $('[data-cp-destinataires]').hidden = !destinataires;
    $('[data-cp-defile]').scrollTop = 0;
  });
})();
