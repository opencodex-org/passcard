"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Card, LoginResponse, Payment, money, request } from "../payments-demo/api";

export default function PayPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [checkoutToken] = useState(() => typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("checkout") || "" : "");
  const [userName, setUserName] = useState("");
  const [cards, setCards] = useState<Card[]>([]);
  const [pending, setPending] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedCard, setSelectedCard] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);


  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      const data = await request<LoginResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      setToken(data.token);
      setUserName(data.user.name);
      await refresh(data.token);
      setMessage(`مرحباً ${data.user.name}. طلبات الدفع الجاهزة بانتظارك.`);
    });
  }

  async function refresh(activeToken = token) {
    const [cardData, pendingData, walletData] = await Promise.all([
      request<Card[]>("/cards/mine", {}, activeToken),
      request<Payment[]>(`/payments/pending${checkoutToken ? `?checkoutToken=${encodeURIComponent(checkoutToken)}` : ""}`, {}, activeToken),
      request<{ wallet: { balanceMinor: number } }>("/wallet", {}, activeToken),
    ]);
    setCards(cardData.filter((card) => card.status === "ACTIVE"));
    setPending(pendingData);
    setBalance(walletData.wallet.balanceMinor);
  }

  async function chooseCard() {
    if (!selectedPayment || !selectedCard) return;
    await run(async () => {
      const payment = await request<Payment>(`/payments/${selectedPayment.id}/select-card`, { method: "POST", body: JSON.stringify({ cardId: selectedCard, ...(checkoutToken ? { checkoutToken } : {}) }) }, token);
      setSelectedPayment(payment);
      setPending((items) => items.map((item) => item.id === payment.id ? payment : item));
      setMessage("تم اختيار البطاقة. راجع تفاصيل العملية قبل التأكيد.");
    });
  }

  async function confirm(confirmation: "YES" | "NO") {
    if (!selectedPayment) return;
    await run(async () => {
      const data = await request<{ payment: Payment; transaction?: { reference?: string }; balanceMinor?: number; message?: string }>(`/payments/${selectedPayment.id}/confirm`, { method: "POST", body: JSON.stringify({ confirmation }) }, token);
      setSelectedPayment(data.payment);
      setMessage(confirmation === "YES" ? `تم الدفع بنجاح. المرجع: ${data.transaction?.reference || "متاح في تفاصيل العملية"}. الرصيد الجديد: ${money(data.balanceMinor || 0)}.` : "تم إلغاء عملية الشراء.");
      await refresh();
    });
  }

  async function run(action: () => Promise<void>) {
    try { setLoading(true); setMessage(""); await action(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع."); }
    finally { setLoading(false); }
  }

  return (
    <main className="demo-shell user-shell">
      <div className="demo-container">
        <header className="demo-header"><Link href="/" className="brand-mark">PassCard <span>Max</span></Link><div className="header-links"><Link href="/merchant">واجهة الكاشير</Link><span>الدفع الآمن</span></div></header>
        <section className="demo-hero user-hero"><div><p className="eyebrow">PassCard Max / 02</p><h1>دفع واضح، ببطاقتك أنت.</h1><p className="hero-copy">اختر بطاقة PassCard، راجع التاجر والمبلغ، ثم أكّد العملية. هذه النسخة تخصم من رصيد PassCard الداخلي التجريبي، وليست بوابة Visa أو Mastercard أو Apple Pay أو Google Pay.</p></div><div className="balance-orb"><span>الرصيد الحالي</span><strong>{balance === null ? "—" : money(balance)}</strong></div></section>

        {!token ? <form className="demo-panel login-panel" onSubmit={login}><div className="panel-heading"><span className="step-number">01</span><div><h2>تسجيل الدخول</h2><p>يستخدم هذا النموذج JWT الصادر من API الحالي داخل الجلسة فقط.</p></div></div><div className="field-grid two-col"><label>البريد الإلكتروني<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@example.com" /></label><label>كلمة المرور<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label></div><button className="primary-button" disabled={loading}>الدخول إلى الدفع</button></form> : <div className="user-grid">
          <section className="demo-panel pending-panel"><div className="panel-heading"><span className="step-number accent">02</span><div><h2>طلبات الدفع المعلقة</h2><p>{userName}، اختر طلباً للمتابعة.</p></div></div>{pending.length === 0 ? <div className="empty-state">لا توجد طلبات دفع معلقة حالياً.</div> : <div className="pending-list">{pending.map((item) => <button key={item.id} className={`pending-card ${selectedPayment?.id === item.id ? "selected" : ""}`} onClick={() => setSelectedPayment(item)}><span className="status-dot" /><span><strong>{item.merchant?.businessName || item.merchant?.name || "تاجر PassCard"}</strong><small>{money(item.amountMinor)} · {item.status}</small></span><b>←</b></button>)}</div>}</section>
          <section className="demo-panel checkout-panel"><div className="panel-heading"><span className="step-number">03</span><div><h2>مراجعة الدفع</h2><p>لا يتم الخصم قبل تأكيدك. الدفع الحالي من المحفظة الداخلية التجريبية فقط.</p></div></div>{selectedPayment ? <><div className="checkout-summary"><div><span>التاجر</span><strong>{selectedPayment.merchant?.businessName || selectedPayment.merchant?.name || "PassCard Merchant"}</strong></div><div><span>المبلغ</span><strong>{money(selectedPayment.amountMinor)}</strong></div><div><span>الحالة</span><strong>{selectedPayment.status}</strong></div></div>{!selectedPayment.cardId ? <><label>بطاقتك<select value={selectedCard} onChange={(e) => setSelectedCard(e.target.value)}><option value="">اختر بطاقة ACTIVE</option>{cards.map((card) => <option key={card.id} value={card.id}>{card.cardLevel?.name || "PassCard"} ·••{(card.cardNumber?.slice(-4) || "----")}</option>)}</select></label><button className="secondary-button" onClick={chooseCard} disabled={!selectedCard || loading}>متابعة</button></> : <div className="confirmation-box"><p>هل أنت متأكد من الشراء؟</p><div className="confirm-actions"><button className="confirm-yes" onClick={() => confirm("YES")} disabled={loading}>نعم</button><button className="confirm-no" onClick={() => confirm("NO")} disabled={loading}>لا</button></div></div>}</> : <div className="empty-state">اختر طلب دفع من القائمة لعرض تفاصيله.</div>}</section>
        </div>}
        {message && <div className="demo-message" role="status">{message}</div>}
        <footer className="demo-footer">PassCard Max <span>كل المبالغ بالـ minor units.</span></footer>
      </div>
    </main>
  );
}