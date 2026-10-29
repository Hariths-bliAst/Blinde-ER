/**
 * Dedicated Stylesheet for StatusBanner (MATTHEW'S COMPLETED UI DELIVERABLE)
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
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    marginBottom: THEME.spacing.xs,
  },
  bannerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.xs,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  highContrastDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: THEME.colors.accentYellow,
    marginRight: 8,
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
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  languagePillText: {
    color: THEME.colors.backgroundPrimary,
    fontSize: THEME.typography.badgeSize,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  stateBadgePill: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 6,
  },
  stateBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  statusMessageText: {
    color: THEME.colors.textPrimary,
    fontSize: THEME.typography.statusSize,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: THEME.spacing.xs,
  },
  pipelineStepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2C2C3A',
  },
  pipelineStepPill: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 4,
    marginHorizontal: 2,
    borderRadius: 6,
    backgroundColor: '#1E1E2A',
    borderWidth: 1,
    borderColor: '#3A3A4E',
    alignItems: 'center',
  },
  pipelineStepPillActive: {
    backgroundColor: THEME.colors.accentYellow,
    borderColor: '#FFFFFF',
  },
  pipelineStepPillDone: {
    backgroundColor: '#004D29',
    borderColor: THEME.colors.accentGreen,
  },
  pipelineStepText: {
    color: '#B0B0C0',
    fontSize: 12,
    fontWeight: '800',
  },
  pipelineStepTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  pipelineStepTextDone: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});
