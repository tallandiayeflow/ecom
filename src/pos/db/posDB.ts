import { openDB, IDBPDatabase } from 'idb';

export interface POSProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  barcode: string | null;
  image: string | null;
}

export interface PendingTransaction {
  id: string;
  sessionId: string;
  transactionNumber: string;
  cashierId: string;
  customerName?: string;
  customerPhone?: string;
  items: PendingTxnItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'wave' | 'orange_money' | 'mixed';
  cashTendered: number;
  mobileTendered: number;
  mobileReference?: string;
  changeGiven: number;
  synced: boolean;
  clientCreatedAt: string;
}

export interface PendingTxnItem {
  id: string;
  productId: string;
  productName: string;
  productBarcode?: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  lineTotal: number;
}

export interface CurrentSession {
  id: string;
  cashierId: string;
  cashierName?: string;
  openingBalance: number;
  expectedCash: number;
  status: 'open' | 'closed';
  openedAt: string;
}

const DB_NAME = 'noor-pos';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('pending_txns')) {
          db.createObjectStore('pending_txns', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('current_session')) {
          db.createObjectStore('current_session', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sync_log')) {
          const sl = db.createObjectStore('sync_log', { autoIncrement: true });
          sl.createIndex('ts', 'ts');
        }
      },
    });
  }
  return dbPromise;
}

// Products
export async function cacheProducts(products: POSProduct[]) {
  const db = await getDB();
  const tx = db.transaction('products', 'readwrite');
  await tx.store.clear();
  for (const p of products) await tx.store.put(p);
  await tx.done;
}

export async function getCachedProducts(): Promise<POSProduct[]> {
  const db = await getDB();
  return db.getAll('products');
}

export async function getCachedProductByBarcode(barcode: string): Promise<POSProduct | undefined> {
  const all = await getCachedProducts();
  return all.find(p => p.barcode === barcode);
}

export async function decrementCachedStock(productId: string, qty: number) {
  const db = await getDB();
  const product = await db.get('products', productId);
  if (product) {
    await db.put('products', { ...product, stock: product.stock - qty });
  }
}

// Pending transactions
export async function savePendingTransaction(txn: PendingTransaction) {
  const db = await getDB();
  await db.put('pending_txns', txn);
}

export async function getPendingTransactions(): Promise<PendingTransaction[]> {
  const db = await getDB();
  return db.getAll('pending_txns');
}

export async function deletePendingTransaction(id: string) {
  const db = await getDB();
  await db.delete('pending_txns', id);
}

export async function clearSyncedTransactions(ids: string[]) {
  const db = await getDB();
  const tx = db.transaction('pending_txns', 'readwrite');
  for (const id of ids) await tx.store.delete(id);
  await tx.done;
}

// Current session
export async function saveCurrentSession(session: CurrentSession) {
  const db = await getDB();
  const tx = db.transaction('current_session', 'readwrite');
  await tx.store.clear();
  await tx.store.put(session);
  await tx.done;
}

export async function getCurrentSession(): Promise<CurrentSession | undefined> {
  const db = await getDB();
  const all = await db.getAll('current_session');
  return all[0];
}

export async function clearCurrentSession() {
  const db = await getDB();
  await db.clear('current_session');
}

// Sync log
export async function addSyncLog(entry: { ts: string; status: string; count: number; detail?: string }) {
  const db = await getDB();
  const all = await db.getAll('sync_log');
  if (all.length >= 50) {
    const tx = db.transaction('sync_log', 'readwrite');
    const keys = await tx.store.getAllKeys();
    await tx.store.delete(keys[0]);
    await tx.done;
  }
  await db.add('sync_log', entry);
}

// Offline transaction number sequence
export function generateOfflineTxnNumber(cashierName: string): string {
  const code = cashierName.substring(0, 4).toUpperCase().replace(/\s/g, '');
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const key = `pos_seq_${today}`;
  const seq = (parseInt(localStorage.getItem(key) || '0', 10)) + 1;
  localStorage.setItem(key, String(seq));
  return `POS-${today}-${code}-${String(seq).padStart(4, '0')}`;
}
