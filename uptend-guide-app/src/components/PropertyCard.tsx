import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

interface Props {
  address: string;
  sqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
  lotSize?: string;
  homeScore?: number;
}

export default function PropertyCard({ address, sqft, bedrooms, bathrooms, yearBuilt, lotSize, homeScore }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.scoreRow}>
        <Text style={styles.title}>🏠 Property Info</Text>
        {homeScore != null && (
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{homeScore}</Text>
          </View>
        )}
      </View>
      <Text style={styles.address}>{address}</Text>
      <View style={styles.details}>
        {sqft ? <Detail label="Size" value={`${sqft.toLocaleString()} sqft`} /> : null}
        {bedrooms ? <Detail label="Beds" value={`${bedrooms}`} /> : null}
        {bathrooms ? <Detail label="Baths" value={`${bathrooms}`} /> : null}
        {yearBuilt ? <Detail label="Built" value={`${yearBuilt}`} /> : null}
        {lotSize ? <Detail label="Lot" value={lotSize} /> : null}
      </View>
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: Colors.purple,
  },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: Colors.text },
  scoreBadge: {
    backgroundColor: Colors.success,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  address: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, marginBottom: 12 },
  details: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  detail: { alignItems: 'center', minWidth: 60 },
  detailLabel: { fontSize: 11, color: Colors.textLight, textTransform: 'uppercase', fontWeight: '600' },
  detailValue: { fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 2 },
});
