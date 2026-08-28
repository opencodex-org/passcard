const transactions = [
  {
    id: "TX-DEMO-001",
    type: "مكافأة تجريبية",
    amount: "+5.00 ر.س",
    status: "مكتملة",
    date: "—",
  },
  {
    id: "TX-DEMO-002",
    type: "عملية Sandbox",
    amount: "0.00 ر.س",
    status: "اختبار",
    date: "—",
  },
];

export default function WalletPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <header>
          <p className="text-sm font-semibold text-gray-500">
            PassCard
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            المحفظة
          </h1>

          <p className="mt-3 text-gray-600">
            تابع رصيدك التجريبي وسجل العمليات المرتبطة بحسابك.
          </p>
        </header>

        <section className="mt-8 rounded-3xl bg-black p-7 text-white shadow-xl">
          <p className="text-sm text-white/60">
            الرصيد التجريبي
          </p>

          <p className="mt-3 text-4xl font-bold">
            0.00 ر.س
          </p>

          <p className="mt-4 text-sm leading-6 text-white/60">
            هذا الرصيد تجريبي داخل PassCard وليس حساباً بنكياً ولا
            يمثل أموالاً قابلة للسحب في هذه النسخة.
          </p>
        </section>

        <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              سجل العمليات
            </h2>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
              Sandbox
            </span>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[600px] text-right">
              <thead>
                <tr className="border-b border-gray-200 text-sm text-gray-500">
                  <th className="px-4 py-3 font-medium">
                    العملية
                  </th>

                  <th className="px-4 py-3 font-medium">
                    المبلغ
                  </th>

                  <th className="px-4 py-3 font-medium">
                    الحالة
                  </th>

                  <th className="px-4 py-3 font-medium">
                    التاريخ
                  </th>

                  <th className="px-4 py-3 font-medium">
                    ID
                  </th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="px-4 py-4 text-sm font-medium">
                      {transaction.type}
                    </td>

                    <td className="px-4 py-4 text-sm">
                      {transaction.amount}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                        {transaction.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-500">
                      {transaction.date}
                    </td>

                    <td className="px-4 py-4 font-mono text-xs text-gray-500">
                      {transaction.id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="font-bold">
            تنبيه
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            جميع العمليات المالية في هذه الواجهة تجريبية فقط. لا يتم
            تخزين أرقام البطاقات أو CVV أو PIN، ولا يتم تنفيذ عمليات
            سحب من أجهزة ATM.
          </p>
        </section>
      </div>
    </main>
  );
}
