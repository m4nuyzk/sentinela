const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

const DB_PATH = path.join(__dirname, "db.json");
const FRONTEND_PATH = path.join(__dirname, "../frontend");

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(FRONTEND_PATH));


// ==========================================
// BANCO DE DADOS
// ==========================================

function bancoPadrao() {
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


function lerBanco() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const novoBanco = bancoPadrao();

      fs.writeFileSync(
        DB_PATH,
        JSON.stringify(novoBanco, null, 2)
      );

      return novoBanco;
    }

    const conteudo = fs.readFileSync(
      DB_PATH,
      "utf8"
    );

    const banco = JSON.parse(conteudo);

    banco.usuarios ??= [];
    banco.pacientes ??= [];
    banco.triagens ??= [];
    banco.consultas ??= [];
    banco.tv_historico ??= [];
    banco.tv_chamada ??= null;

    return banco;

  } catch (erro) {

    console.error(
      "Erro ao ler banco:",
      erro
    );

    return bancoPadrao();
  }
}


function salvarBanco(banco) {

  fs.writeFileSync(
    DB_PATH,
    JSON.stringify(
      banco,
      null,
      2
    )
  );
}


// ==========================================
// MEDICAÇÕES
// ==========================================

const MEDICACOES = [
  "Amoxicilina",
  "Dipirona",
  "Paracetamol",
  "Ibuprofeno",
  "Omeprazol",
  "Soro fisiológico",
  "Azitromicina",
  "Loratadina",
  "Buscopan",
  "Nenhuma"
];


// ==========================================
// TESTE DA API
// ==========================================

app.get("/api", (req, res) => {

  res.json({
    sucesso: true,
    sistema: "HospTech",
    mensagem: "API funcionando corretamente.",
    data: new Date().toISOString()
  });

});


// ==========================================
// LOGIN
// ==========================================

app.post("/login", (req, res) => {

  const {
    usuario,
    senha
  } = req.body;

  if (!usuario || !senha) {

    return res.status(400).json({
      sucesso: false,
      erro: "Informe o usuário e a senha."
    });

  }

  const banco = lerBanco();

  const encontrado =
    banco.usuarios.find(
      u =>
        String(u.usuario).toLowerCase() ===
          String(usuario).toLowerCase() &&
        String(u.senha) === String(senha)
    );

  if (!encontrado) {

    return res.status(401).json({
      sucesso: false,
      erro: "Usuário ou senha incorretos."
    });

  }

  res.json({
    sucesso: true,
    usuario: encontrado.usuario,
    tipo: encontrado.tipo
  });

});


// ==========================================
// USUÁRIOS
// ==========================================

app.get("/usuarios", (req, res) => {

  const banco = lerBanco();

  res.json(
    banco.usuarios.map(usuario => ({
      usuario: usuario.usuario,
      tipo: usuario.tipo
    }))
  );

});


// ==========================================
// CADASTRO DE PACIENTE
// ==========================================

app.post("/atendimento", (req, res) => {

  const banco = lerBanco();

  const dados = req.body;

  if (!dados.nome) {

    return res.status(400).json({
      erro: "O nome do paciente é obrigatório."
    });

  }

  if (!dados.cpf) {

    return res.status(400).json({
      erro: "O CPF é obrigatório."
    });

  }

  const paciente = {

    id: Date.now(),

    nome: dados.nome,

    cpf: dados.cpf || "",

    rg: dados.rg || "",

    outroDocumento:
      dados.outroDocumento || "",

    dataNascimento:
      dados.dataNascimento || "",

    sexo:
      dados.sexo || "",

    nomeMae:
      dados.nomeMae || "",

    estadoCivil:
      dados.estadoCivil || "",

    endereco:
      dados.endereco || "",

    telefone:
      dados.telefone || "",

    email:
      dados.email || "",

    contatoEmergencia:
      dados.contatoEmergencia || "",

    tipo:
      dados.tipo || "Particular",

    foto:
      dados.foto || null,

    status: "triagem",

    createdAt:
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString()
  };

  banco.pacientes.push(paciente);

  salvarBanco(banco);

  res.status(201).json({
    sucesso: true,
    mensagem:
      "Paciente cadastrado com sucesso.",
    paciente
  });

});


// ==========================================
// LISTAR PACIENTES
// ==========================================

app.get("/pacientes", (req, res) => {

  const banco = lerBanco();

  res.json(banco.pacientes);

});


// ==========================================
// BUSCAR PACIENTE
// ==========================================

app.get("/pacientes/:id", (req, res) => {

  const banco = lerBanco();

  const paciente =
    banco.pacientes.find(
      p =>
        String(p.id) ===
        String(req.params.id)
    );

  if (!paciente) {

    return res.status(404).json({
      erro: "Paciente não encontrado."
    });

  }

  res.json(paciente);

});


// ==========================================
// ATUALIZAR STATUS DO PACIENTE
// ==========================================

app.patch(
  "/pacientes/:id/status",
  (req, res) => {

    const banco = lerBanco();

    const paciente =
      banco.pacientes.find(
        p =>
          String(p.id) ===
          String(req.params.id)
      );

    if (!paciente) {

      return res.status(404).json({
        erro: "Paciente não encontrado."
      });

    }

    const status =
      req.body.status;

    const statusPermitidos = [
      "triagem",
      "aguardando_medico",
      "em_atendimento",
      "alta"
    ];

    if (
      !statusPermitidos.includes(status)
    ) {

      return res.status(400).json({
        erro: "Status inválido."
      });

    }

    paciente.status = status;

    paciente.updatedAt =
      new Date().toISOString();

    if (status === "alta") {

      paciente.dataAlta =
        new Date().toISOString();

    }

    salvarBanco(banco);

    res.json({
      sucesso: true,
      paciente
    });

  }
);


// ==========================================
// TRIAGEM
// ==========================================

app.post("/triagem", (req, res) => {

  const banco = lerBanco();

  const dados = req.body;

  if (!dados.nome) {

    return res.status(400).json({
      erro: "Informe o paciente."
    });

  }

  if (!dados.sintoma) {

    return res.status(400).json({
      erro: "Informe o sintoma."
    });

  }

  let paciente = null;

  if (dados.pacienteId) {

    paciente =
      banco.pacientes.find(
        p =>
          String(p.id) ===
          String(dados.pacienteId)
      );

  }

  // Compatibilidade com o sistema antigo
  if (!paciente) {

    paciente =
      [...banco.pacientes]
        .reverse()
        .find(
          p =>
            p.nome &&
            p.nome.toLowerCase() ===
              String(dados.nome)
                .toLowerCase()
        );

  }

  const triagem = {

    id: Date.now(),

    pacienteId:
      paciente ? paciente.id : null,

    nome:
      dados.nome,

    sintoma:
      dados.sintoma,

    sintomas:
      dados.sintomas ||
      dados.sintoma ||
      "",

    temperatura:
      dados.temperatura ??
      dados.temp ??
      "",

    temp:
      dados.temperatura ??
      dados.temp ??
      "",

    alergia:
      dados.alergia || "",

    observacao:
      dados.observacao || "",

    risco:
      dados.risco || "verde",

    status:
      "aguardando_medico",

    createdAt:
      new Date().toISOString()
  };

  banco.triagens.push(triagem);

  if (paciente) {

    paciente.status =
      "aguardando_medico";

    paciente.updatedAt =
      new Date().toISOString();

  }

  salvarBanco(banco);

  res.status(201).json({
    sucesso: true,
    mensagem:
      "Triagem registrada com sucesso.",
    triagem
  });

});


// ==========================================
// LISTAR TRIAGENS
// ==========================================

app.get("/triagens", (req, res) => {

  const banco = lerBanco();

  res.json(banco.triagens);

});


// ==========================================
// MEDICAÇÕES DISPONÍVEIS
// ==========================================

app.get(
  "/lista-medicacoes",
  (req, res) => {

    res.json(MEDICACOES);

  }
);


// ==========================================
// SALVAR CONSULTA
// ==========================================

app.post("/consulta", (req, res) => {

  const banco = lerBanco();

  const {
    paciente,
    pacienteId,
    diagnostico,
    medicacao,
    obs
  } = req.body;

  if (!paciente) {

    return res.status(400).json({
      erro: "Paciente não informado."
    });

  }

  if (!diagnostico) {

    return res.status(400).json({
      erro: "Informe o diagnóstico."
    });

  }

  if (!medicacao) {

    return res.status(400).json({
      erro: "Informe a medicação."
    });

  }

  let pacienteEncontrado = null;

  if (pacienteId) {

    pacienteEncontrado =
      banco.pacientes.find(
        p =>
          String(p.id) ===
          String(pacienteId)
      );

  }

  if (!pacienteEncontrado) {

    pacienteEncontrado =
      [...banco.pacientes]
        .reverse()
        .find(
          p =>
            p.nome &&
            p.nome.toLowerCase() ===
              String(paciente)
                .toLowerCase()
        );

  }

  const consulta = {

    id: Date.now(),

    pacienteId:
      pacienteEncontrado
        ? pacienteEncontrado.id
        : null,

    paciente,

    diagnostico,

    medicacao,

    obs:
      obs || "",

    medico:
      "medico",

    createdAt:
      new Date().toISOString(),

    alta: false
  };

  banco.consultas.push(consulta);

  salvarBanco(banco);

  res.status(201).json({
    sucesso: true,
    mensagem:
      "Consulta registrada com sucesso.",
    consulta
  });

});


// ==========================================
// LISTAR CONSULTAS
// ==========================================

app.get("/consultas", (req, res) => {

  const banco = lerBanco();

  res.json(banco.consultas);

});


// ==========================================
// ROTA ANTIGA / MEDICAÇÕES
// ==========================================

app.get("/medicacoes", (req, res) => {

  const banco = lerBanco();

  res.json(banco.consultas);

});


// ==========================================
// DAR ALTA
// ==========================================

app.post("/alta/:id", (req, res) => {

  const banco = lerBanco();

  const paciente =
    banco.pacientes.find(
      p =>
        String(p.id) ===
        String(req.params.id)
    );

  if (!paciente) {

    return res.status(404).json({
      erro: "Paciente não encontrado."
    });

  }

  const consulta =
    [...banco.consultas]
      .reverse()
      .find(
        c =>
          (
            c.pacienteId &&
            String(c.pacienteId) ===
              String(paciente.id)
          ) ||
          (
            c.paciente &&
            paciente.nome &&
            c.paciente.toLowerCase() ===
              paciente.nome.toLowerCase()
          )
      );

  paciente.status = "alta";

  paciente.dataAlta =
    new Date().toISOString();

  paciente.updatedAt =
    new Date().toISOString();

  if (consulta) {

    consulta.alta = true;

    consulta.dataAlta =
      paciente.dataAlta;

  }

  salvarBanco(banco);

  res.json({
    sucesso: true,
    mensagem:
      "Paciente recebeu alta.",
    paciente,
    consulta: consulta || null
  });

});


// ==========================================
// CHAMAR NA TV
// ==========================================

app.post(
  "/tv/chamar",
  (req, res) => {

    const banco = lerBanco();

    const {
      localTipo,
      localNumero,
      paciente
    } = req.body;

    if (!paciente) {

      return res.status(400).json({
        erro: "Informe o paciente."
      });

    }

    const chamada = {

      id:
        String(Date.now()),

      localTipo:
        localTipo || "GUICHÊ",

      localNumero:
        localNumero || "01",

      paciente,

      hora:
        new Date()
          .toLocaleTimeString(
            "pt-BR",
            {
              hour: "2-digit",
              minute: "2-digit"
            }
          )
    };

    banco.tv_chamada =
      chamada;

    banco.tv_historico.unshift(
      chamada
    );

    banco.tv_historico =
      banco.tv_historico.slice(
        0,
        20
      );

    salvarBanco(banco);

    res.json({
      sucesso: true,
      chamada
    });

  }
);


// ==========================================
// CONSULTAR TV
// ==========================================

app.get(
  "/tv/chamada",
  (req, res) => {

    const banco = lerBanco();

    res.json({
      chamada:
        banco.tv_chamada,
      historico:
        banco.tv_historico || []
    });

  }
);


// ==========================================
// PÁGINA INICIAL
// ==========================================

app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      FRONTEND_PATH,
      "index.html"
    )
  );

});


// ==========================================
// TRATAMENTO DE ERROS
// ==========================================

app.use(
  (erro, req, res, next) => {

    console.error(
      "Erro interno:",
      erro
    );

    res.status(500).json({
      erro:
        "Erro interno no servidor."
    });

  }
);


module.exports = app;
