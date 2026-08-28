import Link from "next/link";

const stats = [
  {
    title: "البطاقات",
    value: "0",
    href: "/cards",
  },
  {
    title: "طلبات قيد المراجعة",
    value: "0",
    href: "/cards",
  },
  {
    title: "الرصيد التجريبي",
    value: "0.00 ر.س",
    href: "/wallet",
  },
  {
    title: "المكافآت",
    value: "0",
    href: "/rewards",
  },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">
            PassCard
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            لوحة التحكم
          </h1>

          <p className="mt-3 text-gray-600">
            مرحباً بك في حسابك. من هنا يمكنك إدارة بطاقاتك ومتابعة
            طلباتك ورصيدك التجريبي.
          </p>
        </header>

        <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link
              key={stat.title}
              href={stat.href}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1"
            >
              <p className="text-sm text-gray-500">
                {stat.title}
              </p>

              <p className="mt-3 text-2xl font-bold">
                {stat.value}
              </p>
            </Link>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">
              الإجراءات السريعة
            </h2>

            <div className="mt-5 grid gap-3">
              <Link
                href="/cards/create"
                className="rounded-xl bg-black px-4 py-3 text-center font-semibold text-white hover:opacity-80"
              >
                إنشاء بطاقة
              </Link>

              <Link
                href="/verification"
                className="rounded-xl border border-gray-300 px-4 py-3 text-center font-semibold hover:bg-gray-100"
              >
                إكمال التحقق
              </Link>

              <Link
                href="/kids"
                className="rounded-xl border border-gray-300 px-4 py-3 text-center font-semibold hover:bg-gray-100"
              >
                إدارة PassCard Kids
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">
              حالة الحساب
            </h2>

            <div className="mt-5 space-y-4">
              <StatusRow
                title="الحساب"
                status="نشط"
              />

              <StatusRow
                title="رقم الجوال"
                status="غير متحقق"
              />

              <StatusRow
                title="الهوية"
                status="لم تبدأ"
              />

              <StatusRow
                title="البطاقة"
                status="لا توجد بطاقة"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusRow({
  title,
  status,
}: {
  title: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
      <span className="text-sm font-medium">
        {title}
      </span>

      <span className="text-sm text-gray-500">
        {status}
      </span>
    </div>
  );
}
