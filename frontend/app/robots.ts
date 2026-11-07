import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/ped-expert-mentory", "/folha-pcr", "/lancamento_mentoria"],
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/",
          "/profile/",
          "/billing/",
          "/checkout/",
          "/login",
          "/register",
          "/mentory/",
        ],
      },
    ],
    sitemap: "https://pediatron.com.br/sitemap.xml",
    host: "https://pediatron.com.br",
  };
}
