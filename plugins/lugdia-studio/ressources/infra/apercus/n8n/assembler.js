// Liste des commentaires d'un site, dans l'ordre de création ; statut « masque » = retiré de la page.
const lignes = $input.all().map((i) => i.json).filter((r) => r && r.id != null && r.statut !== 'masque');
const commentaires = lignes.map((r) => ({ id: r.id, page: r.page, piste: r.piste, appareil: r.appareil, theme: r.theme, x: r.x, y: r.y, l: r.l, h: r.h, cible: r.cible, auteur: r.auteur, texte: r.texte, statut: r.statut, creeLe: r.createdAt }));
return [{ json: { corps: JSON.stringify({ ok: true, commentaires }) } }];
