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

app.use(express.json({
  limit: "10mb"
}));

app.use(express.urlencoded({
  extended: true
}));

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
    const conteudo = fs.readFileSync(
      DB_FILE,
      "utf8"
    );

    if (!conteudo.trim()) {
      const novoBanco = bancoInicial();
      writeDB(novoBanco);
      return novoBanco;
    }

    const db = JSON.parse(conteudo);

    if (!Array.isArray(db.usuarios)) {
      db.usuarios = bancoInicial().usuarios;
    }

    if (!Array.isArray(db.pacientes)) {
      db.pacientes = [];
    }

    if (!Array.isArray(db.triagens)) {
      db.triagens = [];
    }

    if (!Array.isArray(db.consultas)) {
      db.consultas = [];
    }

    if (!("tv_chamada" in db)) {
      db.tv_chamada = null;
    }

    if (!Array.isArray(db.tv_historico)) {
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
    body &&
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

    const usuario = valor(
      req.body,
      "usuario"
    );

    const senha = valor(
      req.body,
      "senha"
    );

    if (!usuario || !senha) {
      return res.status(400).json({
        sucesso: false,
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
        sucesso: false,
        erro: "Usuário ou senha incorretos."
      });
    }

    res.json({
      sucesso: true,
      usuario: user.usuario,
      tipo: user.tipo
    });

  } catch (error) {
    console.error(
      "Erro no login:",
      error
    );

    res.status(500).json({
      sucesso: false,
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

      nome: valor(
        req.body,
        "nome"
      ),

      cpf: valor(
        req.body,
        "cpf"
      ),

      rg: valor(
        req.body,
        "rg"
      ),

      outroDocumento: valor(
        req.body,
        "outroDocumento"
      ),

      dataNascimento: valor(
        req.body,
        "dataNascimento"
      ),

      sexo: valor(
        req.body,
        "sexo"
      ),

      nomeMae: valor(
        req.body,
        "nomeMae"
      ),

      estadoCivil: valor(
        req.body,
        "estadoCivil"
      ),

      endereco: valor(
        req.body,
        "endereco"
      ),

      telefone: valor(
        req.body,
        "telefone"
      ),

      email: valor(
        req.body,
        "email"
      ),

      contatoEmergencia: valor(
        req.body,
        "contatoEmergencia"
      ),

      tipo: valor(
        req.body,
        "tipo"
      ),

      foto: req.body.foto || null,

      status: "triagem",

      createdAt:
        new Date().toISOString()
    };

    if (!paciente.nome) {
      return res.status(400).json({
        sucesso: false,
        erro: "Nome completo é obrigatório."
      });
    }

    if (!paciente.cpf) {
      return res.status(400).json({
        sucesso: false,
        erro: "CPF é obrigatório."
      });
    }

    if (!paciente.rg) {
      return res.status(400).json({
        sucesso: false,
        erro: "RG é obrigatório."
      });
    }

    if (!paciente.dataNascimento) {
      return res.status(400).json({
        sucesso: false,
        erro: "Data de nascimento é obrigatória."
      });
    }

    if (!paciente.sexo) {
      return res.status(400).json({
        sucesso: false,
        erro: "Sexo é obrigatório."
      });
    }

    if (!paciente.nomeMae) {
      return res.status(400).json({
        sucesso: false,
        erro: "Nome da mãe é obrigatório."
      });
    }

    if (!paciente.estadoCivil) {
      return res.status(400).json({
        sucesso: false,
        erro: "Estado civil é obrigatório."
      });
    }

    if (!paciente.endereco) {
      return res.status(400).json({
        sucesso: false,
        erro: "Endereço é obrigatório."
      });
    }

    if (!paciente.telefone) {
      return res.status(400).json({
        sucesso: false,
        erro: "Telefone é obrigatório."
      });
    }

    if (!paciente.email) {
      return res.status(400).json({
        sucesso: false,
        erro: "E-mail é obrigatório."
      });
    }

    if (!paciente.contatoEmergencia) {
      return res.status(400).json({
        sucesso: false,
        erro: "Contato de emergência é obrigatório."
      });
    }

    if (!paciente.tipo) {
      return res.status(400).json({
        sucesso: false,
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
      sucesso: false,
      erro: "Erro interno ao cadastrar paciente."
    });
  }
});

// ==========================================
// LISTAR PACIENTES
// ==========================================

app.get("/pacientes", (req, res) => {
  try {
    const db = readDB();

    res.json({
      sucesso: true,
      pacientes: [...db.pacientes].reverse()
    });

  } catch (error) {
    console.error(
      "Erro ao listar pacientes:",
      error
    );

    res.status(500).json({
      sucesso: false,
      erro: "Erro ao buscar pacientes."
    });
  }
});

// ==========================================
// ATUALIZAR STATUS DO PACIENTE
// ==========================================

app.patch(
  "/pacientes/:id/status",
  (req, res) => {

    try {
      const db = readDB();

      const id = Number(
        req.params.id
      );

      const novoStatus = valor(
        req.body,
        "status"
      );

      const statusPermitidos = [
        "triagem",
        "aguardando_medico",
        "em_atendimento",
        "atendido"
      ];

      if (
        !statusPermitidos.includes(
          novoStatus
        )
      ) {
        return res.status(400).json({
          sucesso: false,
          erro: "Status inválido."
        });
      }

      const paciente =
        db.pacientes.find(
          p => Number(p.id) === id
        );

      if (!paciente) {
        return res.status(404).json({
          sucesso: false,
          erro: "Paciente não encontrado."
        });
      }

      paciente.status =
        novoStatus;

      writeDB(db);

      res.json({
        sucesso: true,
        paciente
      });

    } catch (error) {
      console.error(
        "Erro ao atualizar status:",
        error
      );

      res.status(500).json({
        sucesso: false,
        erro: "Erro ao atualizar status."
      });
    }
  }
);

// ==========================================
// TRIAGEM
// ==========================================

app.post("/triagem", (req, res) => {
  try {
    const db = readDB();

    const nome = valor(
      req.body,
      "nome"
    );

    const sintoma = valor(
      req.body,
      "sintoma"
    );

    const alergia = valor(
      req.body,
      "alergia"
    );

    const observacao = valor(
      req.body,
      "observacao"
    );

    const temperatura =
      Number(req.body.temperatura);

    if (!nome) {
      return res.status(400).json({
        sucesso: false,
        erro: "Informe o nome do paciente."
      });
    }

    if (!sintoma) {
      return res.status(400).json({
        sucesso: false,
        erro: "Selecione um sintoma."
      });
    }

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

    let risco = "verde";

    if (
      !Number.isNaN(temperatura) &&
      temperatura >= 39
    ) {
      risco = "vermelho";

    } else if (
      sintomasVermelhos.includes(
        sintoma
      )
    ) {
      risco = "vermelho";

    } else if (
      (
        !Number.isNaN(temperatura) &&
        temperatura >= 38
      ) ||
      sintomasAmarelos.includes(
        sintoma
      )
    ) {
      risco = "amarelo";
    }

    const triagem = {
      id: Date.now(),

      nome,

      sintoma,

      temperatura:
        Number.isNaN(temperatura)
          ? ""
          : temperatura,

      alergia:
        alergia || "Nenhuma",

      observacao:
        observacao || "Nenhuma",

      risco,

      status:
        "aguardando_medico",

      createdAt:
        new Date().toISOString()
    };

    db.triagens.push(
      triagem
    );

    const paciente =
      [...db.pacientes]
        .reverse()
        .find(
          p =>
            String(p.nome)
              .toLowerCase() ===
            nome.toLowerCase() &&
            (
              p.status === "triagem" ||
              p.status === "aguardando_medico"
            )
        );

    if (paciente) {
      paciente.status =
        "aguardando_medico";
    }

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
    console.error(
      "Erro na triagem:",
      error
    );

    res.status(500).json({
      sucesso: false,
      erro: "Erro interno ao cadastrar triagem."
    });
  }
});

// ==========================================
// LISTAR TRIAGENS
// ==========================================

app.get("/triagens", (req, res) => {
  try {
    const db = readDB();

    const triagens =
      [...db.triagens]
        .reverse()
        .map(t => ({
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

  } catch (error) {
    console.error(
      "Erro ao listar triagens:",
      error
    );

    res.status(500).json({
      sucesso: false,
      erro: "Erro ao buscar triagens."
    });
  }
});

// ==========================================
// MEDICAÇÕES DISPONÍVEIS
// ==========================================

app.get(
  "/lista-medicacoes",
  (req, res) => {

    res.json({
      sucesso: true,

      medicacoes: [
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
      ]
    });
  }
);

// ==========================================
// CONSULTA MÉDICA
// ==========================================

app.post("/consulta", (req, res) => {
  try {
    const db = readDB();

    const pacienteNome =
      valor(
        req.body,
        "paciente"
      );

    const diagnostico =
      valor(
        req.body,
        "diagnostico"
      );

    const medicacao =
      valor(
        req.body,
        "medicacao"
      );

    const obs =
      valor(
        req.body,
        "obs"
      );

    if (!pacienteNome) {
      return res.status(400).json({
        sucesso: false,
        erro: "Selecione um paciente."
      });
    }

    if (!diagnostico) {
      return res.status(400).json({
        sucesso: false,
        erro: "Informe o diagnóstico."
      });
    }

    if (!medicacao) {
      return res.status(400).json({
        sucesso: false,
        erro: "Selecione uma medicação."
      });
    }

    const consulta = {
      id: Date.now(),

      paciente:
        pacienteNome,

      diagnostico,

      medicacao,

      obs:
        obs || "Nenhuma",

      createdAt:
        new Date().toISOString()
    };

    db.consultas.push(
      consulta
    );

    const triagem =
      [...db.triagens]
        .reverse()
        .find(
          t =>
            String(t.nome)
              .toLowerCase() ===
            pacienteNome.toLowerCase() &&
            t.status !== "atendido"
        );

    if (triagem) {
      triagem.status =
        "atendido";
    }

    const paciente =
      [...db.pacientes]
        .reverse()
        .find(
          p =>
            String(p.nome)
              .toLowerCase() ===
            pacienteNome.toLowerCase()
        );

    if (paciente) {
      paciente.status =
        "atendido";
    }

    writeDB(db);

    console.log(
      "Consulta salva:",
      consulta
    );

    res.status(201).json({
      sucesso: true,
      mensagem: "Consulta salva com sucesso.",
      consulta
    });

  } catch (error) {
    console.error(
      "Erro ao salvar consulta:",
      error
    );

    res.status(500).json({
      sucesso: false,
      erro: "Erro ao salvar consulta."
    });
  }
});

// ==========================================
// LISTAR CONSULTAS
// ==========================================

app.get("/medicacoes", (req, res) => {
  try {
    const db = readDB();

    res.json({
      sucesso: true,
      consultas:
        [...db.consultas].reverse()
    });

  } catch (error) {
    console.error(
      "Erro ao listar consultas:",
      error
    );

    res.status(500).json({
      sucesso: false,
      erro: "Erro ao buscar consultas."
    });
  }
});

// ==========================================
// TV - CHAMAR PACIENTE
// ==========================================

app.post("/tv/chamar", (req, res) => {
  try {
    const db = readDB();

    const localTipo =
      valor(
        req.body,
        "localTipo"
      ) || "GUICHÊ";

    const localNumero =
      valor(
        req.body,
        "localNumero"
      ) || "01";

    const paciente =
      valor(
        req.body,
        "paciente"
      );

    if (!paciente) {
      return res.status(400).json({
        sucesso: false,
        erro: "Informe o paciente."
      });
    }

    const chamada = {
      id:
        Date.now().toString(),

      localTipo,

      localNumero,

      paciente,

      hora:
        new Date().toLocaleTimeString(
          "pt-BR",
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        ),

      createdAt:
        new Date().toISOString()
    };

    db.tv_chamada =
      chamada;

    db.tv_historico.unshift(
      chamada
    );

    db.tv_historico =
      db.tv_historico.slice(
        0,
        10
      );

    writeDB(db);

    console.log(
      "Paciente chamado na TV:",
      chamada
    );

    res.json({
      sucesso: true,
      chamada
    });

  } catch (error) {
    console.error(
      "Erro ao chamar paciente:",
      error
    );

    res.status(500).json({
      sucesso: false,
      erro: "Erro ao chamar paciente."
    });
  }
});

// ==========================================
// TV - CONSULTAR CHAMADA
// ==========================================

app.get("/tv/chamada", (req, res) => {
  try {
    const db = readDB();

    res.json({
      sucesso: true,

      chamada:
        db.tv_chamada,

      historico:
        db.tv_historico
    });

  } catch (error) {
    console.error(
      "Erro ao consultar TV:",
      error
    );

    res.status(500).json({
      sucesso: false,
      erro: "Erro ao consultar chamada."
    });
  }
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
// INICIAR SERVIDOR
// ==========================================

if (require.main === module) {
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
}

module.exports = app;
