/* =====================================================
   تكامل تطبيق أندرويد (Capacitor): الإشعارات، الروابط العميقة، زر الرجوع
   على الويب كل الدوال تعمل بأمان بدون أثر
   ===================================================== */
const Native = {
  isApp: !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()),
  plugin(n) {
    const C = window.Capacitor; if (!C) return null;
    return (C.Plugins && C.Plugins[n]) || (C.registerPlugin ? C.registerPlugin(n) : null);
  },
  async openUrl(url) {
    const B = this.isApp && this.plugin('Browser');
    if (B) await B.open({ url, presentationStyle: 'popover' }); else location.href = url;
  },
  closeBrowser() { const B = this.isApp && this.plugin('Browser'); if (B) B.close().catch(() => {}); },
  init({ onDeepLink, onBack }) {
    if (!this.isApp) return;
    const A = this.plugin('App'); if (!A) return;
    A.addListener('appUrlOpen', e => onDeepLink && onDeepLink(e.url));
    A.addListener('backButton', () => { if (!(onBack && onBack())) A.exitApp(); });
  },
  async initPush({ onToken, onTap, onReceive }) {
    if (!this.isApp || !CFG.pushEnabled) return false;
    const P = this.plugin('PushNotifications'); if (!P) return false;
    try {
      let s = await P.checkPermissions();
      if (s.receive === 'prompt' || s.receive === 'prompt-with-rationale') s = await P.requestPermissions();
      if (s.receive !== 'granted') return false;
      await P.createChannel({ id: 'jobs', name: 'وظائف وتنبيهات', importance: 4, visibility: 1 }).catch(() => {});
      P.addListener('registration', t => onToken && onToken(t.value, 'android'));
      P.addListener('pushNotificationActionPerformed', a => onTap && onTap((a.notification && a.notification.data) || {}));
      P.addListener('pushNotificationReceived', n => onReceive && onReceive(n));
      await P.register(); return true;
    } catch (e) { console.warn('push', e); return false; }
  }
};
