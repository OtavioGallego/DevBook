# Webapp DevBook

Módulo Go responsável pela interface web do DevBook. É uma aplicação renderizada no servidor (templates `html/template` + jQuery e Bootstrap no cliente) que **não acessa o banco diretamente**: cada ação do usuário é traduzida em uma chamada HTTP para a API (`../api`).

## Stack

- Go 1.14
- [`gorilla/mux`](https://github.com/gorilla/mux) — roteamento HTTP
- [`gorilla/securecookie`](https://github.com/gorilla/securecookie) — cookies criptografados e autenticados
- [`joho/godotenv`](https://github.com/joho/godotenv) — leitura do `.env`
- `html/template` — renderização das views
- jQuery, Bootstrap, SweetAlert2 e Font Awesome (via CDN) no lado cliente

## Como executar

A API precisa estar rodando antes da webapp.

```bash
cp example.env .env   # preencha as variáveis abaixo
go run main.go
```

Variáveis esperadas no `.env`:

| Variável    | Descrição                                                                      |
|-------------|--------------------------------------------------------------------------------|
| `API_URL`   | URL base da API (ex.: `http://localhost:9000`)                                 |
| `APP_PORT`  | Porta HTTP onde a webapp vai escutar                                           |
| `HASH_KEY`  | Chave usada por `securecookie` para autenticar o cookie (HMAC)                 |
| `BLOCK_KEY` | Chave AES usada por `securecookie` para criptografar o cookie (16, 24 ou 32 B) |

## Estrutura interna

```
webapp/
├── main.go                # bootstrap: config, cookies, templates e router
├── example.env            # template do .env
├── assets/                # estáticos servidos em /assets/
│   ├── css/
│   └── js/                # scripts jQuery por página (login, cadastro, home, perfil, ...)
├── views/
│   ├── *.html             # páginas (login, cadastro, home, perfil, usuarios, ...)
│   └── templates/         # parciais reutilizáveis (cabeçalho, scripts, publicacoes)
└── src/
    ├── config/            # leitura do .env (APIURL, Porta, HashKey, BlockKey)
    ├── cookies/           # wrapper sobre securecookie (Configurar, Salvar, Ler, Deletar)
    ├── utils/             # CarregarTemplates() + ExecutarTemplate()
    ├── modelos/           # structs usados na renderização (Usuario, Publicacao, DadosAutenticacao)
    ├── requisicoes/       # FazerRequisicaoComAutenticacao() — http.Client com Bearer
    ├── respostas/         # helpers JSON e tradução de status code da API
    ├── middlewares/       # Logger + Autenticar (verifica cookie antes de servir páginas)
    └── router/
        ├── router.go
        └── rotas/         # tabela de rotas para login, logout, home, usuarios, publicacoes
```

## Fluxo de uma requisição

1. `main.go` chama `config.Carregar()`, `cookies.Configurar()` (instancia o `securecookie` com `HashKey`/`BlockKey`), `utils.CarregarTemplates()` (faz `ParseGlob` de `views/*.html` e `views/templates/*.html`) e finalmente `router.Gerar()`.
2. Cada rota declarada em `src/router/rotas/` indica se a página exige usuário logado (`RequerAutenticacao`). O middleware `Autenticar` lê o cookie `dados`, valida com `securecookie.Decode` e redireciona para `/login` quando não há sessão válida.
3. Controllers se dividem em dois grupos:
   - **`paginas.go`** — apenas renderiza HTML. Pode buscar dados na API antes (ex.: feed da home) e passa o resultado para o template.
   - **`login.go`, `logout.go`, `usuarios.go`, `publicacoes.go`** — recebem submissões/AJAX, montam o JSON correspondente, chamam a API via `requisicoes.FazerRequisicaoComAutenticacao` e devolvem JSON para o front (que dispara `Swal.fire` em caso de erro).
4. Respostas de erro vindas da API são propagadas com `respostas.TratarStatusCodeDeErro`, mantendo o status original.

## Autenticação no front

O login segue este caminho:

1. `login.js` faz `POST /login` para a webapp com `email` e `senha` (form-encoded).
2. `controllers.FazerLogin` reembala em JSON e chama `POST {API_URL}/login`.
3. A API devolve `{id, token}`. A webapp grava esses dois valores num cookie criptografado (`securecookie`) chamado `dados`.
4. Em qualquer requisição posterior à API, `requisicoes.FazerRequisicaoComAutenticacao` lê o cookie, recupera o token e injeta o header `Authorization: Bearer <token>`.
5. `logout.go` apaga o cookie e redireciona para `/login`.

## Detalhes de implementação que valem a pena conhecer

- **Templates parseados uma vez no boot.** `utils.CarregarTemplates` mantém as templates em uma variável de pacote. `ExecutarTemplate` apenas faz `templates.ExecuteTemplate(w, nome, dados)`. Em desenvolvimento, isso significa que mudanças em `views/` exigem reiniciar o processo.
- **Parciais via `{{ define }}`.** As parciais em `views/templates/` (`cabecalho.html`, `scripts.html`, `publicacoes.html`) são incluídas nas páginas com `{{ template "nome" . }}`. O escopo `.` é importante para que listas de publicações tenham acesso a `UsuarioLogadoID`.
- **Cookies como única fonte de sessão.** A webapp não mantém estado em memória nem em banco — toda a sessão é o cookie criptografado. Trocar `HASH_KEY`/`BLOCK_KEY` invalida todas as sessões existentes.
- **Comunicação client → API → API real.** Algumas rotas existem em duas camadas (ex.: a webapp expõe `POST /publicacoes/:id/curtir` para o front, que internamente chama o mesmo endpoint na API REST). Isso evita que o token JWT precise existir no JavaScript do navegador.
- **Erros propagados com fidelidade.** `respostas.TratarStatusCodeDeErro` lê o JSON de erro da API e devolve com o mesmo status code, então a UX (mensagens do `Swal`) reflete o que a API decidiu, não uma camada genérica da webapp.
