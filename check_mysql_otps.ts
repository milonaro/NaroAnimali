import poolWrapper from "./src/lib/mysql.js";

async function test() {
  try {
    console.log("Checking user_otps table in MySQL...");
    const [rows]: any = await poolWrapper.execute("SELECT * FROM user_otps");
    console.log("Found user_otps rows in DB:", rows);

    const now_db = await poolWrapper.execute("SELECT NOW() as now_db");
    console.log("MySQL NOW():", now_db[0]);
    console.log("Node JS Date.now():", new Date().toISOString(), "Timestamp:", Date.now());
  } catch (err: any) {
    console.error("Test failed:", err.message);
  }
  process.exit(0);
}

test();
