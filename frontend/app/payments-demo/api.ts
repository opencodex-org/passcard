import { API_URL } from "../api-url";

export { API_URL };

export async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join("، ")
      : data?.message || "تعذر إكمال الطلب.";
    throw new Error(message);
  }

  return data as T;
}

export type LoginResponse = {
  token: string;
  user: { name: string; email: string; ageGroup: string };
};

export type Card = {
  id: string;
  cardNumber: string;
  status: string;
  cardLevel?: { name: string };
};

export type Merchant = {
  id: string;
  name: string;
  businessName: string;
  merchantCode: string;
};

export type Cashier = { id: string; name: string; code: string };

export type Payment = {
  id: string;
  userId?: string | null;
  cardId?: string | null;
  amountMinor: number;
  currency: string;
  status: string;
  provider: string;
  merchant?: Merchant | null;
  cashier?: Cashier | null;
};

export function money(amountMinor: number) {
  return `${(amountMinor / 100).toFixed(2)} ر.س`;
}