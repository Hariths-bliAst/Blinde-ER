/**
 * Blind-ER High-Contrast Accessible Theme Tokens (MATTHEW'S UI WORKSPACE)
 * Safe to edit freely! Designed for WCAG AAA (7:1+) high-contrast legibility
 * for partially sighted users.
 */

export const THEME = {
  colors: {
    backgroundPrimary: '#000000',     // Pure OLED Black for maximum contrast
    backgroundElevated: '#121218',    // Elevated high-contrast card surface
    accentYellow: '#FFD600',          // Safety Yellow (Primary high-vis highlight)
    accentCyan: '#00E5FF',            // High-Vis Cyan (Active AI / Narration state)
    accentGreen: '#00E676',           // Accessible Emerald (Ready / Success state)
    accentRed: '#FF5252',             // High-Vis Coral Red (Error / Alert state)
    textPrimary: '#FFFFFF',           // Crisp White
    textSecondary: '#FFF59D',         // Warm Pale Yellow for secondary labels
    borderHighContrast: '#FFD600',    // Thick high-contrast boundary lines
  },
  typography: {
    titleSize: 28,
    statusSize: 22,
    bodyLargeSize: 24,
    gestureHintSize: 20,
    badgeSize: 18,
    lineHeightMultiplier: 1.45,
  },
  spacing: {
    xs: 8,
    sm: 14,
    md: 20,
    lg: 28,
    xl: 36,
  },
  borders: {
    thickWidth: 3,
    extraThickWidth: 4,
    radiusMd: 16,
    radiusLg: 24,
  },
};

