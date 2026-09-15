// ==========================================
// CONFIGURAÇÃO
// ==========================================

const API = "";


// ==========================================
// LOGIN
// ==========================================

async function login() {

  const usuarioInput =
    document.getElementById("usuario");

  const senhaInput =
    document.getElementById("senha");

  const erro =
    document.getElementById("erro");

  const usuario =
    usuarioInput.value.trim();

  const senha =
    senhaInput.value.trim();


  // Limpa erro anterior
  erro.innerHTML = "";


  // Validação
  if (!usuario || !senha) {

    erro.innerHTML = `
      <div style="
        color:#dc2626;
        background:#fef2f2;
        border:1px solid #fecaca;
        padding:10px;
        border-radius:10px;
        margin-top:15px;
        font-size:13px;
      ">
        Informe o usuário e a senha.
      </div>
    `;

    return;
  }


  // Desabilita botão durante o login
  const botao =
    document.querySelector(".login-button");

  const textoOriginal =
    botao.innerText;

  botao.disabled = true;
  botao.innerText = "Entrando...";


  try {

    const resposta =
      await fetch(`${API}/login`, {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          usuario: usuario,
          senha: senha
        })

      });


    const dados =
      await resposta.json();


    if (!resposta.ok || !dados.sucesso) {

      throw new Error(
        dados.erro ||
        "Usuário ou senha incorretos."
      );

    }


    // Salva informações do usuário
    localStorage.setItem(
      "hosptech_usuario",
      JSON.stringify({
        usuario: dados.usuario,
        tipo: dados.tipo
      })
    );


    // Direciona conforme o tipo
    if (dados.tipo === "triagem") {

      window.location.href =
        "triagem.html";

    } else if (dados.tipo === "medico") {

      window.location.href =
        "medico.html";

    } else if (dados.tipo === "atendimento") {

      window.location.href =
        "atendimento.html";

    } else {

      window.location.href =
        "dashboard.html";

    }

  } catch (error) {

    console.error(
      "Erro no login:",
      error
    );

    erro.innerHTML = `
      <div style="
        color:#dc2626;
        background:#fef2f2;
        border:1px solid #fecaca;
        padding:10px;
        border-radius:10px;
        margin-top:15px;
        font-size:13px;
      ">
        ${escapeHTML(error.message)}
      </div>
    `;

  } finally {

    botao.disabled = false;
    botao.innerText = textoOriginal;

  }

}


// ==========================================
// ENTER PARA FAZER LOGIN
// ==========================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const senha =
      document.getElementById("senha");

    if (senha) {

      senha.addEventListener(
        "keydown",
        event => {

          if (event.key === "Enter") {
            login();
          }

        }
      );

    }

  }
);


// ==========================================
// VERIFICAR USUÁRIO LOGADO
// ==========================================

function usuarioLogado() {

  const dados =
    localStorage.getItem(
      "hosptech_usuario"
    );

  if (!dados) {
    return null;
  }

  try {

    return JSON.parse(dados);

  } catch {

    localStorage.removeItem(
      "hosptech_usuario"
    );

    return null;

  }

}


// ==========================================
// LOGOUT
// ==========================================

function logout() {

  localStorage.removeItem(
    "hosptech_usuario"
  );

  window.location.href =
    "index.html";

}


// ==========================================
// PROTEGER PÁGINA
// ==========================================

function protegerPagina(tipoPermitido) {

  const usuario =
    usuarioLogado();

  if (!usuario) {

    window.location.href =
      "index.html";

    return false;
  }


  if (
    tipoPermitido &&
    usuario.tipo !== tipoPermitido
  ) {

    alert(
      "Você não possui permissão para acessar esta página."
    );

    window.location.href =
      "index.html";

    return false;
  }


  return true;

}


// ==========================================
// API - CADASTRAR PACIENTE
// ==========================================

async function cadastrarPaciente(dados) {

  const resposta =
    await fetch(`${API}/atendimento`, {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(dados)

    });


  const resultado =
    await resposta.json();


  if (!resposta.ok) {

    throw new Error(
      resultado.erro ||
      "Erro ao cadastrar paciente."
    );

  }


  return resultado;

}


// ==========================================
// API - LISTAR PACIENTES
// ==========================================

async function listarPacientes() {

  const resposta =
    await fetch(`${API}/pacientes`);


  const resultado =
    await resposta.json();


  if (!resposta.ok) {

    throw new Error(
      resultado.erro ||
      "Erro ao buscar pacientes."
    );

  }


  return resultado.pacientes || [];

}


// ==========================================
// API - ATUALIZAR STATUS
// ==========================================

async function atualizarStatusPaciente(
  id,
  status
) {

  const resposta =
    await fetch(
      `${API}/pacientes/${id}/status`,
      {

        method: "PATCH",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          status: status
        })

      }
    );


  const resultado =
    await resposta.json();


  if (!resposta.ok) {

    throw new Error(
      resultado.erro ||
      "Erro ao atualizar status."
    );

  }


  return resultado;

}


// ==========================================
// API - CADASTRAR TRIAGEM
// ==========================================

async function cadastrarTriagem(dados) {

  const resposta =
    await fetch(`${API}/triagem`, {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(dados)

    });


  const resultado =
    await resposta.json();


  if (!resposta.ok) {

    throw new Error(
      resultado.erro ||
      "Erro ao cadastrar triagem."
    );

  }


  return resultado;

}


// ==========================================
// API - LISTAR TRIAGENS
// ==========================================

async function listarTriagens() {

  const resposta =
    await fetch(`${API}/triagens`);


  const resultado =
    await resposta.json();


  if (!resposta.ok) {

    throw new Error(
      resultado.erro ||
      "Erro ao buscar triagens."
    );

  }


  return resultado.triagens || [];

}


// ==========================================
// API - LISTAR MEDICAÇÕES
// ==========================================

async function listarMedicacoes() {

  const resposta =
    await fetch(
      `${API}/lista-medicacoes`
    );


  const resultado =
    await resposta.json();


  if (!resposta.ok) {

    throw new Error(
      resultado.erro ||
      "Erro ao buscar medicações."
    );

  }


  return resultado.medicacoes || [];

}


// ==========================================
// API - SALVAR CONSULTA
// ==========================================

async function salvarConsulta(dados) {

  const resposta =
    await fetch(`${API}/consulta`, {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(dados)

    });


  const resultado =
    await resposta.json();


  if (!resposta.ok) {

    throw new Error(
      resultado.erro ||
      "Erro ao salvar consulta."
    );

  }


  return resultado;

}


// ==========================================
// API - LISTAR CONSULTAS
// ==========================================

async function listarConsultas() {

  const resposta =
    await fetch(`${API}/medicacoes`);


  const resultado =
    await resposta.json();


  if (!resposta.ok) {

    throw new Error(
      resultado.erro ||
      "Erro ao buscar consultas."
    );

  }


  return resultado.consultas || [];

}


// ==========================================
// API - CHAMAR PACIENTE NA TV
// ==========================================

async function chamarPacienteTV(dados) {

  const resposta =
    await fetch(`${API}/tv/chamar`, {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(dados)

    });


  const resultado =
    await resposta.json();


  if (!resposta.ok) {

    throw new Error(
      resultado.erro ||
      "Erro ao chamar paciente."
    );

  }


  return resultado;

}


// ==========================================
// API - CONSULTAR TV
// ==========================================

async function consultarTV() {

  const resposta =
    await fetch(`${API}/tv/chamada`);


  const resultado =
    await resposta.json();


  if (!resposta.ok) {

    throw new Error(
      resultado.erro ||
      "Erro ao consultar TV."
    );

  }


  return resultado;

}


// ==========================================
// FUNÇÃO AUXILIAR
// ==========================================

function escapeHTML(texto) {

  const div =
    document.createElement("div");

  div.textContent =
    String(texto);

  return div.innerHTML;

}


// ==========================================
// TESTE DA API
// ==========================================

async function testarServidor() {

  try {

    const resposta =
      await fetch(`${API}/api`);

    const dados =
      await resposta.json();

    console.log(
      "HospTech:",
      dados
    );

    return dados;

  } catch (erro) {

    console.error(
      "Servidor não respondeu:",
      erro
    );

    return null;

  }

}
