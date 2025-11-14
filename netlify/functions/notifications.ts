import { schedule } from "@netlify/functions";

export const handler = schedule("*/5 * * * *", async () => {
  try {
    console.log("Yippee");
    return {
        statusCode: 200,
    }
  } catch (error) {
    console.error("Failed to notification emails: ", error);
    return {
      statusCode: 500,
    };
  }
});
