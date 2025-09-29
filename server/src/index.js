const app = require("./app");
const { connectDB } = require("./db");
const { PORT } = require("./config");

async function startServer() {
  try {
    // Conectar a la base de datos PostgreSQL
    await connectDB();
    console.log("✅ Conexión a PostgreSQL establecida correctamente");

    // Iniciar el servidor Express
    app.listen(PORT, () => {
      console.log("🚀 Servidor iniciado correctamente");
      console.log(`📡 Puerto: ${PORT}`);
      console.log(`🔗 URL Local: http://localhost:${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || "development"}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🐱 ¡Catfecito Backend está funcionando! ☕");
    });
  } catch (error) {
    console.error("❌ Error crítico al iniciar el servidor:");
    console.error("   Mensaje:", error.message);
    console.error("   Stack:", error.stack);

    // Terminar el proceso si no se puede iniciar
    process.exit(1);
  }
}

// Manejo de señales del sistema para cierre graceful
process.on("SIGTERM", () => {
  console.log("📥 Señal SIGTERM recibida. Cerrando servidor...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n📥 Señal SIGINT recibida (Ctrl+C). Cerrando servidor...");
  process.exit(0);
});

// Manejo de errores no capturados
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Promise Rejection:");
  console.error("   Promise:", promise);
  console.error("   Reason:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:");
  console.error("   Error:", error.message);
  console.error("   Stack:", error.stack);
  process.exit(1);
});

// Iniciar el servidor
console.log("🔄 Iniciando Catfecito Backend...");
startServer();
