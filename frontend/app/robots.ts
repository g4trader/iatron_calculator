import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/ped-expert-mentory", "/lancamento_mentoria"],
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
    sitemap: "https://ped.iatron.com.br/sitemap.xml",
    host: "https://ped.iatron.com.br",
  };
}
