// يضيف إلى مشروع أندرويد المولَّد: رابط الدخول العميق (com.wazifati.app://) وصلاحية الإشعارات
// ويضع google-services.json إن وُجد (لإشعارات Firebase)
import fs from 'fs';
const mf = 'android/app/src/main/AndroidManifest.xml';
let x = fs.readFileSync(mf, 'utf8');
if (!x.includes('android:scheme="com.wazifati.app"')) {
  x = x.replace(/(<activity[\s\S]*?android:name="\.MainActivity"[\s\S]*?>)/, `$1
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="com.wazifati.app" />
            </intent-filter>`);
}
if (!x.includes('POST_NOTIFICATIONS')) x = x.replace('<uses-permission android:name="android.permission.INTERNET" />', '<uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />');
fs.writeFileSync(mf, x);
const gs = ['google-services.json', 'firebase/google-services.json'].find(f => fs.existsSync(f));
if (gs) { fs.copyFileSync(gs, 'android/app/google-services.json'); console.log('google-services.json added from ' + gs); }
else if (process.env.REQUIRE_FIREBASE) { console.error('google-services.json missing'); process.exit(1); }
console.log('android patched');
