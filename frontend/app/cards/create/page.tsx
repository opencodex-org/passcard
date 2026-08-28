"use client";

import { FormEvent, useState } from "react";

const levels = [
  "Basic",
  "Standard",
  "Advanced",
  "Premium",
  "Elite",
  "Ultra Elite",
  "MAX",
];

export default function CreateCardPage() {
  const [level, setLevel] = useState("Basic");
  const [cardName, setCardName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!cardName.trim()) {
      return;
    }

    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="text-sm font-semibold text-gray-500">
            PassCard
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            إنشاء بطاقة جديدة
          </h1>

          <p className="mt-3 text-gray-600">
            خصص بطاقة PassCard الخاصة بك ثم أرسل الطلب للمراجعة.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold">
              بيانات البطاقة
            </h2>

            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  اسم البطاقة
                </span>

                <input
                  type="text"
                  value={cardName}
                  onChange={(event) => setCardName(event.target.value)}
                  placeholder="مثال: PassCard الخاصة بي"
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  مستوى البطاقة
                </span>

                <select
                  value={level}
                  onChange={(event) => setLevel(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black"
                >
                  {levels.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  الصورة
                </span>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  اللون الرئيسي
                </span>

                <input
                  type="color"
                  defaultValue="#111111"
                  className="h-12 w-full rounded-xl border border-gray-300 bg-white p-1"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  الوصف
                </span>

                <textarea
                  rows={4}
                  placeholder="وصف اختياري للبطاقة"
                  className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </label>

              <div className="rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-600">
                بعد إرسال الطلب، ستتم مراجعته من الإدارة. لا تعتبر
                البطاقة مفعلة قبل الموافقة.
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white transition hover:opacity-80"
              >
                إرسال طلب البطاقة
              </button>

              {submitted && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  تم إنشاء طلب البطاقة بنجاح، وحالته الحالية:
                  <strong className="mr-1">Pending</strong>.
                </div>
              )}
            </div>
          </form>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">
              معاينة البطاقة
            </h2>

            <div className="mt-6 flex min-h-[280px] items-center justify-center rounded-3xl bg-gray-100 p-6">
              <div className="w-full max-w-sm rounded-3xl bg-black p-6 text-white shadow-2xl">
                <div className="flex items-start justify-between">
                  <span className="text-sm font-medium">
                    PassCard
                  </span>

                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                    {level}
                  </span>
                </div>

                <div className="mt-20">
                  <p className="text-xs text-white/60">
                    CARD NAME
                  </p>

                  <p className="mt-2 truncate text-xl font-bold">
                    {cardName || "اسم البطاقة"}
                  </p>
                </div>

                <div className="mt-6 flex justify-between text-xs text-white/60">
                  <span>DIGITAL CARD</span>
                  <span>PASSCARD</span>
                </div>
              </div>
            </div>

            <p className="mt-5 text-sm leading-6 text-gray-500">
              هذه معاينة لبطاقة رقمية داخل PassCard وليست بطاقة دفع
              فعلية ولا تحتوي على بيانات دفع حقيقية.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
