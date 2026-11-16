# Eco School — projeto completo do MVP

Código-fonte do aplicativo **Eco School — Escolas Sustentáveis e Conectadas**: React 19, TypeScript, TanStack Start e Tailwind CSS 4, com identidade visual clara derivada da logo oficial e telas adaptadas para celulares.

## Endereços oficiais

- Repositório: https://github.com/ThalesSanti/eco-school (branch principal: `main`).
- Aplicação publicada: https://eco-school.thalescdn.workers.dev/.

## O que está incluído

- Quatro perfis públicos demonstrativos (aluno, professor, gestor escolar e gestor regional); o administrador entra pelo acesso separado Acesso da equipe.
- Missões, entregas com foto, validação pelo professor, progresso, ranking, relatórios e auditoria.
- **Ranking de alunos** por escola, turma e região (pódio, destaque da própria posição e mensagens motivacionais), além do ranking normalizado de escolas com selos. Veja a seção "Ranking de alunos".
- Indicadores de engajamento do aluno (sequência de dias, comparação semanal, marcos de participação) na tela Progresso.
- Validação manual de evidências pelo professor, com aprovação ou rejeição justificada, registro do responsável e auditoria.
- Testes automatizados e uma estrutura SQL de permissões reservada para RBAC futuro; veja `docs/INFRAESTRUTURA-E-PERMISSOES.md`.
- `roadmap.md` com requisitos adiados e limitações do MVP.

Este projeto não é um HTML único: precisa de instalação e de um servidor para executar. Não abra os arquivos de código com duplo clique esperando carregar o aplicativo.

## Executar localmente

Instale Node.js 22.12 ou superior e Bun. Extraia este ZIP e abra um terminal na pasta `eco-school`.

```sh
bun install --frozen-lockfile
```

Copie `.env.example` para `.env` e preencha as configurações públicas de conexão do backend. Nenhuma configuração real ou chave privada acompanha o ZIP. Os nomes das variáveis são mantidos exatamente como o código espera; `VITE_` identifica valores públicos visíveis no navegador. As variáveis sem esse prefixo são usadas pelo servidor.

```sh
bun run dev
```

Abra o endereço local exibido no terminal. Para executar os testes:

```sh
bun run test
```

## Login demonstrativo

A página inicial apresenta quatro perfis (Aluno, Professor, Gestor Escolar e Gestor Regional); ao escolher um, abre-se a tela de login (`/?perfil=aluno`, etc.). O administrador não aparece na seleção pública: entra por **"Acesso da equipe"** (`/?perfil=admin`) e usa a trilha de auditoria.

> **Aviso:** a autenticação é **simulada**, apenas para demonstração acadêmica. As contas e senhas ficam no código do navegador (`src/lib/demo-auth.ts`) e **não oferecem segurança real**. Todos os dados são fictícios.

| Perfil | Usuário | Senha |
| --- | --- | --- |
| Aluno (Ana Souza, 8º A, registro `st1`) | `ana.souza` | `eco2026` |
| Professor (Carlos Lima) | `carlos.lima` | `eco2026` |
| Gestor Escolar (Marta Reis) | `marta.reis` | `eco2026` |
| Gestor Regional (Diretoria de Ensino de Jaú) | `diretoria.jau` | `eco2026` |
| Administrador (acesso da equipe) | `equipe.ecoschool` | `eco2026` |

- Login válido define perfil e usuário, vincula Ana ao aluno `st1` e registra "Login" na auditoria; tentativas recusadas também são registradas (sem a senha). "Sair" encerra a sessão e registra "Logout".
- Cada perfil só abre as páginas da sua navegação; digitar a URL de outro perfil redireciona para a página inicial do perfil conectado.
- A sessão fica no `localStorage` (mesma chave dos dados). Para trocar por autenticação real, implemente a interface `AuthProvider` de `demo-auth.ts` no backend (por exemplo, Supabase Auth); a tela de login já usa essa interface.

## Ranking de alunos

- **Pontuação**: somente atividades **aprovadas** contam. Usa a regra existente `studentPoints` (`src/lib/scoring.ts`, RN09: pontos validados + bônus de assiduidade). `src/lib/ranking.ts` não cria fórmula nova.
- **Ordem**: pontuação confirmada → missões aprovadas → dias ativos. Empate nos três critérios compartilha a posição (1, 2, 2, 4). Alunos sem missão aprovada não aparecem na lista (e ninguém é exposto por ter poucos pontos).
- **Visões**: escola, turma e região, com filtros funcionais. Aluno: própria escola e turma. Professor e gestor escolar: escola da unidade, com seletor de turma. Gestor regional: região, qualquer escola e turma, além do ranking de escolas (aba "Escolas", com selos e fechamento de ciclo). O administrador mantém suas funções administrativas.
- **Privacidade**: nomes abreviados ("Ana S."); nenhum dado pessoal além disso.
- **Dados de demonstração**: todo o conteúdo é fictício. Para exemplificar o ranking regional, `src/lib/demo-data.ts` adiciona alunos e atividades demonstrativas determinísticas (marcados como "demo" na tela), cada um com a própria pontuação calculada a partir de suas atividades; nada é distribuído a partir do total da escola. A EE Itapuí fica propositalmente sem alunos para exibir o estado vazio. Dados já salvos no navegador recebem esses registros automaticamente, sem alterar o que existe; "Restaurar dados de demonstração" (barra superior) volta ao estado inicial.

## Identidade visual

O favicon (`public/favicon.svg`, `.ico`, PNGs 16/32/192/512 e `apple-touch-icon.png`) é uma versão simplificada da folha da logo, configurada em `src/routes/__root.tsx`. A logo oficial está em `public/eco-school-logo.png` (arquivo original, sem alteração). `src/components/eco/logo.tsx` oferece a logo completa e um emblema recortado do mesmo arquivo para áreas compactas. As cores (verde da folha, verde-azulado do "SCHOOL", bases claras) ficam como variáveis em `src/styles.css`.

## Login real (limitação do MVP)

O código está incluído, mas os serviços hospedados não são copiados junto com o projeto. Login real exige um backend configurado, provedores de acesso habilitados e endereços de retorno autorizados para o endereço local ou domínio escolhido.

Os perfis demonstrativos continuam usando autenticação local. A validação de missões é manual: o professor consulta as evidências e aprova ou rejeita cada envio; rejeições exigem justificativa. Decisões registram responsável, data e evento de auditoria. Somente entregas aprovadas contam para pontos e ranking.

## Dados e limitações

Os dados do MVP permanecem no navegador de cada usuário (`localStorage`, chave `eco-school-mvp-v1`). Este ZIP contém os dados fictícios definidos no código, não as entregas, fotos ou alterações salvas em um navegador, nem uma cópia do banco remoto. A autenticação demonstrativa é simulada e os dados do MVP ficam no navegador.

As regras provisórias de pontuação e itens adiados estão registrados no roadmap e no código. É uma versão para validação, não uma implantação completa de produção.

## Verificações de qualidade

```sh
bun run lint     # ESLint (inclui regras de formatação do Prettier; use `bun run format` para corrigir)
bun run test     # Vitest
bunx playwright install chromium  # primeira execução E2E, instala o navegador
bun run test:e2e # Playwright no Chromium
bun run build    # build de produção
```

Roteiro de conferência manual (desktop e celular): `docs/CHECKLIST-TESTES.md`.

### Executar os testes E2E localmente

O Playwright usa `http://127.0.0.1:8787` por padrão. A configuração não inicia o servidor (`webServer` não está definido), então gere primeiro o Worker e mantenha-o rodando em um terminal. O Wrangler está fixado em `4.162.0` nas dependências de desenvolvimento e no lockfile.

Execute o Wrangler pelo Node.js. Com essa versão, `bunx wrangler ...` inicia o Wrangler sob o runtime Bun; o Miniflare responde `503` porque o `fetch` do Bun não encaminha o dispatcher usado por ele. A execução validada usa o CLI instalado no projeto:

```sh
bun run build
node ./node_modules/wrangler/bin/wrangler.js --cwd ./ dev --local --port 8787
```

Em um segundo terminal, na raiz do projeto, execute:

```sh
bun run test:e2e
```

Instale o Chromium uma vez com `bunx playwright install chromium` se ainda não estiver disponível. Os specs de sistema executam `bun install --frozen-lockfile` e `bun run test` e usam a saída daquela execução para atualizar as capturas técnicas; não dependem de arquivos de log antigos em `node_modules/.cache`.

Se a porta 8787 já estiver servindo outro Worker, use uma porta livre e defina `PLAYWRIGHT_BASE_URL` para o mesmo endereço ao executar os testes. Isso evita validar uma instância antiga com assets de outro build.

## Estrutura futura de permissões

O MVP usa contas demonstrativas locais e não consulta a tabela `user_roles`. A migração SQL e os tipos Supabase dessa tabela são uma estrutura de RBAC futuro, não uma integração ativa; a migração foi preservada porque pode já ter sido aplicada em um banco remoto. Veja os detalhes e a cautela de manutenção em `docs/INFRAESTRUTURA-E-PERMISSOES.md`.

## Hospedagem e publicação

```sh
bun run build
```

O projeto usa TanStack Start com processamento no servidor. O `vite.config.ts` delega o build ao pacote `@lovable.dev/vite-tanstack-config`, que (via Nitro) tem **Cloudflare** como destino padrão. Por isso **não** publique em hospedagem estática (por exemplo, GitHub Pages): ela serve apenas arquivos e não executa o servidor do aplicativo.

Para publicar:

1. Envie o código ao GitHub (veja abaixo). O repositório contém o código, não os serviços hospedados.
2. Em um provedor compatível com o destino Cloudflare, conecte o repositório e use `bun install --frozen-lockfile` e `bun run build` como comandos. O arquivo de configuração do provedor (por exemplo, `wrangler`) **não faz parte deste repositório**: crie ou confirme-o conforme a documentação do provedor e https://docs.lovable.dev/tips-tricks/self-hosting.
3. Defina as variáveis de ambiente no painel do provedor, nunca em arquivos versionados: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (veja `.env.example`). Chaves privadas nunca recebem o prefixo `VITE_`.
4. Autorize o domínio publicado como endereço de retorno do login no backend, se for usar autenticação.

Missões, validação manual, ranking e relatórios usam dados demonstrativos no navegador. O cliente Supabase permanece no projeto para os módulos de conexão e autenticação real; o MVP demonstrativo não requer uma conta ou integração de IA.

### Enviar ao GitHub

```sh
git init
git add .
git commit -m "Eco School: novo design, logo oficial e ranking de alunos"
git branch -M main
git remote add origin https://github.com/<usuario>/<repositorio>.git
git push -u origin main
```

Se o repositório já existir e estiver conectado ao Lovable, faça commits normais; não use `push --force`, `rebase` ou `amend` em commits já publicados.

## Verificação da entrega

O ZIP foi inspecionado para confirmar a presença do código, testes, migrações e configurações, e a ausência de `.env` real, dependências instaladas, histórico Git e arquivos de compilação. A instalação e a execução em uma hospedagem externa não foram verificadas nesta entrega.
