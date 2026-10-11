/** Backend'deki rozet tanımlarının (app/services/progress.py) bildirimde gösterilecek kısmı. */
export const BADGE_INFO: Record<string, { title: string; icon: string }> = {
  'ilk-adim': { title: 'İlk adım', icon: '👣' },
  kasif: { title: 'Kâşif', icon: '🧭' },
  'tahmin-ustasi': { title: 'Tahmin ustası', icon: '🎯' },
  'cesur-tahminci': { title: 'Cesur tahminci', icon: '🦁' },
  'gorev-avcisi': { title: 'Görev avcısı', icon: '🏹' },
  'soru-cozucu': { title: 'Soru çözücü', icon: '✍️' },
  'hafiza-sarayi': { title: 'Hafıza sarayı', icon: '🏛️' },
  'kademe-1': { title: 'Kademe 1 ustası', icon: '🏆' },
};
