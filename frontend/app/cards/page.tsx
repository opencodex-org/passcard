"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, request } from "../payments-demo/api";
import { useAuthSession } from "../auth-session";

type CardLevel = {
  id: string;
  name: string;
  description: string | null;
  priceMinor: number;
  color: string | null;
  imageUrl: string | null;
};

function money(amountMinor: number) {
  return `${(amountMinor / 100).toFixed(2)} ر.س`;
}

export default function CardsPage() {
  const { accessToken } = useAuthSession();
  const [levels, setLevels] = useState<CardLevel[]>([]);
  const [myCards, setMyCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await request<CardLevel[]>("/cards/levels");
        if (!cancelled) setLevels(data);
        if (accessToken) {
          const cards = await request<Card[]>("/cards/mine", {}, accessToken);
          if (!cancelled) setMyCards(cards);
        } else if (!cancelled) {
          setMyCards([]);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "تعذر تحميل البطاقات.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [accessToken]);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-gray-500">PassCard</p>
            <h1 className="mt-2 text-3xl font-bold">بطاقاتي</h1>
            <p className="mt-2 text-gray-600">اختر مستوى من المستويات المسجلة فعليًا في PassCard، ثم أرسل طلب البطاقة للمراجعة.</p>
          </div>
          <Link href="/cards/create" className="rounded-xl bg-black px-5 py-3 text-center font-semibold text-white transition hover:opacity-80">
            إنشاء بطاقة
          </Link>
        </div>

        {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}

        {accessToken && <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">طلبات وبطاقاتي</h2>
          {myCards.length === 0 ? <p className="mt-4 text-sm text-gray-500">لا توجد بطاقات أو طلبات محفوظة في حسابك بعد.</p> : <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{myCards.map((card) => <article key={card.id} className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-2"><h3 className="font-bold">{card.cardName || card.cardLevel?.name || "PassCard"}</h3><span className="rounded-full bg-gray-100 px-3 py-1 text-xs">{card.status}</span></div>
            <p className="mt-2 text-sm text-gray-600">المستوى: {card.cardLevel?.name || "—"}</p>
            {card.cardNumber && <p className="mt-2 font-mono text-sm">••••{card.cardNumber.slice(-4)}</p>}
            {card.reviewReason && <p className="mt-2 text-sm text-gray-600">ملاحظة الإدارة: {card.reviewReason}</p>}
          </article>)}</div>}
        </section>}

        <section className="mt-10">
          <h2 className="text-xl font-bold">مستويات PassCard</h2>
          {loading ? <p className="mt-5 text-gray-500">جارٍ تحميل المستويات...</p> : levels.length === 0 ? <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-6 text-sm leading-6 text-gray-600">لا توجد مستويات نشطة مسجلة في قاعدة البيانات. يحتاج المدير إلى إضافتها من لوحة الإدارة قبل إنشاء طلبات البطاقات؛ لم تتم إضافة أسعار افتراضية.</div> : <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{levels.map((level) => <article key={level.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1">
            <div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-bold">{level.name}</h3><p className="mt-1 text-sm text-gray-500">{level.description || "مستوى بطاقة PassCard"}</p></div><span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">PassCard</span></div>
            <p className="mt-5 text-lg font-bold">{money(level.priceMinor)}</p>
            <Link href={`/cards/create?level=${encodeURIComponent(level.name)}`} className="mt-6 block rounded-xl border border-gray-300 px-4 py-3 text-center text-sm font-semibold transition hover:bg-gray-100">اختيار المستوى</Link>
          </article>)}</div>}
        </section>
        <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6"><h2 className="text-lg font-bold">ملاحظة مهمة</h2><p className="mt-2 text-sm leading-6 text-gray-600">إنشاء الطلب لا يفعّل البطاقة. حالة الطلب تبقى Pending حتى قرار الإدارة. هذه البطاقة الداخلية ليست بطاقة مصرفية؛ إصدار بطاقة حقيقية أو إضافتها إلى Apple Wallet/Google Wallet يحتاج جهة إصدار وتكاملًا رسميًا.</p></section>
      </div>
    </main>
  );
}
