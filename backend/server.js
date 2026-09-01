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

function bancoVazio() {
  return {
    usuarios: [],
    pacientes: [],
    triagens: [],
    consultas: [],
    tv_chamada: null,
    tv_historico: []
  };
}

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    return bancoVazio();
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

    return bancoVazio();
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

    console.error(
      "Erro ao salvar db.json:",
      error
    );

    throw error;
  }
}

// ==========================================
// FUNÇÃO PARA PEGAR VALORES
// ==========================================

function valor(body, campo) {

  if (
    body &&
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

  const usuario =
    valor(req.body, "usuario");

  const senha =
    valor(req.body, "senha");

  if (!usuario || !senha) {
    return res.status(400).json({
      erro: "Informe usuário e senha."
    });
  }

  const user =
    db.usuarios.find(
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

// ==========================================
// ATENDIMENTO
// CADASTRAR PACIENTE
// ==========================================

app.post("/atendimento", (req, res) => {

  try {

    const db = readDB();

    const nome =
      valor(req.body, "nome");

    const cpf =
      valor(req.body, "cpf");

    const rg =
      valor(req.body, "rg");

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

    const endereco =
      valor(req.body, "endereco");

    const telefone =
      valor(req.body, "telefone");

    const email =
      valor(req.body, "email");

    const contatoEmergencia =
      valor(req.body, "contatoEmergencia");

    const tipo =
      valor(req.body, "tipo");

    let foto = null;

    if (
      req.body.foto &&
      String(req.body.foto).startsWith("data:image/")
    ) {
      foto = req.body.foto;
    }

    // ======================================
    // VALIDAÇÕES
    // ======================================

    const camposObrigatorios = [
      ["nome", nome],
      ["cpf", cpf],
      ["rg", rg],
      ["data de nascimento", dataNascimento],
      ["sexo", sexo],
      ["nome da mãe", nomeMae],
      ["estado civil", estadoCivil],
      ["endereço", endereco],
      ["telefone", telefone],
      ["e-mail", email],
      ["contato de emergência", contatoEmergencia],
      ["tipo de atendimento", tipo]
    ];

    for (const [nomeCampo, valorCampo] of camposObrigatorios) {

      if (!valorCampo) {

        return res.status(400).json({
          erro:
            `${nomeCampo.charAt(0).toUpperCase()}` +
            `${nomeCampo.slice(1)} é obrigatório.`
        });

      }
    }

    const emailValido =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailValido.test(email)) {

      return res.status(400).json({
        erro: "Digite um e-mail válido."
      });
    }

    // ======================================
    // CRIAR PACIENTE
    // ======================================

    const paciente = {

      id: Date.now(),

      nome,

      cpf,

      rg,

      outroDocumento,

      dataNascimento,

      sexo,

      nomeMae,

      estadoCivil,

      endereco,

      telefone,

      email,

      contatoEmergencia,

      tipo,

      foto,

      status: "triagem",

      createdAt:
        new Date().toISOString()
    };

    db.pacientes.push(paciente);

    writeDB(db);

    res.status(201).json(paciente);

  } catch (error) {

    console.error(
      "Erro ao cadastrar paciente:",
      error
    );

    res.status(500).json({
      erro:
        "Erro interno ao cadastrar paciente."
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
// ATUALIZAR STATUS DO PACIENTE
// ==========================================

app.patch(
  "/pacientes/:id/status",
  (req, res) => {

    const db = readDB();

    const id =
      Number(req.params.id);

    const novoStatus =
      valor(req.body, "status");

    const statusPermitidos = [
      "triagem",
      "aguardando_medico",
      "em_atendimento",
      "finalizado"
    ];

    if (!statusPermitidos.includes(novoStatus)) {

      return res.status(400).json({
        erro: "Status inválido."
      });
    }

    const paciente =
      db.pacientes.find(
        p => Number(p.id) === id
      );

    if (!paciente) {

      return res.status(404).json({
        erro: "Paciente não encontrado."
      });
    }

    paciente.status = novoStatus;

    // Atualiza também a triagem relacionada
    const triagem =
      [...db.triagens]
        .reverse()
        .find(
          t =>
            Number(t.pacienteId) === id ||
            (
              t.nome &&
              paciente.nome &&
              t.nome.toLowerCase() ===
                paciente.nome.toLowerCase()
            )
        );

    if (triagem) {

      if (
        novoStatus ===
        "aguardando_medico"
      ) {
        triagem.status =
          "aguardando_medico";
      }

      if (
        novoStatus ===
        "em_atendimento"
      ) {
        triagem.status =
          "em_atendimento";
      }

      if (
        novoStatus ===
        "finalizado"
      ) {
        triagem.status =
          "finalizado";
      }
    }

    writeDB(db);

    res.json(paciente);
  }
);

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

    if (!nome) {

      return res.status(400).json({
        erro: "Informe o nome do paciente."
      });
    }

    if (!sintoma) {

      return res.status(400).json({
        erro: "Selecione o sintoma."
      });
    }

    // ======================================
    // ENCONTRAR PACIENTE
    // ======================================

    const paciente =
      [...db.pacientes]
        .reverse()
        .find(
          p =>
            p.nome &&
            p.nome.toLowerCase() ===
              nome.toLowerCase() &&
            p.status === "triagem"
        );

    // ======================================
    // CLASSIFICAÇÃO
    // ======================================

    const vermelhos = [
      "infarto",
      "avc",
      "convulsao",
      "hemorragia",
      "falta_ar_grave"
    ];

    const amarelos = [
      "febre",
      "vomito",
      "diarreia",
      "falta_ar_moderada"
    ];

    let risco = "verde";

    if (
      !isNaN(temperatura) &&
      temperatura >= 39
    ) {

      risco = "vermelho";

    } else if (
      vermelhos.includes(sintoma)
    ) {

      risco = "vermelho";

    } else if (
      (
        !isNaN(temperatura) &&
        temperatura >= 38
      ) ||
      amarelos.includes(sintoma)
    ) {

      risco = "amarelo";
    }

    // ======================================
    // CRIAR TRIAGEM
    // ======================================

    const triagem = {

      id: Date.now(),

      pacienteId:
        paciente
          ? paciente.id
          : null,

      nome,

      sintoma,

      temperatura:
        isNaN(temperatura)
          ? ""
          : temperatura,

      alergia,

      observacao,

      risco,

      status:
        "aguardando_medico",

      createdAt:
        new Date().toISOString()
    };

    db.triagens.push(triagem);

    // ======================================
    // ATUALIZAR PACIENTE
    // ======================================

    if (paciente) {

      paciente.status =
        "aguardando_medico";
    }

    writeDB(db);

    res.status(201).json(triagem);

  } catch (error) {

    console.error(
      "Erro ao salvar triagem:",
      error
    );

    res.status(500).json({
      erro: "Erro interno ao salvar triagem."
    });
  }
});

// ==========================================
// LISTAR TRIAGENS
// COMPATIBILIDADE COM DADOS ANTIGOS
// ==========================================

app.get("/triagens", (req, res) => {

  const db = readDB();

  const triagens =
    db.triagens.map(t => ({

      ...t,

      // Compatibilidade com registros antigos
      sintoma:
        t.sintoma ||
        t.sintomas ||
        "",

      temperatura:
        t.temperatura !== undefined
          ? t.temperatura
          : (
              t.temp !== undefined
                ? Number(t.temp) || t.temp
                : ""
            ),

      alergia:
        t.alergia || "",

      observacao:
        t.observacao || "",

      status:
        t.status ||
        "aguardando_medico"
    }));

  res.json(triagens);
});

// ==========================================
// TV - CHAMAR PACIENTE
// ==========================================

app.post("/tv/chamar", (req, res) => {

  const db = readDB();

  const paciente =
    valor(req.body, "paciente");

  const localTipo =
    valor(req.body, "localTipo");

  const localNumero =
    valor(req.body, "localNumero");

  if (!paciente) {

    return res.status(400).json({
      erro: "Paciente não informado."
    });
  }

  const chamada = {

    id:
      Date.now().toString(),

    localTipo:
      localTipo || "GUICHÊ",

    localNumero:
      localNumero || "01",

    paciente,

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

  try {

    const db = readDB();

    const paciente =
      valor(req.body, "paciente");

    const diagnostico =
      valor(req.body, "diagnostico");

    const medicacao =
      valor(req.body, "medicacao");

    const obs =
      valor(req.body, "obs");

    if (!paciente) {

      return res.status(400).json({
        erro: "Paciente não informado."
      });
    }

    if (!diagnostico) {

      return res.status(400).json({
        erro: "Diagnóstico é obrigatório."
      });
    }

    if (!medicacao) {

      return res.status(400).json({
        erro: "Medicação é obrigatória."
      });
    }

    const consulta = {

      id: Date.now(),

      paciente,

      diagnostico,

      medicacao,

      obs,

      createdAt:
        new Date().toISOString()
    };

    db.consultas.push(
      consulta
    );

    // ======================================
    // FINALIZAR PACIENTE
    // ======================================

    const pacienteDB =
      [...db.pacientes]
        .reverse()
        .find(
          p =>
            p.nome &&
            p.nome.toLowerCase() ===
              paciente.toLowerCase()
        );

    if (pacienteDB) {

      pacienteDB.status =
        "finalizado";
    }

    const triagem =
      [...db.triagens]
        .reverse()
        .find(
          t =>
            t.nome &&
            t.nome.toLowerCase() ===
              paciente.toLowerCase() &&
            (
              t.status ===
              "em_atendimento" ||
              t.status ===
              "aguardando_medico"
            )
        );

    if (triagem) {

      triagem.status =
        "finalizado";
    }

    writeDB(db);

    res.status(201).json(
      consulta
    );

  } catch (error) {

    console.error(
      "Erro ao salvar consulta:",
      error
    );

    res.status(500).json({
      erro:
        "Erro interno ao salvar consulta."
    });
  }
});

// ==========================================
// MEDICAÇÕES / CONSULTAS
// ==========================================

app.get(
  "/medicacoes",
  (req, res) => {

    const db = readDB();

    res.json(
      db.consultas
    );
  }
);

// ==========================================
// ROTA PRINCIPAL
// ==========================================

app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "../frontend/index.html"
    )
  );
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================

const PORT =
  process.env.PORT || 3000;

app.listen(
  PORT,
  () => {

    console.log("");
    console.log(
      "===================================="
    );
    console.log(
      "       HOSPTECH INICIADO"
    );
    console.log(
      "===================================="
    );
    console.log(
      `Servidor: http://localhost:${PORT}`
    );
    console.log(
      `Banco: ${DB_FILE}`
    );
    console.log(
      "===================================="
    );
    console.log("");
  }
);
