"use client";

import { useState } from "react";

export default function KidsPage() {
  const [parentalControl, setParentalControl] = useState(true);
  const [purchaseApproval, setPurchaseApproval] = useState(true);
  const [notifications, setNotifications] = useState(true);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <header>
          <p className="text-sm font-semibold text-gray-500">
            PassCard
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            PassCard Kids
          </h1>

          <p className="mt-3 text-gray-600">
            إدارة حسابات الأطفال وإعدادات الرقابة الأبوية من مكان واحد.
          </p>
        </header>

        <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">
                حسابات الأطفال
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                لا توجد حسابات أطفال مرتبطة حالياً.
              </p>
            </div>

            <button
              type="button"
              className="rounded-xl bg-black px-5 py-3 font-semibold text-white hover:opacity-80"
            >
              إضافة طفل
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">
            الرقابة الأبوية
          </h2>

          <div className="mt-5 space-y-4">
            <ControlRow
              title="تفعيل الرقابة الأبوية"
              description="السماح لولي الأمر بإدارة إعدادات حساب الطفل."
              enabled={parentalControl}
              onChange={setParentalControl}
            />

            <ControlRow
              title="الموافقة على عمليات الشراء التجريبية"
              description="طلب موافقة ولي الأمر قبل تنفيذ عملية Sandbox."
              enabled={purchaseApproval}
              onChange={setPurchaseApproval}
            />

            <ControlRow
              title="إشعارات ولي الأمر"
              description="إرسال إشعارات عن الأنشطة المهمة داخل المنصة."
              enabled={notifications}
              onChange={setNotifications}
            />
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">
            البريد الإلكتروني للطفل
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            يمكن ربط حساب الطفل ببريد إلكتروني مخصص له. ستستخدم
            المنصة بريداً نظامياً مثل noreply@passcard.com لإرسال
            الرسائل النظامية عند إعداد مزود البريد.
          </p>

          <div className="mt-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
            لا يوجد بريد طفل مرتبط حالياً.
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="font-bold">
            الخصوصية والأمان
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            بيانات الأطفال يجب أن تكون محمية بصلاحيات منفصلة، ولا
            يستطيع الطفل تغيير إعدادات الرقابة الأبوية أو الوصول إلى
            بيانات ولي الأمر دون صلاحية.
          </p>
        </section>
      </div>
    </main>
  );
}

function ControlRow({
  title,
  description,
  enabled,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 rounded-2xl bg-gray-50 p-4">
      <div>
        <h3 className="font-semibold">{title}</h3>

        <p className="mt-1 text-sm leading-6 text-gray-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!enabled)}
        aria-pressed={enabled}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          enabled ? "bg-black" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
            enabled ? "right-1" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
