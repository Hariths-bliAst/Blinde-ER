/**
 * Blind-ER Screen 4 & 5: MoreHubScreen.js
 * Houses the Saved Audiobook Library + Assistive Extensions (Ray-Ban Meta Smart Glasses & Be My Eyes Bridge).
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import FeatureLayoutTemplate from '../components/FeatureLayoutTemplate';
import AccessibleTouchable, {
  speakAssistivePrompt,
} from '../components/AccessibleTouchable';

const SAVED_AUDIOBOOKS = [
  {
    title: 'The Silent Lighthouse',
    chapter: 'Chapter IV • Scanned via CRNN (99.62%)',
    text: 'Chapter Four: The Silent Lighthouse. The wind howled across the jagged cliffs of Northumberland, carrying with it the bitter scent of salt and an approaching storm.',
  },
  {
    title: 'Beneath Northern Stars',
    chapter: 'Chapter V • Scanned via CRNN (99.62%)',
    text: 'Chapter Five: Beneath Northern Stars. Elara raised her lantern toward the ancient stone tower as the distant bell echoed three times across the freezing bay.',
  },
  {
    title: 'Designing Without Sight',
    chapter: 'Chapter I • Tactile & Voice-First Architecture',
    text: 'Chapter One: Designing Without Sight. True accessibility begins when every action on a screen can be discovered safely by touch and confirmed clearly by voice.',
  },
];

export default function MoreHubScreen({ navigation }) {
  const [bookIdx, setBookIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentBook = SAVED_AUDIOBOOKS[bookIdx];

  useEffect(() => {
    speakAssistivePrompt(
      'More Hub opened. Contains your saved Audiobook Library plus Ray-Ban Meta Smart Glasses and Be My Eyes extensions.'
    );
  }, []);

  const togglePlayBook = () => {
    if (isPlaying) {
      setIsPlaying(false);
      speakAssistivePrompt('Audiobook paused.');
    } else {
      setIsPlaying(true);
      speakAssistivePrompt(`${currentBook.title}. ${currentBook.text}`, {
        onDone: () => setIsPlaying(false),
      });
    }
  };

  const handleNextBook = () => {
    const next = (bookIdx + 1) % SAVED_AUDIOBOOKS.length;
    setBookIdx(next);
    setIsPlaying(false);
    speakAssistivePrompt(
      `Selected Book ${next + 1}: ${SAVED_AUDIOBOOKS[next].title}.`
    );
  };

  return (
    <FeatureLayoutTemplate
      featureTitle="More Hub: Audiobook Library and Extensions"
      onBack={() => navigation?.navigate?.('Home')}
      primaryAction={{
        label: isPlaying ? 'Pause' : 'Play Book',
        icon: isPlaying ? '⏸' : '▶',
        hint: 'Tap again to play or pause the current audiobook in your library.',
        onDoubleTap: togglePlayBook,
      }}
      secondaryAction={{
        label: 'Extensions',
        icon: '🕶️',
        hint: 'Tap again to open Ray-Ban Meta Smart Glasses and Be My Eyes extensions.',
        onDoubleTap: () => navigation?.navigate?.('HardwareHub'),
      }}
      nextLabel="Next Book"
      nextHint="Tap again to switch to the next saved audiobook in your library."
      onNext={handleNextBook}
    >
      <View style={styles.wrapper}>
        {/* Audiobook Library Player Card */}
        <AccessibleTouchable
          label={`Audiobook Library: ${currentBook.title}, ${currentBook.chapter}`}
          ttsHint="Tap again to play or pause this audiobook chapter."
          onDoubleTap={togglePlayBook}
          style={styles.libraryHeroCard}
        >
          <Text style={styles.eyebrowDark}>
            📚 AUDIOBOOK LIBRARY ({bookIdx + 1}/{SAVED_AUDIOBOOKS.length})
          </Text>
          <Text style={styles.bookTitleDark}>{currentBook.title}</Text>
          <Text style={styles.bookSubDark}>{currentBook.chapter}</Text>
        </AccessibleTouchable>

        {/* Chapter Transcript & Extensions Links */}
        <View style={styles.readerCard}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.chapterBody}>{currentBook.text}</Text>
          </ScrollView>
        </View>

        <AccessibleTouchable
          label="Assistive Extensions: Ray-Ban Meta Smart Glasses and Be My Eyes Bridge"
          ttsHint="Tap again to open wearable and volunteer extensions."
          onDoubleTap={() => navigation?.navigate?.('HardwareHub')}
          style={styles.extensionRowCard}
        >
          <Text style={styles.extTitle}>
            🕶️ Meta Glasses & 🤝 Be My Eyes Extensions →
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
