"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { API_URL } from "../../api-url";
import { useAuthSession } from "../../auth-session";

type CardLevel = {
  id: string;
  name: string;
  description?: string | null;
  priceMinor: number;
  color?: string | null;
};

type CountryOption = {
  code: string;
  name: string;
  currency: string;
};

type CardTypeOption = {
  code: "VIRTUAL" | "PHYSICAL";
  name: string;
};

type CardOptions = {
  countries: CountryOption[];
  cardTypes: CardTypeOption[];
};

type CreatedCard = {
  id: string;
  cardNumber: string;
  countryCode: string;
  currency: string;
  cardType: string;
  status: string;
  cardLevel: { name: string };
};

function errorMessage(data: unknown, fallback: string) {
  if (typeof data === "object" && data !== null && "message" in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join("، ");
  }
  return fallback;
}

export default function CreateCardPage() {
  const { accessToken } = useAuthSession();
  const [levels, setLevels] = useState<CardLevel[]>([]);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [cardTypes, setCardTypes] = useState<CardTypeOption[]>([]);
  const [levelId, setLevelId] = useState("");
  const [countryCode, setCountryCode] = useState("SA");
  const [cardType, setCardType] = useState<"VIRTUAL" | "PHYSICAL">("VIRTUAL");
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [message, setMessage] = useState("");
  const [createdCard, setCreatedCard] = useState<CreatedCard | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setLoadingOptions(false);
      return;
    }

    let cancelled = false;

    async function loadOptions() {
      try {
        setLoadingOptions(true);
        const headers = { Authorization: `Bearer ${accessToken}` };
        const [levelsResponse, optionsResponse] = await Promise.all([
          fetch(`${API_URL}/cards/levels`, { headers }),
          fetch(`${API_URL}/cards/options`, { headers }),
        ]);

        const [levelsData, optionsData] = await Promise.all([
          levelsResponse.json(),
          optionsResponse.json(),
        ]);

        if (!levelsResponse.ok) {
          throw new Error(errorMessage(levelsData, "تعذر تحميل مستويات البطاقة."));
        }
        if (!optionsResponse.ok) {
          throw new Error(errorMessage(optionsData, "تعذر تحميل خيارات البطاقة."));
        }

        if (cancelled) return;

        const nextLevels = levelsData as CardLevel[];
        const nextOptions = optionsData as CardOptions;
        setLevels(nextLevels);
        setCountries(nextOptions.countries);
        setCardTypes(nextOptions.cardTypes);

        const requestedLevel = new URLSearchParams(window.location.search).get("level");
        const requested = nextLevels.find((level) => level.name === requestedLevel);
        setLevelId(requested?.id ?? nextLevels[0]?.id ?? "");
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "حدث خطأ أثناء تحميل الخيارات.");
        }
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    }

    void loadOptions();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const selectedLevel = levels.find((level) => level.id === levelId);
  const selectedCountry = countries.find((country) => country.code === countryCode);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setCreatedCard(null);

    if (!accessToken) {
      setMessage("سجّل الدخول أولًا لإنشاء بطاقة.");
      return;
    }
    if (!levelId) {
      setMessage("لا توجد مستويات متاحة للبطاقة حاليًا.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/cards`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cardLevelId: levelId, countryCode, cardType }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(errorMessage(data, "تعذر إنشاء البطاقة."));
      }

      setCreatedCard(data as CreatedCard);
      setMessage("تم إنشاء بطاقة PassCard وحفظ اختياراتها بنجاح.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <p className="text-sm font-semibold text-gray-500">PassCard</p>
          <h1 className="mt-2 text-3xl font-bold">إنشاء بطاقة جديدة</h1>
          <p className="mt-3 text-gray-600">
            اختر الدولة والعملة ونوع البطاقة ومستواها.
          </p>
        </header>

        {!accessToken ? (
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-gray-700">يلزم تسجيل الدخول لإنشاء البطاقة.</p>
            <Link href="/login" className="mt-4 inline-block rounded-xl bg-black px-5 py-3 font-semibold text-white">
              تسجيل الدخول
            </Link>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">خيارات البطاقة</h2>

              {loadingOptions ? (
                <p className="text-sm text-gray-500">جارٍ تحميل الخيارات...</p>
              ) : (
                <>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">الدولة</span>
                    <select
                      value={countryCode}
                      onChange={(event) => setCountryCode(event.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
                      required
                    >
                      {countries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name} ({country.code}) · {country.currency}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">نوع البطاقة</span>
                    <select
                      value={cardType}
                      onChange={(event) => setCardType(event.target.value as "VIRTUAL" | "PHYSICAL")}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
                      required
                    >
                      {cardTypes.map((type) => (
                        <option key={type.code} value={type.code}>{type.name}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">مستوى البطاقة</span>
                    <select
                      value={levelId}
                      onChange={(event) => setLevelId(event.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
                      required
                    >
                      {levels.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.name} · {(level.priceMinor / 100).toFixed(2)} ر.س
                        </option>
                      ))}
                    </select>
                  </label>

                  <p className="rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-600">
                    الدولة تحدد ملف البطاقة والعملة المسجلة في PassCard فقط. إصدار بطاقة دفع سعودية أو أمريكية فعلية يتطلب مزود إصدار مالي مرخصًا. خيار البطاقة الفعلية لا ينشئ طلب شحن حتى الآن.
                  </p>

                  <button
                    type="submit"
                    disabled={loading || loadingOptions || !levelId}
                    className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "جارٍ إنشاء البطاقة..." : "إنشاء البطاقة"}
                  </button>
                </>
              )}
            </form>

            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">معاينة البطاقة</h2>
              <div className="mt-6 flex min-h-[280px] items-center justify-center rounded-3xl bg-gray-100 p-6">
                <div className="w-full max-w-sm rounded-3xl bg-black p-6 text-white shadow-2xl">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-medium">PassCard</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                      {selectedLevel?.name ?? "اختر المستوى"}
                    </span>
                  </div>
                  <div className="mt-16">
                    <p className="text-xs text-white/60">الدولة / العملة</p>
                    <p className="mt-2 text-xl font-bold">
                      {selectedCountry ? `${selectedCountry.name} · ${selectedCountry.currency}` : "اختر الدولة"}
                    </p>
                    <p className="mt-3 text-sm text-white/70">
                      {cardType === "VIRTUAL" ? "بطاقة افتراضية" : "بطاقة فعلية"}
                    </p>
                  </div>
                  <div className="mt-6 flex justify-between text-xs text-white/60">
                    <span>PASSCARD ID</span>
                    <span>{createdCard ? `••••${createdCard.cardNumber.slice(-4)}` : "•••• ••••"}</span>
                  </div>
                </div>
              </div>

              <p className="mt-5 text-sm leading-6 text-gray-500">
                المعرّف المعروض هو رقم داخلي في PassCard، وليس رقم بطاقة بنكية أو Visa/Mada فعلية.
              </p>
            </section>
          </div>
        )}

        {message && <p role="status" className="mt-5 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">{message}</p>}
        {createdCard && (
          <section className="mt-5 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
            البطاقة محفوظة. الحالة: <strong>{createdCard.status}</strong> · المستوى: <strong>{createdCard.cardLevel.name}</strong> · {createdCard.countryCode}/{createdCard.currency}
          </section>
        )}
      </div>
    </main>
  );
}
