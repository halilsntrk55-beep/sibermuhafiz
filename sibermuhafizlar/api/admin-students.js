import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';

const ADMIN_UID = 'jqS6cdGMhgN8RBGVpeApz7PClBa2';
const PROJECT_ID = 'ubilsem-kds';
const ROOT = 'sibermuhafiz_v1/users';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(body));
}

function firebaseAdmin() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(raw);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON geçerli JSON değil.');
  }
  if (serviceAccount.project_id !== PROJECT_ID) throw new Error('Firebase servis hesabı proje kimliği eşleşmiyor.');
  serviceAccount.private_key = serviceAccount.private_key?.replace(/\\n/g, '\n');
  const app = getApps().find(item => item.name === 'sibermuhafiz-admin-api') ||
    initializeApp({ credential: cert(serviceAccount), databaseURL: 'https://ubilsem-kds-default-rtdb.firebaseio.com', projectId: PROJECT_ID }, 'sibermuhafiz-admin-api');
  return { auth: getAuth(app), db: getDatabase(app) };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { message: 'Bu işlem desteklenmiyor.' });
  const authorization = req.headers.authorization || '';
  const idToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!idToken) return json(res, 401, { message: 'Yönetici oturumu gerekli.' });

  let services;
  try {
    services = firebaseAdmin();
  } catch (error) {
    console.error('Admin service configuration error:', error.message);
    return json(res, 503, { message: 'Yönetici işlemleri için Firebase sunucu bağlantısı yapılandırılmamış.' });
  }
  if (!services) return json(res, 503, { message: 'Yönetici işlemleri için Vercel üzerinde Firebase servis anahtarı tanımlanmalı.' });

  let claims;
  try {
    claims = await services.auth.verifyIdToken(idToken, true);
  } catch {
    return json(res, 401, { message: 'Yönetici oturumun sona ermiş. Yeniden giriş yap.' });
  }
  if (claims.uid !== ADMIN_UID) return json(res, 403, { message: 'Bu işlem yalnızca yetkili yöneticiye açıktır.' });

  const action = req.body?.action;
  const uid = req.body?.uid;
  if (typeof uid !== 'string' || !/^[A-Za-z0-9_-]{20,128}$/.test(uid) || uid === ADMIN_UID) {
    return json(res, 400, { message: 'Öğrenci hesabı doğrulanamadı.' });
  }

  const recordRef = services.db.ref(`${ROOT}/${uid}`);
  try {
    const recordSnapshot = await recordRef.once('value');
    const record = recordSnapshot.val();
    if (!record?.profile || !record?.progress) return json(res, 404, { message: 'SiberMuhafız öğrenci hesabı bulunamadı.' });

    if (action === 'set-password') {
      const password = req.body?.password;
      if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
        return json(res, 400, { message: 'Yeni parola 8–128 karakter arasında olmalı.' });
      }
      await services.auth.updateUser(uid, { password });
      await services.auth.revokeRefreshTokens(uid);
      return json(res, 200, { ok: true });
    }

    if (action === 'delete-account') {
      await services.auth.deleteUser(uid);
      await recordRef.remove();
      return json(res, 200, { ok: true });
    }
    return json(res, 400, { message: 'Hesap işlemi tanınmadı.' });
  } catch (error) {
    console.error('Admin student action failed:', error.code || error.message);
    if (error.code === 'auth/user-not-found') return json(res, 404, { message: 'Firebase Authentication hesabı bulunamadı.' });
    return json(res, 500, { message: 'Hesap işlemi tamamlanamadı. Yeniden deneyin.' });
  }
}
