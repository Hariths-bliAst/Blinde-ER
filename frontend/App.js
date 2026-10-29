/**
 * Blind-ER Root Application Entrypoint
 * Connects the isolated logic hook (`useScannerController`) to Matthew's
 * presentational UI screen (`ScannerScreen`).
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useScannerController } from './src/logic/useScannerController';
import ScannerScreen from './src/ui/screens/ScannerScreen';

export default function App() {
  const controllerProps = useScannerController();

  return (
    <>
      <StatusBar style="light" backgroundColor="#000000" />
      <ScannerScreen {...controllerProps} />
    </>
  );
}

