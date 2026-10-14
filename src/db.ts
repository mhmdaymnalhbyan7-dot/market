export type Product = { id: string; code: string; barcode: string; name: string; category: string; buy: number; price: number; stock: number; min: number; unit: string }
export type Customer = { id: string; name: string; phone: string; balance: number; credit: number }
export type Line = { productId: string; code: string; name: string; qty: number; price: number; discount: number; unit: string }
export type Sale = { id: string; number: string; date: string; customerId: string | null; customerName: string; items: Line[]; subtotal: number; discount: number; total: number; paid: number; remaining: number; method: string }
export type ReturnDoc = { id: string; number: string; date: string; saleId: string; saleNumber: string; customerId: string | null; customerName: string; items: Line[]; total: number; method: string }
export type Payment = { id: string; date: string; customerId: string; customerName: string; amount: number; note: string }
export type Settings = { storeName: string; logo: string }

const DB_NAME = 'souqna-pos'
const DB_VERSION = 1
const stores = ['products', 'customers', 'sales', 'returns', 'payments', 'audit', 'settings']

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      stores.forEach((name) => { if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' }) })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function readAll<T>(store: string): Promise<T[]> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = db.transaction(store).objectStore(store).getAll()
    request.onsuccess = () => resolve(request.result as T[])
    request.onerror = () => reject(request.error)
  })
}

async function seed() {
  const db = await openDatabase()
  const tx = db.transaction(stores, 'readwrite')
  const productsStore = tx.objectStore('products')
  const defaultSettings = { id: 'store', storeName: 'محل سمير الهبيان', logo: '' }
  const count = productsStore.count()
  count.onsuccess = () => {
    if (count.result) return
    const products: Product[] = [
      { id: 'p1', code: '1001', barcode: '6281000000011', name: 'حليب طازج كامل الدسم', category: 'ألبان', buy: 4.1, price: 5.5, stock: 48, min: 10, unit: 'حبة' },
      { id: 'p2', code: '1002', barcode: '6281000000028', name: 'خبز عربي أبيض', category: 'مخبوزات', buy: 1.2, price: 2, stock: 36, min: 8, unit: 'ربطة' },
      { id: 'p3', code: '1003', barcode: '6281000000035', name: 'أرز بسمتي هندي ٥ كجم', category: 'مواد غذائية', buy: 27, price: 34.5, stock: 18, min: 5, unit: 'كيس' },
      { id: 'p4', code: '1004', barcode: '6281000000042', name: 'زيت دوار الشمس ١.٥ لتر', category: 'مواد غذائية', buy: 10, price: 13.75, stock: 4, min: 6, unit: 'عبوة' },
      { id: 'p5', code: '1005', barcode: '6281000000059', name: 'بيض أبيض طازج ١٢ حبة', category: 'ألبان', buy: 8, price: 10.5, stock: 24, min: 6, unit: 'طبق' },
      { id: 'p6', code: '1006', barcode: '6281000000066', name: 'مياه شرب ٦ × ١.٥ لتر', category: 'مشروبات', buy: 7, price: 9.25, stock: 30, min: 8, unit: 'عبوة' },
      { id: 'p7', code: '1007', barcode: '6281000000073', name: 'قهوة عربية مطحونة ٢٥٠ جم', category: 'مشروبات', buy: 16, price: 21, stock: 12, min: 4, unit: 'عبوة' },
      { id: 'p8', code: '1008', barcode: '6281000000080', name: 'موز طازج', category: 'خضار وفواكه', buy: 3.5, price: 5, stock: 20, min: 5, unit: 'كجم' },
    ]
    products.forEach((product) => productsStore.add(product))
    const customers = tx.objectStore('customers')
    ;[
      { id: 'c1', name: 'عميل نقدي', phone: '', balance: 0, credit: 0 },
      { id: 'c2', name: 'أحمد محمد', phone: '0501234567', balance: 0, credit: 0 },
      { id: 'c3', name: 'سارة عبدالله', phone: '0552345678', balance: 0, credit: 0 },
    ].forEach((customer) => customers.add(customer))
    tx.objectStore('settings').put(defaultSettings)
  }
  await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error) })
}

export async function initialize() { await seed() }
export const getProducts = () => readAll<Product>('products')
export const getCustomers = () => readAll<Customer>('customers')
export const getSales = () => readAll<Sale>('sales')
export const getReturns = () => readAll<ReturnDoc>('returns')
export const getPayments = () => readAll<Payment>('payments')
export async function getSettings(): Promise<Settings> { return (await readAll<Settings & { id: string }>('settings'))[0] ?? { storeName: 'محل سمير الهبيان', logo: '' } }

export async function saveProduct(product: Product) {
  const db = await openDatabase(); const tx = db.transaction('products', 'readwrite'); tx.objectStore('products').put(product)
  await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error) })
}
export async function deleteProduct(id: string) {
  const db = await openDatabase(); const tx = db.transaction(['products', 'audit'], 'readwrite'); tx.objectStore('products').delete(id)
  tx.objectStore('audit').add({ id: crypto.randomUUID(), action: 'حذف منتج', target: id, date: new Date().toISOString() })
  await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error) })
}
export async function saveCustomer(customer: Customer) {
  const db = await openDatabase(); const tx = db.transaction('customers', 'readwrite'); tx.objectStore('customers').put(customer)
  await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error) })
}

export async function completeSale(sale: Sale) {
  const db = await openDatabase(); const tx = db.transaction(['sales', 'products', 'customers', 'payments', 'audit'], 'readwrite')
  const sales = tx.objectStore('sales'); const products = tx.objectStore('products'); const customers = tx.objectStore('customers')
  const existing = sales.get(sale.id)
  existing.onsuccess = () => {
    if (existing.result) { tx.abort(); return }
    const requests = sale.items.map((line) => products.get(line.productId))
    let completed = 0
    requests.forEach((request, index) => {
      request.onsuccess = () => {
        const product = request.result as Product | undefined; const line = sale.items[index]
        if (!product || product.stock < line.qty) { tx.abort(); return }
        product.stock -= line.qty; products.put(product); completed += 1
        if (completed === requests.length) {
          sales.add(sale)
          if (sale.customerId) {
            const customerRequest = customers.get(sale.customerId)
            customerRequest.onsuccess = () => {
              const customer = customerRequest.result as Customer | undefined
              if (!customer) { tx.abort(); return }
              const appliedCredit = Math.min(customer.credit ?? 0, sale.remaining)
              customer.credit = (customer.credit ?? 0) - appliedCredit
              customer.balance += sale.remaining - appliedCredit; customers.put(customer)
            }
          }
          if (sale.paid > 0) tx.objectStore('payments').add({ id: crypto.randomUUID(), date: sale.date, customerId: sale.customerId ?? '', customerName: sale.customerName, amount: sale.paid, note: `تحصيل فاتورة ${sale.number}` })
          tx.objectStore('audit').add({ id: crypto.randomUUID(), action: 'إتمام فاتورة بيع', target: sale.number, date: sale.date })
        }
      }
    })
  }
  await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error ?? new Error('تعذر إتمام الفاتورة: المخزون غير كافٍ أو البيانات غير صالحة')); tx.onerror = () => reject(tx.error) })
}

export async function completeReturn(doc: ReturnDoc) {
  const db = await openDatabase(); const tx = db.transaction(['sales', 'returns', 'products', 'customers', 'audit'], 'readwrite')
  const sales = tx.objectStore('sales'); const returns = tx.objectStore('returns'); const original = sales.get(doc.saleId)
  original.onsuccess = () => {
    if (!original.result) { tx.abort(); return }
    const allReturns = returns.getAll()
    allReturns.onsuccess = () => {
      const used = new Map<string, number>()
      ;(allReturns.result as ReturnDoc[]).filter((item) => item.saleId === doc.saleId).forEach((item) => item.items.forEach((line) => used.set(line.productId, (used.get(line.productId) ?? 0) + line.qty)))
      const source = original.result as Sale
      for (const line of doc.items) {
        const sold = source.items.find((item) => item.productId === line.productId)
        if (!sold || line.qty <= 0 || line.qty + (used.get(line.productId) ?? 0) > sold.qty) { tx.abort(); return }
      }
      const products = tx.objectStore('products')
      doc.items.forEach((line) => { const req = products.get(line.productId); req.onsuccess = () => { if (req.result) { const p = req.result as Product; p.stock += line.qty; products.put(p) } } })
      returns.add(doc)
      if (doc.method === 'حساب العميل' && doc.customerId) {
        const customerReq = tx.objectStore('customers').get(doc.customerId)
        customerReq.onsuccess = () => { const customer = customerReq.result as Customer | undefined; if (customer) { const debtReduction = Math.min(customer.balance, doc.total); customer.balance -= debtReduction; customer.credit = (customer.credit ?? 0) + doc.total - debtReduction; tx.objectStore('customers').put(customer) } }
      }
      tx.objectStore('audit').add({ id: crypto.randomUUID(), action: 'إتمام فاتورة مرتجعات', target: doc.number, date: doc.date })
    }
  }
  await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error ?? new Error('تعذر حفظ المرتجع')); tx.onerror = () => reject(tx.error) })
}

export async function collectPayment(customerId: string, amount: number, note: string) {
  const db = await openDatabase(); const tx = db.transaction(['customers', 'payments', 'audit'], 'readwrite'); const req = tx.objectStore('customers').get(customerId)
  req.onsuccess = () => { const customer = req.result as Customer | undefined; if (!customer || amount <= 0 || amount > customer.balance) { tx.abort(); return }
    customer.balance -= amount; tx.objectStore('customers').put(customer)
    tx.objectStore('payments').add({ id: crypto.randomUUID(), date: new Date().toISOString(), customerId, customerName: customer.name, amount, note })
    tx.objectStore('audit').add({ id: crypto.randomUUID(), action: 'تحصيل رصيد عميل', target: customer.name, date: new Date().toISOString() })
  }
  await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error ?? new Error('تعذر تسجيل الدفعة')); tx.onerror = () => reject(tx.error) })
}

export async function saveSettings(settings: Settings) {
  const db = await openDatabase(); const tx = db.transaction('settings', 'readwrite'); tx.objectStore('settings').put({ ...settings, id: 'store' })
  await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error) })
}