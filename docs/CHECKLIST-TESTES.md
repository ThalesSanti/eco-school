# Eco School — checklist de conferência manual

Execute `bun run dev`, abra o endereço exibido e marque cada item. Repita nas larguras **360, 390, 768 e 1440 px** (DevTools → modo dispositivo). Registre data, responsável e resultado.

## Fluxos por perfil
- [ ] Início: logo nítida e sem distorção, slogan, texto de apresentação e 5 cartões de perfil; cada um entra na página inicial do perfil.
- [ ] Aluno: Missões → enviar missão com evidência; quiz com correção automática; Progresso (pontos, sequência, marcos); Ranking.
- [ ] Professor: Validação → aprovar e rejeitar (motivo obrigatório); pontos do aluno mudam após aprovar; Turmas; Ranking com seletor de turma.
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
- [ ] `bun run lint`  - [ ] `bun run test`  - [ ] `bun run build`
