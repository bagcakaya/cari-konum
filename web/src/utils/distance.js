/**
 * Haversine formulasi ile iki koordinat arasi mesafeyi metre cinsinden hesaplar.
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return Infinity;
  
  const R = 6371e3; // Dunya yaricapi (metre)
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Metre cinsinden
}

/**
 * Mesafeyi okunakli metne donusturur (orn: "140 m" veya "2.4 km")
 */
export function formatDistance(meters) {
  if (!meters || meters === Infinity) return 'Bilinmiyor';
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Para birimini Turk Lirasi formatinda dondurur.
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null) return '0,00 ₺';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
