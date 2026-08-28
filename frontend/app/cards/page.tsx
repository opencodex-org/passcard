import Link from "next/link";

const cardLevels = [
  {
    name: "Basic",
    arabicName: "منخفضة",
    description: "بطاقة أساسية للاستخدام الشخصي.",
  },
  {
    name: "Standard",
    arabicName: "عادية",
    description: "خيارات تصميم وتخصيص إضافية.",
  },
  {
    name: "Advanced",
    arabicName: "متوسطة",
    description: "مميزات متقدمة وتخصيص أكبر.",
  },
  {
    name: "Premium",
    arabicName: "فوق المتوسطة",
    description: "تصميم احترافي ومميزات إضافية.",
  },
  {
    name: "Elite",
    arabicName: "مميزة",
    description: "تجربة عالية المستوى وتخصيص موسع.",
  },
  {
    name: "Ultra Elite",
    arabicName: "مميزة جداً",
    description: "تخصيص متقدم وتجربة VIP.",
  },
  {
    name: "MAX",
    arabicName: "ماكس",
    description: "أعلى مستوى في نظام PassCard.",
  },
];

export default function CardsPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-gray-500">
              PassCard
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              بطاقاتي
            </h1>

            <p className="mt-2 text-gray-600">
              اختر مستوى البطاقة المناسب لك وابدأ إنشاء بطاقة رقمية.
            </p>
          </div>

          <Link
            href="/cards/create"
            className="rounded-xl bg-black px-5 py-3 text-center font-semibold text-white transition hover:opacity-80"
          >
            إنشاء بطاقة
          </Link>
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-bold">
            مستويات PassCard
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cardLevels.map((level) => (
              <article
                key={level.name}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold">
                      {level.name}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {level.arabicName}
                    </p>
                  </div>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
                    PassCard
                  </span>
                </div>

                <p className="mt-5 text-sm leading-6 text-gray-600">
                  {level.description}
                </p>

                <Link
                  href={`/cards/create?level=${encodeURIComponent(
                    level.name
                  )}`}
                  className="mt-6 block rounded-xl border border-gray-300 px-4 py-3 text-center text-sm font-semibold transition hover:bg-gray-100"
                >
                  اختيار المستوى
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold">
            ملاحظة
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            هذه المستويات تخص بطاقات PassCard الرقمية داخل المنصة.
            إصدار بطاقة دفع أو بطاقة مالية حقيقية يتطلب مزوداً مالياً
            مرخصاً وتكاملاً رسمياً معه.
          </p>
        </section>
      </div>
    </main>
  );
}
