type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function getFromAddress() {
  return process.env.EMAIL_FROM ?? "Iatron <no-reply@iatron.app>";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[character] || character));
}

function mentoryEmail(input: SendEmailInput) {
  const body = escapeHtml(input.text).replace(/\n/g, "<br>");
  return '<!doctype html><html lang="pt-BR"><body style="margin:0;background:#0A1B33;color:#FFFFFF;font-family:Montserrat,Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="24" style="background:#0A1B33"><tr><td align="center"><table role="presentation" width="100%" style="max-width:600px;background:#123A6B;border:1px solid #22D3EE"><tr><td style="padding:28px"><div style="font-family:Barlow,Arial,sans-serif;font-weight:bold;font-size:26px">PED EXPERT</div><div style="color:#22D3EE;letter-spacing:6px;font-size:21px">MENTORY</div><hr style="border:0;border-top:1px solid #22D3EE;margin:20px 0"><h1 style="font-family:Barlow,Arial,sans-serif;font-size:24px">'+escapeHtml(input.subject)+'</h1><div style="font-size:15px;line-height:1.7;overflow-wrap:anywhere">'+body+'</div></td></tr></table></td></tr></table></body></html>';
}

export async function sendEmail(input: SendEmailInput) {
  if (process.env.RESEND_API_KEY) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: getFromAddress(),
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html ?? (/mentory|pediatron/i.test(input.subject) ? mentoryEmail(input) : undefined)
      })
    });

    if (!response.ok) {
      const detail = await response.json().catch(() => null);
      console.error("[email:resend] rejected", { status: response.status, code: typeof detail?.name === "string" ? detail.name.slice(0,80) : "unknown" });
      throw new Error("Email provider rejected the message.");
    }

    return { delivered: true, provider: "resend" as const };
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[email:dev]", {
      to: input.to,
      subject: input.subject,
      text: input.text
    });
    return { delivered: false, provider: "development-console" as const };
  }

  throw new Error("Email provider not configured.");
}
