# DevBook

DevBook é uma rede social de estudo escrita em Go, desenvolvida como projeto prático de um curso online. O objetivo é exercitar, da camada de banco até a camada de apresentação, os fundamentos de uma aplicação web completa em Go: roteamento HTTP, autenticação com JWT, acesso a MySQL, hashing de senhas com bcrypt, renderização de templates HTML e comunicação entre serviços.

## Estrutura do repositório

O projeto é dividido em dois módulos Go independentes, cada um com seu próprio `go.mod` e seu próprio ciclo de execução. Eles não compartilham código: a comunicação entre os dois acontece exclusivamente via HTTP.

```
DevBook/
├── api/        # API REST em Go (gorilla/mux + MySQL + JWT)
├── webapp/     # Aplicação web em Go (gorilla/mux + templates HTML)
└── LICENSE
```

- **`api/`** expõe a API REST que cuida das regras de negócio, da autenticação dos usuários e do acesso ao banco MySQL. Veja o `README.md` dentro da pasta para detalhes da implementação.
- **`webapp/`** é o frontend renderizado no servidor. Ele não fala diretamente com o banco; cada ação do usuário vira uma requisição HTTP para a API. Veja o `README.md` da pasta para detalhes.

## Como rodar

Cada módulo é executado de forma independente e precisa do seu próprio arquivo `.env` (baseado no `example.env` correspondente). A ordem natural é:

1. Suba o MySQL e execute os scripts em `api/sql/` para criar o schema e popular dados de exemplo.
2. Crie `api/.env` a partir de `api/example.env` e rode a API:
   ```bash
   cd api && go run main.go
   ```
3. Crie `webapp/.env` a partir de `webapp/example.env` (apontando `API_URL` para a API que acabou de subir) e rode a aplicação web:
   ```bash
   cd webapp && go run main.go
   ```

## Banco de dados

Os scripts SQL ficam em `api/sql/`:

- `sql.sql` — schema com as tabelas `usuarios`, `seguidores` e `publicacoes`.
- `dados.sql` — usuários e publicações de exemplo para começar a explorar a aplicação.

## Convenções

- Código, comentários e mensagens de erro estão em **português**. A nomenclatura segue esse padrão (`Carregar`, `Gerar`, `BuscarUsuarios`, `Publicacao`, etc.).
- Os dois módulos seguem o mesmo desenho em camadas (router → middlewares → controllers → repositório/serviço → modelo), o que facilita transitar entre eles.
