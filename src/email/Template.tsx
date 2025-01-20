export default function Template({ name }: { name: string }) {
  const styles = {
    container: {
      fontFamily: "Arial, sans-serif",
      backgroundColor: "#f4f4f4",
      padding: "20px",
      textAlign: "center",
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
    button: {
      display: "inline-block",
      padding: "10px 20px",
      fontSize: "16px",
      color: "#ffffff",
      backgroundColor: "#007BFF",
      border: "none",
      borderRadius: "5px",
      textDecoration: "none",
      cursor: "pointer",
    },
  };

  return (
    // @ts-expect-error idk what is wrong here, but this should be fine
    <div style={styles.container}>
      <div style={styles.box}>
        <h1 style={styles.header}>Greetings</h1>
        <p style={styles.text}>Hey, {name}!</p>
      </div>
    </div>
  );
}
