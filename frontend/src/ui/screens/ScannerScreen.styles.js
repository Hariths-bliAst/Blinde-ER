/**
 * Dedicated Stylesheet for ScannerScreen (MATTHEW'S UI WORKSPACE)
 */

import { StyleSheet } from 'react-native';
import { THEME } from '../theme/theme';

export const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: THEME.colors.backgroundPrimary,
  },
  cameraPreviewWrapper: {
    height: 150,
    width: '100%',
    borderRadius: THEME.borders.radiusMd,
    borderWidth: THEME.borders.thickWidth,
    borderColor: THEME.colors.accentYellow,
    overflow: 'hidden',
    marginBottom: THEME.spacing.xs,
    backgroundColor: '#1A1A24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraView: {
    flex: 1,
    width: '100%',
  },
  cameraOverlayBadge: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.accentYellow,
  },
  cameraOverlayText: {
    color: THEME.colors.accentYellow,
    fontSize: 16,
    fontWeight: '800',
  },
  cameraPermissionFallbackText: {
    color: THEME.colors.textSecondary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: THEME.spacing.md,
  },
});

