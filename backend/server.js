const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 3000;

const FRONTEND_DIR = path.join(__dirname, "../frontend");
const DB_FILE = path.join(__dirname, "db.json");

// ==========================================
// CONFIGURAÇÕES
// ==========================================

app.use(cors());

app.use(express.json({ limit: "10mb" }));

app.use(express.urlencoded({
  extended: true
}));

// Servir FRONTEND
app.use(express.static(FRONTEND_DIR));

// ==========================================
// BANCO DE DADOS
// ==========================================

function bancoInicial() {
  return {
    usuarios: [
      {
        usuario: "triagem",
        senha: "123",
        tipo: "triagem"
      },
      {
        usuario: "medico",
        senha: "123",
        tipo: "medico"
      },
      {
        usuario: "atendimento",
        senha: "123",
        tipo: "atendimento"
      }
    ],

    pacientes: [],
    triagens: [],
    consultas: [],

    tv_chamada: null,

    tv_historico: []
  };
}

function readDB() {

  if (!fs.existsSync(DB_FILE)) {

    const novoBanco = bancoInicial();

    writeDB(novoBanco);

    return novoBanco;
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

    console.error(
      "Erro ao ler db.json:",
      error
    );

    return bancoInicial();
  }
}

function writeDB(data) {

  fs.writeFileSync(
    DB_FILE,
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

// ==========================================
// PEGAR VALOR
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
// TESTE DA API
// ==========================================

app.get("/api", (req, res) => {

  res.json({
    sistema: "HospTech",
    status: "online",
    servidor: true
  });
});

// ==========================================
// LOGIN
// ==========================================

app.post("/login", (req, res) => {

  try {

    const db = readDB();

    const usuario =
      valor(req.body, "usuario");

    const senha =
      valor(req.body, "senha");

    if (!usuario || !senha) {

      return res.status(400).json({
        erro: "Usuário e senha são obrigatórios."
      });
    }

    const user = db.usuarios.find(
      u =>
        u.usuario === usuario &&
        u.senha === senha
    );

    if (!user) {

      return res.status(401).json({
        erro: "Usuário ou senha incorretos."
      });
    }

    res.json({
      sucesso: true,
      usuario: user.usuario,
      tipo: user.tipo
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      erro: "Erro interno no login."
    });
  }
});

// ==========================================
// CADASTRAR PACIENTE
// ==========================================

app.post("/atendimento", (req, res) => {

  try {

    const db = readDB();

    const paciente = {

      id: Date.now(),

      nome:
        valor(req.body, "nome"),

      cpf:
        valor(req.body, "cpf"),

      rg:
        valor(req.body, "rg"),

      outroDocumento:
        valor(req.body, "outroDocumento"),

      dataNascimento:
        valor(req.body, "dataNascimento"),

      sexo:
        valor(req.body, "sexo"),

      nomeMae:
        valor(req.body, "nomeMae"),

      estadoCivil:
        valor(req.body, "estadoCivil"),

      endereco:
        valor(req.body, "endereco"),

      telefone:
        valor(req.body, "telefone"),

      email:
        valor(req.body, "email"),

      contatoEmergencia:
        valor(req.body, "contatoEmergencia"),

      tipo:
        valor(req.body, "tipo"),

      foto:
        req.body.foto || null,

      status: "triagem",

      createdAt:
        new Date().toISOString()
    };

    // ======================================
    // VALIDAÇÕES
    // ======================================

    if (!paciente.nome) {
      return res.status(400).json({
        erro: "Nome completo é obrigatório."
      });
    }

    if (!paciente.cpf) {
      return res.status(400).json({
        erro: "CPF é obrigatório."
      });
    }

    if (!paciente.rg) {
      return res.status(400).json({
        erro: "RG é obrigatório."
      });
    }

    if (!paciente.dataNascimento) {
      return res.status(400).json({
        erro: "Data de nascimento é obrigatória."
      });
    }

    if (!paciente.sexo) {
      return res.status(400).json({
        erro: "Sexo é obrigatório."
      });
    }

    if (!paciente.nomeMae) {
      return res.status(400).json({
        erro: "Nome da mãe é obrigatório."
      });
    }

    if (!paciente.estadoCivil) {
      return res.status(400).json({
        erro: "Estado civil é obrigatório."
      });
    }

    if (!paciente.endereco) {
      return res.status(400).json({
        erro: "Endereço é obrigatório."
      });
    }

    if (!paciente.telefone) {
      return res.status(400).json({
        erro: "Telefone é obrigatório."
      });
    }

    if (!paciente.email) {
      return res.status(400).json({
        erro: "E-mail é obrigatório."
      });
    }

    if (!paciente.contatoEmergencia) {
      return res.status(400).json({
        erro: "Contato de emergência é obrigatório."
      });
    }

    if (!paciente.tipo) {
      return res.status(400).json({
        erro: "Tipo de atendimento é obrigatório."
      });
    }

    db.pacientes.push(paciente);

    writeDB(db);

    console.log(
      "Paciente cadastrado:",
      paciente.nome
    );

    res.status(201).json({
      sucesso: true,
      mensagem: "Paciente cadastrado com sucesso.",
      paciente
    });

  } catch (error) {

    console.error(
      "Erro ao cadastrar paciente:",
      error
    );

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

  res.json({
    sucesso: true,
    pacientes: db.pacientes
  });
});

// ==========================================
// TRIAGEM
// ==========================================

app.post("/triagem", (req, res) => {

  try {

    const db = readDB();

    const nome =
      valor(req.body, "nome");

    const sintoma =
      valor(req.body, "sintoma");

    const alergia =
      valor(req.body, "alergia");

    const observacao =
      valor(req.body, "observacao");

    const temperatura =
      Number(req.body.temperatura);

    let risco =
      valor(req.body, "risco");

    // ======================================
    // DEFINIR RISCO PELA TEMPERATURA
    // ======================================

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

    // ======================================
    // CRIAR TRIAGEM
    // ======================================

    const triagem = {

      id: Date.now(),

      nome,

      sintoma,

      temperatura:
        req.body.temperatura || "",

      alergia,

      observacao,

      risco,

      status:
        "aguardando_medico",

      createdAt:
        new Date().toISOString()
    };

    db.triagens.push(triagem);

    writeDB(db);

    console.log(
      "Triagem cadastrada:",
      triagem
    );

    res.status(201).json({
      sucesso: true,
      mensagem: "Triagem cadastrada com sucesso.",
      triagem
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      erro: "Erro interno ao cadastrar triagem."
    });
  }
});

// ==========================================
// LISTAR TRIAGENS
// ==========================================

app.get("/triagens", (req, res) => {

  const db = readDB();

  // Converte registros antigos
  // para o padrão novo

  const triagens =
    db.triagens.map(t => ({

      ...t,

      sintoma:
        t.sintoma ??
        t.sintomas ??
        "",

      temperatura:
        t.temperatura ??
        t.temp ??
        "",

      alergia:
        t.alergia ??
        "",

      observacao:
        t.observacao ??
        "",

      risco:
        t.risco ??
        "verde",

      status:
        t.status ??
        "aguardando_medico"
    }));

  res.json({
    sucesso: true,
    triagens
  });
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

  db.tv_chamada =
    chamada;

  db.tv_historico.unshift(
    chamada
  );

  if (
    db.tv_historico.length > 5
  ) {

    db.tv_historico =
      db.tv_historico.slice(0, 5);
  }

  writeDB(db);

  res.json({
    sucesso: true,
    chamada
  });
});

// ==========================================
// TV - CONSULTAR
// ==========================================

app.get("/tv/chamada", (req, res) => {

  const db = readDB();

  res.json({

    sucesso: true,

    chamada:
      db.tv_chamada,

    historico:
      db.tv_historico
  });
});

// ==========================================
// MEDICAÇÕES
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

  try {

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

    db.consultas.push(
      consulta
    );

    writeDB(db);

    res.status(201).json({
      sucesso: true,
      consulta
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      erro: "Erro ao salvar consulta."
    });
  }
});

// ==========================================
// LISTAR CONSULTAS
// ==========================================

app.get("/medicacoes", (req, res) => {

  const db = readDB();

  res.json({
    sucesso: true,
    consultas: db.consultas
  });
});

// ==========================================
// ROTA PRINCIPAL
// ==========================================

app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      FRONTEND_DIR,
      "index.html"
    )
  );
});

// ==========================================
// INICIAR
// ==========================================

app.listen(
  PORT,
  () => {

    console.log("");
    console.log(
      "================================="
    );

    console.log(
      "🏥 HospTech iniciado!"
    );

    console.log(
      `🌐 http://localhost:${PORT}`
    );

    console.log(
      `📁 Frontend: ${FRONTEND_DIR}`
    );

    console.log(
      `🗄️ Banco: ${DB_FILE}`
    );

    console.log(
      "================================="
    );

  }
);
