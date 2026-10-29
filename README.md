# MarmitaFlow

Cardápio digital que conecta pedido, disponibilidade dos pratos e cozinha.
Projeto acadêmico integrador de Vinícius Spejo da Silva, Rafael Miquelin, Matheus Nery e João Vitor dos Santos.

## Persistência e pagamentos

Restaurantes, credenciais, cardápios e pedidos são persistidos no Cloudflare D1. Um Worker atende a API no mesmo endereço do site. Cada proprietário acessa apenas a gestão e os pedidos do próprio restaurante; clientes acompanham os pedidos associados ao seu navegador por um cookie protegido. As telas consultam atualizações a cada 8 segundos quando a aba está visível.

Pix e cartão continuam **simulados**: não há cobrança, confirmação bancária ou integração com operadora. O servidor calcula os preços, adicionais, cupom e entrega e revalida o cardápio antes de gravar o pedido. A expedição exige a conferência de todos os itens.

A sacola permanece no `localStorage`. Dados da antiga demonstração local não são enviados automaticamente para o D1: o banco começa com o catálogo inicial e recebe os novos cadastros pela API. Senhas de contas novas são gravadas com hash PBKDF2 e salt; sessões usam cookies HttpOnly, SameSite e Secure em HTTPS. Os cookies de sessão duram 7 dias; o de acompanhamento do cliente, 30 dias. O pagamento usa uma identificação de tentativa para evitar pedidos duplicados em reenvios.

## Executar localmente

Use a versão de Node indicada em `.node-version`.

```powershell
npm.cmd ci
npm.cmd run db:migrate:local
npm.cmd run dev -- --host 0.0.0.0
```

Abra `http://localhost:5173/`. O emulador usa um D1 **local**, separado do banco publicado. Para testar em outro dispositivo na mesma rede, use o endereço de rede mostrado pelo Vite e mantenha o servidor ativo. Caso o Windows solicite acesso à rede, permita para a rede privada usada no teste.

## Contas de demonstração

| Restaurante | E-mail | Senha |
| --- | --- | --- |
| Marmita Flow | admin@marmitaflow.com | 123456 |
| Cantina da Nona | nona@cantina.com | 123456 |

Essas duas contas são públicas e demonstrativas. Para dados próprios, cadastre um restaurante com credenciais próprias. A cozinha exige login do proprietário correspondente.

## Rotas

| Endereço | Função |
| --- | --- |
| `#/plataforma` | Apresentação e restaurantes |
| `#/cardapio/:slug` | Cardápio público, montagem, sacola e acompanhamento |
| `#/criar-restaurante` | Cadastro persistido no D1 |
| `#/admin-login` | Login do proprietário |
| `#/admin` | Marca, cardápio, disponibilidade e QR Code |
| `#/cozinha/:slug` | Comandas, status e checklist |
| `#/sobre` | Projeto e equipe |

A API usa `/api/state`, `/api/auth/login`, `/api/auth/logout`, `/api/restaurants`, `/api/products` e `/api/orders`. Dados de clientes e credenciais não são incluídos no catálogo público. Alterações exigem sessão e autorização do restaurante no servidor. Solicitações de origens diferentes são recusadas.

## Verificação

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run check:api
```

`npm test` inclui testes da API com SQLite, isolamento entre contas, login/logout, preços calculados no servidor, estoque, idempotência e checklist. `check:api` testa o Worker em execução em `http://127.0.0.1:5173`, criando um pedido de demonstração e concluindo-o; use apenas em ambiente de teste. A URL pode ser alterada com `MARMITAFLOW_URL`.

O build gera `dist/client` para o navegador e `dist/marmitaflow` para o Worker. O Wrangler usa a configuração gerada pelo plugin do Vite para publicar ambos.

## Publicar na Cloudflare

O banco `marmitaflow-db` está associado ao binding `DB` em `wrangler.toml`. O ID de banco não é uma credencial. Login e tokens da Cloudflare ficam na configuração local da ferramenta, fora do código.

```powershell
npx.cmd wrangler login
npm.cmd run db:migrate:remote
npm.cmd run deploy
```

As migrations em `migrations/` criam as tabelas e o catálogo inicial uma única vez. Não edite uma migration já aplicada: crie a próxima para mudanças no banco. `scripts/generate-seed.mjs` foi usado para gerar os dados iniciais; não é necessário executá-lo no uso normal.

O fluxo GitHub Actions valida testes e build. Para publicação automática, configure os secrets `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` no repositório ou no ambiente `production`. O token precisa das permissões de publicação de Workers e edição de D1 para a conta do projeto. Sem os secrets, a publicação é pulada com um aviso; a validação continua.

GitHub Pages sozinho não executa a API e não pode hospedar esta versão completa. Publique o Worker com seus assets pela Cloudflare.

## Estrutura

- `server/`: API, validação, preços, autenticação e acesso ao D1.
- `migrations/`: estrutura SQL e catálogo de demonstração.
- `src/data/catalog.js`: catálogo inicial e opções de montagem compartilhadas.
- `src/store.js` e `src/api.js`: estado da interface e comunicação com o servidor.
- `src/views/`: telas do cliente, proprietário e cozinha.
- `tests/`: regras do carrinho e testes da API.
- `public/assets/`: imagens do projeto.

Desenvolvido para fins acadêmicos. Todos os direitos reservados à equipe.
