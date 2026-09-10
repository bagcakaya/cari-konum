import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistance } from '../utils/distance';

export default function ProximityAlertModal({
  alertData,
  onYes,
  onNo,
  proximityThreshold = 50,
}) {
  if (!alertData || !alertData.cari) return null;

  const { cari, distance } = alertData;

  return (
    <Modal
      visible={true}
      animationType="fade"
      transparent={true}
      onRequestClose={() => onNo(cari)}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Radar Animasyon İkonu */}
          <View style={styles.radarCircle}>
            <View style={styles.radarInner}>
              <Ionicons name="business" size={30} color="#ffffff" />
            </View>
          </View>

          {/* Mesafe Rozeti */}
          <View style={styles.distBadge}>
            <Ionicons name="navigate" size={12} color="#60a5fa" />
            <Text style={styles.distText}>
              Yaklaşık {formatDistance(distance)} ({proximityThreshold}m Yarıçap İçi)
            </Text>
          </View>

          {/* Soru Başlığı */}
          <Text style={styles.cariTitle} numberOfLines={2}>
            {cari.ad}
          </Text>

          <Text style={styles.questionText}>
            Firmasına yaklaştınız, uğramak ister misiniz?
          </Text>

          {/* Aksiyon Butonları (Evet / Hayır) */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.btnNo}
              activeOpacity={0.8}
              onPress={() => onNo(cari)}
            >
              <Ionicons name="close" size={18} color="#cbd5e1" />
              <Text style={styles.btnNoText}>Hayır</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnYes}
              activeOpacity={0.8}
              onPress={() => onYes(cari)}
            >
              <Ionicons name="checkmark" size={18} color="#ffffff" />
              <Text style={styles.btnYesText}>Evet</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.noteText}>
            * Evet butonuna bastığınızda firmanın güncel borç, alacak ve iletişim kartı açılacaktır.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0f172a',
    borderRadius: 28,
    padding: 24,
    borderWidth: 2,
    borderColor: '#2563eb',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  radarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  radarInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  distBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#172554',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e40af',
    marginBottom: 12,
  },
  distText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#93c5fd',
  },
  cariTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#60a5fa',
    textAlign: 'center',
    marginBottom: 6,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 20,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btnNo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  btnNoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  btnYes: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 16,
  },
  btnYesText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  noteText: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 16,
  },
});