/**
 * Dedicated Stylesheet for TranscriptCard (MATTHEW'S COMPLETED UI DELIVERABLE)
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
  headerToolbarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.xs,
    flexWrap: 'wrap',
    gap: 6,
  },
  sectionHeading: {
    color: THEME.colors.accentCyan,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  toolbarButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accessibilityTogglePill: {
    backgroundColor: '#222230',
    borderWidth: 2,
    borderColor: THEME.colors.accentYellow,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  accessibilityToggleText: {
    color: THEME.colors.accentYellow,
    fontSize: 13,
    fontWeight: '900',
  },
  narratedBodyText: {
    color: THEME.colors.textPrimary,
    fontSize: THEME.typography.bodyLargeSize,
    fontWeight: '700',
    lineHeight: 34,
  },
  narratedBodyTextExtraLarge: {
    fontSize: THEME.typography.bodyExtraLargeSize,
    lineHeight: 42,
  },
  rawOcrComparisonBox: {
    marginTop: THEME.spacing.sm,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 2,
    borderTopColor: '#333348',
  },
  rawOcrLabel: {
    color: THEME.colors.accentYellow,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  rawOcrBodyText: {
    color: THEME.colors.textSecondary,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
  },
  placeholderText: {
    color: THEME.colors.textSecondary,
    fontSize: THEME.typography.statusSize,
    fontWeight: '600',
    lineHeight: 30,
  },
});
