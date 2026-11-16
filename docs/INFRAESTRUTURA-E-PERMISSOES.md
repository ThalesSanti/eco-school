# Infraestrutura de testes e permissões

## Execução E2E com Playwright

`playwright.config.ts` define Chromium, um único worker e `http://127.0.0.1:8787` como `baseURL` padrão. Não há `webServer`: o Worker deve ser iniciado em um terminal separado. O Wrangler `4.162.0` é dependência de desenvolvimento fixada no `package.json` e no `bun.lock`. O comando E2E não publica nem altera o Worker remoto.

Na raiz do projeto, faça o build local e inicie o Worker pelo Node.js:

```sh
bun install --frozen-lockfile
bun run build
node ./node_modules/wrangler/bin/wrangler.js --cwd ./ dev --local --port 8787
```

Com o Wrangler `4.162.0`, o comando `bunx wrangler --cwd ./ dev --local --port 8787` executa o Wrangler sob Bun. O runtime local então responde `503` com a mensagem de que `fetch()` do Bun não encaminha o dispatcher do Undici usado pelo Miniflare. A execução pelo Node evita esse problema. Em outro terminal, ainda na raiz do projeto, execute:

Mantenha esse terminal aberto. Em outro terminal, também na raiz do projeto, instale o Chromium se necessário e execute a suíte:

```sh
bunx playwright install chromium
bun run test:e2e
```

Os specs abrangidos por `**/*.spec.ts` ficam em `e2e/`:

- `initial-captures.spec.ts`: auditoria demonstrativa e layout mobile.
- `manual-validation.spec.ts`: evidência pendente, aprovação, rejeição justificada, auditoria, pontuação e quatro larguras de tela.
- `system-manual-captures.spec.ts`: instalação congelada, testes unitários e aplicação pública.
- `user-manual-captures.spec.ts`: fluxos demonstrativos do aluno, professor e ranking.

O spec de sistema chama `bun install --frozen-lockfile` e `bun run test` como processos filhos. Anexa a saída capturada ao resultado Playwright e gera as imagens técnicas a partir dessa execução atual. O caso de testes verifica que a saída contém 34 testes aprovados. Assim, a geração não depende de arquivos temporários pré-existentes nem de resultados armazenados em `node_modules/.cache`.

O caso de aplicação pública apenas abre a URL publicada para conferir e capturar a tela inicial. Ele não executa deploy nem envia alterações ao Cloudflare.

Se a porta `8787` estiver ocupada por uma instância anterior, inicie o Worker em uma porta livre e defina `PLAYWRIGHT_BASE_URL` com essa mesma URL ao rodar `bun run test:e2e`. Confirme que o endereço responde e que os assets do build carregam antes de interpretar falhas nos fluxos de login.

## Cloudflare Workers Builds

O adaptador Vite encaminha as opções `nitro` para o Nitro. Em `vite.config.ts`, `nitro.cloudflare.wrangler.previews` define o bloco do Wrangler em tempo de build; não edite `.output/server/wrangler.json`, pois ele é gerado. O Nitro gera a configuração de deploy e `.wrangler/deploy/config.json` direciona o Wrangler para esse arquivo.

Após `bun run build`, a configuração gerada deve conter:

```json
"previews": {}
```

O bloco vazio é válido para este Worker, que não declara bindings de preview próprios. Se forem necessários recursos ou variáveis exclusivos de Preview, devem ser configurados com valores seguros para Preview; os Previews não herdam as configurações de produção.

No Dashboard, em **Workers & Pages → Eco School → Settings → Builds**, defina:

| Campo | Valor |
| --- | --- |
| Production branch | `main` |
| Build command | `bun run build` |
| Deploy command | `npx wrangler deploy` |
| Preview builds | habilitado |
| Preview command | `npx wrangler preview` |

Com Preview Builds habilitado, pushes para `main` executam o build e o Deploy command. Pushes para `finalizacao-mvp-sem-ia` executam o build e o Preview command; não substituem o Worker publicado em produção. Confira também que a hospedagem de Preview (`workers.dev` ou um domínio de Preview) esteja habilitada para o Worker.

Workers antigos conectados a Builds podem continuar no fluxo legado. Se o Dashboard mostrar **Set up Worker Previews**, o proprietário da conta precisa revisar essa migração antes de iniciá-la: a documentação do Cloudflare informa que essa mudança única não pode ser revertida. Nenhuma configuração remota foi alterada durante esta revisão.

O Wrangler `4.162.0` valida o arquivo gerado com `npx wrangler deploy --dry-run`, sem publicar. O comando `npx wrangler preview` cria ou atualiza uma Preview remota e, portanto, não foi executado nesta revisão.

## Estrutura SQL de RBAC futuro

`drizzle/migrations/0000_teacher_ai_access.sql` cria o enum `public.app_role` (`professor`, `admin`) e a tabela `public.user_roles`, com referência a `auth.users`, unicidade por usuário/função e Row Level Security. A política permite que uma pessoa autenticada leia apenas as próprias atribuições; a função `service_role` recebe acesso administrativo.

`src/integrations/supabase/types.ts` descreve essa tabela e esse enum para tipagem do cliente Supabase. A busca no código atual não encontrou consultas ou gravações em `user_roles`, nem verificações de `app_role` no fluxo de autenticação. O MVP usa as contas demonstrativas de `src/lib/demo-auth.ts` e guarda o perfil localmente; as permissões simuladas pela interface não representam RBAC no servidor.

Portanto, tabela, enum e tipos permanecem como estrutura histórica/de RBAC futuro, sem integração ativa no MVP demonstrativo. O nome `0000_teacher_ai_access.sql` reflete o contexto original da migração, mas a avaliação assistida por IA foi removida do aplicativo.

O estado do banco remoto não foi consultado. A migração não foi removida, renomeada nem modificada, pois pode já estar aplicada fora deste repositório. Antes de qualquer alteração futura, confira o histórico de migrações e o schema de cada banco. Se a migração já tiver sido aplicada, use uma migração corretiva nova e progressiva; não reescreva nem reaplique o arquivo `0000` sobre um banco existente.
