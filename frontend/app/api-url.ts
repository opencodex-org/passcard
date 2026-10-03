const developmentApiUrl = "http://localhost:4000/api/v1";
const productionApiUrl = "https://passcard-igfn.onrender.com/api/v1";
const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");

export const API_URL =
  process.env.NODE_ENV === "production"
    ? productionApiUrl
    : configuredApiUrl || developmentApiUrl;