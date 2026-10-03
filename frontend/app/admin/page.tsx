"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { API_URL } from "../api-url";

type UserSummary = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
};

type UserCard = {
  id: string;
  maskedNumber: string;
  status: string;
  cardLevel: { name: string };
};

type TopupRecord = {
  id: string;
  adminId: string | null;
  userId: string;
  cardId: string | null;
  amountMinor: number;
  status: string;
  reference: string | null;
  createdAt: string;
  user: { name: string; email: string };
  card: { maskedNumber: string; status: string } | null;
};

type TopupResult = {
  topup: { id: string; reference: string; amountMinor: number };
  balanceMinor: number;
  duplicate: boolean;
};

async function api<T>(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(body?.message)
      ? body.message.join("، ")
      : body?.message || "تعذر إكمال الطلب.";
    throw new Error(message);
  }
  return body as T;
}

function formatMoney(amountMinor: number) {
  const whole = Math.trunc(amountMinor / 100);
  const fraction = String(amountMinor % 100).padStart(2, "0");
  return `${whole}.${fraction} ر.س`;
}

function parseAmountToMinor(value: string): number | null {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;

  const whole = Number(match[1]);
  const fraction = Number((match[2] || "").padEnd(2, "0"));
  if (!Number.isSafeInteger(whole)) return null;

  const amountMinor = whole * 100 + fraction;
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0 || amountMinor > 2147483647) {
    return null;
  }
  return amountMinor;
}

export default function AdminTopupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [cards, setCards] = useState<UserCard[]>([]);
  const [cardId, setCardId] = useState("");
  const [amountSar, setAmountSar] = useState("25");
  const [history, setHistory] = useState<TopupRecord[]>([]);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [result, setResult] = useState<TopupResult | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const requestInFlight = useRef(false);
  const idempotencyKey = useRef<string | null>(null);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message || "تعذر تسجيل الدخول.");
      const topups = await api<TopupRecord[]>("/admin/topups", body.token);
      setToken(body.token);
      setHistory(topups);
      setSuccess("تم تسجيل الدخول.");
    });
  }

  async function searchUsers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      const found = await api<UserSummary[]>(
        `/admin/users?search=${encodeURIComponent(search.trim())}`,
        token,
      );
      setUsers(found);
      setSelectedUser(null);
      setCards([]);
      setCardId("");
    });
  }

  async function chooseUser(user: UserSummary) {
    await run(async () => {
      const userCards = await api<UserCard[]>(
        `/admin/users/${user.id}/cards`,
        token,
      );
      setSelectedUser(user);
      setCards(userCards.filter((card) => card.status === "ACTIVE"));
      setCardId("");
    });
  }

  async function loadHistory(activeToken = token) {
    const entries = await api<TopupRecord[]>("/admin/topups", activeToken);
    setHistory(entries);
  }

  async function confirmTopup() {
    if (!selectedUser || !cardId || requestInFlight.current) return;
    const amountMinor = parseAmountToMinor(amountSar);
    if (amountMinor === null) {
      setError("أدخل مبلغاً صحيحاً أكبر من صفر وبحد أقصى منزلتين عشريتين.");
      setConfirmationOpen(false);
      return;
    }

    requestInFlight.current = true;
    await run(async () => {
      const topup = await api<TopupResult>("/admin/topups", token, {
        method: "POST",
        body: JSON.stringify({
          userId: selectedUser.id,
          cardId,
          amountMinor,
          idempotencyKey: idempotencyKey.current || crypto.randomUUID(),
        }),
      });
      setResult(topup);
      setSuccess(
        topup.duplicate
          ? "تم التعرف على الطلب المكرر دون إضافة رصيد جديد."
          : "تمت إضافة الرصيد بنجاح.",
      );
      setConfirmationOpen(false);
      idempotencyKey.current = null;
      await loadHistory();
    });
    requestInFlight.current = false;
  }

  async function run(action: () => Promise<void>) {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "حدث خطأ غير متوقع.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="demo-shell">
      <div className="demo-container">
        <header className="demo-header">
          <Link href="/" className="brand-mark">PassCard <span>Admin</span></Link>
          <div className="header-links"><Link href="/merchant">الكاشير</Link><span>إدارة الشحن</span></div>
        </header>

        <section className="demo-hero">
          <div>
            <p className="eyebrow">Administration / Wallet</p>
            <h1>شحن موثق، برصيد مضبوط.</h1>
            <p className="hero-copy">كل عملية ترتبط بمشرف ومستخدم وبطاقة، وتسجل بمعرّف فريد يمنع تكرار الإضافة.</p>
          </div>
          <div className="hero-stamp"><strong>TOP</strong><span>ADMIN<br />LEDGER</span></div>
        </section>

        {!token ? (
          <form className="demo-panel login-panel" onSubmit={login}>
            <div className="panel-heading"><span className="step-number">01</span><div><h2>دخول الإدارة</h2><p>يتطلب حساباً نشطاً بدور ADMIN.</p></div></div>
            <div className="field-grid two-col">
              <label>البريد الإلكتروني<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
              <label>كلمة المرور<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
            </div>
            <button className="primary-button" disabled={loading}>{loading ? "جارٍ التحقق..." : "تسجيل الدخول"}</button>
          </form>
        ) : (
          <div className="demo-columns">
            <section className="demo-panel">
              <div className="panel-heading"><span className="step-number">01</span><div><h2>اختيار المستخدم والبطاقة</h2><p>البحث بالبريد أو الاسم أو رقم الجوال.</p></div></div>
              <form className="stack-form" onSubmit={searchUsers}>
                <label>بحث المستخدم<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="اسم، بريد أو جوال" /></label>
                <button className="secondary-button" disabled={loading}>{loading ? "جارٍ البحث..." : "بحث عن مستخدم"}</button>
              </form>
              {users.length > 0 && <div className="pending-list topup-user-list">{users.map((user) => <button type="button" key={user.id} className={`pending-card ${selectedUser?.id === user.id ? "selected" : ""}`} onClick={() => void chooseUser(user)} disabled={loading}><span className="status-dot" /><span><strong>{user.name}</strong><small>{user.email} · {user.status}</small></span><b>اختيار</b></button>)}</div>}
              {users.length === 0 && <div className="empty-state topup-empty">ابحث عن مستخدم لعرض بطاقاته.</div>}
              {selectedUser && <div className="stack-form topup-card-picker">
                <div className="record-chip">المستخدم: {selectedUser.name} · {selectedUser.email}</div>
                <label>بطاقة المستخدم<select value={cardId} onChange={(event) => setCardId(event.target.value)}><option value="">اختر بطاقة نشطة</option>{cards.map((card) => <option key={card.id} value={card.id}>{card.cardLevel.name} · {card.maskedNumber}</option>)}</select></label>
                {cards.length === 0 && <div className="empty-state">لا توجد بطاقة نشطة لهذا المستخدم.</div>}
              </div>}
            </section>

            <section className="demo-panel payment-panel">
              <div className="panel-heading"><span className="step-number accent">02</span><div><h2>إضافة رصيد</h2><p>الرصيد يسجل بالوحدات الصغرى، دون كسور عائمة.</p></div></div>
              <div className="stack-form">
                <label>المبلغ بالريال<input type="number" min="0.01" step="0.01" value={amountSar} onChange={(event) => setAmountSar(event.target.value)} /></label>
                <div className="summary-line"><span>قيمة الإضافة</span><strong>{parseAmountToMinor(amountSar) === null ? "—" : formatMoney(parseAmountToMinor(amountSar)!)}</strong></div>
                <button className="primary-button" onClick={() => { setError(""); idempotencyKey.current = crypto.randomUUID(); setConfirmationOpen(true); }} disabled={loading || !selectedUser || !cardId || parseAmountToMinor(amountSar) === null}>إضافة رصيد</button>
              </div>
              {result && <div className="payment-ticket topup-result"><span className="status-dot" /><div><strong>تمت العملية · {formatMoney(result.topup.amountMinor)}</strong><small>المرجع: {result.topup.reference}</small><small>الرصيد الجديد: {formatMoney(result.balanceMinor)}</small></div></div>}
            </section>
          </div>
        )}

        {confirmationOpen && <div className="topup-confirm-backdrop" role="presentation"><section className="demo-panel topup-confirm" role="dialog" aria-modal="true" aria-labelledby="topup-confirm-title"><div className="panel-heading"><span className="step-number accent">!</span><div><h2 id="topup-confirm-title">تأكيد إضافة الرصيد</h2><p>راجع المستفيد والبطاقة والمبلغ قبل التنفيذ.</p></div></div><div className="checkout-summary"><div><span>المستخدم</span><strong>{selectedUser?.name}</strong></div><div><span>البطاقة</span><strong>{cards.find((card) => card.id === cardId)?.maskedNumber}</strong></div><div><span>المبلغ</span><strong>{formatMoney(parseAmountToMinor(amountSar) || 0)}</strong></div></div><div className="confirm-actions"><button className="confirm-yes" onClick={() => void confirmTopup()} disabled={loading}>{loading ? "جارٍ الإضافة..." : "تأكيد الشحن"}</button><button className="confirm-no" onClick={() => { idempotencyKey.current = null; setConfirmationOpen(false); }} disabled={loading}>رجوع</button></div></section></div>}

        {error && <div className="demo-message topup-error" role="alert">{error}</div>}
        {success && <div className="demo-message" role="status">{success}</div>}

        {token && <section className="demo-panel topup-history"><div className="panel-heading"><span className="step-number">03</span><div><h2>سجل عمليات الشحن</h2><p>آخر 100 عملية مسجلة في دفتر المعاملات.</p></div></div>{history.length === 0 ? <div className="empty-state">لا توجد عمليات شحن بعد.</div> : <div className="topup-table-wrap"><table className="topup-table"><thead><tr><th>المستخدم</th><th>البطاقة</th><th>المبلغ</th><th>المرجع</th><th>التاريخ</th></tr></thead><tbody>{history.map((item) => <tr key={item.id}><td>{item.user.name}<small>{item.user.email}</small></td><td>{item.card?.maskedNumber || "—"}</td><td>{formatMoney(item.amountMinor)}</td><td>{item.reference}</td><td>{new Date(item.createdAt).toLocaleString("ar-SA")}</td></tr>)}</tbody></table></div>}</section>}

        <footer className="demo-footer">PassCard Admin <span>لا يتم تخزين PAN كامل أو CVV أو PIN.</span></footer>
      </div>
    </main>
  );
}