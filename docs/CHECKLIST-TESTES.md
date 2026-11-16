# Eco School — checklist de conferência manual

Execute `bun run dev`, abra o endereço exibido e marque cada item. Repita nas larguras **360, 390, 768 e 1440 px** (DevTools → modo dispositivo). Registre data, responsável e resultado.

## Login
- [ ] Início mostra só 4 perfis + link discreto "Acesso da equipe"; clicar leva à tela de login do perfil.
- [ ] Cada conta (ver README) entra e cai na página inicial correta; "Preencher automaticamente" funciona; mostrar/ocultar senha funciona.
- [ ] Senha errada e campos vazios mostram mensagem; conta de outro perfil é recusada; Voltar retorna à seleção.
- [ ] Ana (`ana.souza`) vê as missões/pontos de `st1`; admin entra só por "Acesso da equipe" e abre a auditoria com os eventos de login/logout.
- [ ] "Sair" volta ao início; digitar `/app/auditoria` como aluno redireciona; `/app/*` sem sessão volta ao início.
- [ ] Aba do navegador mostra o ícone da folha e o título "Eco School — Escolas Sustentáveis e Conectadas" (limpe o cache se aparecer o ícone antigo).

## Fluxos por perfil
- [ ] Início: logo nítida e sem distorção, slogan, texto de apresentação e 4 cartões públicos de perfil; o administrador usa o acesso separado Acesso da equipe.
- [ ] Aluno: Missões → enviar missão com evidência; quiz com correção automática; Progresso (pontos, sequência, marcos); Ranking.
- [ ] Professor: Validação → abrir uma entrega pendente e conferir aluno, turma, missão, evidência e pontos; aprovar; confirmar responsável/data e pontos atualizados; em outra entrega, rejeitar, conferir que justificativa é obrigatória e verificar o motivo na aba Decididas. Turmas; Ranking com seletor de turma.
- [ ] Gestor escolar: Painel, Ranking (escola/turma), Regras, Relatórios (gerar e exportar CSV).
- [ ] Gestor regional: Ranking → aba Escolas (fórmula, fechar ciclo, emitir selo) e aba Alunos (região/escola/turma); Relatórios.
- [ ] Administrador: Auditoria e Regras; eventos de validação e relatório aparecem na trilha.

## Ranking de alunos
- [ ] Trocar Escola / Turma / Região altera a lista; trocar a região, a escola ou a turma altera a lista.
- [ ] Região "Itapuí" mostra o estado vazio (escola sem alunos).
- [ ] Aluno aprova → sobe pontos e posição; pendente e rejeitada não alteram o ranking.
- [ ] Aluno "Ana S." aparece destacada ("Você") e a mensagem motivacional corresponde à posição.
- [ ] Nomes sempre abreviados; registros demo marcados.

## Layout e acessibilidade
- [ ] Sem rolagem horizontal em 360 px em nenhuma página; gráficos sem cortes.
- [ ] Barra inferior não encobre botões (último item de cada página alcançável); alvos de toque ≥ 44 px.
- [ ] Modal de missão cabe na tela e rola internamente; foco visível ao navegar por teclado.
- [ ] Contraste de textos secundários legível; podium legível em 360 px (nomes truncados, sem sobreposição).

## Persistência
- [ ] Recarregar a página mantém pontos, missões enviadas e perfil; "Restaurar dados de demonstração" volta ao estado inicial.
- [ ] Usuário com dados antigos salvos no navegador passa a ver os alunos de demonstração sem perder o que já tinha.

## Comandos
- [ ] `bun run lint`  - [ ] `bun run test`  - [ ] `bunx playwright install chromium` (primeira execução)  - [ ] `bun run test:e2e`  - [ ] `bun run build`
