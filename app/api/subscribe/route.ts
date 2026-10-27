const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
