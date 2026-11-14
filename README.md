# Eco School — projeto completo do MVP

Código-fonte do aplicativo **Eco School — Escolas Sustentáveis e Conectadas**: React 19, TypeScript, TanStack Start e Tailwind CSS 4, com identidade visual clara derivada da logo oficial e telas adaptadas para celulares.

## O que está incluído

- Perfis de demonstração de aluno, professor, gestor, regional e administrador.
- Missões, entregas com foto, validação pelo professor, progresso, ranking, relatórios e auditoria.
- **Ranking de alunos** por escola, turma e região (pódio, destaque da própria posição e mensagens motivacionais), além do ranking normalizado de escolas com selos. Veja a seção "Ranking de alunos".
- Indicadores de engajamento do aluno (sequência de dias, comparação semanal, marcos de participação) na tela Progresso.
- Código de avaliação assistida por IA, autenticação e autorização de professores.
- Testes e migração SQL de permissões em `drizzle/migrations`.
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

## Ranking de alunos

- **Pontuação**: somente atividades **aprovadas** contam. Usa a regra existente `studentPoints` (`src/lib/scoring.ts`, RN09: pontos validados + bônus de assiduidade). `src/lib/ranking.ts` não cria fórmula nova.
- **Ordem**: pontuação confirmada → missões aprovadas → dias ativos. Empate nos três critérios compartilha a posição (1, 2, 2, 4). Alunos sem missão aprovada não aparecem na lista (e ninguém é exposto por ter poucos pontos).
- **Visões**: escola, turma e região, com filtros funcionais. Aluno: própria escola e turma. Professor e gestor escolar: escola da unidade, com seletor de turma. Gestor regional: região, qualquer escola e turma, além do ranking de escolas (aba "Escolas", com selos e fechamento de ciclo). O administrador mantém suas funções administrativas.
- **Privacidade**: nomes abreviados ("Ana S."); nenhum dado pessoal além disso.
- **Dados de demonstração**: todo o conteúdo é fictício. Para exemplificar o ranking regional, `src/lib/demo-data.ts` adiciona alunos e atividades demonstrativas determinísticas (marcados como "demo" na tela), cada um com a própria pontuação calculada a partir de suas atividades; nada é distribuído a partir do total da escola. A EE Itapuí fica propositalmente sem alunos para exibir o estado vazio. Dados já salvos no navegador recebem esses registros automaticamente, sem alterar o que existe; "Restaurar dados de demonstração" (barra superior) volta ao estado inicial.

## Identidade visual

A logo oficial está em `public/eco-school-logo.png` (arquivo original, sem alteração). `src/components/eco/logo.tsx` oferece a logo completa e um emblema recortado do mesmo arquivo para áreas compactas. As cores (verde da folha, verde-azulado do "SCHOOL", bases claras) ficam como variáveis em `src/styles.css`.

## Login e avaliação por IA

O código está incluído, mas os serviços hospedados não são copiados junto com o projeto. Login real exige um backend configurado, provedores de acesso habilitados e endereços de retorno autorizados para o endereço local ou domínio escolhido.

A avaliação por IA exige uma conta autenticada com permissão `professor` ou `admin` em `user_roles`. Escolher um perfil de demonstração não concede essa permissão. A migração incluída cria a estrutura de permissões; contas reais e suas autorizações não estão no ZIP. Não aplique migrações repetidamente a um backend que já as possui.

A conexão com AI Gateway usa a configuração privada fornecida pelo ambiente Lovable. Ela não é exportada. Fora desse ambiente, a integração requer uma configuração de hospedagem compatível; não há garantia de que a IA funcione apenas instalando este ZIP. Nunca coloque credenciais privadas em variáveis com prefixo `VITE_` nem no navegador.

A IA apenas sugere feedback e nunca aprova entregas ou altera pontos automaticamente.

## Dados e limitações

Os dados do MVP permanecem no navegador de cada usuário (`localStorage`, chave `eco-school-mvp-v1`). Este ZIP contém os dados fictícios definidos no código, não as entregas, fotos ou alterações salvas em um navegador, nem uma cópia do banco remoto. Autenticação e permissões reais são exigidas somente para o recurso de IA na versão atual.

As regras provisórias de pontuação e itens adiados estão registrados no roadmap e no código. É uma versão para validação, não uma implantação completa de produção.

## Verificações de qualidade

```sh
bun run lint     # ESLint (inclui regras de formatação do Prettier; use `bun run format` para corrigir)
bun run test     # Vitest
bun run build    # build de produção
```

Roteiro de conferência manual (desktop e celular): `docs/CHECKLIST-TESTES.md`.

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

Integrações externas: o backend (Supabase / Lovable Cloud) é necessário apenas para login real e avaliação por IA; ranking, missões, validação e relatórios funcionam com os dados salvos no navegador. A IA depende da configuração privada do ambiente Lovable e pode não funcionar fora dele.

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
