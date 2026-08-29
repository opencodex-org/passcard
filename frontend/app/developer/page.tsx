"use client";

import { useState } from "react";

export default function DeveloperPage() {
  const [created, setCreated] = useState(false);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <header>
          <p className="text-sm font-semibold text-gray-500">
            PassCard Developer
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            بوابة المطورين
          </h1>

          <p className="mt-3 max-w-2xl text-gray-600">
            أنشئ تطبيقات Sandbox واستخدم مفاتيح API لاختبار التكامل
            مع PassCard بطريقة منظمة وآمنة.
          </p>
        </header>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <InfoCard
            title="Applications"
            value="0"
            description="تطبيقاتك المسجلة"
          />

          <InfoCard
            title="API Keys"
            value="0"
            description="مفاتيح API نشطة"
          />

          <InfoCard
            title="Webhooks"
            value="0"
            description="Webhooks مسجلة"
          />
        </section>

        <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold">
                إنشاء تطبيق
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                أنشئ تطبيقاً جديداً للاختبار داخل Sandbox.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCreated(true)}
              className="rounded-xl bg-black px-5 py-3 font-semibold text-white hover:opacity-80"
            >
              إنشاء Application
            </button>
          </div>

          {created && (
            <div className="mt-6 rounded-2xl bg-gray-50 p-5">
              <p className="text-sm font-semibold">
                تم إنشاء تطبيق تجريبي
              </p>

              <p className="mt-2 font-mono text-xs text-gray-500">
                app_demo_passcard
              </p>

              <p className="mt-4 text-sm text-gray-600">
                سيتم إنشاء بيانات التطبيق ومفاتيح API الحقيقية من
                الـ Backend بعد ربط قاعدة البيانات ونظام المصادقة.
              </p>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">
            Developer Payment Integration
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            استخدم مفاتيح التكامل الخاصة بالمطور لربط التطبيقات
            المتوافقة مع PassCard. الإصدار الحالي يستخدم Sandbox
            فقط ولا ينفذ عمليات مالية حقيقية.
          </p>

          <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <p className="text-xs font-semibold text-gray-500">
              API BASE URL
            </p>

            <code className="mt-2 block font-mono text-sm">
              http://localhost:4000/api/v1
            </code>
          </div>
        </section>

        <section className="mt-6 grid gap-5 md:grid-cols-2">
          <ActionCard
            title="API Keys"
            description="إنشاء وإلغاء وإدارة مفاتيح API وصلاحياتها."
          />

          <ActionCard
            title="Webhooks"
            description="إعداد نقاط استقبال الأحداث الخاصة بتطبيقك."
          />

          <ActionCard
            title="API Logs"
            description="متابعة الطلبات والأحداث المسجلة."
          />

          <ActionCard
            title="Sandbox"
            description="اختبار التكامل دون استخدام بيانات مالية حقيقية."
          />
        </section>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="font-bold">
            أمان مفاتيح API
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            لا تخزن مفاتيح API في الواجهة الأمامية أو داخل GitHub.
            سيتم تخزينها بطريقة آمنة في الـ Backend، ويمكن إلغاؤها
            في أي وقت.
          </p>
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>

      <p className="mt-3 text-3xl font-bold">{value}</p>

      <p className="mt-2 text-xs text-gray-500">
        {description}
      </p>
    </div>
  );
}

function ActionCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-gray-500">
        {description}
      </p>

      <button
        type="button"
        className="mt-5 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-100"
      >
        فتح
      </button>
    </div>
  );
}
