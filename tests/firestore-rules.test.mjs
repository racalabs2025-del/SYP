import { after, before, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';

let env;
const paths = ['meydanlar/test', 'vardiyalar/test', 'kronikSorunlar/test', 'personelIzinler/test',
  'meydanBasvurulari/test', 'meydanBasvuruStats/test', 'personelBasvuruOzetleri/test',
  'meydanFaaliyetRaporlari/test', 'operasyonelIcgoruler/test',
  'meydanlar/test/gunlukNotlar/test', 'meydanFaaliyetRaporlari/test/chunks/test'];
const token = (role, provider = 'password') => ({ sypRole: role, firebase: { sign_in_provider: provider } });

before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-syp-tests',
    firestore: { host: '127.0.0.1', port: 8085, rules: readFileSync('firestore.rules', 'utf8') },
    storage: { host: '127.0.0.1', port: 9198, rules: readFileSync('storage.rules', 'utf8') },
  });
  await env.withSecurityRulesDisabled(async (context) => {
    for (const path of paths) await setDoc(doc(context.firestore(), path), { test: true });
    await uploadBytes(ref(context.storage(), 'faaliyet-raporlari/test.pdf'), new Uint8Array([1, 2, 3]));
  });
});
after(async () => { await env?.cleanup(); });

test('anonymous, unauthenticated and unassigned users cannot read or write any operational path', async () => {
  const contexts = [env.unauthenticatedContext(), env.authenticatedContext('anonymous', token('admin', 'anonymous')),
    env.authenticatedContext('unassigned', { firebase: { sign_in_provider: 'password' } })];
  for (const context of contexts) for (const path of paths) {
    const record = doc(context.firestore(), path);
    await assertFails(getDoc(record));
    await assertFails(setDoc(record, { test: true }));
    await assertFails(deleteDoc(record));
  }
});

test('viewer can read and list but cannot create, update or delete', async () => {
  const db = env.authenticatedContext('viewer', token('viewer')).firestore();
  for (const path of paths) {
    await assertSucceeds(getDoc(doc(db, path)));
    await assertFails(setDoc(doc(db, path), { changed: true }));
    await assertFails(setDoc(doc(db, path + '-new'), { test: true }));
    await assertFails(deleteDoc(doc(db, path)));
  }
  await assertSucceeds(getDocs(collection(db, 'meydanlar')));
});

test('editor can create and update but cannot delete or grant itself permissions', async () => {
  const db = env.authenticatedContext('editor', token('editor')).firestore();
  for (const path of paths) {
    await assertSucceeds(setDoc(doc(db, path), { changed: true }));
    await assertSucceeds(setDoc(doc(db, path + '-new'), { test: true }));
    await assertFails(deleteDoc(doc(db, path)));
  }
  await assertFails(setDoc(doc(db, 'users/editor'), { sypRole: 'admin' }));
});

test('admin can delete allowed records; unknown collections remain closed', async () => {
  const db = env.authenticatedContext('admin', token('admin')).firestore();
  for (const path of paths) await assertSucceeds(deleteDoc(doc(db, path + '-new')));
  for (const path of ['users/admin', 'secrets/test', 'meydanlar/test/unknown/test']) {
    await assertFails(getDoc(doc(db, path)));
    await assertFails(setDoc(doc(db, path), { test: true }));
  }
});

test('report storage follows the same role boundaries', async () => {
  for (const [role, canRead, canWrite, canDelete] of [[null, false, false, false], ['viewer', true, false, false], ['editor', true, true, false], ['admin', true, true, true]]) {
    const context = role ? env.authenticatedContext(role, token(role)) : env.unauthenticatedContext();
    const file = ref(context.storage(), 'faaliyet-raporlari/test.pdf');
    await (canRead ? assertSucceeds : assertFails)(getBytes(file));
    await (canWrite ? assertSucceeds : assertFails)(uploadBytes(file, new Uint8Array([4])));
    await (canDelete ? assertSucceeds : assertFails)(deleteObject(file));
    await assertFails(uploadBytes(ref(context.storage(), 'other/test.pdf'), new Uint8Array([4])));
  }
});
