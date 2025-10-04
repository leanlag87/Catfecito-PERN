import "dotenv/config";
import app from "./app.js";
import { testDB } from "./db.js";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await testDB();

    app.listen(PORT, () => {
      console.log("🚀 Servidor iniciado correctamente");
      console.log(`📡 Puerto: ${PORT}`);
      console.log(`🔗 URL Local: http://localhost:${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || "development"}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🐱 ¡Catfecito Backend está funcionando! ☕");
    });
  } catch (error) {
    console.error("Error al iniciar el servidor", error);
    process.exit(1);
  }
}

startServer();
