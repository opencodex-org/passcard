"use client";

import { FormEvent, useState } from "react";
import { useRef } from "react";
import { API_URL } from "../api-url";

async function post(path: string, body: unknown) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(result?.message)
      ? result.message.join("، ")
      : result?.message || "تعذر إكمال الطلب.";
    throw new Error(message);
  }

  return result as { message?: string };
}

export default function VerifyPhonePage() {
  const requestInFlight = useRef(false);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function sendCode() {
    if (requestInFlight.current) return;
    setMessage("");
    setError("");
    if (!phone.trim()) {
      setError("أدخل رقم الجوال أولاً.");
      return;
    }

    requestInFlight.current = true;
    setLoading(true);
    try {
      const result = await post("/otp/send", { phone: phone.trim() });
      setCode("");
      setMessage(result.message || "تم إرسال رمز التحقق إلى جوالك.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر إرسال الرمز.");
    } finally {
      requestInFlight.current = false;
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestInFlight.current) return;
    setMessage("");
    setError("");

    if (!phone.trim() || !/^\d{6}$/.test(code)) {
      setError("أدخل رقم الجوال ورمز التحقق المكون من 6 أرقام.");
      return;
    }

    requestInFlight.current = true;
    setLoading(true);
    try {
      const result = await post("/otp/verify", {
        phone: phone.trim(),
        code,
      });
      setMessage(result.message || "تم التحقق من رقم الجوال بنجاح.");
      setCode("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر التحقق من الرمز.");
    } finally {
      requestInFlight.current = false;
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-6 text-2xl font-bold">PassCard</div>

        <h1 className="text-2xl font-bold">تحقق من رقم الجوال</h1>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          اطلب رمزًا إلى رقم جوالك، ثم أدخله لإكمال عملية التحقق.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block text-right">
            <span className="mb-2 block text-sm font-medium">رقم الجوال</span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value.replace(/[^\d+]/g, ""))}
              placeholder="05xxxxxxxx أو +9665xxxxxxxx"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              aria-label="رقم الجوال"
            />
          </label>

          <label className="block text-right">
            <span className="mb-2 block text-sm font-medium">
              رمز التحقق
            </span>

            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, ""))
              }
              placeholder="••••••"
              className="w-full rounded-xl border border-gray-300 px-4 py-4 text-center text-2xl tracking-[0.5em] outline-none transition focus:border-black"
              aria-label="رمز التحقق"
            />
          </label>

          <button
            type="submit"
            disabled={loading || !phone.trim() || code.length !== 6}
            className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "جارٍ التحقق..." : "تحقق"}
          </button>
        </form>

        {message && (
          <div className="mt-5 rounded-xl bg-gray-100 p-4 text-sm text-gray-600">
            {message}
          </div>
        )}

        <button
          type="button"
          disabled={loading || !phone.trim()}
          onClick={sendCode}
          className="mt-6 text-sm font-semibold text-gray-600 hover:text-black hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "جارٍ إرسال الرمز..." : "إرسال / إعادة إرسال الرمز"}
        </button>

        {error && (
          <div role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
