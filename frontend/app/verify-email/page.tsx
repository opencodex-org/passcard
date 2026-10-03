"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "../auth-session";
import { API_URL } from "../api-url";

type VerificationResponse = {
  success: boolean;
  message: string;
  emailVerified: boolean;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    ageGroup: string;
    role: string;
  };
  security: { emailVerified: boolean };
};

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      Array.isArray(data?.message)
        ? data.message.join("، ")
        : data?.message || "تعذر إكمال الطلب.",
    );
  }
  return data as T;
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const {
    pendingEmail,
    setPendingEmail,
    setSession,
  } = useAuthSession();
  const [email, setEmail] = useState(pendingEmail || "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const requestInFlight = useRef(false);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestInFlight.current) return;
    setMessage("");
    setError("");

    if (!email.trim() || !/^\d{6}$/.test(code)) {
      setError("أدخل البريد الإلكتروني ورمز التحقق المكون من 6 أرقام.");
      return;
    }

    requestInFlight.current = true;
    setLoading(true);
    try {
      const result = await post<VerificationResponse>("/auth/verify-email", {
        email: email.trim(),
        code,
      });
      if (!result.token || !result.user || !result.emailVerified) {
        throw new Error("تعذر إنشاء جلسة موثقة.");
      }

      setSession(result.token, {
        ...result.user,
        emailVerified: result.security?.emailVerified === true,
      });
      setPendingEmail(null);
      setMessage("تم التحقق من بريدك بنجاح، جارٍ نقلك إلى لوحة التحكم...");
      window.setTimeout(() => router.push("/dashboard"), 500);
    } catch (cause) {
      requestInFlight.current = false;
      setError(cause instanceof Error ? cause.message : "حدث خطأ غير متوقع.");
    } finally {
      if (!requestInFlight.current) setLoading(false);
    }
  }

  async function resendCode() {
    if (requestInFlight.current) return;
    setMessage("");
    setError("");
    if (!email.trim()) {
      setError("أدخل بريدك الإلكتروني أولاً.");
      return;
    }

    requestInFlight.current = true;
    setLoading(true);
    try {
      const result = await post<{ message: string }>(
        "/auth/resend-email-verification",
        { email: email.trim() },
      );
      setMessage(result.message || "تم طلب إرسال رمز تحقق جديد.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر إعادة إرسال الرمز.");
    } finally {
      requestInFlight.current = false;
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
      <section className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <Link href="/" className="mb-6 block text-center text-2xl font-bold text-gray-900">
          PassCard
        </Link>
        <h1 className="text-center text-2xl font-bold">تحقق من بريدك الإلكتروني</h1>
        <p className="mt-3 text-center text-sm leading-6 text-gray-500">
          أدخل رمز التحقق المكون من 6 أرقام لإكمال التسجيل أو تسجيل الدخول.
        </p>

        <form onSubmit={verify} className="mt-7 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">البريد الإلكتروني</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">رمز التحقق</span>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••••"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-2xl tracking-[0.35em] outline-none focus:border-black"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "جارٍ التحقق..." : "تحقق وأكمل"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => void resendCode()}
          disabled={loading}
          className="mt-4 w-full text-sm font-semibold text-gray-600 underline disabled:opacity-50"
        >
          {loading ? "جارٍ الإرسال..." : "إعادة إرسال الرمز"}
        </button>

        {message && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      </section>
    </main>
  );
}
