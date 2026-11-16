# Eco School — Roadmap

## Sprint atual (MVP de validação) — entregue
- [x] Seleção pública de quatro perfis (aluno, professor, gestor escolar, gestor regional); administrador por Acesso da equipe
- [x] RF01/US01 Missões do dia com status (disponível, enviada, validada, rejeitada, expirada) e prazo
- [x] RF02/US02 Registro com descrição/foto, bloqueio após prazo (RN01) e sem envio duplicado
- [x] Quiz com correção automática (RN02)
- [x] RF03/US03 Validação com aprovação/rejeição justificada, validador e data/hora
- [x] RF04 Pontuação individual + assiduidade (RN09) e score normalizado da escola (RN04)
- [x] RF05/US05 Regra de bônus com teto central, versionamento por período e auditoria
- [x] RF06/US04 Progresso: confirmados x pendentes, gráfico, histórico, bônus acadêmico
- [x] RF07/US06 Painel da escola (ativos, validadas, conclusão, evolução, turmas, categorias)
- [x] RF08/US07 Ranking regional com fórmula visível e sem dados pessoais
- [x] RF09/US10 Selos após fechamento do ciclo
- [x] RF10/US08 Relatórios por período/unidade com exportação CSV
- [x] US09 Trilha de auditoria com filtros
- [x] Testes das regras de pontuação

## Sprint final — redesign e ranking de alunos
- [x] Identidade visual clara baseada na logo oficial, aplicada a todas as telas
- [x] Tela inicial de apresentação com logo, slogan, quatro cartões públicos e acesso administrativo separado
- [x] Ranking de alunos por escola, turma e região (pódio, filtros funcionais, destaque da própria posição)
- [x] Ranking disponível para aluno, professor, gestor escolar e regional; ranking de escolas preservado
- [x] Indicadores de engajamento no Progresso (sequência, semana anterior, marcos)
- [x] Testes unitários do ranking, dos dados de demonstração e da navegação

## Adiado para próximo sprint
- [ ] Migrar perfis de demonstração para login real e RBAC em todo o app (RNF04)
- [ ] Migrar os dados do MVP do navegador para Lovable Cloud; Cloud já está ativo
- [ ] Armazenamento seguro de fotos de evidência
- [ ] Cadastro/edição de missões, turmas, escolas e usuários pelo gestor
- [ ] Fórmula oficial do fator de engajamento — bloqueio: aprovação da governança (usada hipótese 1+0,4×(adesão−0,5), limite 0,8–1,2)
- [ ] Critérios oficiais de selos e teto central — bloqueio: governança (usado Ouro≥180, Prata≥140, Bronze≥100; teto 1,0)
- [ ] Ajuste manual de pontuação com motivo e valores antes/depois (RN06)
- [ ] Exportação PDF dos relatórios
- [ ] Integração com sistema acadêmico/boletim — bloqueio: APIs da rede não definidas
- [ ] LGPD: consentimento de responsáveis, retenção/descarte, atendimento ao titular
- [ ] Backups, observabilidade, testes de carga, CI/CD e Docker (RNF01–03, RNF08)
- [ ] Notificações (push/e-mail) de novas missões e validações

## Adaptação para celulares
- [x] Navegação de aluno e professor, missões, progresso e turmas sem cortes
- [x] Formulários acessíveis e controles confortáveis ao toque
- [x] Conferir envio, aprovação/rejeição e retorno ao progresso em celulares

## Escopo removido
- Avaliação assistida por IA: removida do MVP; o professor continua validando manualmente as evidências na página Validação.
