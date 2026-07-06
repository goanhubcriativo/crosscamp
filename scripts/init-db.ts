// Cria as tabelas no banco configurado em DATABASE_URL.
// Uso: npm run db:init
import { initDb } from "../lib/db";

initDb()
  .then(() => {
    console.log("Banco inicializado com sucesso.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Falha ao inicializar o banco:", err);
    process.exit(1);
  });
