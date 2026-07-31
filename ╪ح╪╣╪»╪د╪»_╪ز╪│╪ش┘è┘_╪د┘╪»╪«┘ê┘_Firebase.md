# إعداد تسجيل الدخول في Electrify

تمت إضافة بوابة دخول حقيقية باستخدام Firebase Authentication وتشمل:

- تسجيل الدخول بواسطة Google.
- إنشاء حساب بالبريد الإلكتروني وكلمة المرور.
- استعادة كلمة المرور.
- حفظ الجلسة وتسجيل الخروج.
- فصل المشاريع المحلية لكل مستخدم على الجهاز نفسه.

## 1) إنشاء مشروع Firebase

1. افتح Firebase Console.
2. اختر **Create a project** وأنشئ مشروعًا باسم Electrify.
3. من Project Overview اضغط رمز Web `</>`.
4. سجل تطبيق ويب باسم Electrify.
5. انسخ كائن `firebaseConfig`.

## 2) وضع بيانات الاتصال

افتح الملف:

```text
firebase-config.js
```

واستبدل القيم التي تبدأ بـ `YOUR_` ببيانات تطبيقك من Firebase.

> كائن إعداد Firebase الخاص بتطبيق الويب ليس Service Account ولا مفتاح خادم سري. لا تضع أي private key أو Service Account داخل ملفات الموقع.

## 3) تفعيل طرق الدخول

من Firebase Console:

```text
Authentication → Sign-in method
```

فعّل:

1. **Google** واختر بريد الدعم.
2. **Email/Password**.

## 4) إضافة نطاق الموقع

من:

```text
Authentication → Settings → Authorized domains
```

أضف نطاق موقعك، مثل:

```text
electrify.example.com
```

عادةً `localhost` يكون متاحًا للتجربة المحلية.

## 5) التشغيل المحلي

شغّل:

```text
تشغيل_الموقع.bat
```

ثم افتح الرابط المحلي الظاهر. لا تفتح `index.html` بالنقر المباشر لأن تسجيل Firebase يحتاج HTTP أو HTTPS.

## ملاحظة عن المشاريع

المشاريع الآن مفصولة لكل مستخدم، لكنها ما زالت محفوظة داخل المتصفح نفسه. تسجيل الدخول من جهاز آخر لن ينقل المشاريع تلقائيًا. لنقل المشاريع بين الأجهزة استخدم تصدير واستيراد JSON، أو أضف Cloud Firestore لاحقًا للمزامنة السحابية.
