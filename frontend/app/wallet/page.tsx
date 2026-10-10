"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { request } from "../payments-demo/api";
import { useAuthSession } from "../auth-session";

type WalletTransaction = {
  id: string;
  amountMinor: number;
  type: string;
  status: string;
  reference: string | null;
  description: string | null;
  createdAt: string;
};

type WalletResponse = {
  success: boolean;
  wallet: { id: string; balanceMinor: number; points: number; transactions: WalletTransaction[] };
};

type TopupRequest = {
  id: string;
  amountMinor: number;
  status: string;
  description: string | null;
  reference: string | null;
  createdAt: string;
  updatedAt: string;
};

function money(amountMinor: number) {
  return `${(amountMinor / 100).toFixed(2)} ر.س`;
}

function parseAmount(value: string) {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  const amount = Number(match[1]) * 100 + Number((match[2] || "").padEnd(2, "0"));
  return Number.isSafeInteger(amount) && amount >= 100 && amount <= 2147483647 ? amount : null;
}

export default function WalletPage() {
  const { accessToken, user } = useAuthSession();
  const [wallet, setWallet] = useState<WalletResponse["wallet"] | null>(null);
  const [requests, setRequests] = useState<TopupRequest[]>([]);
  const [amount, setAmount] = useState("25.00");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const idempotencyKey = useRef<string | null>(null);

  async function refresh(token = accessToken) {
    if (!token) return;
    const [walletData, requestData] = await Promise.all([
      request<WalletResponse>("/wallet", {}, token),
      request<TopupRequest[]>("/wallet/topup-requests", {}, token),
    ]);
    setWallet(walletData.wallet);
    setRequests(requestData);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!accessToken) {
        setInitialLoading(false);
        return;
      }
      try {
        const [walletData, requestData] = await Promise.all([
          request<WalletResponse>("/wallet", {}, accessToken),
          request<TopupRequest[]>("/wallet/topup-requests", {}, accessToken),
        ]);
        if (!cancelled) {
          setWallet(walletData.wallet);
          setRequests(requestData);
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "تعذر تحميل المحفظة.");
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [accessToken]);

  async function submitTopupRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!accessToken) {
      setError("سجّل الدخول أولًا لإنشاء طلب شحن.");
      return;
    }
    const amountMinor = parseAmount(amount);
    if (amountMinor === null) {
      setError("أدخل مبلغًا صحيحًا لا يقل عن 1 ريال، وبحد أقصى منزلتين عشريتين.");
      return;
    }
    idempotencyKey.current ||= crypto.randomUUID();
    try {
      setLoading(true);
      const result = await request<{ request: { id: string; status: string; amountMinor: number }; duplicate: boolean }>("/wallet/topup-requests", {
        method: "POST",
        body: JSON.stringify({ amountMinor, idempotencyKey: idempotencyKey.current }),
      }, accessToken);
      setMessage(result.duplicate ? "هذا الطلب مسجل مسبقًا ولم تتم إضافة رصيد جديد." : "تم حفظ طلب الشحن. لم يتغير الرصيد؛ ينتظر الطلب موافقة الإدارة.");
      idempotencyKey.current = null;
      await refresh(accessToken);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر إنشاء طلب الشحن.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <header>
          <p className="text-sm font-semibold text-gray-500">PassCard</p>
          <h1 className="mt-2 text-3xl font-bold">المحفظة</h1>
          <p className="mt-3 text-gray-600">الرصيد وسجل العمليات من حسابك المسجّل، وليس بيانات تجريبية ثابتة.</p>
        </header>

        {!accessToken && <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">سجّل الدخول لعرض رصيدك وطلب شحن. <Link href="/login" className="font-bold underline">تسجيل الدخول</Link></section>}

        <section className="mt-8 rounded-3xl bg-black p-7 text-white shadow-xl">
          <p className="text-sm text-white/60">الرصيد المتاح</p>
          <p className="mt-3 text-4xl font-bold">{initialLoading ? "جارٍ التحميل..." : wallet ? money(wallet.balanceMinor) : "—"}</p>
          {user && <p className="mt-3 text-sm text-white/70">الحساب: {user.name} · النقاط: {wallet?.points ?? 0}</p>}
          <p className="mt-4 text-sm leading-6 text-white/60">الرصيد الحالي دفتر داخلي في PassCard، وليس حسابًا مصرفيًا. شحنه لا يعني إصدار بطاقة بنكية.</p>
        </section>

        {accessToken && <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <form onSubmit={submitTopupRequest} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">طلب شحن بموافقة الإدارة</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">يرسل الطلب للمراجعة فقط. لن يضاف الرصيد إلا بعد الموافقة، وسيتم تسجيل القرار في سجل المعاملات.</p>
            <label className="mt-5 block"><span className="mb-2 block text-sm font-medium">المبلغ بالريال السعودي</span><input type="number" min="1" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required className="w-full rounded-xl border border-gray-300 px-4 py-3" /></label>
            <p className="mt-3 text-sm text-gray-500">قيمة الطلب: {parseAmount(amount) === null ? "—" : money(parseAmount(amount)!)}</p>
            <button type="submit" disabled={loading || initialLoading} className="mt-5 w-full rounded-xl bg-black px-4 py-3 font-semibold text-white disabled:opacity-50">{loading ? "جارٍ إرسال الطلب..." : "إرسال طلب الشحن"}</button>
          </form>
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">الشحن الإلكتروني</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">Visa وMastercard وApple Pay وGoogle Pay غير مفعلة في هذه النسخة. لم تتم تهيئة مزوّد دفع خارجي أو مفاتيح اختبار أو Webhook للتحقق من الدفع.</p>
            <div className="mt-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">لن يتم إنشاء عملية دفع أو خصم مبلغ حتى يكتمل إعداد مزوّد معتمد واختبار التحقق من نتيجة الدفع على الخادم.</div>
          </section>
        </section>}

        {error && <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
        {message && <div role="status" className="mt-6 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">{message}</div>}

        {accessToken && <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">طلبات الشحن</h2>
          {requests.length === 0 ? <p className="mt-4 text-sm text-gray-500">لا توجد طلبات شحن.</p> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[500px] text-right"><thead><tr className="border-b border-gray-200 text-sm text-gray-500"><th className="px-3 py-3">المبلغ</th><th className="px-3 py-3">الحالة</th><th className="px-3 py-3">التاريخ</th><th className="px-3 py-3">ملاحظة</th></tr></thead><tbody>{requests.map((item) => <tr key={item.id} className="border-b border-gray-100"><td className="px-3 py-4">{money(item.amountMinor)}</td><td className="px-3 py-4">{item.status}</td><td className="px-3 py-4 text-sm text-gray-500">{new Date(item.createdAt).toLocaleString("ar-SA")}</td><td className="px-3 py-4 text-sm text-gray-500">{item.description || "—"}</td></tr>)}</tbody></table></div>}
        </section>}

        {accessToken && <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">سجل المعاملات</h2>
          {!wallet || wallet.transactions.length === 0 ? <p className="mt-4 text-sm text-gray-500">لا توجد معاملات مسجلة بعد.</p> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[600px] text-right"><thead><tr className="border-b border-gray-200 text-sm text-gray-500"><th className="px-3 py-3">النوع</th><th className="px-3 py-3">المبلغ</th><th className="px-3 py-3">الحالة</th><th className="px-3 py-3">المرجع</th><th className="px-3 py-3">التاريخ</th></tr></thead><tbody>{wallet.transactions.map((item) => <tr key={item.id} className="border-b border-gray-100"><td className="px-3 py-4">{item.type}</td><td className="px-3 py-4">{money(item.amountMinor)}</td><td className="px-3 py-4">{item.status}</td><td className="px-3 py-4 font-mono text-xs">{item.reference || "—"}</td><td className="px-3 py-4 text-sm text-gray-500">{new Date(item.createdAt).toLocaleString("ar-SA")}</td></tr>)}</tbody></table></div>}
        </section>}
      </div>
    </main>
  );
}
