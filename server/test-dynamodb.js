import "dotenv/config";
import { testDynamoDB } from "./dynamodb.js";

async function main() {
  console.log("🔍 Probando conexión a DynamoDB...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    await testDynamoDB();
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Test completado exitosamente");
    process.exit(0);
  } catch (error) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("❌ Test falló");
    process.exit(1);
  }
}

main();
