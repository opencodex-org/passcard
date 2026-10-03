"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  API_URL,
  Cashier,
  LoginResponse,
  Merchant,
  Payment,
  money,
  request,
} from "../payments-demo/api";

export default function MerchantPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [cashier, setCashier] = useState<Cashier | null>(null);
  const [merchantId, setMerchantId] = useState("");
  const [cashierId, setCashierId] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [merchantCode, setMerchantCode] = useState("");
  const [cashierName, setCashierName] = useState("");
  const [cashierCode, setCashierCode] = useState("");
  const [amount, setAmount] = useState("5");
  const [payment, setPayment] = useState<Payment | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      const data = await request<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      setMessage(`مرحباً ${data.user.name}. تم تسجيل الدخول للجلسة الحالية.`);
    });
  }

  async function createMerchant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      const data = await request<Merchant>("/merchants", {
        method: "POST",
        body: JSON.stringify({ name: merchantName, businessName, merchantCode }),
      }, token);
      setMerchant(data);
      setMerchantId(data.id);
      setMessage("تم إنشاء التاجر. أنشئ كاشيراً أو استخدم معرّفاً موجوداً.");
    });
  }

  async function createCashier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      const data = await request<Cashier>("/cashiers", {
        method: "POST",
        body: JSON.stringify({ merchantId, name: cashierName, code: cashierCode }),
      }, token);
      setCashier(data);
      setCashierId(data.id);
      setMessage("تم إنشاء الكاشير. أصبح بالإمكان إنشاء طلب دفع.");
    });
  }

  async function createPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      const data = await request<Payment>("/merchant/payments", {
        method: "POST",
        body: JSON.stringify({
          amountMinor: Math.round(Number(amount) * 100),
          merchantId,
          cashierId,
        }),
      }, token);
      setPayment(data);
      setMessage("تم إنشاء طلب الدفع. انتظر تأكيد المستخدم.");
    });
  }

  async function run(action: () => Promise<void>) {
    try {
      setLoading(true);
      setMessage("");
      await action();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="demo-shell">
      <div className="demo-container">
        <header className="demo-header">
          <Link href="/" className="brand-mark">PassCard <span>Max</span></Link>
          <div className="header-links"><Link href="/pay">واجهة المستخدم</Link><span>تجربة الكاشير</span></div>
        </header>

        <section className="demo-hero">
          <div>
            <p className="eyebrow">Merchant console / 01</p>
            <h1>ابدأ طلب الدفع من نقطة البيع.</h1>
            <p className="hero-copy">أنشئ طلباً بمبلغ بالريال السعودي واترك للمستخدم اختيار بطاقته وتأكيد العملية.</p>
          </div>
          <div className="hero-stamp"><strong>MAX</strong><span>PASSCARD<br />PAYMENT</span></div>
        </section>

        <form className="demo-panel login-panel" onSubmit={login}>
          <div className="panel-heading"><span className="step-number">01</span><div><h2>دخول الكاشير</h2><p>استخدم حساباً بدور CASHIER من النظام الحالي.</p></div></div>
          <div className="field-grid two-col">
            <label>البريد الإلكتروني<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="cashier@example.com" /></label>
            <label>كلمة المرور<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          </div>
          <button className="primary-button" disabled={loading}>{token ? "تم تسجيل الدخول" : "تسجيل الدخول"}</button>
        </form>

        <div className="demo-columns">
          <section className="demo-panel">
            <div className="panel-heading"><span className="step-number">02</span><div><h2>بيانات التاجر والكاشير</h2><p>أنشئ سجلاً جديداً أو استخدم المعرّفات الموجودة.</p></div></div>
            <form onSubmit={createMerchant} className="stack-form">
              <div className="field-grid two-col"><label>اسم التاجر<input value={merchantName} onChange={(e) => setMerchantName(e.target.value)} placeholder="متجر النخبة" required /></label><label>اسم النشاط<input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Elite Store" required /></label></div>
              <div className="field-grid two-col"><label>رمز التاجر<input value={merchantCode} onChange={(e) => setMerchantCode(e.target.value)} placeholder="ELITE-001" required /></label><label>Merchant ID<input value={merchantId} onChange={(e) => setMerchantId(e.target.value)} placeholder="استخدم ID موجوداً" /></label></div>
              <button className="secondary-button" disabled={!token || loading}>إنشاء تاجر</button>
            </form>
            <form onSubmit={createCashier} className="stack-form divider-top">
              <div className="field-grid two-col"><label>اسم الكاشير<input value={cashierName} onChange={(e) => setCashierName(e.target.value)} placeholder="أحمد" required /></label><label>رمز الكاشير<input value={cashierCode} onChange={(e) => setCashierCode(e.target.value)} placeholder="C-01" required /></label></div>
              <div className="field-grid two-col"><label>Cashier ID<input value={cashierId} onChange={(e) => setCashierId(e.target.value)} placeholder="استخدم ID موجوداً" /></label><div className="record-chip">{merchant ? `تاجر نشط: ${merchant.name}` : "لم يتم اختيار تاجر"}{cashier ? ` · كاشير: ${cashier.code}` : ""}</div></div>
              <button className="secondary-button" disabled={!token || loading}>إنشاء كاشير</button>
            </form>
          </section>

          <section className="demo-panel payment-panel">
            <div className="panel-heading"><span className="step-number accent">03</span><div><h2>طلب دفع جديد</h2><p>المبلغ يستخدم minor units: 5 ر.س = 500.</p></div></div>
            <form onSubmit={createPayment} className="stack-form">
              <label>المبلغ بالريال السعودي<input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></label>
              <div className="summary-line"><span>سيتم إنشاء الطلب بقيمة</span><strong>{money(Math.round(Number(amount || 0) * 100))}</strong></div>
              <button className="primary-button" disabled={!token || !merchantId || !cashierId || loading}>إنشاء طلب الدفع</button>
            </form>
            {payment && <div className="payment-ticket"><span className="status-dot pending-dot" /> <div><strong>الطلب قيد الانتظار</strong><small>Payment ID: {payment.id}</small><small>الحالة: {payment.status}</small><small>تاجر: {merchant?.businessName || "تم الاختيار"}</small></div><div className="fake-qr" aria-label="رابط الدفع التجريبي">••<br />••</div></div>}
          </section>
        </div>

        {message && <div className="demo-message" role="status">{message}</div>}
        <footer className="demo-footer">API: {API_URL} <span>لا يتم تنفيذ الخصم من شاشة الكاشير.</span></footer>
      </div>
    </main>
  );
}