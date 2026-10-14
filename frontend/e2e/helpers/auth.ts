import type { Page } from "@playwright/test";
import { e2ePassword } from "./db";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export async function login(page: Page, email: string, callbackUrl = "/dashboard") {
  const csrfResponse = await page.context().request.get(`${baseURL}/api/auth/csrf`);
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };
  await page.context().request.post(`${baseURL}/api/auth/callback/credentials`, {
    form: {
      csrfToken,
      email,
      password: e2ePassword,
      callbackUrl,
      redirect: "false"
    },
    maxRedirects: 0
  });
  await page.goto(callbackUrl);
  // The app may redirect /dashboard to /dashboard/pcr or deny an admin route.
  // Each test asserts the destination appropriate to that user's permissions.
  await page.waitForURL((url) => url.pathname !== "/login", { timeout: 15_000 });
}
