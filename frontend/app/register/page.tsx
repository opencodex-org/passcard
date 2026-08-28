import Link from "next/link";

export default function RegisterPage() {
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

        <div className="space-y-4">
          <button
            type="button"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 font-semibold transition hover:bg-gray-100"
          >
            التسجيل باستخدام Google
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">أو</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              الاسم
            </span>

            <input
              type="text"
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
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
            />
          </label>

          <label className="flex items-start gap-3 text-sm text-gray-600">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
            />

            <span>
              أوافق على شروط الاستخدام وسياسة الخصوصية.
            </span>
          </label>

          <button
            type="button"
            className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white transition hover:opacity-80"
          >
            إنشاء الحساب
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          لديك حساب بالفعل؟{" "}
          <Link
            href="/login"
            className="font-semibold text-black hover:underline"
          >
            تسجيل الدخول
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-gray-400">
          بعد التسجيل سيتم تفعيل مراحل التحقق والحماية عند ربط الـ Backend.
        </p>
      </div>
    </main>
  );
}
