"use client";

import { FormEvent, useState } from "react";

export default function VerifyPhonePage() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!/^\d{6}$/.test(code)) {
      setMessage("أدخل رمز التحقق المكون من 6 أرقام.");
      return;
    }

    setMessage(
      "تم استلام رمز التحقق. سيتم ربط التحقق الفعلي بخدمة OTP في الـ Backend."
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-6 text-2xl font-bold">PassCard</div>

        <h1 className="text-2xl font-bold">تحقق من رقم الجوال</h1>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          أدخل رمز التحقق المرسل إلى رقم جوالك لإكمال عملية التحقق.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block text-right">
            <span className="mb-2 block text-sm font-medium">
              رمز التحقق
            </span>

            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, ""))
              }
              placeholder="000000"
              className="w-full rounded-xl border border-gray-300 px-4 py-4 text-center text-2xl tracking-[0.5em] outline-none transition focus:border-black"
              aria-label="رمز التحقق"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white transition hover:opacity-80"
          >
            تحقق
          </button>
        </form>

        {message && (
          <div className="mt-5 rounded-xl bg-gray-100 p-4 text-sm text-gray-600">
            {message}
          </div>
        )}

        <button
          type="button"
          className="mt-6 text-sm font-semibold text-gray-600 hover:text-black hover:underline"
        >
          إعادة إرسال الرمز
        </button>
      </div>
    </main>
  );
}
