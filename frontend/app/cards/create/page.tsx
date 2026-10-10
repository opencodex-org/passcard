"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { request } from "../../payments-demo/api";
import { API_URL } from "../../api-url";
import { useAuthSession } from "../../auth-session";

type CardLevel = {
id: string;
name: string;
description?: string | null;
priceMinor: number;
color?: string | null;
imageUrl?: string | null;
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

type CardRequestResult = {
id: string;
cardName: string;
countryCode: string;
currency: string;
cardType: string;
status: string;
cardLevel: { name: string };
};

function getErrorMessage(cause: unknown, fallback: string) {
return cause instanceof Error ? cause.message : fallback;
}

export default function CreateCardPage() {
const { accessToken } = useAuthSession();

const [levels, setLevels] = useState<CardLevel[]>([]);
const [countries, setCountries] = useState<CountryOption[]>([]);
const [cardTypes, setCardTypes] = useState<CardTypeOption[]>([]);
const [levelId, setLevelId] = useState("");
const [countryCode, setCountryCode] = useState("SA");
const [cardType, setCardType] = useState<"VIRTUAL" | "PHYSICAL">("VIRTUAL");
const [cardName, setCardName] = useState("");
const [designColor, setDesignColor] = useState("#111111");
const [description, setDescription] = useState("");
const [imageUrl, setImageUrl] = useState("");
const [createdRequest, setCreatedRequest] =
useState<CardRequestResult | null>(null);
const [loadingLevels, setLoadingLevels] = useState(true);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
const [message, setMessage] = useState("");

useEffect(() => {
let cancelled = false;

```
async function loadOptions() {
  try {
    setLoadingLevels(true);

    const headers = accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined;

    const [levelResponse, optionsResponse] = await Promise.all([
      fetch(`${API_URL}/cards/levels`, { headers }),
      fetch(`${API_URL}/cards/options`, { headers }),
    ]);

    const [levelData, optionsData] = await Promise.all([
      levelResponse.json(),
      optionsResponse.json(),
    ]);

    if (!levelResponse.ok) {
      throw new Error("تعذر تحميل مستويات البطاقات.");
    }
    if (!optionsResponse.ok) {
      throw new Error("تعذر تحميل خيارات البطاقات.");
    }
    if (cancelled) return;

    const nextLevels = levelData as CardLevel[];
    const nextOptions = optionsData as CardOptions;

    setLevels(nextLevels);
    setCountries(nextOptions.countries);
    setCardTypes(nextOptions.cardTypes);

    const requestedName = new URLSearchParams(
      window.location.search,
    ).get("level");
    const requestedLevel = nextLevels.find(
      (item) => item.name === requestedName,
    );

    setLevelId(requestedLevel?.id ?? nextLevels[0]?.id ?? "");

    if (requestedLevel?.color) {
      setDesignColor(requestedLevel.color);
    } else if (nextLevels[0]?.color) {
      setDesignColor(nextLevels[0].color);
    }
  } catch (cause) {
    if (!cancelled) {
      setError(getErrorMessage(cause, "حدث خطأ أثناء تحميل الخيارات."));
    }
  } finally {
    if (!cancelled) setLoadingLevels(false);
  }
}

void loadOptions();

return () => {
  cancelled = true;
};
```

}, [accessToken]);

const selectedLevel = levels.find((item) => item.id === levelId);
const selectedCountry = countries.find(
(item) => item.code === countryCode,
);

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
event.preventDefault();
setError("");
setMessage("");
setCreatedRequest(null);

```
if (!accessToken) {
  setError("سجّل الدخول أولًا حتى يرتبط طلب البطاقة بحسابك.");
  return;
}

if (!levelId) {
  setError("لا يوجد مستوى نشط للبطاقة حاليًا.");
  return;
}

if (!cardName.trim()) {
  setError("اكتب اسم البطاقة.");
  return;
}

try {
  setLoading(true);

  const result = await request<CardRequestResult>(
    "/cards",
    {
      method: "POST",
      body: JSON.stringify({
        cardLevelId: levelId,
        cardName: cardName.trim(),
        countryCode,
        cardType,
        designColor,
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
      }),
    },
    accessToken,
  );

  setCreatedRequest(result);
  setMessage("تم إرسال طلب البطاقة بنجاح، وهو بانتظار مراجعة الإدارة.");
} catch (cause) {
  setError(getErrorMessage(cause, "تعذر إرسال طلب البطاقة."));
} finally {
  setLoading(false);
}
```

}

return ( <main className="min-h-screen bg-gray-50 px-6 py-10"> <div className="mx-auto max-w-5xl"> <header className="mb-8"> <p className="text-sm font-semibold text-gray-500">PassCard</p> <h1 className="mt-2 text-3xl font-bold">إنشاء بطاقة جديدة</h1> <p className="mt-3 text-gray-600">
خصّص البطاقة وأرسل طلبك. ستبقى غير مفعّلة حتى تراجع الإدارة الطلب
وتوافق عليه. </p> </header>

```
    {!accessToken && (
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        يلزم تسجيل الدخول قبل إرسال الطلب.{" "}
        <Link className="font-bold underline" href="/login">
          تسجيل الدخول
        </Link>
      </div>
    )}

    {error && (
      <div
        role="alert"
        className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
      >
        {error}
      </div>
    )}

    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-xl font-bold">بيانات البطاقة</h2>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">اسم البطاقة</span>
          <input
            type="text"
            value={cardName}
            onChange={(event) => setCardName(event.target.value)}
            placeholder="مثال: بطاقتي الخاصة"
            required
            maxLength={80}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">
            مستوى البطاقة
          </span>
          <select
            value={levelId}
            onChange={(event) => {
              const nextId = event.target.value;
              setLevelId(nextId);
              const nextLevel = levels.find((item) => item.id === nextId);
              if (nextLevel?.color) setDesignColor(nextLevel.color);
            }}
            disabled={loadingLevels || levels.length === 0}
            required
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
          >
            {levels.length === 0 && (
              <option value="">لا توجد مستويات نشطة</option>
            )}
            {levels.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {(item.priceMinor / 100).toFixed(2)} ر.س
              </option>
            ))}
          </select>
        </label>

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
            onChange={(event) =>
              setCardType(event.target.value as "VIRTUAL" | "PHYSICAL")
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
            required
          >
            {cardTypes.map((type) => (
              <option key={type.code} value={type.code}>
                {type.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">
            رابط صورة البطاقة (اختياري)
          </span>
          <input
            type="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://example.com/card-art.png"
            className="w-full rounded-xl border border-gray-300 px-4 py-3"
          />
          <span className="mt-1 block text-xs text-gray-500">
            هذا رابط للمعاينة فقط؛ لا يرفع صورة إلى خادم التخزين.
          </span>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">
            اللون الرئيسي
          </span>
          <input
            type="color"
            value={designColor}
            onChange={(event) => setDesignColor(event.target.value)}
            className="h-12 w-full rounded-xl border border-gray-300 bg-white p-1"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">الوصف</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            maxLength={500}
            placeholder="وصف اختياري للبطاقة"
            className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3"
          />
        </label>

        <p className="rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-600">
          إرسال الطلب لا يصدر بطاقة دفع بنكية فعلية. تبقى البطاقة بانتظار
          مراجعة الإدارة، ولا يعني ذلك توفر تكامل مع Visa أو Apple Wallet
          أو Google Wallet.
        </p>

        <button
          type="submit"
          disabled={
            loading ||
            loadingLevels ||
            !accessToken ||
            !levelId ||
            levels.length === 0
          }
          className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "جارٍ إرسال الطلب..." : "إرسال طلب البطاقة"}
        </button>
      </form>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">معاينة البطاقة</h2>

        <div className="mt-6 flex min-h-[280px] items-center justify-center rounded-3xl bg-gray-100 p-6">
          <div
            className="w-full max-w-sm overflow-hidden rounded-3xl p-6 text-white shadow-2xl"
            style={{ backgroundColor: designColor }}
          >
            {imageUrl && (
              <div
                aria-label="معاينة صورة البطاقة"
                className="mb-4 h-20 rounded-xl bg-cover bg-center"
                style={{
                  backgroundImage: `url("${imageUrl.replace(/"/g, "")}")`,
                }}
              />
            )}

            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-medium">PassCard</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                {selectedLevel?.name ?? "اختر المستوى"}
              </span>
            </div>

            <div className="mt-12">
              <p className="text-xs text-white/60">اسم البطاقة</p>
              <p className="mt-2 truncate text-xl font-bold">
                {cardName || "اسم البطاقة"}
              </p>
              <p className="mt-3 text-sm text-white/80">
                {selectedCountry
                  ? `${selectedCountry.name} · ${selectedCountry.currency}`
                  : "اختر الدولة"}
              </p>
              <p className="mt-2 text-sm text-white/80">
                {cardType === "VIRTUAL" ? "بطاقة افتراضية" : "بطاقة فعلية"}
              </p>
            </div>

            <div className="mt-6 flex justify-between text-xs text-white/60">
              <span>PASSCARD</span>
              <span>بانتظار المراجعة</span>
            </div>
          </div>
        </div>

        <p className="mt-5 text-sm leading-6 text-gray-500">
          هذه معاينة للتصميم فقط، وليست بطاقة دفع فعلية أو بيانات مصرفية.
        </p>

        {createdRequest && (
          <div
            role="status"
            className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700"
          >
            تم استلام الطلب. الحالة:{" "}
            <strong>{createdRequest.status}</strong>
            {" · "}
            المستوى: <strong>{createdRequest.cardLevel.name}</strong>
            <p className="mt-2">
              <Link className="font-semibold underline" href="/cards">
                متابعة بطاقاتي
              </Link>
            </p>
          </div>
        )}
      </section>
    </div>

    {message && (
      <p
        role="status"
        className="mt-5 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700"
      >
        {message}
      </p>
    )}
  </div>
</main>
```

);
}
