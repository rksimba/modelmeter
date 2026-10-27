const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STORED_MESSAGE =
  "You're on the list. We only email when a tracked price changes or a model launches.";

const SAVE_FAILED_MESSAGE =
  "Could not save your signup right now. Please try again later.";

function isDuplicateContact(status: number, raw: string): boolean {
  if (status !== 409 && status !== 422) return false;
  return /already[\s_-]*exist|already[\s_-]*created|duplicate/i.test(raw);
}

export async function POST(request: Request) {
  let email = "";
  try {
    const body = (await request.json()) as { email?: unknown };
    if (typeof body.email === "string") email = body.email.trim();
  } catch {
    email = "";
  }

  if (!email || email.length > 200 || !EMAIL.test(email)) {
    return Response.json(
      { ok: false, stored: false, sent: false, message: "Enter a valid email address." },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const segmentId = process.env.RESEND_SEGMENT_ID;
  if (!apiKey || !segmentId) {
    return Response.json(
      {
        ok: false,
        stored: false,
        sent: false,
        message:
          "Signup is not connected yet. This address was not stored and no email was sent.",
      },
      { status: 501 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch("https://api.resend.com/contacts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        unsubscribed: false,
        segments: [{ id: segmentId }],
      }),
    });
  } catch {
    return Response.json(
      { ok: false, stored: false, sent: false, message: SAVE_FAILED_MESSAGE },
      { status: 502 },
    );
  }

  if (upstream.status === 200 || upstream.status === 201) {
    return Response.json({
      ok: true,
      stored: true,
      sent: false,
      message: STORED_MESSAGE,
    });
  }

  let raw = "";
  if (upstream.status === 409 || upstream.status === 422) {
    try {
      raw = await upstream.text();
    } catch {
      raw = "";
    }
  }

  if (isDuplicateContact(upstream.status, raw)) {
    return Response.json({
      ok: true,
      stored: true,
      sent: false,
      message: STORED_MESSAGE,
    });
  }

  return Response.json(
    { ok: false, stored: false, sent: false, message: SAVE_FAILED_MESSAGE },
    { status: 502 },
  );
}
