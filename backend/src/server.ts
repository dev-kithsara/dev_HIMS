import app from "./app";
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

/*
==========================================
Start Express Server
==========================================
*/

app.listen(PORT, () => {
  console.log("================================");
  console.log("🚀 KAIROS Backend Started");
  console.log(`🌍 http://localhost:${PORT}`);
  console.log("================================");
});