/**
 * Player Card Artwork Image Registry
 *
 * Maps stable player-card IDs (P001 - P023) to their corresponding local
 * public artwork image paths in public/players/.
 *
 * Requirements:
 * - Local static paths only: no remote CDNs, cloud storage, or paid APIs.
 * - Exact filename and case preservation.
 * - Kept separate from generated players.json to survive `npm run import-data`.
 */

export const PLAYER_IMAGE_MAP: Readonly<Record<string, string>> = Object.freeze({
  P001: '/players/Zlatan_Ibrahimovic.png',
  P002: '/players/Cristiano_Ronaldo.png',
  P003: '/players/Lionel_Messi.png',
  P004: '/players/Ronaldinho.png',
  P005: '/players/Ruud_Gullit.png',
  P006: '/players/Luis_suarez.png',
  P007: '/players/Jude_Bellingham.png',
  P008: '/players/Kylian_Mbappe.png',
  P009: '/players/Kaka.png',
  P010: '/players/Harry_Kane.png',
  P011: '/players/Patrick_Vieira.png',
  P012: '/players/Jordi_Alba.png',
  P013: '/players/Kevin De Bruyne.png',
  P014: '/players/Michael_Olise.png',
  P015: '/players/Paolo_Maldini.png',
  P016: '/players/Lilian_Thuram.png',
  P017: '/players/Frank_Rijkaard.png',
  P018: '/players/Tomas_Rosicky.png',
  P019: '/players/Cafu.png',
  P020: '/players/Luis_Diaz.png',
  P021: '/players/Alessandro_Nesta.png',
  P022: '/players/Marcel_desailly.png',
  P023: '/players/Manuel_Neuer.png',
});

/**
 * Returns the mapped artwork image URL for a player card ID, or null if unmapped.
 */
export function getPlayerImageUrl(playerId: string): string | null {
  return PLAYER_IMAGE_MAP[playerId] ?? null;
}

/**
 * Total count of registered player card artworks.
 */
export const TOTAL_REGISTERED_ARTWORKS = Object.keys(PLAYER_IMAGE_MAP).length;
