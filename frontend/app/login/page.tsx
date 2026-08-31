"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://passcard-igfn.onrender.com/api/v1";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!email.trim() || !password) {
      setMessage("يرجى إدخال البريد الإلكتروني وكلمة المرور.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "تعذر تسجيل الدخول.");
      }

      setMessage("تم تسجيل الدخول بنجاح.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "حدث خطأ غير متوقع."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credential: string) {
    setMessage("");

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credential }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || "فشل تسجيل الدخول باستخدام Google."
        );
      }

      setMessage(
        `مرحبًا ${data?.user?.name || ""}، تم تسجيل الدخول بنجاح.`
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "حدث خطأ غير متوقع."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 text-2xl font-bold">PassCard</div>

          <h1 className="text-2xl font-bold">تسجيل الدخول</h1>

          <p className="mt-2 text-sm text-gray-500">
            سجّل الدخول إلى حسابك في PassCard
          </p>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={(response) => {
              if (response.credential) {
                handleGoogleSuccess(response.credential);
              } else {
                setMessage("لم يتم استلام بيانات Google.");
              }
            }}
            onError={() => {
              setMessage("تعذر تسجيل الدخول باستخدام Google.");
            }}
            useOneTap={false}
            text="continue_with"
            shape="rectangular"
            width="100%"
          />
        </div>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">أو</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              البريد الإلكتروني
            </span>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              كلمة المرور
            </span>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
            />
          </label>

          {message && (
            <div
              className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700"
              role="status"
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          ليس لديك حساب؟{" "}
          <Link
            href="/register"
            className="font-semibold text-black hover:underline"
          >
            إنشاء حساب
          </Link>
        </p>
      </div>
    </main>
  );
}
