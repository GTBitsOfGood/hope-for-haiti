import SendGrid from "@sendgrid/mail";
import open from "open-html";

const apiKey = process.env.SENDGRID_API_KEY as string;
const fromEmail = process.env.SENDGRID_SENDER as string;

// SendGrid setup is only required in production
if (process.env.NODE_ENV === "production") {
  if (apiKey === undefined) throw "Must set SENDGRID_API_KEY";
  if (fromEmail === undefined) throw "Must set SENDGRID_SENDER";
}
if (apiKey) SendGrid.setApiKey(apiKey);

// If in dev environment with no API key, we'll open emails locally
const openLocally = process.env.NODE_ENV !== "production" && !apiKey;

/**
 * Wrapper around SendGrid that opens the email locally if no API key
 * is configured.
 *
 * Example usage:
 *   const html = await render(<Template name={"John"} />);
 *   await sendEmail("john@test.com", "Greetings", html);
 *
 * @param to email address to send to
 * @param subject subject header for the email
 * @param html HTML string to send
 * @returns SendGrid response if actually sent, else void
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<[SendGrid.ClientResponse, unknown] | void> {
  if (openLocally) {
    open(html);
    return;
  }

  return SendGrid.send({
    to,
    from: fromEmail,
    subject,
    html,
  });
}