type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function getFromAddress() {
  return process.env.EMAIL_FROM ?? "Iatron <no-reply@iatron.app>";
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
        html: input.html
      })
    });

    if (!response.ok) {
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

  return { delivered: false, provider: "not_configured" as const };
}
