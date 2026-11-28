// Temporary visual references from BBS Japan's official forged wheel product pages.
// These third-party model names and images are for development layout evaluation only.
const bbsImage = (file) => 'https://bbs-japan.co.jp/en/wp-content/uploads/sites/2/' + file;
const bbsPage = (id) => 'https://bbs-japan.co.jp/en/products/' + id + '/';

export const forgedReferenceProducts = [
  { id: 'fl', model: 'FL', construction: 'One-Piece', design: 'Cross-Spoke', description: 'A modern cross-spoke interpretation built around BBS FORTEGA material.', image: bbsImage('2025/03/fortega_main-1.jpg'), source: bbsPage('2332') },
  { id: 'rz-d', model: 'RZ-D', construction: 'One-Piece', design: 'Cross-Spoke', description: 'Ten slender cross spokes with a refined, deep-centre profile.', image: bbsImage('2016/10/newRZ-D.jpg'), source: bbsPage('1126') },
  { id: 'ri-d', model: 'RI-D', construction: 'One-Piece', design: 'Five-Spoke', description: 'A minimalist five-spoke form with a lightweight motorsport character.', image: bbsImage('2016/10/newRI-D.jpg'), source: bbsPage('1108') },
  { id: 'fi-r', model: 'FI-R', construction: 'One-Piece', design: 'Five-Spoke', description: 'A performance-focused forged design with distinctive milled detailing.', image: bbsImage('2017/07/newFI-R.jpg'), source: bbsPage('1507') },
  { id: 'fi-r-evo', model: 'FI-R Evo', construction: 'One-Piece', design: 'Five-Spoke', description: 'An evolved five-spoke design balancing structural form and reduced mass.', image: bbsImage('2024/03/FI-R-Evo.jpg'), source: bbsPage('2178') },
  { id: 'super-rs', model: 'SUPER-RS', construction: 'Two-Piece', design: 'Cross-Spoke', description: 'A classic multi-cross-spoke design with a distinctive two-piece architecture.', image: bbsImage('2016/10/SUPER-RS_top.jpg'), source: bbsPage('1296') },
  { id: 'lm-r', model: 'LM-R', construction: 'Two-Piece', design: 'Mesh', description: 'A motorsport-derived mesh design with a refined multi-piece profile.', image: bbsImage('2016/10/LM-R_top.jpg'), source: bbsPage('1303') },
  { id: 'ri-s', model: 'RI-S', construction: 'Two-Piece', design: 'Multi-Spoke', description: 'A sculpted multi-spoke expression in a two-piece forged construction.', image: bbsImage('2016/10/RI-S.jpg'), source: bbsPage('1428') },
  { id: 'lm', model: 'LM', construction: 'Two-Piece', design: 'Mesh', description: 'A heritage mesh design recognised for its deep-lip multi-piece character.', image: bbsImage('2016/10/newLM.jpg'), source: bbsPage('1142') },
  { id: 'rn', model: 'RN', construction: 'One-Piece', design: 'Multi-Spoke', description: 'A contemporary multi-spoke design with a clean, refined profile.', image: bbsImage('2016/10/RN_top.jpg'), source: bbsPage('1316') },
  { id: 're-x', model: 'RE-X', construction: 'One-Piece', design: 'Multi-Spoke', description: 'A modern multi-spoke design with a strong, continuous spoke profile.', image: bbsImage('2017/12/REX_MAIN.jpg'), source: bbsPage('1586') },
  { id: 'fs', model: 'FS', construction: 'One-Piece', design: 'Cross-Spoke', description: 'A compact cross-spoke layout with a balanced performance aesthetic.', image: bbsImage('2016/10/newFS.jpg'), source: bbsPage('1422') },
  { id: 're-v', model: 'RE-V', construction: 'One-Piece', design: 'Five-Spoke', description: 'A purposeful five-spoke design with a restrained, performance-led appearance.', image: bbsImage('2016/10/RE-V_top.jpg'), source: bbsPage('1283') },
  { id: 're-v7', model: 'RE-V7', construction: 'One-Piece', design: 'Seven-Spoke', description: 'A seven-spoke design that brings a contemporary edge to a classic format.', image: bbsImage('2021/06/newRE-V7.jpg'), source: bbsPage('1898') },
  { id: 'ri-a', model: 'RI-A', construction: 'One-Piece', design: 'Multi-Spoke', description: 'A motorsport-inspired multi-spoke design with a purposeful stance.', image: bbsImage('2016/10/newRI-A.jpg'), source: bbsPage('1135') },
  { id: 'rt-x', model: 'RT-X', construction: 'Two-Piece', design: 'Cross-Spoke', description: 'A cross-spoke two-piece design with a strong, mechanical character.', image: bbsImage('2023/10/RT-X_.jpg'), source: bbsPage('2138') },
  { id: 'rf', model: 'RF', construction: 'One-Piece', design: 'Five-Spoke', description: 'A clean five-spoke forged form with a light, understated visual language.', image: bbsImage('2016/10/RF_top.jpg'), source: bbsPage('1160') },
  { id: 're-l2', model: 'RE-L2', construction: 'One-Piece', design: 'Multi-Spoke', description: 'A refined multi-spoke wheel with a compact and elegant design direction.', image: bbsImage('2016/10/RE-L2_top.jpg'), source: bbsPage('1226') },
  { id: 'rp', model: 'RP', construction: 'One-Piece', design: 'Multi-Spoke', description: 'A light, compact multi-spoke design for smaller vehicle applications.', image: bbsImage('2016/10/newRP.jpg'), source: bbsPage('1174') },
  { id: 'rs-gt', model: 'RS-GT', construction: 'Two-Piece', design: 'Split-Spoke', description: 'A lightweight split-spoke design in a two-piece forged architecture.', image: bbsImage('2016/10/RS-GT_top.jpg'), source: bbsPage('1253') },
];
