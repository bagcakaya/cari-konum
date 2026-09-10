import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/distance';

export default function CariDetailModal({ cari, onClose, onTestProximity, proximityThreshold = 50 }) {
  if (!cari) return null;

  const isBorclu = cari.bakiye > 0;
  const isAlacakli = cari.bakiye < 0;

  const handleOpenMaps = () => {
    if (cari.enlem && cari.boylam) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${cari.enlem},${cari.boylam}`;
      Linking.openURL(url);
    } else {
      const q = encodeURIComponent(`${cari.adresTemiz || cari.adres || ''} ${cari.ilce || ''} ${cari.il || ''}`);
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
    }
  };

  const handleCall = () => {
    if (cari.telefon) {
      Linking.openURL(`tel:${cari.telefon}`);
    }
  };

  return (
    <Modal
      visible={!!cari}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <View style={styles.codeBadge}>
                <Text style={styles.codeText}>{cari.kod}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  isBorclu ? styles.bgRed : isAlacakli ? styles.bgGreen : styles.bgGray,
                ]}
              >
                <Text style={styles.statusText}>
                  {isBorclu ? 'Borçlu (Alacağımız Var)' : isAlacakli ? 'Alacaklı' : 'Kapalı'}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#94a3b8" />
            </TouchableOpacity>

            <Text style={styles.title}>{cari.ad}</Text>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* Finansal Bakiye Kartı */}
            <View
              style={[
                styles.financialCard,
                isBorclu ? styles.borderRed : isAlacakli ? styles.borderGreen : styles.borderGray,
              ]}
            >
              <Text style={styles.finSub}>Net Bakiye</Text>
              <Text
                style={[
                  styles.finAmount,
                  isBorclu ? styles.textRed : isAlacakli ? styles.textGreen : styles.textGray,
                ]}
              >
                {formatCurrency(Math.abs(cari.bakiye || 0))}
              </Text>

              <View style={styles.finGrid}>
                <View style={styles.finCol}>
                  <Text style={styles.finColSub}>Toplam Borç</Text>
                  <Text style={styles.finColVal}>{formatCurrency(cari.borc || 0)}</Text>
                </View>
                <View style={styles.finCol}>
                  <Text style={styles.finColSub}>Toplam Alacak</Text>
                  <Text style={styles.finColVal}>{formatCurrency(cari.alacak || 0)}</Text>
                </View>
              </View>
            </View>

            {/* Adres ve İletişim Kartı */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.iconBox}>
                  <Ionicons name="location" size={16} color="#3b82f6" />
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoSub}>Adres</Text>
                  <Text style={styles.infoVal}>
                    {cari.adresTemiz || cari.adres || 'Açık adres girilmemiş.'}
                  </Text>
                  <Text style={styles.infoDist}>
                    {[cari.ilce, cari.il].filter(Boolean).join(' / ')}
                  </Text>
                </View>
              </View>

              {cari.yetkili ? (
                <View style={[styles.infoRow, styles.borderTop]}>
                  <View style={styles.iconBox}>
                    <Ionicons name="person" size={16} color="#94a3b8" />
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoSub}>Yetkili</Text>
                    <Text style={styles.infoVal}>{cari.yetkili}</Text>
                  </View>
                </View>
              ) : null}

              {cari.telefon ? (
                <TouchableOpacity
                  style={[styles.infoRow, styles.borderTop]}
                  onPress={handleCall}
                >
                  <View style={styles.iconBox}>
                    <Ionicons name="call" size={16} color="#10b981" />
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoSub}>Telefon</Text>
                    <Text style={[styles.infoVal, { color: '#38bdf8' }]}>
                      {cari.telefon}
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : null}

              {/* 50m Yakınlık Testi */}
              {cari.enlem && cari.boylam && onTestProximity ? (
                <TouchableOpacity
                  style={styles.testActionBtn}
                  onPress={() => {
                    onClose();
                    onTestProximity(cari);
                  }}
                >
                  <Ionicons name="radio-outline" size={16} color="#f59e0b" />
                  <Text style={styles.testActionText}>
                    🎯 Bu Carinin {proximityThreshold}m Bildirimini Test Et
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </ScrollView>

          {/* Aksiyon Butonları */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.btnNav} onPress={handleOpenMaps}>
              <Ionicons name="navigate" size={18} color="#ffffff" />
              <Text style={styles.btnNavText}>Yol Tarifi Al</Text>
            </TouchableOpacity>

            {cari.telefon ? (
              <TouchableOpacity style={styles.btnCall} onPress={handleCall}>
                <Ionicons name="call" size={18} color="#ffffff" />
                <Text style={styles.btnCallText}>Ara</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.btnClose} onPress={onClose}>
              <Text style={styles.btnCloseText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    position: 'relative',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  codeBadge: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codeText: {
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  bgRed: { backgroundColor: '#991b1b' },
  bgGreen: { backgroundColor: '#065f46' },
  bgGray: { backgroundColor: '#334155' },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 4,
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    padding: 18,
    gap: 14,
  },
  financialCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  borderRed: { borderColor: '#ef4444' },
  borderGreen: { borderColor: '#10b981' },
  borderGray: { borderColor: '#475569' },
  finSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  finAmount: {
    fontSize: 24,
    fontWeight: '900',
    marginVertical: 4,
  },
  finGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  finCol: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 10,
  },
  finColSub: {
    fontSize: 10,
    color: '#94a3b8',
  },
  finColVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 2,
  },
  textRed: { color: '#ef4444' },
  textGreen: { color: '#10b981' },
  textGray: { color: '#94a3b8' },
  infoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  borderTop: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
  },
  infoSub: {
    fontSize: 10,
    color: '#94a3b8',
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f8fafc',
    marginTop: 1,
  },
  infoDist: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
    marginTop: 2,
  },
  testActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    marginTop: 4,
  },
  testActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f59e0b',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  btnNav: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    paddingVertical: 13,
    borderRadius: 12,
  },
  btnNavText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  btnCall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 13,
    borderRadius: 12,
  },
  btnCallText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  btnClose: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCloseText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
});