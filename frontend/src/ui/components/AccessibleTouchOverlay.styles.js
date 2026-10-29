/**
 * Dedicated Stylesheet for AccessibleTouchOverlay (MATTHEW'S UI WORKSPACE)
 */

import { StyleSheet } from 'react-native';
import { THEME } from '../theme/theme';

export const styles = StyleSheet.create({
  fullScreenResponder: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: THEME.colors.backgroundPrimary,
    borderWidth: THEME.borders.extraThickWidth,
    borderColor: THEME.colors.accentYellow,
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.xl,
    paddingBottom: THEME.spacing.lg,
  },
  fullScreenResponderPressed: {
    borderColor: THEME.colors.accentCyan,
    backgroundColor: '#09141A',
  },
  gestureFooterBar: {
    backgroundColor: THEME.colors.backgroundElevated,
    borderWidth: THEME.borders.thickWidth,
    borderColor: THEME.colors.accentYellow,
    borderRadius: THEME.borders.radiusMd,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    marginTop: THEME.spacing.sm,
  },
  gestureGuideTitle: {
    color: THEME.colors.accentYellow,
    fontSize: THEME.typography.badgeSize,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: THEME.spacing.xs,
  },
  gestureInstructionText: {
    color: THEME.colors.textPrimary,
    fontSize: THEME.typography.gestureHintSize,
    fontWeight: '700',
    lineHeight: 28,
  },
});

