"use client";

import { FormEvent, useState } from "react";

export default function VerificationPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-sm font-semibold text-gray-500">PassCard</p>

          <h1 className="mt-2 text-3xl font-bold">
            التحقق من الحساب
          </h1>

          <p className="mt-3 max-w-2xl text-gray-600">
            أكمل معلومات التحقق المطلوبة حتى تتمكن من استخدام الميزات
            التي تتطلب حساباً موثقاً.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <section>
            <h2 className="text-lg font-bold">المعلومات الأساسية</h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  الاسم الكامل
                </span>

                <input
                  type="text"
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  placeholder="الاسم الكامل"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  تاريخ الميلاد
                </span>

                <input
                  type="date"
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </label>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold">مستند التحقق</h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              ارفع مستند التحقق المطلوب فقط إذا طلبه النظام. سيتم التعامل
              مع الملفات الحساسة وفق صلاحيات الوصول وسياسة الخصوصية.
            </p>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium">
                مستند التحقق
              </span>

              <input
                type="file"
                accept="image/*,.pdf"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm"
              />
            </label>
          </section>

          <section>
            <h2 className="text-lg font-bold">الصورة الشخصية</h2>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium">
                صورة شخصية
              </span>

              <input
                type="file"
                accept="image/*"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm"
              />
            </label>
          </section>

          <label className="flex items-start gap-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
            <input
              type="checkbox"
              required
              className="mt-1 h-4 w-4"
            />

            <span>
              أؤكد أن المعلومات التي أقدمها صحيحة، وأوافق على معالجة
              بيانات التحقق وفق سياسة الخصوصية.
            </span>
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white transition hover:opacity-80"
          >
            إرسال طلب التحقق
          </button>

          {submitted && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              تم تسجيل طلب التحقق. حالة الطلب الحالية:
              <strong className="mr-1 text-black">Pending</strong>
              وسيظهر القرار بعد المراجعة.
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
