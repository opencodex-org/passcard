export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-6 rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-600">
          PassCard
        </div>

        <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
          بطاقتك الرقمية، بتصميمك الخاص
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
          أنشئ بطاقة PassCard رقمية مخصصة، اختر المستوى المناسب لك،
          وأرسل طلبك للمراجعة بطريقة آمنة ومنظمة.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href="/register"
            className="rounded-xl bg-black px-7 py-3 font-semibold text-white transition hover:opacity-80"
          >
            إنشاء حساب
          </a>

          <a
            href="/login"
            className="rounded-xl border border-gray-300 px-7 py-3 font-semibold transition hover:bg-gray-100"
          >
            تسجيل الدخول
          </a>
        </div>

        <div className="mt-16 grid w-full gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Feature
            title="بطاقات متعددة"
            description="اختر بين Basic و Standard و Advanced و Premium و Elite و Ultra Elite و MAX."
          />

          <Feature
            title="تحقق آمن"
            description="حماية الحساب باستخدام التحقق من الجوال ووسائل الحماية المناسبة."
          />

          <Feature
            title="مراجعة الإدارة"
            description="طلبات البطاقات تمر بمراجعة قبل تفعيلها."
          />

          <Feature
            title="PassCard Kids"
            description="حسابات أطفال مع أدوات للرقابة الأبوية."
          />
        </div>
      </section>
    </main>
  );
}

function Feature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 p-6 text-right shadow-sm">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-gray-600">{description}</p>
    </div>
  );
}
