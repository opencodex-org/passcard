const rewards = [
  {
    title: "مكافأة التسجيل",
    amount: "5.00 ر.س",
    status: "تجريبية",
  },
  {
    title: "مكافأة النشاط",
    amount: "0.00 ر.س",
    status: "غير متاحة",
  },
];

export default function RewardsPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <header>
          <p className="text-sm font-semibold text-gray-500">
            PassCard
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            المكافآت
          </h1>

          <p className="mt-3 text-gray-600">
            تابع المكافآت التجريبية التي يحصل عليها حسابك وفق قواعد
            PassCard.
          </p>
        </header>

        <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                إجمالي المكافآت التجريبية
              </p>

              <p className="mt-2 text-3xl font-bold">
                5.00 ر.س
              </p>
            </div>

            <div className="rounded-2xl bg-gray-100 px-4 py-3 text-sm font-semibold">
              Sandbox
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold">
            سجل المكافآت
          </h2>

          <div className="mt-5 space-y-4">
            {rewards.map((reward) => (
              <article
                key={reward.title}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-bold">
                      {reward.title}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {reward.status}
                    </p>
                  </div>

                  <p className="text-xl font-bold">
                    {reward.amount}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="font-bold">
            كيف تعمل المكافآت؟
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            سيتم لاحقاً ربط المكافآت بنظام Ledger في الـ Backend،
            بحيث يتم تسجيل كل إضافة أو خصم كعملية مستقلة مع رقم
            عملية وتاريخ وسبب واضح.
          </p>
        </section>
      </div>
    </main>
  );
}
