const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

const PORT = 3000;
const FRONTEND_DIR = path.join(__dirname, "../frontend");
const DB_FILE = path.join(__dirname, "db.json");

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(FRONTEND_DIR));

/* =========================================================
   BANCO DE DADOS
   ========================================================= */

function createEmptyDB() {
  return {
    usuarios: [],
    pacientes: [],
    triagens: [],
    consultas: []
  };
}

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const db = createEmptyDB();
    writeDB(db);
    return db;
  }

  try {
    const content = fs.readFileSync(DB_FILE, "utf8");

    if (!content.trim()) {
      const db = createEmptyDB();
      writeDB(db);
      return db;
    }

    const db = JSON.parse(content);

    return {
      usuarios: Array.isArray(db.usuarios) ? db.usuarios : [],
      pacientes: Array.isArray(db.pacientes) ? db.pacientes : [],
      triagens: Array.isArray(db.triagens) ? db.triagens : [],
      consultas: Array.isArray(db.consultas) ? db.consultas : []
    };
  } catch (error) {
    console.error("Erro ao ler banco de dados:", error);

    return createEmptyDB();
  }
}

function writeDB(data) {
  fs.writeFileSync(
    DB_FILE,
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

/* =========================================================
   TV / MÍDIA INDOOR
   ========================================================= */

let chamadaAtual = null;
let historicoChamadas = [];

/* =========================================================
   ROTA PRINCIPAL
   ========================================================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

/* =========================================================
   LOGIN
   ========================================================= */

app.post("/login", (req, res) => {
  const db = readDB();

  const usuario = String(req.body.usuario || "").trim();
  const senha = String(req.body.senha || "");

  if (!usuario || !senha) {
    return res.status(400).json({
      erro: "Informe usuário e senha."
    });
  }

  const user = db.usuarios.find(
    u =>
      u.usuario === usuario &&
      u.senha === senha
  );

  if (!user) {
    return res.status(401).json({
      erro: "Usuário ou senha inválidos."
    });
  }

  res.json(user);
});

/* =========================================================
   ATENDIMENTO
   ========================================================= */

app.post("/atendimento", (req, res) => {
  const db = readDB();

  const nome = String(req.body.nome || "").trim();
  const cpf = String(req.body.cpf || "").trim();
  const tipo = String(req.body.tipo || "").trim();

  if (!nome) {
    return res.status(400).json({
      erro: "O nome do paciente é obrigatório."
    });
  }

  if (!cpf) {
    return res.status(400).json({
      erro: "O CPF do paciente é obrigatório."
    });
  }

  if (!tipo) {
    return res.status(400).json({
      erro: "Informe o tipo de atendimento."
    });
  }

  const paciente = {
    id: Date.now(),
    nome,
    cpf,
    tipo,
    foto: req.body.foto || null,
    status: "triagem",
    createdAt: new Date().toISOString()
  };

  db.pacientes.push(paciente);

  writeDB(db);

  res.status(201).json(paciente);
});

/* =========================================================
   LISTAR PACIENTES
   ========================================================= */

app.get("/pacientes", (req, res) => {
  const db = readDB();

  res.json(db.pacientes);
});

/* =========================================================
   ATUALIZAR STATUS DO PACIENTE
   ========================================================= */

app.patch("/pacientes/:id/status", (req, res) => {
  const db = readDB();

  const id = Number(req.params.id);
  const novoStatus = String(req.body.status || "").trim();

  const statusPermitidos = [
    "triagem",
    "aguardando_medico",
    "em_atendimento",
    "atendido"
  ];

  if (!statusPermitidos.includes(novoStatus)) {
    return res.status(400).json({
      erro: "Status inválido."
    });
  }

  const paciente = db.pacientes.find(
    p => p.id === id
  );

  if (!paciente) {
    return res.status(404).json({
      erro: "Paciente não encontrado."
    });
  }

  paciente.status = novoStatus;

  writeDB(db);

  res.json(paciente);
});

/* =========================================================
   TRIAGEM
   ========================================================= */

app.post("/triagem", (req, res) => {
  const db = readDB();

  const nome = String(req.body.nome || "").trim();
  const sintoma = String(req.body.sintoma || "").trim();
  const temperatura = Number(req.body.temperatura);
  const alergia = String(req.body.alergia || "").trim();
  const observacao = String(req.body.observacao || "").trim();

  if (!nome) {
    return res.status(400).json({
      erro: "Informe o nome do paciente."
    });
  }

  if (!sintoma) {
    return res.status(400).json({
      erro: "Selecione um sintoma."
    });
  }

  let risco = req.body.risco;

  const sintomasVermelhos = [
    "infarto",
    "avc",
    "convulsao",
    "hemorragia",
    "falta_ar_grave"
  ];

  const sintomasAmarelos = [
    "febre",
    "vomito",
    "diarreia",
    "falta_ar_moderada"
  ];

  if (temperatura >= 39) {
    risco = "vermelho";
  } else if (sintomasVermelhos.includes(sintoma)) {
    risco = "vermelho";
  } else if (
    temperatura >= 38 ||
    sintomasAmarelos.includes(sintoma)
  ) {
    risco = "amarelo";
  } else {
    risco = "verde";
  }

  const triagem = {
    id: Date.now(),
    nome,
    sintoma,
    temperatura: Number.isNaN(temperatura)
      ? null
      : temperatura,
    alergia: alergia || "Nenhuma",
    observacao: observacao || "Nenhuma",
    risco,
    status: "aguardando_medico",
    createdAt: new Date().toISOString()
  };

  db.triagens.push(triagem);

  /*
    Se existir um paciente com o mesmo nome aguardando
    triagem, atualiza o status dele.
  */
  const paciente = [...db.pacientes]
    .reverse()
    .find(
      p =>
        p.nome.toLowerCase() === nome.toLowerCase() &&
        p.status === "triagem"
    );

  if (paciente) {
    paciente.status = "aguardando_medico";
  }

  writeDB(db);

  res.status(201).json(triagem);
});

/* =========================================================
   LISTAR TRIAGENS
   ========================================================= */

app.get("/triagens", (req, res) => {
  const db = readDB();

  res.json(
    [...db.triagens].reverse()
  );
});

/* =========================================================
   MEDICAÇÕES DISPONÍVEIS
   ========================================================= */

app.get("/lista-medicacoes", (req, res) => {
  res.json([
    "Dipirona",
    "Paracetamol",
    "Ibuprofeno",
    "Amoxicilina",
    "Azitromicina",
    "Loratadina",
    "Omeprazol",
    "Buscopan",
    "Dramin",
    "Soro fisiológico"
  ]);
});

/* =========================================================
   CONSULTA MÉDICA
   ========================================================= */

app.post("/consulta", (req, res) => {
  const db = readDB();

  const pacienteNome = String(
    req.body.paciente || ""
  ).trim();

  const diagnostico = String(
    req.body.diagnostico || ""
  ).trim();

  const medicacao = String(
    req.body.medicacao || ""
  ).trim();

  const obs = String(
    req.body.obs || ""
  ).trim();

  if (!pacienteNome) {
    return res.status(400).json({
      erro: "Selecione um paciente."
    });
  }

  if (!diagnostico) {
    return res.status(400).json({
      erro: "Informe o diagnóstico."
    });
  }

  if (!medicacao) {
    return res.status(400).json({
      erro: "Selecione uma medicação."
    });
  }

  const consulta = {
    id: Date.now(),
    paciente: pacienteNome,
    diagnostico,
    medicacao,
    obs: obs || "Nenhuma",
    createdAt: new Date().toISOString()
  };

  db.consultas.push(consulta);

  /*
    Procura a triagem correspondente e finaliza.
  */
  const triagem = [...db.triagens]
    .reverse()
    .find(
      t =>
        t.nome.toLowerCase() ===
        pacienteNome.toLowerCase()
    );

  if (triagem) {
    triagem.status = "atendido";
  }

  /*
    Atualiza também o cadastro do paciente.
  */
  const paciente = [...db.pacientes]
    .reverse()
    .find(
      p =>
        p.nome.toLowerCase() ===
        pacienteNome.toLowerCase()
    );

  if (paciente) {
    paciente.status = "atendido";
  }

  writeDB(db);

  res.status(201).json(consulta);
});

/* =========================================================
   MEDICAÇÕES PRESCRITAS
   ========================================================= */

app.get("/medicacoes", (req, res) => {
  const db = readDB();

  res.json(
    [...db.consultas].reverse()
  );
});

/* =========================================================
   CHAMAR PACIENTE NA TV
   ========================================================= */

app.post("/tv/chamar", (req, res) => {
  const localTipo = String(
    req.body.localTipo || "GUICHÊ"
  ).trim();

  const localNumero = String(
    req.body.localNumero || "01"
  ).trim();

  const paciente = String(
    req.body.paciente || ""
  ).trim();

  if (!paciente) {
    return res.status(400).json({
      erro: "Informe o paciente."
    });
  }

  chamadaAtual = {
    id: Date.now(),
    localTipo,
    localNumero,
    paciente,
    createdAt: new Date().toISOString()
  };

  historicoChamadas.unshift(
    chamadaAtual
  );

  historicoChamadas =
    historicoChamadas.slice(0, 10);

  res.json({
    sucesso: true,
    chamada: chamadaAtual
  });
});

/* =========================================================
   CONSULTAR CHAMADA DA TV
   ========================================================= */

app.get("/tv/chamada", (req, res) => {
  res.json({
    chamada: chamadaAtual,
    historico: historicoChamadas
  });
});

/* =========================================================
   SERVIDOR
   ========================================================= */

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(
      `🏥 Sistema Hospitalar rodando em http://localhost:${PORT}`
    );
  });
}

module.exports = app;
