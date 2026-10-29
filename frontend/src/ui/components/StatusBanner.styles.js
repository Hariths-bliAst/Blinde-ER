/**
 * Dedicated Stylesheet for StatusBanner (MATTHEW'S UI WORKSPACE)
 */

import { StyleSheet } from 'react-native';
import { THEME } from '../theme/theme';

export const styles = StyleSheet.create({
  bannerContainer: {
    width: '100%',
    backgroundColor: THEME.colors.backgroundElevated,
    borderWidth: THEME.borders.thickWidth,
    borderColor: THEME.colors.accentYellow,
    borderRadius: THEME.borders.radiusMd,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  bannerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.xs,
  },
  appBrandText: {
    color: THEME.colors.accentYellow,
    fontSize: THEME.typography.titleSize,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  languagePill: {
    backgroundColor: THEME.colors.accentCyan,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  languagePillText: {
    color: THEME.colors.backgroundPrimary,
    fontSize: THEME.typography.badgeSize,
    fontWeight: '900',
  },
  statusBadgeText: {
    color: THEME.colors.accentGreen,
    fontSize: THEME.typography.badgeSize,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statusBadgeError: {
    color: THEME.colors.accentRed,
  },
  statusMessageText: {
    color: THEME.colors.textPrimary,
    fontSize: THEME.typography.statusSize,
    fontWeight: '700',
    lineHeight: 30,
  },
});

