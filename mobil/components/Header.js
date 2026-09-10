import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Header({
  isTracking,
  isRefreshing,
  onRefreshData,
  proximityThreshold = 50,
  setProximityThreshold,
  isSimulating,
  setIsSimulating,
}) {
  const cycleThreshold = () => {
    const next =
      proximityThreshold === 50
        ? 100
        : proximityThreshold === 100
        ? 150
        : proximityThreshold === 150
        ? 200
        : 50;
    setProximityThreshold(next);
  };

  return (
    <View style={styles.header}>
      {/* Sol: Logo ve Durum */}
      <View style={styles.left}>
        <View style={styles.logoBadge}>
          <Ionicons name="radio" size={18} color="#ffffff" />
        </View>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.title}>CariRadar</Text>
            <View style={styles.dbBadge}>
              <Text style={styles.dbBadgeText}>POLATLAR2025</Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.dot,
                isTracking ? styles.dotGreen : styles.dotAmber,
              ]}
            />
            <Text style={styles.statusText}>
              {isTracking ? `GPS Aktif (${proximityThreshold}m)` : 'GPS Bekleniyor'}
            </Text>
          </View>
        </View>
      </View>

      {/* Sağ: Aksiyon Butonları */}
      <View style={styles.actions}>
        {/* Mesafe Seçici Butonu */}
        <TouchableOpacity
          style={styles.radiusBtn}
          activeOpacity={0.7}
          onPress={cycleThreshold}
        >
          <Text style={styles.radiusBtnText}>{proximityThreshold}m</Text>
        </TouchableOpacity>

        {/* Simülasyon / Test Modu */}
        <TouchableOpacity
          style={[styles.iconBtn, isSimulating && styles.iconBtnActive]}
          activeOpacity={0.7}
          onPress={() => setIsSimulating(!isSimulating)}
        >
          <Ionicons
            name="locate"
            size={18}
            color={isSimulating ? '#f59e0b' : '#94a3b8'}
          />
        </TouchableOpacity>

        {/* Canlı Yenileme */}
        <TouchableOpacity
          style={styles.iconBtn}
          activeOpacity={0.7}
          onPress={onRefreshData}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#60a5fa" />
          ) : (
            <Ionicons name="refresh" size={18} color="#cbd5e1" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    zIndex: 50,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  dbBadge: {
    backgroundColor: '#172554',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1e40af',
  },
  dbBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#60a5fa',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotGreen: { backgroundColor: '#10b981' },
  dotAmber: { backgroundColor: '#f59e0b' },
  statusText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radiusBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#3b82f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  radiusBtnText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '700',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnActive: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
});