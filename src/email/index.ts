import SendGrid from "@sendgrid/mail";
import { render } from "@react-email/components";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { exec } from "child_process";
import CreateAccountInvite, {
  CreateAccountInviteProps,
} from "./templates/CreateAccountInvite";
import CreateAccountReminder, {
  CreateAccountReminderProps,
} from "./templates/CreateAccountReminder";
import ResetPassword, { ResetPasswordProps } from "./templates/ResetPassword";
import SupportTicketUnread, { SupportTicketUnreadProps } from "./templates/SupportTicketUnread";
import SupportTicketClosed, { SupportTicketClosedProps } from "./templates/SupportTicketClosed";

const apiKey = process.env.SENDGRID_API_KEY as string;
const fromEmail = process.env.SENDGRID_SENDER as string;

if (apiKey) SendGrid.setApiKey(apiKey);

// If in dev environment with no API key, we'll open emails locally
const openLocally = !apiKey;

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
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `email-preview-${timestamp}.html`;
    const previewsDir = join(process.cwd(), "email-previews");
    const filepath = join(previewsDir, filename);

    try {
      writeFileSync(filepath, html);
    } catch {
      mkdirSync(previewsDir, { recursive: true });
      writeFileSync(filepath, html);
    }

    const relativePath = `email-previews/${filename}`;
    console.log(`📧 Email preview saved: ${relativePath}`);

    const fileUrl = `file://${filepath}`;
    const platform = process.platform;

    let command: string;
    if (platform === "darwin") {
      command = `open -n "${fileUrl}"`;
    } else if (platform === "win32") {
      command = `start "" "${fileUrl}"`;
    } else {
      command = `xdg-open "${fileUrl}"`;
    }

    exec(command, (error) => {
      if (error) {
        console.log(
          `📧 Could not auto-open browser. Please open manually: ${fileUrl}`
        );
      } else {
        console.log(`📧 Email preview opened in browser`);
      }
    });

    return;
  }

  return SendGrid.send(
    {
      to,
      from: { email: fromEmail, name: "Hope for Haiti" },
      subject,
      html,
    },
    Array.isArray(to)
  );
}

type EmailMessage = {
  to: string | string[];
  subject: string;
  html: string;
};

export async function sendEmailMultiple(
  messages: EmailMessage[]
): Promise<(void | [SendGrid.ClientResponse, object])[] | void> {
  if (messages.length === 0) {
    return;
  }

  return Promise.all(
    messages.map(({ to, subject, html }) => sendEmail(to, subject, html))
  );
}

export class EmailClient {
  static async sendUserInvite(to: string, props: CreateAccountInviteProps) {
    const html = await render(CreateAccountInvite(props));
    return sendEmail(to, "Your Invite Link", html);
  }

  static async sendUserInviteReminder(
    to: string,
    props: CreateAccountReminderProps
  ) {
    const html = await render(CreateAccountReminder(props));
    return sendEmail(to, "Reminder: Complete Your Account", html);
  }

  static async sendPasswordReset(to: string, props: ResetPasswordProps) {
    const html = await render(ResetPassword(props));
    return sendEmail(to, "Reset Your Password", html);
  }

  static async sendSupportTicketUnread(to: string, props: SupportTicketUnreadProps) {
    const html = await render(SupportTicketUnread(props));
    return sendEmail(to, "Unread Support Ticket Messages", html);
  }

  static async sendSupportTicketClosed(to: string, props: SupportTicketClosedProps) {
    const html = await render(SupportTicketClosed(props)); 
    return sendEmail(to, `Support Ticket Closed: ${props.ticketName}`, html);
  }
}
