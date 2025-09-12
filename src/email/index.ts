import SendGrid from "@sendgrid/mail";
import open from "open-html";
import { render } from "@react-email/render";
import UserInviteTemplate from "@/email/templates/UserInvite";
import ParterInviteReminderTemplate from "@/email/templates/PartnerInviteReminder";
import ItemsExpiringTemplate from "@/email/templates/ItemsExpiring";
import ItemsVisibleTemplate from "@/email/templates/ItemsVisible";
import DonorOfferCreatedTemplate from "@/email/templates/DonorOfferCreated";

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
 * ```
 * const html = await render(<Template name={"John"} />);
 * await sendEmail("john@test.com", "Greetings", html);
 * ```
 *
 * @param to email address to send to
 * @param subject subject header for the email
 * @param html HTML string to send
 * @returns SendGrid response if actually sent, else void
 */
export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string
): Promise<[SendGrid.ClientResponse, object] | void> {
  if (openLocally) {
    open(html);
    return;
  }

  return SendGrid.send({
    to,
    from: fromEmail,
    subject,
    html,
  }, Array.isArray(to));
}

export class EmailClient {
  static async sendUserInvite(to: string, props: { inviteUrl: string }) {
    const html = await render(UserInviteTemplate(props));
    return sendEmail(to, "Your Invite Link", html);
  }

  static async sendPartnerInviteReminder(to: string, props: { inviteUrl: string }) {
    const html = await render(ParterInviteReminderTemplate(props));
    return sendEmail(to, "Reminder: Complete Your Account", html);
  }

  static async sendItemsExpiring(
    to: string,
    props: {
      month: string;
      items: Array<{
        name: string;
        quantity?: number;
        expirationDate?: string;
      }>;
    }
  ) {
    const html = await render(ItemsExpiringTemplate(props));
    return sendEmail(to, `Items Expiring in ${props.month}`, html);
  }

  static async sendItemsVisible(
    to: string,
    props: { items: Array<{ name: string; quantity?: number }> }
  ) {
    const html = await render(ItemsVisibleTemplate(props));
    return sendEmail(to, "New Items Visible", html);
  }

  static async sendDonorOfferCreated(
    to: string | string[],
    props: { offerTitle: string; description?: string; donorName?: string }
  ) {
    const html = await render(DonorOfferCreatedTemplate(props));
    return sendEmail(to, "Donor Offer Created", html);
  }
}
