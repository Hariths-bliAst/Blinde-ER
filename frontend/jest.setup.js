import React from 'react';

jest.mock('expo/virtual/env', () => ({
  env: {},
}), { virtual: true });

jest.mock('react-native', () => {
  const ReactLib = require('react');

  const createHostComponent = (name) => {
    const Component = ReactLib.forwardRef((props, ref) => {
      const { style, disabled, onPress, children, ...rest } = props;
      const resolvedStyle =
        typeof style === 'function' ? style({ pressed: false }) : style;
      return ReactLib.createElement(
        name,
        {
          ...rest,
          ref,
          disabled,
          style: resolvedStyle,
          onPress: disabled ? undefined : onPress,
        },
        children
      );
    });
    Component.displayName = name;
    return Component;
  };

  return {
    View: createHostComponent('View'),
    Text: createHostComponent('Text'),
    TextInput: createHostComponent('TextInput'),
    Image: createHostComponent('Image'),
    Switch: createHostComponent('Switch'),
    Modal: createHostComponent('Modal'),
    Pressable: createHostComponent('Pressable'),
    SafeAreaView: createHostComponent('SafeAreaView'),
    ScrollView: createHostComponent('ScrollView'),
    StatusBar: createHostComponent('StatusBar'),
    StyleSheet: {
      create: (styles) => styles,
      flatten: (style) => {
        if (!style) return {};
        if (Array.isArray(style)) {
          const flat = style.flat(Infinity).filter(Boolean);
          return Object.assign({}, ...flat);
        }
        return style;
      },
    },
    AccessibilityInfo: {
      announceForAccessibility: jest.fn(),
      isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
    },
  };
});

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn(() => Promise.resolve(false)),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

const mockRequestPermission = jest.fn(() =>
  Promise.resolve({ granted: true, status: 'granted' })
);
const mockUseCameraPermissions = jest.fn(() => [
  { granted: true, status: 'granted' },
  mockRequestPermission,
]);

jest.mock('expo-camera', () => {
  const ReactLib = require('react');
  const CameraView = ReactLib.forwardRef((props, ref) => {
    ReactLib.useImperativeHandle(ref, () => ({
      takePictureAsync: jest.fn(() =>
        Promise.resolve({ uri: 'file:///captured-book-page.jpg' })
      ),
    }));
    return ReactLib.createElement('CameraView', props);
  });
  CameraView.displayName = 'CameraView';

  return {
    CameraView,
    useCameraPermissions: (...args) => mockUseCameraPermissions(...args),
    __mockUseCameraPermissions: mockUseCameraPermissions,
    __mockRequestPermission: mockRequestPermission,
  };
});
