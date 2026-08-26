const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

// ==========================================
// CONFIGURAÇÕES
// ==========================================

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(
  express.static(
    path.join(__dirname, "../frontend")
  )
);

const DB_FILE = path.join(__dirname, "db.json");

// ==========================================
// BANCO DE DADOS
// ==========================================

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    return {
      usuarios: [],
      pacientes: [],
      triagens: [],
      consultas: [],
      tv_chamada: null,
      tv_historico: []
    };
  }

  try {
    const db = JSON.parse(
      fs.readFileSync(DB_FILE, "utf8")
    );

    if (!db.usuarios) db.usuarios = [];
    if (!db.pacientes) db.pacientes = [];
    if (!db.triagens) db.triagens = [];
    if (!db.consultas) db.consultas = [];

    if (!("tv_chamada" in db)) {
      db.tv_chamada = null;
    }

    if (!db.tv_historico) {
      db.tv_historico = [];
    }

    return db;

  } catch (error) {
    console.error("Erro ao ler db.json:", error);

    return {
      usuarios: [],
      pacientes: [],
      triagens: [],
      consultas: [],
      tv_chamada: null,
      tv_historico: []
    };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(data, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("Erro ao salvar db.json:", error);
    throw error;
  }
}

// ==========================================
// FUNÇÃO PARA PEGAR VALOR
// ==========================================

function valor(body, campo) {
  if (
    body[campo] !== undefined &&
    body[campo] !== null
  ) {
    return String(body[campo]).trim();
  }

  return "";
}

// ==========================================
// LOGIN
// ==========================================

app.post("/login", (req, res) => {
  const db = readDB();

  const usuario = valor(req.body, "usuario");
  const senha = valor(req.body, "senha");

  const user = db.usuarios.find(
    u =>
      u.usuario === usuario &&
      u.senha === senha
  );

  if (!user) {
    return res.status(401).json({
      erro: "Login inválido"
    });
  }

  res.json(user);
});

// ==========================================
// ATENDIMENTO
// CADASTRAR PACIENTE
// ==========================================

app.post("/atendimento", (req, res) => {

  try {

    console.log("");
    console.log("==========================================");
    console.log("DADOS RECEBIDOS EM /atendimento:");
    console.log(JSON.stringify(req.body, null, 2));
    console.log("==========================================");

    const db = readDB();

    // ======================================
    // DADOS PESSOAIS
    // ======================================

    const nome = valor(req.body, "nome");

    const cpf = valor(req.body, "cpf");

    const rg = valor(req.body, "rg");

    const outroDocumento =
      valor(req.body, "outroDocumento");

    const dataNascimento =
      valor(req.body, "dataNascimento");

    const sexo =
      valor(req.body, "sexo");

    const nomeMae =
      valor(req.body, "nomeMae");

    const estadoCivil =
      valor(req.body, "estadoCivil");

    // ======================================
    // ENDEREÇO E CONTATO
    // ======================================

    const endereco =
      valor(req.body, "endereco");

    const telefone =
      valor(req.body, "telefone");

    const email =
      valor(req.body, "email");

    const contatoEmergencia =
      valor(req.body, "contatoEmergencia");

    // ======================================
    // ATENDIMENTO
    // ======================================

    const tipo =
      valor(req.body, "tipo");

    // ======================================
    // FOTO
    // ======================================

    let foto = null;

    if (
      req.body.foto !== undefined &&
      req.body.foto !== null &&
      req.body.foto !== ""
    ) {
      foto = req.body.foto;
    }

    // ======================================
    // VALIDAÇÕES
    // ======================================

    if (!nome) {
      return res.status(400).json({
        erro: "Nome completo é obrigatório."
      });
    }

    if (!cpf) {
      return res.status(400).json({
        erro: "CPF é obrigatório."
      });
    }

    if (!rg) {
      return res.status(400).json({
        erro: "RG é obrigatório."
      });
    }

    if (!dataNascimento) {
      return res.status(400).json({
        erro: "Data de nascimento é obrigatória."
      });
    }

    if (!sexo) {
      return res.status(400).json({
        erro: "Sexo é obrigatório."
      });
    }

    if (!nomeMae) {
      return res.status(400).json({
        erro: "Nome da mãe é obrigatório."
      });
    }

    if (!estadoCivil) {
      return res.status(400).json({
        erro: "Estado civil é obrigatório."
      });
    }

    if (!endereco) {
      return res.status(400).json({
        erro: "Endereço é obrigatório."
      });
    }

    if (!telefone) {
      return res.status(400).json({
        erro: "Telefone é obrigatório."
      });
    }

    if (!email) {
      return res.status(400).json({
        erro: "E-mail é obrigatório."
      });
    }

    if (!contatoEmergencia) {
      return res.status(400).json({
        erro: "Contato de emergência é obrigatório."
      });
    }

    if (!tipo) {
      return res.status(400).json({
        erro: "Tipo de atendimento é obrigatório."
      });
    }

    // ======================================
    // CRIAR PACIENTE
    // ======================================

    const paciente = {

      id: Date.now(),

      nome: nome,

      cpf: cpf,

      rg: rg,

      outroDocumento:
        outroDocumento,

      dataNascimento:
        dataNascimento,

      sexo:
        sexo,

      nomeMae:
        nomeMae,

      estadoCivil:
        estadoCivil,

      endereco:
        endereco,

      telefone:
        telefone,

      email:
        email,

      contatoEmergencia:
        contatoEmergencia,

      tipo:
        tipo,

      foto:
        foto,

      status:
        "triagem",

      createdAt:
        new Date().toISOString()
    };

    // ======================================
    // SALVAR NO DB.JSON
    // ======================================

    db.pacientes.push(paciente);

    writeDB(db);

    console.log("PACIENTE SALVO COM SUCESSO:");

    console.log(
      JSON.stringify(
        paciente,
        null,
        2
      )
    );

    res.status(201).json(paciente);

  } catch (error) {

    console.error(
      "ERRO AO CADASTRAR PACIENTE:"
    );

    console.error(error);

    res.status(500).json({
      erro: "Erro interno ao cadastrar paciente."
    });
  }
});

// ==========================================
// LISTAR PACIENTES
// ==========================================

app.get("/pacientes", (req, res) => {

  const db = readDB();

  res.json(db.pacientes);
});

// ==========================================
// TRIAGEM
// ==========================================

app.post("/triagem", (req, res) => {

  const db = readDB();

  let risco = req.body.risco;

  const temperatura =
    Number(req.body.temperatura);

  if (
    !isNaN(temperatura) &&
    temperatura >= 39
  ) {
    risco = "vermelho";

  } else if (
    !isNaN(temperatura) &&
    temperatura >= 38
  ) {
    risco = "amarelo";

  } else if (!risco) {
    risco = "verde";
  }

  const triagem = {

    id: Date.now(),

    nome:
      valor(req.body, "nome"),

    sintoma:
      valor(req.body, "sintoma"),

    temperatura:
      req.body.temperatura || "",

    alergia:
      valor(req.body, "alergia"),

    observacao:
      valor(req.body, "observacao"),

    risco:
      risco,

    status:
      "aguardando_medico",

    createdAt:
      new Date().toISOString()
  };

  db.triagens.push(triagem);

  writeDB(db);

  res.json(triagem);
});

// ==========================================
// LISTAR TRIAGENS
// ==========================================

app.get("/triagens", (req, res) => {

  const db = readDB();

  res.json(db.triagens);
});

// ==========================================
// TV - CHAMAR PACIENTE
// ==========================================

app.post("/tv/chamar", (req, res) => {

  const db = readDB();

  const chamada = {

    id:
      Date.now().toString(),

    localTipo:
      valor(req.body, "localTipo"),

    localNumero:
      valor(req.body, "localNumero"),

    paciente:
      valor(req.body, "paciente"),

    hora:
      new Date().toLocaleTimeString(
        "pt-BR",
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      )
  };

  db.tv_chamada = chamada;

  db.tv_historico.unshift(chamada);

  if (db.tv_historico.length > 5) {
    db.tv_historico.pop();
  }

  writeDB(db);

  res.json(chamada);
});

// ==========================================
// TV - CONSULTAR CHAMADA
// ==========================================

app.get("/tv/chamada", (req, res) => {

  const db = readDB();

  res.json({
    chamada:
      db.tv_chamada,

    historico:
      db.tv_historico
  });
});

// ==========================================
// LISTA DE MEDICAÇÕES
// ==========================================

app.get(
  "/lista-medicacoes",
  (req, res) => {

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

  }
);

// ==========================================
// CONSULTA MÉDICA
// ==========================================

app.post("/consulta", (req, res) => {

  const db = readDB();

  const consulta = {

    id: Date.now(),

    paciente:
      valor(req.body, "paciente"),

    diagnostico:
      valor(req.body, "diagnostico"),

    medicacao:
      valor(req.body, "medicacao"),

    obs:
      valor(req.body, "obs"),

    createdAt:
      new Date().toISOString()
  };

  db.consultas.push(consulta);

  writeDB(db);

  res.json(consulta);
});

// ==========================================
// MEDICAÇÕES / CONSULTAS
// ==========================================

app.get(
  "/medicacoes",
  (req, res) => {

    const db = readDB();

    res.json(db.consultas);
  }
);

// ==========================================
// INICIAR SERVIDOR
// ==========================================

const PORT =
  process.env.PORT || 3000;

app.listen(
  PORT,
  () => {

    console.log(
      `Servidor rodando na porta ${PORT}`
    );

    console.log(
      `Banco de dados: ${DB_FILE}`
    );

  }
);
