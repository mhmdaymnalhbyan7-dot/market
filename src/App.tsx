import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Activity, AlertTriangle, ArrowDownLeft, ArrowUpRight, Banknote, Barcode, Boxes, CalendarDays, Check, ChevronDown, CircleHelp, CreditCard, FileBarChart, FilePlus2, FileText, Headphones, History, ListFilter, LogOut, PackagePlus, Plus, Printer, Search, Settings as SettingsIcon, ShoppingBag, ShoppingCart, Trash2, UserRound, UsersRound, Wallet, X } from 'lucide-react'
import { collectPayment, completeReturn, completeSale, deleteProduct, getCustomers, getPayments, getProducts, getReturns, getSales, getSettings, initialize, saveCustomer, saveProduct, saveSettings, type Customer, type Line, type Payment, type Product, type ReturnDoc, type Sale, type Settings } from './db'

type Page = 'sales' | 'returns' | 'products' | 'customers' | 'accounts' | 'reports' | 'settings'
type Notice = { text: string; kind: 'success' | 'error' }
type PrintData = { kind: 'sale' | 'return'; number: string; date: string; customer: string; items: Line[]; subtotal: number; discount: number; total: number; paid: number; remaining: number; method: string; original?: string }

const money = (value: number) => `${new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2, numberingSystem: 'latn' }).format(value)} ر.س`
const shortDate = (date: string) => new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))
const makeId = () => crypto.randomUUID()
const invoiceNumber = (prefix: string, index: number) => `${prefix}-${new Date().toISOString().slice(2, 10).replaceAll('-', '')}-${String(index + 1).padStart(3, '0')}`

const nav: { id: Page; title: string; icon: typeof ShoppingCart }[] = [
  { id: 'sales', title: 'فاتورة مبيعات', icon: ShoppingCart },
  { id: 'returns', title: 'فاتورة مرتجعات', icon: ArrowDownLeft },
  { id: 'products', title: 'المنتجات والمخزون', icon: Boxes },
  { id: 'customers', title: 'العملاء', icon: UsersRound },
  { id: 'accounts', title: 'حسابات العملاء', icon: Wallet },
  { id: 'reports', title: 'التقارير', icon: FileBarChart },
  { id: 'settings', title: 'الإعدادات', icon: SettingsIcon },
]

function App() {
  const [page, setPage] = useState<Page>('sales')
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [returns, setReturns] = useState<ReturnDoc[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [settings, setSettings] = useState<Settings>({ storeName: 'محل سمير الهبيان', logo: '' })
  const [notice, setNotice] = useState<Notice | null>(null)
  const [loading, setLoading] = useState(true)
  const [latestSale, setLatestSale] = useState<Sale | null>(null)
  const [latestReturn, setLatestReturn] = useState<ReturnDoc | null>(null)
  const [printData, setPrintData] = useState<PrintData | null>(null)
  const noticeTimer = useRef<number | undefined>(undefined)

  const refresh = async () => {
    const [nextProducts, nextCustomers, nextSales, nextReturns, nextPayments, nextSettings] = await Promise.all([getProducts(), getCustomers(), getSales(), getReturns(), getPayments(), getSettings()])
    setProducts(nextProducts); setCustomers(nextCustomers); setSales(nextSales); setReturns(nextReturns); setPayments(nextPayments); setSettings(nextSettings)
  }
  useEffect(() => { initialize().then(refresh).finally(() => setLoading(false)) }, [])
  useEffect(() => { document.title = 'محل سمير الهبيان'; }, [])
  useEffect(() => { if (!notice) return; window.clearTimeout(noticeTimer.current); noticeTimer.current = window.setTimeout(() => setNotice(null), 3600) }, [notice])
  const toast = (text: string, kind: Notice['kind'] = 'success') => setNotice({ text, kind })

  const print = (data: PrintData) => {
    setPrintData(data)
    window.setTimeout(() => window.print(), 120)
  }

  if (loading) return <div className="loading-screen"><div className="brand-mark"><ShoppingBag size={23} /></div><span>جارٍ تجهيز سوقنا...</span></div>

  return <div className={`app-shell ${page === 'returns' ? 'returns-theme' : ''}`}>
    <aside className="sidebar no-print">
      <div className="brand-lockup"><div className="brand-mark"><ShoppingBag size={22} /></div><div><strong>محل سمير الهبيان</strong><span>إدارة المتجر</span></div></div>
      <div className="nav-caption">القائمة الرئيسية</div>
      <nav className="side-nav" aria-label="التنقل الرئيسي">{nav.map(({ id, title, icon: Icon }) => <button className={`nav-item ${page === id ? 'active' : ''}`} key={id} onClick={() => setPage(id)}><Icon size={19} strokeWidth={1.8} /><span>{title}</span>{id === 'products' && products.filter((item) => item.stock <= item.min).length > 0 && <i className="nav-count">{products.filter((item) => item.stock <= item.min).length}</i>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="support-row"><div className="support-icon"><Headphones size={17} /></div><div><strong>مركز المساعدة</strong><span>نحن هنا لمساعدتك</span></div><ChevronDown size={15} /></div><div className="user-row"><div className="avatar">م</div><div className="user-copy"><strong>مدير المتجر</strong><span>مدير النظام</span></div><button className="icon-btn" title="تسجيل الخروج"><LogOut size={17} /></button></div></div>
    </aside>
    <main className="main-area">
      <header className="topbar no-print"><div><div className="breadcrumb">الرئيسية <span>/</span> <b>محل سمير الهبيان</b> <span>/</span> <b>{nav.find((item) => item.id === page)?.title}</b></div><h1>{nav.find((item) => item.id === page)?.title}</h1></div><div className="topbar-actions"><div className="live-date"><CalendarDays size={17} /><span>{new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { dateStyle: 'full' }).format(new Date())}</span></div><button className="icon-btn top-help" title="المساعدة"><CircleHelp size={19} /></button></div></header>
      <div className="page-content no-print">
        {page === 'sales' && <SalesPage products={products} customers={customers} sales={sales} refresh={refresh} toast={toast} print={print} latestSale={latestSale} setLatestSale={setLatestSale} />}
        {page === 'returns' && <ReturnsPage sales={sales} returns={returns} refresh={refresh} toast={toast} print={print} latestReturn={latestReturn} setLatestReturn={setLatestReturn} />}
        {page === 'products' && <ProductsPage products={products} refresh={refresh} toast={toast} />}
        {page === 'customers' && <CustomersPage customers={customers} sales={sales} returns={returns} payments={payments} refresh={refresh} toast={toast} />}
        {page === 'accounts' && <AccountsPage customers={customers} payments={payments} refresh={refresh} toast={toast} />}
        {page === 'reports' && <ReportsPage products={products} customers={customers} sales={sales} returns={returns} payments={payments} />}
        {page === 'settings' && <SettingsPage settings={settings} setSettings={setSettings} toast={toast} />}
      </div>
      <div className="print-root" aria-hidden="true">{printData && <PrintReceipt data={printData} settings={settings} />}</div>
      {notice && <div role="status" className={`toast ${notice.kind}`}><span className="toast-icon">{notice.kind === 'success' ? <Check size={17} /> : <AlertTriangle size={17} />}</span>{notice.text}<button onClick={() => setNotice(null)} aria-label="إغلاق"><X size={16} /></button></div>}
    </main>
  </div>
}

function Shortcut({ children }: { children: string }) { return <kbd>{children}</kbd> }
function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) { return <div className="section-title"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div> }
function EmptyState({ title, copy }: { title: string; copy: string }) { return <div className="empty-state"><div className="empty-icon"><FileText size={22} /></div><strong>{title}</strong><span>{copy}</span></div> }
function TableWrap({ children }: { children: ReactNode }) { return <div className="table-wrap"><table>{children}</table></div> }

function SalesPage({ products, customers, sales, refresh, toast, print, latestSale, setLatestSale }: { products: Product[]; customers: Customer[]; sales: Sale[]; refresh: () => Promise<void>; toast: (text: string, kind?: Notice['kind']) => void; print: (data: PrintData) => void; latestSale: Sale | null; setLatestSale: (sale: Sale | null) => void }) {
  const [lines, setLines] = useState<Line[]>([])
  const [query, setQuery] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [paid, setPaid] = useState('')
  const [method, setMethod] = useState('نقدي')
  const [selected, setSelected] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const customerRef = useRef<HTMLSelectElement>(null)
  const undoRef = useRef<Line[] | null>(null)
  const itemsSubtotal = lines.reduce((sum, line) => sum + line.qty * line.price, 0)
  const discounts = lines.reduce((sum, line) => sum + line.discount, 0)
  const total = Math.max(0, itemsSubtotal - discounts)
  const paidAmount = method === 'آجل' ? 0 : Math.max(0, Number(paid || 0))
  const remaining = Math.max(0, total - paidAmount)
  const selectedCustomer = customers.find((item) => item.id === customerId)
  const suggestions = query.trim() ? products.filter((item) => `${item.name} ${item.code} ${item.barcode}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6) : []
  const remember = (next: Line[]) => { undoRef.current = lines; setLines(next) }
  const addProduct = (product: Product) => {
    if (product.stock <= 0) { toast('هذا المنتج غير متوفر في المخزون', 'error'); return }
    const existing = lines.find((item) => item.productId === product.id)
    if (existing && existing.qty >= product.stock) { toast('الكمية المطلوبة تتجاوز المخزون المتاح', 'error'); return }
    const next = existing ? lines.map((item) => item.productId === product.id ? { ...item, qty: item.qty + 1 } : item) : [...lines, { productId: product.id, code: product.code, name: product.name, qty: 1, price: product.price, discount: 0, unit: product.unit }]
    remember(next); setSelected(product.id); setQuery('')
  }
  const removeLine = (id: string) => { remember(lines.filter((item) => item.productId !== id)); if (selected === id) setSelected(null) }
  const changeLine = (id: string, field: 'qty' | 'discount', value: number) => {
    const line = lines.find((item) => item.productId === id); if (!line) return
    const product = products.find((item) => item.id === id)
    const safeValue = field === 'qty' ? Math.max(1, Math.min(product?.stock ?? line.qty, value || 1)) : Math.max(0, Math.min(line.qty * line.price, value || 0))
    remember(lines.map((item) => item.productId === id ? { ...item, [field]: safeValue } : item))
  }
  const reset = () => { setLines([]); setSelected(null); setCustomerId(''); setPaid(''); setMethod('نقدي'); setQuery(''); setLatestSale(null) }
  const startNewInvoice = () => {
    if (lines.length && !window.confirm('بدء فاتورة جديدة؟ سيتم إلغاء الفاتورة الحالية غير المحفوظة.')) return
    reset()
  }
  const finalize = async () => {
    if (busyRef.current) return
    if (!lines.length) { toast('أضف منتجاً واحداً على الأقل إلى الفاتورة', 'error'); return }
    if ((method === 'آجل' || remaining > 0) && !customerId) { toast('اختر عميلاً لتسجيل المبلغ المتبقي كرصيد', 'error'); return }
    if (!window.confirm(`تأكيد إتمام الفاتورة بإجمالي ${money(total)}؟`)) return
    busyRef.current = true; setBusy(true)
    const date = new Date().toISOString()
    const sale: Sale = { id: makeId(), number: invoiceNumber('SAL', sales.filter((item) => item.date.slice(0, 10) === date.slice(0, 10)).length), date, customerId: customerId || null, customerName: selectedCustomer?.name ?? 'عميل نقدي', items: lines.map((line) => ({ ...line })), subtotal: itemsSubtotal, discount: discounts, total, paid: Math.min(paidAmount, total), remaining, method }
    try {
      await completeSale(sale); await refresh(); setLatestSale(sale); reset(); toast(`تم حفظ الفاتورة ${sale.number} وتحديث المخزون`)
    } catch (error) { toast(error instanceof Error ? error.message : 'تعذر حفظ الفاتورة', 'error') }
    finally { busyRef.current = false; setBusy(false) }
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!/^F[1-8]$/.test(event.key) || event.repeat) return
      const target = event.target as HTMLElement
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) return
      event.preventDefault()
      if (event.key === 'F1') { startNewInvoice() }
      if (event.key === 'F2') searchRef.current?.focus()
      if (event.key === 'F3') customerRef.current?.focus()
      if (event.key === 'F4' && selected) { if (window.confirm('حذف المنتج المحدد من الفاتورة؟')) removeLine(selected) }
      if (event.key === 'F5' && lines.length) removeLine(lines[lines.length - 1].productId)
      if (event.key === 'F6' && selected) document.querySelector<HTMLInputElement>(`[data-qty="${selected}"]`)?.focus()
      if (event.key === 'F7' && undoRef.current) { setLines(undoRef.current); undoRef.current = null; toast('تم التراجع عن آخر تعديل') }
      if (event.key === 'F8') void finalize()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const todaySales = sales.filter((sale) => sale.date.slice(0, 10) === new Date().toISOString().slice(0, 10))
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0)
  const lowStockCount = products.filter((item) => item.stock <= item.min).length
  const activeCustomers = new Set(sales.filter((sale) => sale.customerId).map((sale) => sale.customerId as string)).size
  const averageBasket = todaySales.length ? todayRevenue / todaySales.length : 0

  return <div className="sales-layout">
    <div className="sales-main">
      <div className="overview-strip" aria-label="ملخص يومي">
        <article className="overview-card primary">
          <span className="overview-label">إيرادات اليوم</span>
          <strong>{money(todayRevenue)}</strong>
          <small>{todaySales.length} فاتورة</small>
        </article>
        <article className="overview-card success">
          <span className="overview-label">متوسط السلة</span>
          <strong>{money(averageBasket)}</strong>
          <small>{activeCustomers} عميل نشط</small>
        </article>
        <article className="overview-card warning">
          <span className="overview-label">مخزون منخفض</span>
          <strong>{lowStockCount}</strong>
          <small>منتجات تحتاج متابعة</small>
        </article>
        <article className="overview-card blue">
          <span className="overview-label">أحدث فاتورة</span>
          <strong>{latestSale ? latestSale.number : '—'}</strong>
          <small>{latestSale ? shortDate(latestSale.date) : 'لا توجد مبيعات محفوظة'}</small>
        </article>
      </div>
      <div className="invoice-heading"><div className="invoice-badge"><FilePlus2 size={20} /></div><div><strong>فاتورة جديدة</strong><span>أدخل المنتجات وابدأ عملية البيع</span></div><div className="invoice-meta"><span><b>رقم الفاتورة</b><strong>{invoiceNumber('SAL', sales.length)}</strong></span><span><b>التاريخ والوقت</b><strong>{new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())}</strong></span></div></div>
      <section className="surface cashier-surface">
        <div className="cashier-tools">
          <div className="field customer-field"><label htmlFor="customer-select">العميل</label><div className="select-shell"><UserRound size={17} /><select id="customer-select" ref={customerRef} value={customerId} onChange={(event) => setCustomerId(event.target.value)}><option value="">عميل نقدي / اختر عميلاً</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}{customer.balance > 0 ? ` · رصيد ${money(customer.balance)}` : ''}</option>)}</select><ChevronDown size={15} /></div>{selectedCustomer && <span className="customer-balance">الرصيد السابق: {money(selectedCustomer.balance)}{selectedCustomer.credit > 0 ? ` · رصيد دائن ${money(selectedCustomer.credit)}` : ''}</span>}</div>
          <div className="field search-field"><label htmlFor="product-search">بحث عن منتج <span>الاسم أو الباركود أو الرمز</span></label><div className="search-shell"><Search size={18} /><input id="product-search" ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && suggestions[0]) { event.preventDefault(); addProduct(suggestions[0]) } }} placeholder="امسح الباركود أو اكتب اسم المنتج..." autoComplete="off" /><Shortcut>F2</Shortcut><Barcode className="search-barcode" size={20} /></div>{suggestions.length > 0 && <div className="suggestion-list">{suggestions.map((product) => <button key={product.id} onClick={() => addProduct(product)}><span className="suggestion-icon"><PackagePlus size={18} /></span><span className="suggestion-copy"><strong>{product.name}</strong><small>{product.code} · متوفر {product.stock} {product.unit}</small></span><b>{money(product.price)}</b></button>)}</div>}</div>
        </div>
        <div className="table-heading"><div><ShoppingCart size={17} /><strong>المنتجات في الفاتورة</strong><span className="item-count">{lines.length}</span></div><button className="text-btn" onClick={() => { if (lines.length && window.confirm('مسح جميع المنتجات من الفاتورة؟')) { remember([]); setSelected(null) } }} disabled={!lines.length}><Trash2 size={15} /> مسح الكل</button></div>
        {lines.length ? <TableWrap><thead><tr><th>المنتج</th><th>الرمز</th><th>الكمية</th><th>سعر الوحدة</th><th>الخصم</th><th>الإجمالي</th><th></th></tr></thead><tbody>{lines.map((line) => <tr key={line.productId} className={selected === line.productId ? 'selected-row' : ''} onClick={() => setSelected(line.productId)}><td><strong className="product-name-cell">{line.name}</strong><small>{line.unit}</small></td><td className="muted-cell">{line.code}</td><td><div className="qty-control"><button onClick={(event) => { event.stopPropagation(); changeLine(line.productId, 'qty', line.qty - 1) }} aria-label="تقليل الكمية">−</button><input data-qty={line.productId} value={line.qty} min="1" max={products.find((product) => product.id === line.productId)?.stock} onChange={(event) => changeLine(line.productId, 'qty', Number(event.target.value))} aria-label={`كمية ${line.name}`} /><button onClick={(event) => { event.stopPropagation(); changeLine(line.productId, 'qty', line.qty + 1) }} aria-label="زيادة الكمية">+</button></div></td><td>{money(line.price)}</td><td><input className="discount-input" type="number" min="0" max={line.qty * line.price} value={line.discount} onClick={(event) => event.stopPropagation()} onChange={(event) => changeLine(line.productId, 'discount', Number(event.target.value))} aria-label={`خصم ${line.name}`} /></td><td><strong>{money(line.qty * line.price - line.discount)}</strong></td><td><button className="icon-btn danger-icon" title="حذف المنتج" onClick={(event) => { event.stopPropagation(); removeLine(line.productId) }}><X size={16} /></button></td></tr>)}</tbody></TableWrap> : <EmptyState title="فاتورتك جاهزة للبدء" copy="ابحث عن منتج أو امسح الباركود لإضافته هنا" />}
        <div className="keyboard-hint"><span><Shortcut>F4</Shortcut> حذف المحدد</span><span><Shortcut>F5</Shortcut> حذف آخر منتج</span><span><Shortcut>F6</Shortcut> تعديل الكمية</span><span><Shortcut>F7</Shortcut> تراجع</span></div>
      </section>
      <div className="recent-strip"><div><History size={17} /><strong>آخر الفواتير</strong></div>{sales.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3).map((sale) => <button key={sale.id} onClick={() => print({ kind: 'sale', number: sale.number, date: sale.date, customer: sale.customerName, items: sale.items, subtotal: sale.subtotal, discount: sale.discount, total: sale.total, paid: sale.paid, remaining: sale.remaining, method: sale.method })}><span>{sale.number}</span><b>{money(sale.total)}</b><Printer size={14} /></button>)}{!sales.length && <span className="muted-cell">لا توجد فواتير سابقة</span>}</div>
    </div>
    <aside className="checkout-panel surface">
      <SectionTitle title="ملخص الفاتورة" subtitle="راجع الإجمالي قبل الإتمام" />
      <div className="summary-lines"><div><span>الإجمالي قبل الخصم</span><b>{money(itemsSubtotal)}</b></div><div className="discount-row"><span>إجمالي الخصومات</span><b>− {money(discounts)}</b></div></div>
      <div className="total-block"><span>المبلغ المستحق</span><strong>{money(total)}</strong><small>شامل جميع المنتجات</small></div>
      <div className="field paid-field"><label htmlFor="paid-input">المبلغ المدفوع</label><div className="money-input"><input id="paid-input" type="number" min="0" max={total} step="0.5" value={method === 'آجل' ? '0' : paid} onChange={(event) => setPaid(event.target.value)} placeholder={String(total)} disabled={method === 'آجل'} /><span>ر.س</span></div></div>
      <div className="due-row"><span>المتبقي على العميل</span><strong className={remaining ? 'due-value' : 'settled-value'}>{money(remaining)}</strong></div>
      <div className="field payment-field"><label>طريقة الدفع</label><div className="payment-options">{[{ label: 'نقدي', icon: Banknote }, { label: 'بطاقة', icon: CreditCard }, { label: 'آجل', icon: Wallet }].map(({ label, icon: Icon }) => <button key={label} className={method === label ? 'selected' : ''} onClick={() => { setMethod(label); if (label === 'آجل') setPaid('0'); else if (paid === '0') setPaid('') }}><Icon size={17} />{label}</button>)}</div></div>
      {method === 'آجل' && <div className="credit-note"><Wallet size={15} /> يسجل المتبقي على حساب العميل المحدد</div>}
      <button className="primary-action finalize-btn" onClick={() => void finalize()} disabled={busy || !lines.length}><span>بدء تنفيذ الفاتورة</span><Plus size={19} /><Shortcut>F8</Shortcut></button>
      <div className="checkout-secondary"><button onClick={() => { const sale = latestSale; if (sale) print({ kind: 'sale', number: sale.number, date: sale.date, customer: sale.customerName, items: sale.items, subtotal: sale.subtotal, discount: sale.discount, total: sale.total, paid: sale.paid, remaining: sale.remaining, method: sale.method }); else toast('أتمم فاتورة أولاً لطباعة نسخة منها', 'error') }}><Printer size={16} /> طباعة آخر فاتورة</button><button onClick={startNewInvoice}><FilePlus2 size={16} /> فاتورة جديدة <Shortcut>F1</Shortcut></button></div>
      <div className="shortcut-footer"><span>بحث منتج <Shortcut>F2</Shortcut></span><span>اختيار عميل <Shortcut>F3</Shortcut></span></div>
    </aside>
  </div>
}

function ReturnsPage({ sales, returns, refresh, toast, print, latestReturn, setLatestReturn }: { sales: Sale[]; returns: ReturnDoc[]; refresh: () => Promise<void>; toast: (text: string, kind?: Notice['kind']) => void; print: (data: PrintData) => void; latestReturn: ReturnDoc | null; setLatestReturn: (doc: ReturnDoc | null) => void }) {
  const [saleId, setSaleId] = useState('')
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [method, setMethod] = useState('نقدي')
  const [busy, setBusy] = useState(false)
  const original = sales.find((sale) => sale.id === saleId)
  const returned = returns.filter((doc) => doc.saleId === saleId).flatMap((doc) => doc.items).reduce<Record<string, number>>((map, line) => { map[line.productId] = (map[line.productId] ?? 0) + line.qty; return map }, {})
  const selectedLines = original?.items.filter((line) => (quantities[line.productId] ?? 0) > 0).map((line) => ({ ...line, qty: quantities[line.productId], discount: line.qty ? line.discount / line.qty * quantities[line.productId] : 0 })) ?? []
  const total = selectedLines.reduce((sum, line) => sum + line.qty * line.price - line.discount, 0)
  const save = async () => {
    if (!original || !selectedLines.length) { toast('اختر فاتورة وحدد الكميات المرتجعة', 'error'); return }
    if (busy) return
    if (!window.confirm(`تأكيد حفظ المرتجع بقيمة ${money(total)}؟`)) return
    setBusy(true)
    const doc: ReturnDoc = { id: makeId(), number: invoiceNumber('RET', returns.length), date: new Date().toISOString(), saleId: original.id, saleNumber: original.number, customerId: original.customerId, customerName: original.customerName, items: selectedLines, total, method: method === 'نقدي' ? 'استرداد نقدي' : 'حساب العميل' }
    try { await completeReturn(doc); await refresh(); setLatestReturn(doc); setQuantities({}); toast(`تم حفظ المرتجع ${doc.number} وإعادة الكمية للمخزون`) }
    catch (error) { toast(error instanceof Error ? error.message : 'تعذر حفظ المرتجع', 'error') }
    finally { setBusy(false) }
  }
  return <div className="returns-page">
    <div className="returns-banner"><div className="return-emblem"><ArrowDownLeft size={22} /></div><div><h2>إدارة المرتجعات</h2><p>ابحث عن فاتورة البيع الأصلية وحدد المنتجات المراد إرجاعها</p></div><div className="return-stat"><span>إجمالي المرتجعات</span><strong>{money(returns.reduce((sum, item) => sum + item.total, 0))}</strong></div></div>
    <section className="surface return-form"><div className="field return-search"><label htmlFor="sale-select">فاتورة البيع الأصلية</label><div className="select-shell"><Search size={17} /><select id="sale-select" value={saleId} onChange={(event) => { setSaleId(event.target.value); setQuantities({}) }}><option value="">ابحث واختر رقم الفاتورة...</option>{sales.slice().sort((a, b) => b.date.localeCompare(a.date)).map((sale) => <option key={sale.id} value={sale.id}>{sale.number} · {sale.customerName} · {money(sale.total)}</option>)}</select><ChevronDown size={16} /></div></div>
    {original ? <><div className="original-invoice"><div><span>رقم الفاتورة</span><strong>{original.number}</strong></div><div><span>العميل</span><strong>{original.customerName}</strong></div><div><span>تاريخ البيع</span><strong>{shortDate(original.date)}</strong></div><div><span>إجمالي الفاتورة</span><strong>{money(original.total)}</strong></div></div>
      <div className="table-heading"><div><Boxes size={17} /><strong>أصناف الفاتورة</strong></div><span className="tiny-note">لا يمكن تجاوز الكمية المتبقية من الفاتورة</span></div>
      <TableWrap><thead><tr><th>المنتج</th><th>الكمية المباعة</th><th>مرتجع سابقاً</th><th>المتاح للإرجاع</th><th>كمية الإرجاع</th><th>قيمة الإرجاع</th></tr></thead><tbody>{original.items.map((line) => { const max = Math.max(0, line.qty - (returned[line.productId] ?? 0)); const qty = quantities[line.productId] ?? 0; return <tr key={line.productId}><td><strong className="product-name-cell">{line.name}</strong><small>{line.code}</small></td><td>{line.qty} {line.unit}</td><td>{returned[line.productId] ?? 0}</td><td><span className={max ? 'available-tag' : 'unavailable-tag'}>{max}</span></td><td><input className="return-qty" type="number" min="0" max={max} value={qty} disabled={!max} onChange={(event) => setQuantities({ ...quantities, [line.productId]: Math.max(0, Math.min(max, Number(event.target.value))) })} aria-label={`كمية إرجاع ${line.name}`} /></td><td>{money(qty * line.price - (line.qty ? line.discount / line.qty * qty : 0))}</td></tr>})}</tbody></TableWrap>
      <div className="return-bottom"><div className="field"><label>طريقة التسوية</label><div className="payment-options"><button className={method === 'نقدي' ? 'selected' : ''} onClick={() => setMethod('نقدي')}><Banknote size={16} /> استرداد نقدي</button><button className={method === 'حساب العميل' ? 'selected' : ''} onClick={() => setMethod('حساب العميل')}><Wallet size={16} /> حساب العميل</button></div></div><div className="refund-total"><span>مبلغ الاسترداد</span><strong>{money(total)}</strong></div><div className="return-actions"><button className="secondary-action" onClick={() => { const doc = latestReturn; if (doc) print({ kind: 'return', number: doc.number, date: doc.date, customer: doc.customerName, items: doc.items, subtotal: doc.total, discount: 0, total: doc.total, paid: doc.total, remaining: 0, method: doc.method, original: doc.saleNumber }); else toast('احفظ مرتجعاً أولاً لطباعة نسخة منه', 'error') }}><Printer size={17} /> طباعة المرتجع</button><button className="return-primary" onClick={() => void save()} disabled={busy || !selectedLines.length}><Check size={18} /> حفظ فاتورة المرتجعات</button></div></div>
      </> : <EmptyState title="اختر فاتورة البيع" copy="ستظهر الأصناف والكميات المتاحة للإرجاع بعد اختيار الفاتورة" />}</section>
    <section className="surface recent-returns"><SectionTitle title="سجل المرتجعات" subtitle="آخر عمليات الإرجاع المحفوظة" />{returns.length ? <TableWrap><thead><tr><th>رقم المرتجع</th><th>الفاتورة الأصلية</th><th>العميل</th><th>التاريخ</th><th>طريقة التسوية</th><th>المبلغ</th></tr></thead><tbody>{returns.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map((doc) => <tr key={doc.id}><td><strong>{doc.number}</strong></td><td>{doc.saleNumber}</td><td>{doc.customerName}</td><td>{shortDate(doc.date)}</td><td>{doc.method}</td><td>{money(doc.total)}</td></tr>)}</tbody></TableWrap> : <EmptyState title="لا توجد مرتجعات بعد" copy="ستظهر هنا الفواتير التي يتم حفظها" />}</section>
  </div>
}

function ProductsPage({ products, refresh, toast }: { products: Product[]; refresh: () => Promise<void>; toast: (text: string, kind?: Notice['kind']) => void }) {
  const [query, setQuery] = useState(''); const [category, setCategory] = useState('الكل'); const [editing, setEditing] = useState<Product | null | undefined>(undefined)
  const categories = ['الكل', ...new Set(products.map((item) => item.category))]
  const filtered = products.filter((item) => (category === 'الكل' || item.category === category) && `${item.name} ${item.code} ${item.barcode}`.toLowerCase().includes(query.toLowerCase()))
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const data = new FormData(event.currentTarget); const code = String(data.get('code') ?? '').trim()
    if (products.some((item) => item.code === code && item.id !== editing?.id)) { toast('رمز المنتج مستخدم مسبقاً', 'error'); return }
    const product: Product = { id: editing?.id ?? makeId(), code, barcode: String(data.get('barcode') ?? '').trim(), name: String(data.get('name') ?? '').trim(), category: String(data.get('category') ?? '').trim(), buy: Number(data.get('buy')), price: Number(data.get('price')), stock: Number(data.get('stock')), min: Number(data.get('min')), unit: String(data.get('unit') ?? 'حبة').trim() }
    try { await saveProduct(product); await refresh(); setEditing(undefined); toast('تم حفظ بيانات المنتج') } catch { toast('تعذر حفظ المنتج', 'error') }
  }
  return <>
    <div className="stat-row three"><Stat icon={<Boxes />} label="إجمالي المنتجات" value={String(products.length)} tone="green" /><Stat icon={<AlertTriangle />} label="مخزون منخفض" value={String(products.filter((item) => item.stock <= item.min).length)} tone="amber" /><Stat icon={<Activity />} label="قيمة المخزون" value={money(products.reduce((sum, item) => sum + item.stock * item.buy, 0))} tone="blue" /></div>
    <section className="surface management-surface"><SectionTitle title="قائمة المنتجات" subtitle="إدارة الأصناف والأسعار والكميات المتاحة" action={<button className="primary-action compact" onClick={() => setEditing(null)}><Plus size={17} /> إضافة منتج</button>} />
      <div className="filter-row"><div className="table-search"><Search size={17} /><input placeholder="ابحث باسم المنتج أو الرمز..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="filter-select"><ListFilter size={16} /><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></div><span className="result-count">{filtered.length} منتج</span></div>
      <TableWrap><thead><tr><th>المنتج</th><th>الرمز / الباركود</th><th>التصنيف</th><th>سعر الشراء</th><th>سعر البيع</th><th>المخزون</th><th>الحالة</th><th></th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><small>{item.unit}</small></td><td>{item.code}<small>{item.barcode || '—'}</small></td><td><span className="category-chip">{item.category}</span></td><td>{money(item.buy)}</td><td><strong>{money(item.price)}</strong></td><td>{item.stock} {item.unit}<small>الحد الأدنى {item.min}</small></td><td><span className={`stock-pill ${item.stock <= item.min ? 'low' : 'normal'}`}><i />{item.stock <= item.min ? 'مخزون منخفض' : 'متوفر'}</span></td><td><div className="row-actions"><button className="icon-btn" title="تعديل المنتج" onClick={() => setEditing(item)}><SettingsIcon size={16} /></button><button className="icon-btn danger-icon" title="حذف المنتج" onClick={async () => { if (window.confirm(`حذف ${item.name} من قائمة المنتجات؟`)) { await deleteProduct(item.id); await refresh(); toast('تم حذف المنتج') } }}><Trash2 size={16} /></button></div></td></tr>)}</tbody></TableWrap>
      {!filtered.length && <EmptyState title="لا توجد نتائج" copy="جرّب تغيير كلمات البحث أو أضف منتجاً جديداً" />}
    </section>
    {editing !== undefined && <Dialog title={editing ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'} onClose={() => setEditing(undefined)}><form className="form-grid" onSubmit={submit}><Field label="اسم المنتج" name="name" required value={editing?.name} /><Field label="رمز المنتج" name="code" required value={editing?.code} /><Field label="الباركود" name="barcode" value={editing?.barcode} /><Field label="التصنيف" name="category" required value={editing?.category} placeholder="مثال: ألبان" /><Field label="سعر الشراء" name="buy" type="number" min="0" step="0.01" required value={editing?.buy} /><Field label="سعر البيع" name="price" type="number" min="0" step="0.01" required value={editing?.price} /><Field label="الكمية المتاحة" name="stock" type="number" min="0" step="1" required value={editing?.stock ?? 0} /><Field label="تنبيه عند الكمية" name="min" type="number" min="0" step="1" required value={editing?.min ?? 5} /><Field label="وحدة القياس" name="unit" required value={editing?.unit ?? 'حبة'} /><div className="dialog-actions"><button type="button" className="secondary-action" onClick={() => setEditing(undefined)}>إلغاء</button><button className="primary-action compact" type="submit"><Check size={16} /> حفظ المنتج</button></div></form></Dialog>}
  </>
}

function CustomersPage({ customers, sales, returns, payments, refresh, toast }: { customers: Customer[]; sales: Sale[]; returns: ReturnDoc[]; payments: Payment[]; refresh: () => Promise<void>; toast: (text: string, kind?: Notice['kind']) => void }) {
  const [query, setQuery] = useState(''); const [editing, setEditing] = useState<Customer | null | undefined>(undefined); const [selected, setSelected] = useState<Customer | null>(null)
  const filtered = customers.filter((item) => `${item.name} ${item.phone}`.includes(query))
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); const name = String(data.get('name') ?? '').trim(); if (!name) return; await saveCustomer({ id: editing?.id ?? makeId(), name, phone: String(data.get('phone') ?? '').trim(), balance: editing?.balance ?? 0, credit: editing?.credit ?? 0 }); await refresh(); setEditing(undefined); toast('تم حفظ بيانات العميل') }
  const timeline = selected ? [...sales.filter((item) => item.customerId === selected.id).map((item) => ({ date: item.date, title: `فاتورة بيع ${item.number}`, value: item.total, type: 'sale' })), ...returns.filter((item) => item.customerId === selected.id).map((item) => ({ date: item.date, title: `مرتجع ${item.number}`, value: item.total, type: 'return' })), ...payments.filter((item) => item.customerId === selected.id).map((item) => ({ date: item.date, title: item.note || 'دفعة على الحساب', value: item.amount, type: 'payment' }))].sort((a, b) => b.date.localeCompare(a.date)) : []
  return <><div className="stat-row three"><Stat icon={<UsersRound />} label="إجمالي العملاء" value={String(customers.length)} tone="green" /><Stat icon={<Wallet />} label="إجمالي المديونية" value={money(customers.reduce((sum, item) => sum + item.balance, 0))} tone="amber" /><Stat icon={<History />} label="عمليات هذا الشهر" value={String(sales.filter((item) => item.customerId).length + returns.filter((item) => item.customerId).length)} tone="blue" /></div>
    <section className="surface management-surface"><SectionTitle title="دليل العملاء" subtitle="ملفات العملاء وسجل التعاملات" action={<button className="primary-action compact" onClick={() => setEditing(null)}><Plus size={17} /> إضافة عميل</button>} /><div className="filter-row"><div className="table-search"><Search size={17} /><input placeholder="ابحث باسم العميل أو رقم الجوال..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><span className="result-count">{filtered.length} عميل</span></div>
      <TableWrap><thead><tr><th>العميل</th><th>رقم الجوال</th><th>عدد الفواتير</th><th>إجمالي المشتريات</th><th>الرصيد المستحق</th><th>رصيد دائن</th><th></th></tr></thead><tbody>{filtered.map((item) => { const customerSales = sales.filter((sale) => sale.customerId === item.id); return <tr key={item.id} onClick={() => setSelected(item)} className="clickable-row"><td><div className="customer-cell"><span className="avatar small-avatar">{item.name.slice(0, 1)}</span><strong>{item.name}</strong></div></td><td>{item.phone || '—'}</td><td>{customerSales.length}</td><td>{money(customerSales.reduce((sum, sale) => sum + sale.total, 0))}</td><td><strong className={item.balance ? 'due-value' : ''}>{money(item.balance)}</strong></td><td>{money(item.credit ?? 0)}</td><td><button className="icon-btn" title="تعديل العميل" onClick={(event) => { event.stopPropagation(); setEditing(item) }}><SettingsIcon size={16} /></button></td></tr>})}</tbody></TableWrap>
      {!filtered.length && <EmptyState title="لا يوجد عملاء مطابقون" copy="أضف عميلاً أو غيّر عبارة البحث" />}</section>
    {selected && <Dialog title={`ملف ${selected.name}`} onClose={() => setSelected(null)}><div className="profile-summary"><div className="avatar profile-avatar">{selected.name.slice(0, 1)}</div><div><strong>{selected.name}</strong><span>{selected.phone || 'لا يوجد رقم جوال'}</span></div><div className="profile-balance"><span>الرصيد المستحق</span><b>{money(selected.balance)}</b></div></div><h3 className="dialog-subtitle">سجل التعاملات</h3>{timeline.length ? <div className="timeline">{timeline.map((item, index) => <div className="timeline-row" key={`${item.title}-${index}`}><i className={`timeline-dot ${item.type}`} /><div><strong>{item.title}</strong><small>{shortDate(item.date)}</small></div><b>{money(item.value)}</b></div>)}</div> : <EmptyState title="لا توجد تعاملات" copy="ستظهر الفواتير والمدفوعات والمرتجعات هنا" />}</Dialog>}
    {editing !== undefined && <Dialog title={editing ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'} onClose={() => setEditing(undefined)}><form className="form-grid" onSubmit={submit}><Field label="اسم العميل" name="name" required value={editing?.name} /><Field label="رقم الجوال (اختياري)" name="phone" type="tel" value={editing?.phone} /><div className="dialog-actions"><button type="button" className="secondary-action" onClick={() => setEditing(undefined)}>إلغاء</button><button className="primary-action compact" type="submit"><Check size={16} /> حفظ العميل</button></div></form></Dialog>}
  </>
}

function AccountsPage({ customers, payments, refresh, toast }: { customers: Customer[]; payments: Payment[]; refresh: () => Promise<void>; toast: (text: string, kind?: Notice['kind']) => void }) {
  const debtors = customers.filter((item) => item.balance > 0).sort((a, b) => b.balance - a.balance)
  const totalDebt = debtors.reduce((sum, item) => sum + item.balance, 0)
  const [paying, setPaying] = useState<Customer | null>(null)
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!paying) return; const data = new FormData(event.currentTarget); const amount = Number(data.get('amount')); if (amount <= 0 || amount > paying.balance) { toast('أدخل مبلغاً لا يتجاوز الرصيد المستحق', 'error'); return } try { await collectPayment(paying.id, amount, String(data.get('note') || 'دفعة على الحساب')); await refresh(); setPaying(null); toast('تم تسجيل الدفعة وتحديث رصيد العميل') } catch { toast('تعذر تسجيل الدفعة', 'error') } }
  return <><div className="stat-row three"><Stat icon={<Wallet />} label="إجمالي الأرصدة المستحقة" value={money(totalDebt)} tone="amber" /><Stat icon={<UsersRound />} label="عملاء لديهم رصيد" value={String(debtors.length)} tone="green" /><Stat icon={<Banknote />} label="التحصيلات المسجلة" value={money(payments.reduce((sum, item) => sum + item.amount, 0))} tone="blue" /></div>
    <div className="accounts-grid"><section className="surface management-surface"><SectionTitle title="الأرصدة المستحقة" subtitle="سجل دفعة جزئية أو سدد الرصيد بالكامل" /><TableWrap><thead><tr><th>العميل</th><th>رقم الجوال</th><th>الرصيد المستحق</th><th>رصيد دائن</th><th>آخر دفعة</th><th></th></tr></thead><tbody>{debtors.map((customer) => { const last = payments.filter((item) => item.customerId === customer.id).sort((a, b) => b.date.localeCompare(a.date))[0]; return <tr key={customer.id}><td><strong>{customer.name}</strong></td><td>{customer.phone || '—'}</td><td><strong className="due-value">{money(customer.balance)}</strong></td><td>{money(customer.credit ?? 0)}</td><td>{last ? shortDate(last.date) : '—'}</td><td><button className="collect-btn" onClick={() => setPaying(customer)}><Banknote size={15} /> تسجيل دفعة</button></td></tr>})}</tbody></TableWrap>{!debtors.length && <EmptyState title="لا توجد أرصدة مستحقة" copy="ستظهر هنا حسابات العملاء ذات الرصيد" />}</section>
    <section className="surface management-surface payments-panel"><SectionTitle title="آخر التحصيلات" subtitle="الدفعات المسجلة على الحساب" />{payments.length ? <div className="payments-list">{payments.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map((item) => <div className="payment-row" key={item.id}><span className="payment-symbol"><ArrowDownLeft size={16} /></span><div><strong>{item.customerName}</strong><small>{item.note} · {shortDate(item.date)}</small></div><b>{money(item.amount)}</b></div>)}</div> : <EmptyState title="لا توجد دفعات" copy="ستظهر التحصيلات المسجلة هنا" />}</section></div>
    {paying && <Dialog title={`تسجيل دفعة من ${paying.name}`} onClose={() => setPaying(null)}><div className="payment-balance-note">الرصيد المستحق الحالي <strong>{money(paying.balance)}</strong></div><form className="form-grid" onSubmit={submit}><Field label="مبلغ الدفعة" name="amount" type="number" min="0.01" max={paying.balance} step="0.01" required autoFocus /><Field label="ملاحظة (اختياري)" name="note" placeholder="مثال: سداد نقدي" /><div className="dialog-actions"><button className="secondary-action" type="button" onClick={() => setPaying(null)}>إلغاء</button><button className="primary-action compact" type="submit"><Check size={16} /> تسجيل الدفعة</button></div></form></Dialog>}
  </>
}

function ReportsPage({ products, customers, sales, returns, payments }: { products: Product[]; customers: Customer[]; sales: Sale[]; returns: ReturnDoc[]; payments: Payment[] }) {
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10)); const [to, setTo] = useState(new Date().toISOString().slice(0, 10))
  const inRange = (date: string) => date.slice(0, 10) >= from && date.slice(0, 10) <= to
  const rangeSales = sales.filter((item) => inRange(item.date)); const rangeReturns = returns.filter((item) => inRange(item.date)); const rangePayments = payments.filter((item) => inRange(item.date))
  const gross = rangeSales.reduce((sum, item) => sum + item.total, 0); const returnTotal = rangeReturns.reduce((sum, item) => sum + item.total, 0); const collected = rangeSales.reduce((sum, item) => sum + item.paid, 0) + rangePayments.reduce((sum, item) => sum + item.amount, 0)
  const best = new Map<string, { name: string; qty: number; value: number }>()
  rangeSales.forEach((sale) => sale.items.forEach((line) => { const item = best.get(line.productId) ?? { name: line.name, qty: 0, value: 0 }; item.qty += line.qty; item.value += line.qty * line.price - line.discount; best.set(line.productId, item) }))
  const ranking = [...best.values()].sort((a, b) => b.qty - a.qty).slice(0, 5); const maxBest = Math.max(1, ...ranking.map((item) => item.qty))
  return <><section className="surface report-filter"><div><FileBarChart size={19} /><div><strong>نظرة عامة على الأداء</strong><span>تقارير المبيعات والتحصيل والمخزون</span></div></div><label>من <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label>إلى <input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label></section>
    <div className="stat-row four"><Stat icon={<ShoppingCart />} label="إجمالي المبيعات" value={money(gross)} tone="green" detail={`${rangeSales.length} فاتورة`} /><Stat icon={<ArrowDownLeft />} label="إجمالي المرتجعات" value={money(returnTotal)} tone="red" detail={`${rangeReturns.length} مرتجع`} /><Stat icon={<ArrowUpRight />} label="صافي المبيعات" value={money(gross - returnTotal)} tone="blue" detail="بعد خصم المرتجعات" /><Stat icon={<Banknote />} label="التحصيل الفعلي" value={money(collected)} tone="amber" detail="لا يشمل الأرصدة الآجلة" /></div>
    <div className="reports-grid"><section className="surface report-card"><SectionTitle title="الأكثر مبيعاً" subtitle="حسب الكمية المباعة ضمن الفترة" />{ranking.length ? <div className="ranking-list">{ranking.map((item, index) => <div className="ranking-row" key={item.name}><span className="ranking-num">{String(index + 1).padStart(2, '0')}</span><div className="ranking-content"><div><strong>{item.name}</strong><span>{item.qty} وحدة <b>{money(item.value)}</b></span></div><div className="bar-track"><i style={{ width: `${item.qty / maxBest * 100}%` }} /></div></div></div>)}</div> : <EmptyState title="لا توجد مبيعات في هذه الفترة" copy="غيّر نطاق التاريخ لعرض النتائج" />}</section>
    <section className="surface report-card"><SectionTitle title="مؤشرات الحسابات" subtitle="الأرصدة والدفعات خلال الفترة" /><div className="metric-list"><div><span>إجمالي ديون العملاء الحالية</span><strong>{money(customers.reduce((sum, item) => sum + item.balance, 0))}</strong></div><div><span>الفواتير المتبقية في الفترة</span><strong>{money(rangeSales.reduce((sum, item) => sum + item.remaining, 0))}</strong></div><div><span>دفعات الحساب المستلمة</span><strong>{money(rangePayments.reduce((sum, item) => sum + item.amount, 0))}</strong></div><div><span>عدد العملاء المدينين</span><strong>{customers.filter((item) => item.balance > 0).length}</strong></div></div></section>
    <section className="surface report-card low-stock-card"><SectionTitle title="تنبيهات المخزون" subtitle="منتجات وصلت إلى الحد الأدنى أو أقل" />{products.filter((item) => item.stock <= item.min).length ? <div className="low-stock-list">{products.filter((item) => item.stock <= item.min).map((item) => <div key={item.id}><span className="warning-dot"><AlertTriangle size={15} /></span><strong>{item.name}</strong><span>المتاح <b>{item.stock}</b> · الحد الأدنى {item.min}</span></div>)}</div> : <div className="all-stock-ok"><Check size={17} /> جميع المنتجات ضمن مستوى المخزون الآمن</div>}</section>
    <section className="surface report-card"><SectionTitle title="حركة الفواتير" subtitle="ملخص المبيعات والمرتجعات ضمن الفترة" />{rangeSales.length || rangeReturns.length ? <div className="flow-list">{[...rangeSales.map((item) => ({ date: item.date, label: item.number, customer: item.customerName, amount: item.total, type: 'sale' })), ...rangeReturns.map((item) => ({ date: item.date, label: item.number, customer: item.customerName, amount: item.total, type: 'return' }))].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map((item) => <div key={item.label}><span className={`flow-type ${item.type}`}>{item.type === 'sale' ? <ArrowUpRight size={15} /> : <ArrowDownLeft size={15} />}</span><div><strong>{item.label}</strong><small>{item.customer} · {shortDate(item.date)}</small></div><b>{item.type === 'return' ? '− ' : ''}{money(item.amount)}</b></div>)}</div> : <EmptyState title="لا توجد حركة خلال الفترة" copy="ستظهر هنا الفواتير بعد إتمامها" />}</section></div>
  </>
}

function SettingsPage({ settings, setSettings, toast }: { settings: Settings; setSettings: (settings: Settings) => void; toast: (text: string, kind?: Notice['kind']) => void }) {
  const [name, setName] = useState(settings.storeName); const [logo, setLogo] = useState(settings.logo)
  const save = async (event: FormEvent) => { event.preventDefault(); const next = { storeName: name.trim() || 'محل سمير الهبيان', logo: logo.trim() }; await saveSettings(next); setSettings(next); toast('تم حفظ إعدادات المتجر') }
  return <div className="settings-layout"><section className="surface settings-card"><SectionTitle title="بيانات المتجر" subtitle="تظهر هذه البيانات في الفواتير المطبوعة" /><form className="settings-form" onSubmit={save}><label className="form-label">اسم المتجر<input value={name} onChange={(event) => setName(event.target.value)} required /></label><label className="form-label">رابط شعار المتجر (اختياري)<input value={logo} onChange={(event) => setLogo(event.target.value)} placeholder="https://..." dir="ltr" /></label>{logo && <img className="logo-preview" src={logo} alt="معاينة شعار المتجر" /> }<div className="setting-note"><Printer size={17} /><span>تدعم الفواتير الطباعة على ورق A4 والإيصالات الحرارية بعرض 80 مم.</span></div><button className="primary-action compact" type="submit"><Check size={17} /> حفظ الإعدادات</button></form></section><section className="surface settings-card"><SectionTitle title="اختصارات لوحة المفاتيح" subtitle="تعمل في شاشة فاتورة المبيعات عند عدم الكتابة في حقل" /><div className="settings-shortcuts">{[['F1', 'فاتورة جديدة'], ['F2', 'البحث عن منتج'], ['F3', 'اختيار عميل'], ['F4', 'حذف المنتج المحدد'], ['F5', 'حذف آخر منتج'], ['F6', 'تعديل كمية المنتج'], ['F7', 'تراجع عن آخر تعديل'], ['F8', 'حفظ الفاتورة']].map(([key, label]) => <div key={key}><span>{label}</span><Shortcut>{key}</Shortcut></div>)}</div></section></div>
}

function Stat({ icon, label, value, tone, detail }: { icon: ReactNode; label: string; value: string; tone: string; detail?: string }) { return <div className="surface stat-card"><span className={`stat-icon ${tone}`}>{icon}</span><div><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div></div> }
function Field({ label, name, value, type = 'text', required, min, max, step, placeholder, autoFocus }: { label: string; name: string; value?: string | number; type?: string; required?: boolean; min?: number | string; max?: number | string; step?: number | string; placeholder?: string; autoFocus?: boolean }) { return <label className="form-label">{label}<input name={name} type={type} defaultValue={value} required={required} min={min} max={max} step={step} placeholder={placeholder} autoFocus={autoFocus} /></label> }
function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) { return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="modal-dialog" role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="إغلاق"><X size={18} /></button></header><div className="modal-content">{children}</div></section></div> }

function PrintReceipt({ data, settings }: { data: PrintData; settings: Settings }) {
  return <article className="print-sheet"><header className="receipt-head">{settings.logo && <img src={settings.logo} alt="شعار المتجر" />}<h1>{settings.storeName}</h1><strong>{data.kind === 'sale' ? 'فاتورة مبيعات' : 'فاتورة مرتجعات'}</strong></header><div className="receipt-meta"><span>رقم الفاتورة</span><b>{data.number}</b><span>التاريخ</span><b>{shortDate(data.date)}</b><span>العميل</span><b>{data.customer}</b>{data.original && <><span>الفاتورة الأصلية</span><b>{data.original}</b></>}</div><table><thead><tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead><tbody>{data.items.map((line) => <tr key={line.productId}><td>{line.name}</td><td>{line.qty}</td><td>{money(line.price)}</td><td>{money(line.qty * line.price - line.discount)}</td></tr>)}</tbody></table><div className="receipt-totals"><div><span>الإجمالي قبل الخصم</span><b>{money(data.subtotal)}</b></div><div><span>الخصم</span><b>{money(data.discount)}</b></div><div className="receipt-grand"><span>الإجمالي النهائي</span><b>{money(data.total)}</b></div><div><span>{data.kind === 'sale' ? 'المبلغ المدفوع' : 'طريقة التسوية'}</span><b>{data.kind === 'sale' ? money(data.paid) : data.method}</b></div>{data.kind === 'sale' && <div><span>المتبقي</span><b>{money(data.remaining)}</b></div>}<div><span>طريقة الدفع</span><b>{data.method}</b></div></div><footer>شكراً لزيارتكم، نسعد بخدمتكم دائماً</footer></article>
}

export default App