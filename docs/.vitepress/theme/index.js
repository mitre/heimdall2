// Minimal theme (ADR-005 §2.3.1: "minimal — SAF logo, theme color only").
//
// Phase 1 deliberately ships a pass-through: the theme color travels as a head
// meta tag in config.mjs, and the SAF logo is an image asset that arrives with
// the rest of docs/site/public/ in the Phase 3 content migration. Declaring the
// extension point now — rather than adding it later — is what lets the in-app
// target style itself without touching the published build (vulcan applies its
// in-app stylesheet through exactly this seam).
import DefaultTheme from 'vitepress/theme';

export default DefaultTheme;
