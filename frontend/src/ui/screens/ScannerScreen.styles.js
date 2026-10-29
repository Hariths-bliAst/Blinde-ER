/**
 * Dedicated Stylesheet for ScannerScreen (MATTHEW'S COMPLETED UI DELIVERABLE)
 */

import { StyleSheet } from 'react-native';
import { THEME } from '../theme/theme';

export const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: THEME.colors.backgroundPrimary,
  },
  cameraPreviewWrapper: {
    height: 145,
    width: '100%',
    borderRadius: THEME.borders.radiusMd,
    borderWidth: THEME.borders.thickWidth,
    borderColor: THEME.colors.accentYellow,
    overflow: 'hidden',
    marginBottom: THEME.spacing.xs,
    backgroundColor: '#12121A',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cameraView: {
    flex: 1,
    width: '100%',
  },
  reticleCornerTopLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 24,
    height: 24,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: THEME.colors.accentYellow,
  },
  reticleCornerTopRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: THEME.colors.accentYellow,
  },
  reticleCornerBottomLeft: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    width: 24,
    height: 24,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: THEME.colors.accentYellow,
  },
  reticleCornerBottomRight: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 24,
    height: 24,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: THEME.colors.accentYellow,
  },
  cameraOverlayBadge: {
    position: 'absolute',
    bottom: 8,
    left: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: THEME.colors.accentYellow,
  },
  cameraOverlayText: {
    color: THEME.colors.accentYellow,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  cameraPermissionFallbackText: {
    color: THEME.colors.textSecondary,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: THEME.spacing.md,
  },
});
