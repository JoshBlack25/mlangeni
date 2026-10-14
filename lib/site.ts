/**
 * Facts about the business, used by metadata, structured data, the sitemap and
 * llms.txt. Only what the site already states publicly — no invented address,
 * phone number, hours or ratings (see PRODUCT.md, "Evidence on Hand").
 */

/**
 * The public origin, without a trailing slash. Canonical URLs, the sitemap and
 * social-share images are absolute, so this must be the production domain in
 * production: set NEXT_PUBLIC_SITE_URL. On Vercel the production domain is
 * used automatically when it is not set.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/+$/, "");

/**
 * The business phone / WhatsApp number in international format, digits only
 * (e.g. 27821234567). Phone and WhatsApp options stay hidden until it is set,
 * rather than showing a number nobody answers.
 */
export const BUSINESS_PHONE = (process.env.NEXT_PUBLIC_BUSINESS_PHONE ?? "").replace(/\D/g, "");

export const SITE = {
  name: "Mlangeni Grand Hospitality",
  shortName: "Mlangeni",
  description:
    "Premium private-event catering and hospitality in Cape Town, South Africa. Weddings, corporate functions and celebrations, from first enquiry to the final course.",
  email: "hello@mlangeni.co.za",
  // Privacy, POPIA and PAIA requests, and the Information Officer.
  legalEmail: "mlangenicatering@gmail.com",
  locality: "Cape Town",
  region: "Western Cape",
  country: "ZA",
  locale: "en_ZA",
  logo: "/logos/logoPNG.png",
} as const;
