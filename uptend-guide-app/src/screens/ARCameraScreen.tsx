import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { guidePhotoAnalyze } from '../api/client';
import { Colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

interface ServiceTag {
  id: string;
  label: string;
  price: string;
  x: number;
  y: number;
}

const MOCK_TAGS: ServiceTag[] = [
  { id: '1', label: 'Lawn Mowing', price: '$45', x: 0.3, y: 0.5 },
  { id: '2', label: 'Tree Trimming', price: '$180', x: 0.7, y: 0.3 },
  { id: '3', label: 'Pressure Wash', price: '$120', x: 0.5, y: 0.8 },
];

export default function ARCameraScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [tags, setTags] = useState<ServiceTag[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanned, setScanned] = useState(false);
  const cameraRef = useRef<any>(null);

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.permText}>Camera access needed for AR features</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Access</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleScan = async () => {
    if (!cameraRef.current || analyzing) return;
    setAnalyzing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: false });

      // Send to backend for analysis
      const formData = new FormData();
      formData.append('photo', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'ar-scan.jpg',
      } as any);
      formData.append('mode', 'ar_overlay');

      try {
        const result = await guidePhotoAnalyze(formData);
        if (result.tags) {
          setTags(result.tags);
        } else {
          setTags(MOCK_TAGS);
        }
      } catch {
        // Use mock data when backend unavailable
        setTags(MOCK_TAGS);
      }

      setScanned(true);
    } catch (e) {
      console.error('AR scan failed:', e);
      setTags(MOCK_TAGS);
      setScanned(true);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleTagPress = (tag: ServiceTag) => {
    navigation.navigate('Bud', { prefill: `Get a quote for ${tag.label}` });
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        {/* AR Overlay */}
        {scanned && tags.map((tag) => (
          <TouchableOpacity
            key={tag.id}
            style={[
              styles.tag,
              { left: tag.x * width - 60, top: tag.y * (height - 200) },
            ]}
            onPress={() => handleTagPress(tag)}
            activeOpacity={0.8}
          >
            <View style={styles.tagArrow} />
            <Text style={styles.tagLabel}>{tag.label}</Text>
            <Text style={styles.tagPrice}>{tag.price}</Text>
          </TouchableOpacity>
        ))}

        {/* Scanning overlay */}
        {analyzing && (
          <View style={styles.scanOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.scanText}>Analyzing area...</Text>
          </View>
        )}

        {/* Crosshair */}
        {!scanned && !analyzing && (
          <View style={styles.crosshair}>
            <View style={[styles.crossLine, styles.crossH]} />
            <View style={[styles.crossLine, styles.crossV]} />
          </View>
        )}
      </CameraView>

      {/* Bottom controls */}
      <SafeAreaView edges={['bottom']} style={styles.controls}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.scanBtn, analyzing && styles.scanBtnDisabled]}
          onPress={scanned ? () => { setScanned(false); setTags([]); } : handleScan}
          disabled={analyzing}
        >
          <Text style={styles.scanBtnText}>{scanned ? 'Rescan' : 'Scan Area'}</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          {scanned ? 'Tap a tag to get a quote' : 'Point at your yard or room'}
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: 24 },
  permText: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', marginBottom: 16 },
  permBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  permBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  camera: { flex: 1 },
  tag: {
    position: 'absolute',
    backgroundColor: 'rgba(244, 124, 32, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  tagArrow: {
    position: 'absolute',
    bottom: -8,
    width: 16,
    height: 16,
    backgroundColor: 'rgba(244, 124, 32, 0.95)',
    transform: [{ rotate: '45deg' }],
  },
  tagLabel: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  tagPrice: { color: Colors.white, fontSize: 18, fontWeight: '800', marginTop: 2 },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanText: { color: Colors.white, fontSize: 16, fontWeight: '600', marginTop: 12 },
  crosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -25,
    marginTop: -25,
    width: 50,
    height: 50,
  },
  crossLine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.7)' },
  crossH: { width: 50, height: 2, top: 24, left: 0 },
  crossV: { width: 2, height: 50, top: 0, left: 24 },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  backBtn: { position: 'absolute', left: 20, top: 16 },
  backText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  scanBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 30,
    paddingHorizontal: 40,
    paddingVertical: 16,
    marginBottom: 8,
  },
  scanBtnDisabled: { opacity: 0.5 },
  scanBtnText: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  hint: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 8 },
});
