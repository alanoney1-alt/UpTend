import React from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export async function pickPhoto(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Please allow photo library access.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });
  if (result.canceled) return null;
  return result.assets[0].uri;
}

export async function takePhoto(): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Please allow camera access.');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
  if (result.canceled) return null;
  return result.assets[0].uri;
}

export function showPhotoOptions(onPhoto: (uri: string) => void) {
  Alert.alert('Add Photo', 'Choose a source', [
    { text: 'Camera', onPress: async () => { const u = await takePhoto(); if (u) onPhoto(u); } },
    { text: 'Gallery', onPress: async () => { const u = await pickPhoto(); if (u) onPhoto(u); } },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
