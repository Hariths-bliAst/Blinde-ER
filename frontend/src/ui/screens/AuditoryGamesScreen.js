/**
 * Blind-ER Screen 6: AuditoryGamesScreen.js
 * 4 Playable Auditory Games:
 *   1. Pitch Training (Higher vs. Lower frequency)
 *   2. Note Recognising (Identify A4, C4, E4, G4)
 *   3. Chord Identifying (Major vs. Minor vs. Diminished Triad)
 *   4. Audio Pattern Match (3-Note Spatial Contour Memory)
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FeatureLayoutTemplate from '../components/FeatureLayoutTemplate';
import AccessibleTouchable, {
  speakAssistivePrompt,
} from '../components/AccessibleTouchable';

const GAMES = [
  {
    id: 'PITCH',
    title: 'Pitch Training',
    prompt: 'Reference tone 440 Hz followed by 587 Hz. Is the 2nd tone Higher or Lower?',
    choices: ['Higher Pitch', 'Lower Pitch', 'Same Pitch'],
    correctIdx: 0,
    audioDescription: 'Playing 440 Hertz... Now playing 587 Hertz.',
  },
  {
    id: 'NOTE',
    title: 'Note Recognising',
    prompt: 'Identify the concert reference note played with harmonic overtones.',
    choices: ['Note A4 (440 Hz)', 'Note C4 (261 Hz)', 'Note E4 (330 Hz)', 'Note G4 (392 Hz)'],
    correctIdx: 0,
    audioDescription: 'Playing concert pitch Note A 4, 440 Hertz.',
  },
  {
    id: 'CHORD',
    title: 'Chord Identifying',
    prompt: 'Three notes played simultaneously as a triad. Identify the chord quality!',
    choices: ['C Major Triad (Bright)', 'A Minor Triad (Warm)', 'B Diminished Triad (Tense)'],
    correctIdx: 0,
    audioDescription: 'Playing triad: C 4, E 4, and G 4 together.',
  },
  {
    id: 'MEMORY',
    title: 'Audio Pattern Match',
    prompt: 'Memorize the 3-note spatial melody contour and match its shape!',
    choices: ['Low -> Mid -> High', 'High -> Mid -> Low', 'Low -> High -> Low (Arch)'],
    correctIdx: 2,
    audioDescription: 'Playing 3-note pattern: Low 330 Hz, High 660 Hz, Low 330 Hz.',
  },
];

export default function AuditoryGamesScreen({ navigation }) {
  const [gameIdx, setGameIdx] = useState(0);
  const [choiceIdx, setChoiceIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const currentGame = GAMES[gameIdx];
  const currentChoice = currentGame.choices[choiceIdx];

  useEffect(() => {
    speakAssistivePrompt(
      `Auditory Games Suite. Game 1 of 4: ${currentGame.title}. ${currentGame.prompt}`
    );
  }, []);

  const playSoundChallenge = () => {
    speakAssistivePrompt(currentGame.audioDescription);
  };

  const cycleChoice = () => {
    const next = (choiceIdx + 1) % currentGame.choices.length;
    setChoiceIdx(next);
    speakAssistivePrompt(
      `Selected choice: ${currentGame.choices[next]}. Tap Next in the bottom bar to submit.`
    );
  };

  const submitAnswer = () => {
    if (choiceIdx === currentGame.correctIdx) {
      const nextScore = score + 10;
      const nextStreak = streak + 1;
      setScore(nextScore);
      setStreak(nextStreak);
      speakAssistivePrompt(
        `Correct! ${currentChoice}. Score is now ${nextScore}, streak ${nextStreak}.`
      );
    } else {
      setStreak(0);
      speakAssistivePrompt(
        `Not quite. You chose ${currentChoice}. Tap Hear to listen again or cycle your choice.`
      );
    }
  };

  const switchGameMode = () => {
    const next = (gameIdx + 1) % GAMES.length;
    setGameIdx(next);
    setChoiceIdx(0);
    speakAssistivePrompt(
      `Switched to Game ${next + 1}: ${GAMES[next].title}. ${GAMES[next].prompt}`
    );
  };

  return (
    <FeatureLayoutTemplate
      featureTitle="Auditory Games Suite"
      onBack={() => navigation?.navigate?.('Home')}
      primaryAction={{
        label: 'Hear',
        icon: '🎵',
        hint: 'Tap again to hear the sound challenge.',
        onDoubleTap: playSoundChallenge,
      }}
      secondaryAction={{
        label: 'Choice',
        icon: '⇄',
        hint: 'Tap again to cycle your answer choice.',
        onDoubleTap: cycleChoice,
      }}
      nextLabel="Submit"
      nextHint="Tap again to check if your selected answer is correct."
      onNext={submitAnswer}
      overflowActions={[
        {
          label: 'Switch Game Mode',
          onExecute: switchGameMode,
        },
      ]}
    >
      <View style={styles.container}>
        <AccessibleTouchable
          label={`${currentGame.title}. Score ${score}, Streak ${streak}.`}
          ttsHint="Tap again to hear the sound challenge."
          onDoubleTap={playSoundChallenge}
          style={styles.gameHeaderCard}
        >
          <Text style={styles.badgeText}>
            GAME {gameIdx + 1}/4 • SCORE: {score} • STREAK: {streak}
          </Text>
          <Text style={styles.gameTitle}>{currentGame.title}</Text>
          <Text style={styles.gamePrompt}>{currentGame.prompt}</Text>
        </AccessibleTouchable>

        <AccessibleTouchable
          label={`Current Answer Choice: ${currentChoice}`}
          ttsHint="Tap again to cycle to the next answer choice."
          onDoubleTap={cycleChoice}
          style={styles.choiceCard}
        >
          <Text style={styles.choiceLabel}>SELECTED ANSWER</Text>
          <Text style={styles.choiceValue}>{currentChoice}</Text>
        </AccessibleTouchable>
      </View>
    </FeatureLayoutTemplate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 14,
  },
  gameHeaderCard: {
    flex: 5,
    width: '100%',
    backgroundColor: '#F5C518',
    borderRadius: 24,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#1A1A1C',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  gameTitle: {
    color: '#000000',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  gamePrompt: {
    color: '#141416',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },
  choiceCard: {
    flex: 5,
    width: '100%',
    backgroundColor: '#141416',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#26262A',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  choiceLabel: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  choiceValue: {
    color: '#F5C518',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
});
