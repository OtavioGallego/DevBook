# API DevBook

Módulo Go que expõe a API REST do DevBook. É a única camada do projeto que conversa com o MySQL e a única que emite tokens JWT. A aplicação web (`../webapp`) consome esta API via HTTP.

## Stack

- Go 1.14
- [`gorilla/mux`](https://github.com/gorilla/mux) — roteamento HTTP
- [`go-sql-driver/mysql`](https://github.com/go-sql-driver/mysql) — driver do MySQL
- [`dgrijalva/jwt-go`](https://github.com/dgrijalva/jwt-go) — geração e validação de JWT
- [`golang.org/x/crypto/bcrypt`](https://pkg.go.dev/golang.org/x/crypto/bcrypt) — hash de senhas
- [`badoux/checkmail`](https://github.com/badoux/checkmail) — validação de e-mail
- [`joho/godotenv`](https://github.com/joho/godotenv) — leitura do `.env`

## Como executar

```bash
cp example.env .env   # preencha as variáveis abaixo
go run main.go
```

Variáveis esperadas no `.env`:

| Variável     | Descrição                                                     |
|--------------|---------------------------------------------------------------|
| `DB_USUARIO` | Usuário do MySQL                                              |
| `DB_SENHA`   | Senha do MySQL                                                |
| `DB_NOME`    | Nome do banco (use `devbook`, criado por `sql/sql.sql`)       |
| `API_PORT`   | Porta HTTP onde a API vai escutar (padrão `9000` se inválido) |
| `SECRET_KEY` | Chave usada para assinar os tokens JWT                        |

Antes da primeira execução, rode os scripts em `sql/` no MySQL:

```bash
mysql -u root -p < sql/sql.sql      # cria database e tabelas
mysql -u root -p < sql/dados.sql    # popula usuários e publicações de exemplo
```

## Estrutura interna

```
api/
├── main.go                # bootstrap: carrega config, monta router e escuta a porta
├── example.env            # template do .env
├── sql/                   # scripts de schema e seed
└── src/
    ├── config/            # leitura do .env e variáveis globais (porta, DSN, secret)
    ├── banco/             # abertura da conexão com o MySQL (chamada por requisição)
    ├── seguranca/         # bcrypt: Hash() e VerificarSenha()
    ├── autenticacao/      # criação e validação de tokens JWT
    ├── modelos/           # structs do domínio + validações em Preparar()
    ├── repositorios/      # SQL puro, um arquivo por agregado
    ├── controllers/       # handlers HTTP — orquestram repositórios e respostas
    ├── respostas/         # helpers JSON e formatação de erros
    ├── middlewares/       # log de requisições + autenticação JWT
    └── router/
        ├── router.go      # cria o *mux.Router
        └── rotas/         # tabela de rotas (URI, método, handler, exige auth?)
```

## Fluxo de uma requisição

1. `main.go` chama `config.Carregar()` (lê o `.env`) e `router.Gerar()`, depois inicia o `http.ListenAndServe`.
2. `router/rotas/rotas.go` percorre todas as rotas declaradas em `login.go`, `usuarios.go` e `publicacoes.go`. Cada rota é uma struct `Rota{URI, Metodo, Funcao, RequerAutenticacao}`.
3. Para cada rota, o middleware `Logger` é aplicado sempre; `Autenticar` é aplicado quando `RequerAutenticacao` é `true` — ele extrai o JWT do header `Authorization`, valida com `SECRET_KEY` e segue ou aborta com 401.
4. O controller decodifica o body para um `modelos.X`, chama `Preparar()` para validar/normalizar, abre uma conexão via `banco.Conectar()`, instancia o repositório correspondente e responde via `respostas.JSON` ou `respostas.Erro`.
5. Repositórios usam `database/sql` direto (sem ORM): `Prepare`, `Query`, `Exec`, `Scan`. Cada handler abre e fecha sua própria conexão (`defer db.Close()`).

## Endpoints

### Autenticação
- `POST /login` — recebe `{email, senha}`, valida com bcrypt e devolve `{id, token}`.

### Usuários (todos exigem JWT, exceto o `POST /usuarios`)
- `POST /usuarios`
- `GET /usuarios?usuario=<termo>`
- `GET /usuarios/{usuarioId}`
- `PUT /usuarios/{usuarioId}`
- `DELETE /usuarios/{usuarioId}`
- `POST /usuarios/{usuarioId}/seguir`
- `POST /usuarios/{usuarioId}/parar-de-seguir`
- `GET /usuarios/{usuarioId}/seguidores`
- `GET /usuarios/{usuarioId}/seguindo`
- `POST /usuarios/{usuarioId}/atualizar-senha`

### Publicações (todas exigem JWT)
- `POST /publicacoes`
- `GET /publicacoes` — feed com publicações próprias e de quem o usuário segue
- `GET /publicacoes/{publicacaoId}`
- `PUT /publicacoes/{publicacaoId}`
- `DELETE /publicacoes/{publicacaoId}`
- `GET /usuarios/{usuarioId}/publicacoes`
- `POST /publicacoes/{publicacaoId}/curtir`
- `POST /publicacoes/{publicacaoId}/descurtir`

## Detalhes de implementação que valem a pena conhecer

- **Validação no modelo, não no controller.** Cada modelo expõe um método `Preparar(etapa string)` que faz `validar()` e `formatar()`. As etapas (`"cadastro"`, `"edicao"`) decidem quais campos são obrigatórios. Isso mantém o controller focado em HTTP e o modelo focado em regra.
- **Senhas nunca trafegam em claro no banco.** `seguranca.Hash` aplica bcrypt no cadastro e na atualização. `seguranca.VerificarSenha` é usada tanto no login quanto na rota de troca de senha (que confirma a senha atual antes de aceitar a nova).
- **Autorização por dono.** Operações como editar/deletar usuário e publicação comparam o `usuarioId` da URL com o `ID` extraído do JWT (via `autenticacao.ExtrairUsuarioID`) e respondem 403 quando não bate.
- **Conexão por requisição.** Não há pool global compartilhado: cada handler chama `banco.Conectar()` e dá `defer db.Close()`. Suficiente para o escopo do projeto e mais simples para o aluno seguir o fluxo.
- **Tokens JWT.** `autenticacao.CriarToken` assina com `HS256` usando `config.SecretKey` e embute `usuarioId` e `exp`. O middleware `Autenticar` valida o algoritmo, a expiração e a assinatura antes de deixar a requisição passar.
