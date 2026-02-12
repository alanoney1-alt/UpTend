import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Animated, Dimensions, StyleSheet, StatusBar, Platform,
} from 'react-native';
import MapView, { Marker, Region, PROVIDER_DEFAULT } from 'react-native-maps';
import { Colors } from '../theme/colors';
import { ProLocation, getAvailableProsNearby } from '../services/ProAvailabilityAPI';
import { liveProTracking, ProUpdateEvent } from '../services/LiveProTracking';
import ProMapMarker from '../components/ProMapMarker';
import ProCard from '../components/ProCard';
import ProListView from '../components/ProListView';

const { height: SCREEN_H } = Dimensions.get('window');
const ORLANDO = { latitude: 28.5383, longitude: -81.3792, latitudeDelta: 0.08, longitudeDelta: 0.08 };

export default function LiveMapScreen({ navigation }: any) {
  const [pros, setPros] = useState<ProLocation[]>([]);
  const [selectedPro, setSelectedPro] = useState<ProLocation | null>(null);
  const [showList, setShowList] = useState(false);
  const [nearbyCount, setNearbyCount] = useState(0);
  const mapRef = useRef<MapView>(null);
  const sheetY = useRef(new Animated.Value(SCREEN_H)).current;

  // Load initial pros
  useEffect(() => {
    (async () => {
      const nearby = await getAvailableProsNearby(ORLANDO.latitude, ORLANDO.longitude, 10);
      setPros(nearby);
      setNearbyCount(nearby.filter(p => p.status !== 'offline').length);
    })();
  }, []);

  // Subscribe to live updates
  useEffect(() => {
    liveProTracking.connect(ORLANDO.latitude, ORLANDO.longitude);

    const unsub = liveProTracking.subscribe((event: ProUpdateEvent) => {
      if (event.type === 'location') {
        setPros(prev => prev.map(p =>
          p.id === event.proId ? { ...p, lat: event.lat, lng: event.lng } : p
        ));
      } else if (event.type === 'status') {
        setPros(prev => prev.map(p =>
          p.id === event.proId ? { ...p, status: event.status, estimatedDoneMin: event.estimatedDoneMin } : p
        ));
      } else if (event.type === 'count') {
        setNearbyCount(event.nearbyCount);
      }
    });

    return () => { unsub(); liveProTracking.disconnect(); };
  }, []);

  const openSheet = useCallback((pro: ProLocation) => {
    setSelectedPro(pro);
    Animated.spring(sheetY, { toValue: SCREEN_H * 0.4, useNativeDriver: false }).start();
  }, []);

  const closeSheet = useCallback(() => {
    Animated.timing(sheetY, { toValue: SCREEN_H, duration: 250, useNativeDriver: false }).start(() => {
      setSelectedPro(null);
    });
  }, []);

  const handleHire = useCallback((pro: ProLocation) => {
    closeSheet();
    navigation.navigate('Guide', {
      prefill: `I'd like to hire ${pro.firstName} ${pro.lastInitial}. for ${pro.services[0]?.name ?? 'a service'}`,
    });
  }, [navigation]);

  if (showList) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.listTopBar}>
          <Text style={styles.countText}>
            <Text style={styles.countNum}>{nearbyCount}</Text> pros near you
          </Text>
          <TouchableOpacity onPress={() => setShowList(false)} style={styles.toggleBtn}>
            <Text style={styles.toggleText}>🗺️ Map</Text>
          </TouchableOpacity>
        </View>
        <ProListView pros={pros} onHire={handleHire} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Map */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        initialRegion={ORLANDO}
        showsUserLocation
        showsMyLocationButton={false}
        mapType="standard"
        onPress={closeSheet}
      >
        {pros.filter(p => p.status !== 'offline').map(pro => (
          <Marker
            key={pro.id}
            coordinate={{ latitude: pro.lat, longitude: pro.lng }}
            onPress={() => openSheet(pro)}
            tracksViewChanges={false}
          >
            <ProMapMarker
              status={pro.status}
              serviceIcon={pro.services[0]?.icon ?? '⭐'}
            />
          </Marker>
        ))}
      </MapView>

      {/* Top banner */}
      <View style={styles.topBanner}>
        <View style={styles.topBar}>
          <View style={styles.countBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.countText}>
              <Text style={styles.countNum}>{nearbyCount}</Text> pros available near you right now
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowList(true)} style={styles.toggleBtn}>
            <Text style={styles.toggleText}>📋 List</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom sheet */}
      <Animated.View style={[styles.sheet, { top: sheetY }]}>
        <View style={styles.sheetHandle} />
        {selectedPro && <ProCard pro={selectedPro} onHire={handleHire} />}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBanner: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
  },
  listTopBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: 12,
    paddingHorizontal: 16, backgroundColor: Colors.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  countBadge: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  liveDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success, marginRight: 8,
  },
  countText: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  countNum: { fontWeight: '800', color: Colors.primary, fontSize: 16 },
  toggleBtn: {
    backgroundColor: Colors.white, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border,
  },
  toggleText: { fontSize: 13, fontWeight: '700', color: Colors.text },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16,
    elevation: 10, paddingBottom: 30,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border,
    alignSelf: 'center', marginTop: 8, marginBottom: 4,
  },
});
