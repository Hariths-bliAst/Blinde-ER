/**
 * Blind-ER Screen 6: AuditoryGamesScreen.js
 * 4 Playable Auditory Games with concise voice prompts:
 *   1. Pitch Training
 *   2. Note Recognising
 *   3. Chord Identifying
 *   4. Audio Pattern Match
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
    prompt: 'Is the second tone higher or lower?',
    choices: ['Higher Pitch', 'Lower Pitch', 'Same Pitch'],
    correctIdx: 0,
    audioDescription: 'Tone one: 440 Hertz. Tone two: 587 Hertz.',
  },
  {
    id: 'NOTE',
    title: 'Note Recognising',
    prompt: 'Identify the reference musical note.',
    choices: ['Note A4', 'Note C4', 'Note E4', 'Note G4'],
    correctIdx: 0,
    audioDescription: 'Playing Note A 4.',
  },
  {
    id: 'CHORD',
    title: 'Chord Identifying',
    prompt: 'Identify the three-note chord quality.',
    choices: ['C Major Triad', 'A Minor Triad', 'B Diminished Triad'],
    correctIdx: 0,
    audioDescription: 'Playing C Major triad.',
  },
  {
    id: 'MEMORY',
    title: 'Audio Pattern Match',
    prompt: 'Match the three-note melody contour.',
    choices: ['Low -> Mid -> High', 'High -> Mid -> Low', 'Low -> High -> Low'],
    correctIdx: 2,
    audioDescription: 'Low, High, Low.',
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
    speakAssistivePrompt(`${currentGame.title}. ${currentGame.prompt}`);
  }, []);

  const playSoundChallenge = () => {
    speakAssistivePrompt(currentGame.audioDescription);
  };

  const cycleChoice = () => {
    const next = (choiceIdx + 1) % currentGame.choices.length;
    setChoiceIdx(next);
    speakAssistivePrompt(currentGame.choices[next]);
  };

  const submitAnswer = () => {
    if (choiceIdx === currentGame.correctIdx) {
      const nextScore = score + 10;
      const nextStreak = streak + 1;
      setScore(nextScore);
      setStreak(nextStreak);
      speakAssistivePrompt(`Correct. Score ${nextScore}.`);
    } else {
      setStreak(0);
      speakAssistivePrompt('Try again.');
    }
  };

  const switchGameMode = () => {
    const next = (gameIdx + 1) % GAMES.length;
    setGameIdx(next);
    setChoiceIdx(0);
    speakAssistivePrompt(`${GAMES[next].title}.`);
  };

  return (
    <FeatureLayoutTemplate
      featureTitle="Auditory Games"
      onBack={() => navigation?.navigate?.('Home')}
      primaryAction={{
        label: 'Hear',
        icon: '🎵',
        hint: 'Double tap to hear sound.',
        onDoubleTap: playSoundChallenge,
      }}
      secondaryAction={{
        label: 'Choice',
        icon: '⇄',
        hint: 'Double tap to switch choice.',
        onDoubleTap: cycleChoice,
      }}
      nextLabel="Submit"
      nextHint="Double tap to submit."
      onNext={submitAnswer}
      overflowActions={[
        {
          label: 'Switch Game',
          onExecute: switchGameMode,
        },
      ]}
    >
      <View style={styles.container}>
        <AccessibleTouchable
          label={currentGame.title}
          ttsHint="Double tap to hear sound."
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
          label={currentChoice}
          ttsHint="Double tap to switch choice."
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
