import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

const $ = (id) => document.getElementById(id);
const configured = firebaseConfig && Object.values(firebaseConfig).every((value) => value && !String(value).includes('YOUR_'));
let auth = null;
let authMode = 'login';
let appLoaded = false;

function show(element, visible = true) {
  element?.classList.toggle('hidden', !visible);
}

function setBusy(busy, button = $('emailSubmitBtn')) {
  if (!button) return;
  button.disabled = busy;
  button.classList.toggle('busy', busy);
}

function showMessage(message, type = 'error') {
  const box = $('authMessage');
  if (!box) return;
  box.textContent = message;
  box.className = `auth-message ${type}`;
}

function clearMessage() {
  const box = $('authMessage');
  if (!box) return;
  box.textContent = '';
  box.className = 'auth-message hidden';
}

function friendlyError(error) {
  const code = error?.code || '';
  const messages = {
    'auth/invalid-credential': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    'auth/user-not-found': 'لا يوجد حساب مرتبط بهذا البريد الإلكتروني.',
    'auth/wrong-password': 'كلمة المرور غير صحيحة.',
    'auth/email-already-in-use': 'هذا البريد مستخدم بالفعل. جرّب تسجيل الدخول.',
    'auth/invalid-email': 'صيغة البريد الإلكتروني غير صحيحة.',
    'auth/weak-password': 'كلمة المرور ضعيفة. استخدم 8 أحرف على الأقل.',
    'auth/too-many-requests': 'محاولات كثيرة. انتظر قليلًا ثم أعد المحاولة.',
    'auth/network-request-failed': 'تعذر الاتصال بالإنترنت. تحقق من الشبكة.',
    'auth/popup-closed-by-user': 'تم إغلاق نافذة Google قبل إكمال تسجيل الدخول.',
    'auth/cancelled-popup-request': 'تم إلغاء محاولة تسجيل دخول سابقة.',
    'auth/unauthorized-domain': 'هذا النطاق غير مضاف إلى Authorized domains في Firebase.',
    'auth/operation-not-allowed': 'طريقة تسجيل الدخول غير مفعلة في Firebase Authentication.',
    'auth/missing-password': 'أدخل كلمة المرور.',
    'auth/requires-recent-login': 'لأسباب أمنية، سجّل الخروج ثم ادخل مجددًا وحاول مرة أخرى.',
    'auth/invalid-password': 'كلمة المرور الحالية غير صحيحة.',
    'auth/credential-too-old-login-again': 'انتهت صلاحية الجلسة الأمنية. سجّل الدخول مجددًا ثم أعد المحاولة.'
  };
  return messages[code] || error?.message || 'حدث خطأ غير متوقع. أعد المحاولة.';
}

function switchMode(mode) {
  authMode = mode;
  const register = mode === 'register';
  $('loginTab')?.classList.toggle('active', !register);
  $('registerTab')?.classList.toggle('active', register);
  $('loginTab')?.setAttribute('aria-selected', String(!register));
  $('registerTab')?.setAttribute('aria-selected', String(register));
  show($('displayNameWrap'), register);
  show($('confirmPasswordWrap'), register);
  show($('loginOptions'), !register);
  $('authTitle').textContent = register ? 'إنشاء حساب جديد' : 'تسجيل الدخول';
  $('authSubtitle').textContent = register ? 'أنشئ حسابك واحفظ مشاريعك باسمك.' : 'ادخل إلى مشاريعك وأدوات التصميم.';
  $('emailSubmitBtn').querySelector('span').textContent = register ? 'إنشاء الحساب' : 'تسجيل الدخول';
  $('authPassword').autocomplete = register ? 'new-password' : 'current-password';
  clearMessage();
}

function buildFallbackAvatar(name) {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#17324d"/><stop offset="1" stop-color="#0c1b2d"/></linearGradient></defs><rect width="120" height="120" rx="60" fill="url(#g)"/><circle cx="60" cy="60" r="57" fill="none" stroke="#42e8c2" stroke-opacity=".35" stroke-width="2"/><text x="60" y="75" font-size="50" font-weight="700" text-anchor="middle" fill="#42e8c2" font-family="Arial">${name.trim().charAt(0) || 'E'}</text></svg>`)}`;
}

function hasPasswordProvider(user) {
  return Boolean(user?.providerData?.some((provider) => provider.providerId === 'password'));
}

function providerLabel(user) {
  const providers = user?.providerData?.map((provider) => provider.providerId) || [];
  if (providers.includes('google.com') && providers.includes('password')) return 'Google + بريد وكلمة مرور';
  if (providers.includes('google.com')) return 'مسجّل بواسطة Google';
  if (providers.includes('password')) return 'بريد إلكتروني وكلمة مرور';
  return 'حساب Electrify';
}

function setUserUi(user) {
  const name = user.displayName || user.email?.split('@')[0] || 'مستخدم Electrify';
  const email = user.email || '';
  const avatar = user.photoURL || buildFallbackAvatar(name);
  $('userName').textContent = name;
  $('dropdownUserName').textContent = name;
  $('dropdownUserEmail').textContent = email;
  const avatarTargets = ['userAvatar', 'dropdownUserAvatar', 'settingsAvatar'];
  avatarTargets.forEach((id) => {
    const image = $(id);
    if (!image) return;
    image.onerror = () => {
      image.onerror = null;
      image.src = buildFallbackAvatar(name);
    };
    image.src = avatar;
    image.alt = `صورة ${name}`;
  });
  if ($('settingsSummaryName')) $('settingsSummaryName').textContent = name;
  if ($('settingsSummaryEmail')) $('settingsSummaryEmail').textContent = email;
  if ($('settingsProviderBadge')) $('settingsProviderBadge').textContent = providerLabel(user);
  if ($('settingsDisplayName')) $('settingsDisplayName').value = name;
  if ($('settingsEmail')) $('settingsEmail').value = email;
  if ($('settingsPhotoUrl')) $('settingsPhotoUrl').value = user.photoURL || '';

  const passwordEnabled = hasPasswordProvider(user);
  $('accountPasswordForm')?.classList.toggle('hidden', !passwordEnabled);
  show($('googlePasswordNotice'), !passwordEnabled);
  $('passwordSettingsBtn')?.classList.toggle('hidden', !passwordEnabled);
}

function loadApplication(user) {
  syncAuthSnapshot(user);
  if (appLoaded) return;
  appLoaded = true;
  const script = document.createElement('script');
  script.src = './app.js';
  script.defer = true;
  document.body.appendChild(script);
}

async function googleSignIn() {
  clearMessage();
  const button = $('googleSignInBtn');
  setBusy(true, button);
  try {
    await setPersistence(auth, $('rememberMe')?.checked === false ? browserSessionPersistence : browserLocalPersistence);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, provider);
  } catch (error) {
    if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(error?.code)) {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
      return;
    }
    if (error?.code !== 'auth/cancelled-popup-request') showMessage(friendlyError(error));
  } finally {
    setBusy(false, button);
  }
}

async function emailSubmit(event) {
  event.preventDefault();
  clearMessage();
  const email = $('authEmail').value.trim();
  const password = $('authPassword').value;
  const name = $('authDisplayName').value.trim();
  const confirmation = $('authPasswordConfirm').value;

  if (!email || !password) return showMessage('أدخل البريد الإلكتروني وكلمة المرور.');
  if (password.length < 8) return showMessage('استخدم كلمة مرور من 8 أحرف على الأقل.');
  if (authMode === 'register' && !name) return showMessage('أدخل الاسم الكامل.');
  if (authMode === 'register' && password !== confirmation) return showMessage('كلمتا المرور غير متطابقتين.');

  setBusy(true);
  try {
    await setPersistence(auth, $('rememberMe')?.checked === false ? browserSessionPersistence : browserLocalPersistence);
    if (authMode === 'register') {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: name });
      await credential.user.reload();
      setUserUi(auth.currentUser || credential.user);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  } catch (error) {
    showMessage(friendlyError(error));
  } finally {
    setBusy(false);
  }
}

async function resetPassword() {
  clearMessage();
  const email = $('authEmail').value.trim();
  if (!email) return showMessage('أدخل بريدك الإلكتروني أولًا ثم اضغط نسيت كلمة المرور.');
  try {
    await sendPasswordResetEmail(auth, email);
    showMessage('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك.', 'success');
  } catch (error) {
    showMessage(friendlyError(error));
  }
}


function setSettingsMessage(id, message, type = 'error') {
  const box = $(id);
  if (!box) return;
  box.textContent = message;
  box.className = `settings-message ${type}`;
}

function clearSettingsMessage(id) {
  const box = $(id);
  if (!box) return;
  box.textContent = '';
  box.className = 'settings-message hidden';
}

function syncAuthSnapshot(user) {
  window.electrifyAuthUser = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    photoURL: user.photoURL || ''
  };
}

function openAccountDialog(section = 'profile') {
  const user = auth?.currentUser;
  if (!user) return;
  setUserUi(user);
  clearSettingsMessage('profileSettingsMessage');
  clearSettingsMessage('passwordSettingsMessage');
  $('userDropdown')?.classList.add('hidden');
  $('userMenuBtn')?.setAttribute('aria-expanded', 'false');
  const dialog = $('accountDialog');
  if (!dialog?.open) dialog?.showModal();
  requestAnimationFrame(() => {
    const target = section === 'password' ? $('passwordSettingsSection') : $('profileSettingsSection');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    (section === 'password' ? $('settingsCurrentPassword') : $('settingsDisplayName'))?.focus();
  });
}

async function saveAccountProfile(event) {
  event.preventDefault();
  clearSettingsMessage('profileSettingsMessage');
  const user = auth?.currentUser;
  if (!user) return setSettingsMessage('profileSettingsMessage', 'انتهت الجلسة. سجّل الدخول مجددًا.');
  const displayName = $('settingsDisplayName')?.value.trim() || '';
  const photoURL = $('settingsPhotoUrl')?.value.trim() || '';
  if (displayName.length < 2) return setSettingsMessage('profileSettingsMessage', 'أدخل اسمًا صحيحًا من حرفين على الأقل.');
  if (photoURL && !/^https:\/\//i.test(photoURL)) return setSettingsMessage('profileSettingsMessage', 'رابط الصورة يجب أن يبدأ بـ https://');
  const button = $('saveProfileBtn');
  setBusy(true, button);
  try {
    await updateProfile(user, { displayName, photoURL: photoURL || null });
    await user.reload();
    const refreshed = auth.currentUser || user;
    setUserUi(refreshed);
    syncAuthSnapshot(refreshed);
    setSettingsMessage('profileSettingsMessage', 'تم تحديث الاسم والصورة بنجاح.', 'success');
  } catch (error) {
    setSettingsMessage('profileSettingsMessage', friendlyError(error));
  } finally {
    setBusy(false, button);
  }
}

async function changeAccountPassword(event) {
  event.preventDefault();
  clearSettingsMessage('passwordSettingsMessage');
  const user = auth?.currentUser;
  if (!user || !user.email) return setSettingsMessage('passwordSettingsMessage', 'تعذر تحديد الحساب الحالي.');
  if (!hasPasswordProvider(user)) return setSettingsMessage('passwordSettingsMessage', 'كلمة المرور لهذا الحساب تُدار بواسطة Google.');
  const currentPassword = $('settingsCurrentPassword')?.value || '';
  const newPassword = $('settingsNewPassword')?.value || '';
  const confirmation = $('settingsConfirmPassword')?.value || '';
  if (!currentPassword) return setSettingsMessage('passwordSettingsMessage', 'أدخل كلمة المرور الحالية.');
  if (newPassword.length < 8) return setSettingsMessage('passwordSettingsMessage', 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل.');
  if (newPassword !== confirmation) return setSettingsMessage('passwordSettingsMessage', 'تأكيد كلمة المرور غير مطابق.');
  if (currentPassword === newPassword) return setSettingsMessage('passwordSettingsMessage', 'اختر كلمة مرور جديدة مختلفة عن الحالية.');
  const button = $('updatePasswordBtn');
  setBusy(true, button);
  try {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
    $('settingsCurrentPassword').value = '';
    $('settingsNewPassword').value = '';
    $('settingsConfirmPassword').value = '';
    setSettingsMessage('passwordSettingsMessage', 'تم تغيير كلمة المرور بنجاح.', 'success');
  } catch (error) {
    setSettingsMessage('passwordSettingsMessage', friendlyError(error));
  } finally {
    setBusy(false, button);
  }
}

async function sendAccountResetEmail() {
  clearSettingsMessage('passwordSettingsMessage');
  const user = auth?.currentUser;
  if (!user?.email) return setSettingsMessage('passwordSettingsMessage', 'لا يوجد بريد إلكتروني مرتبط بالحساب.');
  try {
    await sendPasswordResetEmail(auth, user.email);
    setSettingsMessage('passwordSettingsMessage', `تم إرسال رابط إعادة التعيين إلى ${user.email}.`, 'success');
  } catch (error) {
    setSettingsMessage('passwordSettingsMessage', friendlyError(error));
  }
}

async function logoutCurrentUser() {
  $('userDropdown')?.classList.add('hidden');
  if ($('accountDialog')?.open) $('accountDialog').close();
  await signOut(auth);
  location.reload();
}

function bindUi() {
  $('loginTab')?.addEventListener('click', () => switchMode('login'));
  $('registerTab')?.addEventListener('click', () => switchMode('register'));
  $('googleSignInBtn')?.addEventListener('click', googleSignIn);
  $('emailAuthForm')?.addEventListener('submit', emailSubmit);
  $('forgotPasswordBtn')?.addEventListener('click', resetPassword);
  $('togglePassword')?.addEventListener('click', () => {
    const input = $('authPassword');
    const visible = input.type === 'text';
    input.type = visible ? 'password' : 'text';
    $('togglePassword').textContent = visible ? 'إظهار' : 'إخفاء';
  });
  $('userMenuBtn')?.addEventListener('click', () => {
    const dropdown = $('userDropdown');
    const open = dropdown.classList.toggle('hidden') === false;
    $('userMenuBtn').setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('#userMenu')) {
      $('userDropdown')?.classList.add('hidden');
      $('userMenuBtn')?.setAttribute('aria-expanded', 'false');
    }
  });
  $('accountSettingsBtn')?.addEventListener('click', () => openAccountDialog('profile'));
  $('passwordSettingsBtn')?.addEventListener('click', () => openAccountDialog('password'));
  $('closeAccountDialog')?.addEventListener('click', () => $('accountDialog')?.close());
  $('accountDoneBtn')?.addEventListener('click', () => $('accountDialog')?.close());
  $('accountProfileForm')?.addEventListener('submit', saveAccountProfile);
  $('accountPasswordForm')?.addEventListener('submit', changeAccountPassword);
  $('sendAccountResetBtn')?.addEventListener('click', sendAccountResetEmail);
  $('logoutBtn')?.addEventListener('click', logoutCurrentUser);
  $('accountLogoutBtn')?.addEventListener('click', logoutCurrentUser);
  document.querySelectorAll('.settings-toggle-password').forEach((button) => {
    button.addEventListener('click', () => {
      const input = $(button.dataset.target);
      if (!input) return;
      const visible = input.type === 'text';
      input.type = visible ? 'password' : 'text';
      button.textContent = visible ? 'إظهار' : 'إخفاء';
    });
  });
  $('accountDialog')?.addEventListener('click', (event) => {
    if (event.target === $('accountDialog')) $('accountDialog').close();
  });
}

bindUi();

if (!configured) {
  document.body.classList.remove('auth-loading');
  show($('authLoading'), false);
  show($('firebaseSetup'), true);
} else {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    auth.languageCode = 'ar';
    await getRedirectResult(auth).catch((error) => showMessage(friendlyError(error)));
    onAuthStateChanged(auth, (user) => {
      document.body.classList.remove('auth-loading');
      show($('authLoading'), false);
      if (user) {
        setUserUi(user);
        document.body.classList.add('authenticated');
        document.body.classList.remove('app-locked');
        show($('authScreen'), false);
        loadApplication(user);
      } else {
        document.body.classList.remove('authenticated');
        document.body.classList.add('app-locked');
        show($('authScreen'), true);
        show($('authForms'), true);
        switchMode('login');
      }
    });
  } catch (error) {
    document.body.classList.remove('auth-loading');
    show($('authLoading'), false);
    show($('firebaseSetup'), true);
    const paragraph = $('firebaseSetup')?.querySelector('p');
    if (paragraph) paragraph.textContent = `تعذر تشغيل Firebase: ${friendlyError(error)}`;
  }
}
