/**
 * 8-neighbor autotiling bitmask engine for top-down RPG maps
 */

export interface NeighborState {
  n: boolean;
  ne: boolean;
  e: boolean;
  se: boolean;
  s: boolean;
  sw: boolean;
  w: boolean;
  nw: boolean;
}

export function resolveAutotileId(neighbors: NeighborState, x = 0, y = 0): string {
  const { n, ne, e, se, s, sw, w, nw } = neighbors;

  // No neighbors
  if (!n && !s && !w && !e) {
    return 'isolated';
  }

  // 1 neighbor only -> endcaps
  if (n && !s && !w && !e) return 'endcap_s';
  if (s && !n && !w && !e) return 'endcap_n';
  if (w && !n && !s && !e) return 'endcap_e';
  if (e && !n && !s && !w) return 'endcap_w';

  // Corridors (opposite sides present, other two empty)
  if (n && s && !w && !e) return 'corridor_vert';
  if (w && e && !n && !s) return 'corridor_horiz';

  // 2 adjacent cardinals present -> outer corner
  if (s && e && !n && !w) return 'corner_outer_tl';
  if (s && w && !n && !e) return 'corner_outer_tr';
  if (n && e && !s && !w) return 'corner_outer_bl';
  if (n && w && !s && !e) return 'corner_outer_br';

  // 3 cardinals present -> cardinal edge
  if (s && w && e && !n) return 'edge_top';
  if (n && w && e && !s) return 'edge_bottom';
  if (n && s && e && !w) return 'edge_left';
  if (n && s && w && !e) return 'edge_right';

  // All 4 cardinals present
  if (n && s && w && e) {
    // Check diagonal inner corners
    if (!nw && ne && se && sw) return 'corner_inner_tl';
    if (!ne && nw && se && sw) return 'corner_inner_tr';
    if (!sw && nw && ne && se) return 'corner_inner_bl';
    if (!se && nw && ne && sw) return 'corner_inner_br';

    // Full fill - vary with alternate textures for visual richness
    const pseudo = (x * 7 + y * 13) % 10;
    if (pseudo === 3) return 'center_alt1';
    if (pseudo === 7) return 'center_alt2';
    return 'center';
  }

  return 'center';
}
