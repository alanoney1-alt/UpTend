import React, { useState } from 'react';
import { View, TouchableOpacity, Image, Text, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PLAYER_WIDTH = SCREEN_WIDTH - 64; // chat bubble padding
const PLAYER_HEIGHT = PLAYER_WIDTH * 9 / 16;

const YT_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/g;

/** Extract all YouTube video IDs from a text string */
export function extractVideoIds(text: string): string[] {
  const ids: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(YT_REGEX.source, 'g');
  while ((m = re.exec(text)) !== null) {
    if (!ids.includes(m[1])) ids.push(m[1]);
  }
  return ids;
}

interface Props {
  videoId: string;
  title?: string;
}

export default function InlineVideoPlayer({ videoId, title }: Props) {
  const [playing, setPlaying] = useState(false);

  if (!videoId) return null;

  const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  if (!playing) {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={() => setPlaying(true)}
        activeOpacity={0.85}
      >
        <Image source={{ uri: thumbUrl }} style={styles.thumb} />
        <View style={styles.overlay}>
          <View style={styles.playBtn}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
        </View>
        {title ? (
          <View style={styles.titleBar}>
            <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  }

  const embedHtml = `
    <!DOCTYPE html>
    <html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
    <style>*{margin:0;padding:0}body{background:#000}iframe{width:100%;height:100%;border:0}</style></head>
    <body><iframe src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1"
    allow="autoplay;encrypted-media" allowfullscreen></iframe></body></html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: embedHtml }}
        style={styles.webview}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 6,
    backgroundColor: '#000',
  },
  thumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    color: '#fff',
    fontSize: 22,
    marginLeft: 3,
  },
  titleBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  titleText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
  webview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
});
