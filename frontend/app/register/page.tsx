"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import { useAuthSession } from "../auth-session";
import { API_URL } from "../api-url";

export default function RegisterPage() {
  const router = useRouter();
  const submissionStarted = useRef(false);
  const {
    registrationEmail,
    setSession,
    setPendingEmail,
    setRegistrationEmail,
  } = useAuthSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(registrationEmail || "");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    registrationEmail ? "هذا البريد غير مسجل. أكمل إنشاء حسابك." : "",
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionStarted.current) return;
    setMessage("");

    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      setMessage("يرجى تعبئة جميع الحقول.");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setMessage("رقم الجوال يجب أن يتكون من 10 أرقام.");
      return;
    }

    if (password.length < 8) {
      setMessage("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
      return;
    }

    if (!accepted) {
      setMessage("يجب الموافقة على شروط الاستخدام وسياسة الخصوصية.");
      return;
    }

    try {
      submissionStarted.current = true;
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone,
          password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "تعذر إنشاء الحساب.");
      }

      setRegistrationEmail(null);
      if (data.emailVerificationRequired) {
        setPendingEmail(data.user.email);
        setMessage("تم إنشاء الحساب، تحقق من بريدك الإلكتروني لإكمال التسجيل...");
        window.setTimeout(() => router.push("/verify-email"), 500);
        return;
      }

      if (!data.token || !data.user) {
        throw new Error("تعذر إنشاء جلسة تسجيل الدخول.");
      }

      setPendingEmail(null);
      setSession(data.token, {
        ...data.user,
        emailVerified: data.security?.emailVerified === true,
      });
      router.push("/dashboard");
    } catch (error) {
      submissionStarted.current = false;
      setMessage(
        error instanceof Error ? error.message : "حدث خطأ غير متوقع."
      );
    } finally {
      if (!submissionStarted.current) setLoading(false);
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
          data?.message || "فشل التسجيل باستخدام Google."
        );
      }

      setMessage(
        `مرحبًا ${data?.user?.name || ""}، تم التسجيل باستخدام Google بنجاح.`
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

          <h1 className="text-2xl font-bold">إنشاء حساب</h1>

          <p className="mt-2 text-sm text-gray-500">
            أنشئ حسابك وابدأ بتخصيص بطاقة PassCard
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
              setMessage("تعذر التسجيل باستخدام Google.");
            }}
            useOneTap={false}
            text="signup_with"
            shape="rectangular"
            width="100%"
          />
        </div>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">أو</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              الاسم
            </span>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اسمك الكامل"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              البريد الإلكتروني
            </span>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              رقم الجوال
            </span>

            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="05XXXXXXXX"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
            />

            <span className="mt-2 block text-xs text-gray-400">
              يجب أن يتكون رقم الجوال من 10 أرقام.
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              كلمة المرور
            </span>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
            />
          </label>

          <label className="flex items-start gap-3 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 h-4 w-4"
            />

            <span>
              أوافق على شروط الاستخدام وسياسة الخصوصية.
            </span>
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
            {loading ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          لديك حساب بالفعل؟{" "}
          <Link
            href="/login"
            className="font-semibold text-black hover:underline"
          >
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </main>
  );
}
