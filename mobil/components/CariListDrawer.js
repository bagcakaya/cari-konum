import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistance, formatCurrency } from '../utils/distance';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CariListDrawer({
  cariler = [],
  onSelectCari,
  onTestProximity,
  proximityThreshold = 50,
  isOpen,
  setIsOpen,
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('hepsi'); // 'hepsi' | 'yakin' | 'borclu' | 'alacakli'
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Klavye açılıp kapandığında çekmecenin yukarı taşmasını önleme
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Filtreleme
  const filteredList = useMemo(() => {
    let list = cariler;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          (c.ad && c.ad.toLowerCase().includes(q)) ||
          (c.kod && c.kod.toLowerCase().includes(q)) ||
          (c.ilce && c.ilce.toLowerCase().includes(q)) ||
          (c.adresTemiz && c.adresTemiz.toLowerCase().includes(q))
      );
    }

    if (filter === 'borclu') {
      list = list.filter((c) => c.bakiye > 0);
    } else if (filter === 'alacakli') {
      list = list.filter((c) => c.bakiye < 0);
    } else if (filter === 'yakin') {
      list = [...list].sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }
    return list;
  }, [cariler, search, filter]);

  const handleToggleDrawer = () => {
    if (isOpen) {
      Keyboard.dismiss();
    }
    setIsOpen(!isOpen);
  };

  const renderItem = ({ item }) => {
    const isBorclu = item.bakiye > 0;
    const isAlacakli = item.bakiye < 0;
    const isNear = item.distance && item.distance <= proximityThreshold;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => {
          Keyboard.dismiss();
          onSelectCari(item);
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.codeBadge}>
            <Text style={styles.codeText}>{item.kod}</Text>
          </View>

          {item.distance !== undefined && item.distance !== Infinity && (
            <View style={[styles.distBadge, isNear && styles.distBadgeNear]}>
              <Ionicons
                name="navigate"
                size={11}
                color={isNear ? '#60a5fa' : '#94a3b8'}
              />
              <Text style={[styles.distText, isNear && styles.distTextNear]}>
                {formatDistance(item.distance)}
              </Text>
            </View>
          )}

          {(!item.enlem || !item.boylam) && (
            <View style={styles.noLocBadge}>
              <Text style={styles.noLocText}>Haritada Yok</Text>
            </View>
          )}
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {item.ad}
        </Text>

        <View style={styles.addrRow}>
          <Ionicons name="location-outline" size={12} color="#64748b" />
          <Text style={styles.addrText} numberOfLines={1}>
            {[item.adresTemiz || item.adres, item.ilce].filter(Boolean).join(' • ') || 'Adres bilgisi yok'}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text
              style={[
                styles.balanceText,
                isBorclu ? styles.textRed : isAlacakli ? styles.textGreen : styles.textGray,
              ]}
            >
              {formatCurrency(Math.abs(item.bakiye || 0))}
            </Text>
            <Text style={styles.balanceSub}>
              {isBorclu ? 'Borç' : isAlacakli ? 'Alacak' : 'Kapalı'}
            </Text>
          </View>

          {item.enlem && item.boylam && (
            <TouchableOpacity
              style={styles.testBtn}
              onPress={() => {
                Keyboard.dismiss();
                setIsOpen(false);
                onTestProximity(item);
              }}
            >
              <Ionicons name="radio" size={12} color="#f59e0b" />
              <Text style={styles.testBtnText}>🎯 {proximityThreshold}m Test</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Dinamik çekmece stili: Klavye açıkken ekranın üstünde sabit kalır
  const drawerStyle = useMemo(() => {
    if (!isOpen) {
      return [styles.drawer, styles.drawerClosed];
    }
    if (isKeyboardVisible) {
      return [styles.drawer, styles.drawerOpenKeyboard];
    }
    return [styles.drawer, styles.drawerOpen];
  }, [isOpen, isKeyboardVisible]);

  return (
    <View style={drawerStyle}>
      {/* Çekmece Tutamağı */}
      <TouchableOpacity
        style={styles.handleArea}
        activeOpacity={0.8}
        onPress={handleToggleDrawer}
      >
        <View style={styles.handleBar} />
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Cariler & Mesafeler</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{filteredList.length}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.toggleText}>
              {isOpen ? 'Haritaya Dön' : 'Listeyi Aç'}
            </Text>
            <Ionicons
              name={isOpen ? 'chevron-down' : 'chevron-up'}
              size={16}
              color="#94a3b8"
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Arama ve Filtreler (Her zaman görünür kalır) */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Cari adı, kodu veya ilçe ara..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'hepsi' && styles.filterBtnActive]}
            onPress={() => setFilter('hepsi')}
          >
            <Text style={[styles.filterText, filter === 'hepsi' && styles.filterTextActive]}>
              Tümü
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, filter === 'yakin' && styles.filterBtnActive]}
            onPress={() => setFilter('yakin')}
          >
            <Text style={[styles.filterText, filter === 'yakin' && styles.filterTextActive]}>
              📍 En Yakın
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, filter === 'borclu' && styles.filterBtnRed]}
            onPress={() => setFilter('borclu')}
          >
            <Text style={[styles.filterText, filter === 'borclu' && styles.filterTextWhite]}>
              Borçlular
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, filter === 'alacakli' && styles.filterBtnGreen]}
            onPress={() => setFilter('alacakli')}
          >
            <Text style={[styles.filterText, filter === 'alacakli' && styles.filterTextWhite]}>
              Alacaklılar
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Liste (Klavye açıldığında kalan boşluğa sığacak şekilde kayar) */}
      {isOpen && (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
    zIndex: 100,
  },
  drawerClosed: {
    bottom: 0,
    height: 105,
  },
  drawerOpen: {
    bottom: 0,
    top: Math.round(SCREEN_HEIGHT * 0.28),
  },
  drawerOpenKeyboard: {
    bottom: 0,
    top: Platform.OS === 'android' ? 50 : 65,
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 16,
  },
  handleBar: {
    width: 44,
    height: 4,
    backgroundColor: '#475569',
    borderRadius: 2,
    marginBottom: 8,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#1e3a8a',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#93c5fd',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  searchFilterContainer: {
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#334155',
    height: 38,
  },
  searchIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  filterBtnActive: {
    backgroundColor: '#2563eb',
  },
  filterBtnRed: {
    backgroundColor: '#dc2626',
  },
  filterBtnGreen: {
    backgroundColor: '#059669',
  },
  filterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  filterTextWhite: {
    color: '#ffffff',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 24,
    gap: 10,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  codeBadge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  codeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  distBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  distBadgeNear: {
    backgroundColor: '#172554',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  distText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
  },
  distTextNear: {
    color: '#93c5fd',
  },
  noLocBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  noLocText: {
    fontSize: 9,
    color: '#cbd5e1',
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  addrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  addrText: {
    fontSize: 11,
    color: '#94a3b8',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  balanceText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  balanceSub: {
    fontSize: 10,
    color: '#64748b',
  },
  textRed: { color: '#ef4444' },
  textGreen: { color: '#10b981' },
  textGray: { color: '#94a3b8' },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  testBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f59e0b',
  },
});