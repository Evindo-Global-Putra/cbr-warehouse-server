import postgres from "postgres";

const testConnection = async () => {
  try {
    const client = postgres(process.env.DATABASE_URL!);

    console.log("🔄 Testing database connection...");
    console.log(
      "📍 Database URL:",
      process.env.DATABASE_URL?.replace(/:[^:]*@/, ":****@"),
    ); // Hide password

    await client`SELECT 1`;

    console.log("✅ Database connection successful!");

    await client.end();
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};

testConnection();
