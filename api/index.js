const app = require("../backend/server");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("");
  console.log("=================================");
  console.log("🏥 HospTech iniciado!");
  console.log(`🌐 http://localhost:${PORT}`);
  console.log("=================================");
});
