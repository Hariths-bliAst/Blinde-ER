/**
 * Dedicated Stylesheet for AccessibleTouchOverlay (MATTHEW'S COMPLETED UI DELIVERABLE)
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
    paddingTop: THEME.spacing.lg,
    paddingBottom: THEME.spacing.md,
  },
  fullScreenResponderPressed: {
    borderColor: THEME.colors.accentCyan,
    backgroundColor: '#0A161E',
  },
  gestureFooterBar: {
    backgroundColor: THEME.colors.backgroundElevated,
    borderWidth: THEME.borders.thickWidth,
    borderColor: THEME.colors.accentYellow,
    borderRadius: THEME.borders.radiusMd,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
    marginTop: THEME.spacing.xs,
  },
  gestureGuideTitle: {
    color: THEME.colors.accentYellow,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 8,
  },
  gestureGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  gestureBadgeCard: {
    flex: 1,
    backgroundColor: '#1C1C28',
    borderWidth: 2,
    borderColor: '#FFD600',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
  },
  gestureBadgeTrigger: {
    color: THEME.colors.accentYellow,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 3,
    textAlign: 'center',
  },
  gestureBadgeAction: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
});
