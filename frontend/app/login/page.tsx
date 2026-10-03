"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import { useAuthSession } from "../auth-session";
import { API_URL } from "../api-url";

export default function LoginPage() {
  const router = useRouter();
  const loginStarted = useRef(false);
  const {
    setSession,
    clearSession,
    setPendingEmail,
    setRegistrationEmail,
  } = useAuthSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loginStarted.current) return;
    setMessage("");

    if (!email.trim() || !password) {
      setMessage("يرجى إدخال البريد الإلكتروني وكلمة المرور.");
      return;
    }

    try {
      loginStarted.current = true;
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

      if (!response.ok && data?.message === "EMAIL_NOT_REGISTERED") {
        clearSession();
        setPendingEmail(null);
        setRegistrationEmail(email.trim().toLowerCase());
        setMessage("هذا البريد غير مسجل. أكمل إنشاء حسابك.");
        router.push("/register");
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || "تعذر تسجيل الدخول.");
      }

      if (data?.emailVerificationRequired) {
        clearSession();
        setPendingEmail(data.email || email.trim().toLowerCase());
        setMessage("تحقق من بريدك الإلكتروني لإكمال تسجيل الدخول...");
        router.push("/verify-email");
        return;
      }

      if (!data?.token || !data?.user) {
        throw new Error("تعذر إنشاء جلسة تسجيل الدخول.");
      }

      setSession(data.token, {
        ...data.user,
        emailVerified: data.security?.emailVerified === true,
      });
      router.push("/dashboard");
    } catch (error) {
      loginStarted.current = false;
      setMessage(
        error instanceof Error ? error.message : "حدث خطأ غير متوقع."
      );
    } finally {
      if (!loginStarted.current) setLoading(false);
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
