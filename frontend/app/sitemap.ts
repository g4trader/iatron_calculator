import type { MetadataRoute } from "next";

const base = "https://ped.iatron.com.br";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: base, changeFrequency: "monthly", priority: 0.8 },
    { url: base + "/ped-expert-mentory", changeFrequency: "monthly", priority: 1 },
    { url: base + "/lancamento_mentoria", changeFrequency: "weekly", priority: 0.9 },
  ];
}
