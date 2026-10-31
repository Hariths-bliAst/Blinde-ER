/**
 * Blind-ER Screen 4 & 5: MoreHubScreen.js
 * Houses the Saved Audiobook Library + Smart Wearable Extensions with true sentence-level Pause & Resume.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import FeatureLayoutTemplate from '../components/FeatureLayoutTemplate';
import AccessibleTouchable, {
  speakAssistivePrompt,
} from '../components/AccessibleTouchable';
import {
  speakAudiobookPassage,
  pauseSpeech,
  stopSpeech,
} from '../../logic/ttsService';

const SAVED_AUDIOBOOKS = [
  {
    title: 'The Silent Lighthouse',
    chapter: 'Chapter IV • Saved Audiobook',
    text: 'Chapter Four: The Silent Lighthouse. The wind howled across the jagged cliffs of Northumberland, carrying with it the bitter scent of salt and an approaching storm. Elara clutched her weathered lantern tighter.',
  },
  {
    title: 'Beneath Northern Stars',
    chapter: 'Chapter V • Saved Audiobook',
    text: 'Chapter Five: Beneath Northern Stars. Elara raised her lantern toward the ancient stone tower as the distant bell echoed three times across the freezing bay.',
  },
  {
    title: 'Designing Without Sight',
    chapter: 'Chapter I • Voice-First Edition',
    text: 'Chapter One: Designing Without Sight. True accessibility begins when every action on a screen can be discovered safely by touch and confirmed clearly by voice.',
  },
];

export default function MoreHubScreen({ navigation }) {
  const [bookIdx, setBookIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const currentBook = SAVED_AUDIOBOOKS[bookIdx];

  useEffect(() => {
    speakAssistivePrompt('Library and Wearables.');
    return () => {
      pauseSpeech();
    };
  }, []);

  const togglePlayBook = () => {
    if (isPlaying) {
      pauseSpeech();
      setIsPlaying(false);
      setIsPaused(true);
    } else {
      const resumeCurrent = isPaused;
      setIsPlaying(true);
      setIsPaused(false);
      speakAudiobookPassage({
        text: `${currentBook.title}. ${currentBook.text}`,
        targetLanguage: 'English',
        resume: resumeCurrent,
        onDone: () => {
          setIsPlaying(false);
          setIsPaused(false);
        },
      });
    }
  };

  const handleNextBook = () => {
    stopSpeech();
    const next = (bookIdx + 1) % SAVED_AUDIOBOOKS.length;
    setBookIdx(next);
    setIsPlaying(false);
    setIsPaused(false);
    speakAssistivePrompt(SAVED_AUDIOBOOKS[next].title);
  };

  const primaryLabel = isPlaying ? 'Pause' : isPaused ? 'Resume' : 'Play';

  return (
    <FeatureLayoutTemplate
      featureTitle="Library and Extensions"
      onBack={() => navigation?.navigate?.('Home')}
      primaryAction={{
        label: primaryLabel,
        icon: isPlaying ? '⏸' : '▶',
        hint: isPlaying
          ? 'Double tap to pause.'
          : isPaused
            ? 'Double tap to resume.'
            : 'Double tap to play.',
        onDoubleTap: togglePlayBook,
      }}
      secondaryAction={{
        label: 'Glasses',
        icon: '🕶️',
        hint: 'Double tap for smart glasses.',
        onDoubleTap: () => navigation?.navigate?.('HardwareHub'),
      }}
      nextLabel="Next"
      nextHint="Double tap for next book."
      onNext={handleNextBook}
    >
      <View style={styles.wrapper}>
        {/* Audiobook Library Player Card */}
        <AccessibleTouchable
          label={currentBook.title}
          ttsHint="Double tap to play or pause."
          onDoubleTap={togglePlayBook}
          style={styles.libraryHeroCard}
        >
          <Text style={styles.eyebrowDark}>
            📚 AUDIOBOOK LIBRARY ({bookIdx + 1}/{SAVED_AUDIOBOOKS.length})
          </Text>
          <Text style={styles.bookTitleDark}>{currentBook.title}</Text>
          <Text style={styles.bookSubDark}>{currentBook.chapter}</Text>
        </AccessibleTouchable>

        {/* Chapter Transcript */}
        <View style={styles.readerCard}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.chapterBody}>{currentBook.text}</Text>
          </ScrollView>
        </View>

        <AccessibleTouchable
          label="Smart Glasses and Be My Eyes"
          ttsHint="Double tap to open."
          onDoubleTap={() => navigation?.navigate?.('HardwareHub')}
          style={styles.extensionRowCard}
        >
          <Text style={styles.extTitle}>
            🕶️ Smart Glasses & 🤝 Be My Eyes →
          </Text>
        </AccessibleTouchable>
      </View>
    </FeatureLayoutTemplate>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    gap: 12,
  },
  libraryHeroCard: {
    flex: 3.5,
    width: '100%',
    backgroundColor: '#F5C518',
    borderRadius: 24,
    padding: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyebrowDark: {
    color: '#1A1A1C',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  bookTitleDark: {
    color: '#000000',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  bookSubDark: {
    color: '#1A1A1C',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  readerCard: {
    flex: 4.5,
    width: '100%',
    backgroundColor: '#141416',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#26262A',
    padding: 18,
  },
  chapterBody: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
  extensionRowCard: {
    flex: 2,
    width: '100%',
    backgroundColor: '#141416',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F5C518',
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  extTitle: {
    color: '#F5C518',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
});
