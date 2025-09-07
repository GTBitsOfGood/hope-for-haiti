export default function ItemsVisibleTemplate({
  items,
}: {
  items: { name: string; quantity?: number }[];
}) {
  const styles = {
    container: {
      fontFamily: "Arial, sans-serif",
      backgroundColor: "#f9fafb",
      padding: "20px",
      textAlign: "left" as const,
    },
    box: {
      backgroundColor: "#ffffff",
      borderRadius: "10px",
      padding: "20px",
      maxWidth: "560px",
      margin: "0 auto",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.08)",
    },
    header: {
      fontSize: "24px",
      color: "#333333",
      marginBottom: "10px",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h2 style={styles.header}>Items made visible</h2>
        {items.length === 0 ? (
          <p>No items included.</p>
        ) : (
          <ul>
            {items.map((it, idx) => (
              <li key={idx}>
                {it.name}
                {it.quantity ? `- Quantity: ${it.quantity}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
