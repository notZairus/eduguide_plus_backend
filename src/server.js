import "dotenv/config";
import app from "./app.js";
import connectDB from "./lib/db.js";

const PORT = process.env.PORT;

await connectDB();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
