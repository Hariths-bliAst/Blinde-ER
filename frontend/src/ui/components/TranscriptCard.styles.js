/**
 * Dedicated Stylesheet for TranscriptCard (MATTHEW'S UI WORKSPACE)
 */

import { StyleSheet } from 'react-native';
import { THEME } from '../theme/theme';

export const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: THEME.colors.backgroundElevated,
    borderWidth: THEME.borders.thickWidth,
    borderColor: THEME.colors.accentCyan,
    borderRadius: THEME.borders.radiusMd,
    padding: THEME.spacing.md,
    marginVertical: THEME.spacing.xs,
  },
  sectionHeading: {
    color: THEME.colors.accentCyan,
    fontSize: THEME.typography.badgeSize,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: THEME.spacing.xs,
  },
  narratedBodyText: {
    color: THEME.colors.textPrimary,
    fontSize: THEME.typography.bodyLargeSize,
    fontWeight: '700',
    lineHeight: 34,
  },
  placeholderText: {
    color: THEME.colors.textSecondary,
    fontSize: THEME.typography.statusSize,
    fontWeight: '600',
    lineHeight: 32,
  },
});

