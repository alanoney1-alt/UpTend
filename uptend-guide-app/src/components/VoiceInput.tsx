import React, { useState, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { Colors } from '../theme/colors';

interface Props {
  onRecordingComplete: (uri: string) => void;
}

export default function VoiceInput({ onRecordingComplete }: Props) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } catch (e) {
      console.error('Failed to start recording', e);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    pulse.stopAnimation();
    pulse.setValue(1);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    if (uri) onRecordingComplete(uri);
  };

  return (
    <Animated.View style={{ transform: [{ scale: pulse }] }}>
      <TouchableOpacity
        style={[styles.btn, recording && styles.btnActive]}
        onPressIn={startRecording}
        onPressOut={stopRecording}
        activeOpacity={0.7}
      >
        <Text style={styles.icon}>{recording ? '⏹' : '🎤'}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnActive: { backgroundColor: Colors.error },
  icon: { fontSize: 20 },
});
