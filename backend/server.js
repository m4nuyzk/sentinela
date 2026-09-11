async function login() {

  const usuario =
    document.getElementById("usuario").value.trim();

  const senha =
    document.getElementById("senha").value.trim();

  const erro =
    document.getElementById("erro");

  const botao =
    document.querySelector(".login-button");


  // Limpa mensagem anterior
  erro.textContent = "";


  // Validação
  if (!usuario || !senha) {
    erro.textContent =
      "Digite o usuário e a senha.";

    return;
  }


  // Evita clicar várias vezes
  botao.disabled = true;
  botao.textContent = "Entrando...";


  try {

    const resposta = await fetch("/login", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        usuario: usuario,
        senha: senha
      })

    });


    const dados = await resposta.json();


    if (!resposta.ok) {

      erro.textContent =
        dados.erro ||
        "Usuário ou senha incorretos.";

      return;
    }


    if (!dados.sucesso) {

      erro.textContent =
        dados.erro ||
        "Não foi possível realizar o login.";

      return;
    }


    // Salva informações do usuário
    localStorage.setItem(
      "usuario",
      dados.usuario
    );

    localStorage.setItem(
      "tipo",
      dados.tipo
    );


    // Redirecionamento
    switch (dados.tipo) {

      case "triagem":
        window.location.href = "triagem.html";
        break;

      case "medico":
        window.location.href = "medico.html";
        break;

      case "atendimento":
        window.location.href = "atendimento.html";
        break;

      default:
        erro.textContent =
          "Tipo de usuário não reconhecido.";

    }


  } catch (error) {

    console.error("Erro no login:", error);

    erro.textContent =
      "Não foi possível conectar ao servidor.";

  } finally {

    botao.disabled = false;
    botao.textContent = "Entrar no sistema";

  }

}
