export default function PartnerInviteReminderTemplate({
  inviteUrl,
}: {
  inviteUrl: string;
}) {
  const styles = {
    container: {
      fontFamily: "Arial, sans-serif",
      backgroundColor: "#f4f4f4",
      padding: "20px",
      textAlign: "center" as const,
    },
    box: {
      backgroundColor: "#ffffff",
      borderRadius: "10px",
      padding: "20px",
      maxWidth: "400px",
      margin: "0 auto",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
    header: {
      fontSize: "24px",
      color: "#333333",
      marginBottom: "10px",
    },
    text: {
      fontSize: "16px",
      color: "#666666",
      marginBottom: "20px",
      lineHeight: "1.5",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h1 style={styles.header}>Reminder: Your invite link</h1>
        <a style={styles.text} href={inviteUrl}>
          Click here to register
        </a>
      </div>
    </div>
  );
}
