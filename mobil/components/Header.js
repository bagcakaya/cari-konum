import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PROXIMITY_OPTIONS = [50, 100, 150, 200, 300, 500];

export default function Header({
  isTracking,
  isRefreshing,
  onRefreshData,
  proximityThreshold = 150,
  setProximityThreshold,
  isSimulating,
  setIsSimulating,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSelectThreshold = (val) => {
    setProximityThreshold(val);
    setIsDropdownOpen(false);
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
        {/* Aşağı Açılır Mesafe Seçici Butonu */}
        <TouchableOpacity
          style={[styles.radiusBtn, isDropdownOpen && styles.radiusBtnOpen]}
          activeOpacity={0.7}
          onPress={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <Text style={styles.radiusBtnText}>{proximityThreshold}m</Text>
          <Ionicons
            name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
            size={12}
            color="#60a5fa"
            style={styles.chevronIcon}
          />
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

      {/* Aşağı Açılan Dropdown Menü */}
      <Modal
        visible={isDropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDropdownOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsDropdownOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdownCard}>
                <View style={styles.dropdownHeader}>
                  <Text style={styles.dropdownTitle}>Radar Menzili</Text>
                </View>
                {PROXIMITY_OPTIONS.map((val) => {
                  const isSelected = proximityThreshold === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.dropdownItem,
                        isSelected && styles.dropdownItemActive,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => handleSelectThreshold(val)}
                    >
                      <View style={styles.dropdownItemLeft}>
                        <Ionicons
                          name="radio"
                          size={12}
                          color={isSelected ? '#3b82f6' : '#64748b'}
                        />
                        <Text
                          style={[
                            styles.dropdownItemText,
                            isSelected && styles.dropdownItemTextActive,
                          ]}
                        >
                          {val}m {val === 150 ? '(Varsayılan)' : ''}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={15} color="#3b82f6" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  radiusBtnOpen: {
    backgroundColor: '#172554',
    borderColor: '#60a5fa',
  },
  radiusBtnText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '700',
  },
  chevronIcon: {
    marginLeft: 3,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 90,
    paddingRight: 16,
  },
  dropdownCard: {
    width: 175,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 12,
    overflow: 'hidden',
    paddingVertical: 4,
  },
  dropdownHeader: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  dropdownTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
  },
  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  dropdownItemTextActive: {
    color: '#60a5fa',
    fontWeight: '700',
  },
});