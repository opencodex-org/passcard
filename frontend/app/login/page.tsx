import Link from "next/link";

export default function LoginPage() {
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

        <div className="space-y-4">
          <button
            type="button"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 font-semibold transition hover:bg-gray-100"
          >
            المتابعة باستخدام Google
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">أو</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              البريد الإلكتروني
            </span>

            <input
              type="email"
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
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
            />
          </label>

          <button
            type="button"
            className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white transition hover:opacity-80"
          >
            تسجيل الدخول
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          ليس لديك حساب؟{" "}
          <Link
            href="/register"
            className="font-semibold text-black hover:underline"
          >
            إنشاء حساب
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-gray-400">
          نظام تسجيل الدخول سيتم ربطه لاحقًا بـ Google OAuth وBackend.
        </p>
      </div>
    </main>
  );
}
