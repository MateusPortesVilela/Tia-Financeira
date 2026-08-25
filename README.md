# Prompt para IA da IDE — App de Controle Financeiro Mensal

Copie e cole o bloco abaixo (dentro das aspas) na IA da sua IDE (Copilot Chat, Cursor, Claude Code, etc.) para iniciar o projeto.

---

```
Você é um desenvolvedor sênior atuando como meu parceiro de programação. Vamos construir, do zero, um aplicativo LEVE e SIMPLES de controle financeiro pessoal, destinado a uma usuária não-técnica (uma administradora que hoje controla tudo em caderno) que faz o fechamento mensal de entradas e saídas de dinheiro.

## Contexto de uso real
- A usuária anota manualmente cada gasto e cada ganho, com data e categoria.
- No fim do mês, ela soma tudo, separado por categoria, para saber quanto entrou e quanto saiu.
- Ela também controla, num calendário separado, os dias em que espera RECEBER dinheiro e os dias em que tem COBRANÇAS/contas a pagar.
- Hoje ela se perde facilmente controlando despesas espalhadas.
- Ela não é técnica: o app precisa ser extremamente simples, com pouquíssimos cliques para registrar algo, sem jargão técnico, sem telas complexas.

## Objetivo do app (MVP)
1. Cadastro rápido de lançamentos: tipo (entrada/saída), valor, categoria, data, descrição opcional.
2. Categorias editáveis pela própria usuária (ex: mercado, contas de casa, transporte, salário, freelas etc.), com possibilidade de criar novas.
3. Resumo mensal automático: total de entradas, total de saídas, saldo do mês, e subtotal por categoria (substituindo a soma manual do caderno).
4. Calendário/agenda de compromissos financeiros: datas de recebimentos esperados e datas de cobranças/contas a pagar, com indicação visual de "vencido", "vence hoje", "a vencer".
5. Histórico simples por mês, com possibilidade de navegar entre meses anteriores.
6. Alertas visuais (sem precisar de notificação push complexa) para cobranças próximas do vencimento ao abrir o app.

## Fora de escopo por enquanto (não implementar ainda)
- Login multiusuário / autenticação complexa.
- Integração bancária automática (open finance, importação de extrato).
- Relatórios avançados, gráficos sofisticados, previsões com IA.
- Versão mobile nativa (o foco é um app leve, web ou desktop simples).

## Requisitos técnicos
- Priorize SIMPLICIDADE e baixo custo de manutenção sobre arquitetura sofisticada.
- Sugira você mesmo a stack mais leve e adequada (ex: app web single-page com armazenamento local, ou app desktop simples), explicando o porquê antes de começar a codar, e me pergunte se eu confirmo antes de gerar os arquivos.
- Os dados precisam persistir entre sessões (a usuária vai usar isso todo dia).
- Interface em português, com textos claros e botões grandes, pensada para alguém que nunca usou um sistema parecido.
- Evite dependências pesadas ou configuração complicada de ambiente.

## Como quero trabalhar com você
1. Antes de escrever qualquer código, proponha a stack e a estrutura de dados (categorias, lançamentos, compromissos do calendário) e espere minha confirmação.
2. Depois, construa o MVP em etapas pequenas e testáveis, uma funcionalidade por vez, começando pelo cadastro de lançamentos e resumo mensal, e só depois o calendário de recebimentos/cobranças.
3. A cada etapa, explique em linguagem simples o que foi feito e como eu testo.
4. Sempre que possível, use nomes de campos e categorias em português, pensando na usuária final.
```

---

**Por que montei assim:** separei o prompt em contexto real de uso, escopo do MVP, o que deixar de fora por enquanto, requisitos técnicos e forma de trabalho — isso evita que a IA da IDE já saia gerando uma stack pesada (ex: microserviços, banco na nuvem) para um problema que é, na prática, um app pessoal de anotação e soma. Também deixei a escolha da stack para a IA sugerir e você aprovar, porque isso muda dependendo da IDE/ferramenta que você está usando (algumas têm mais facilidade com web, outras com Python, etc.).

Se quiser, posso já sugerir aqui mesmo 2-3 opções de stack (ex: HTML/JS puro com armazenamento local, ou Python com SQLite) para você decidir antes de ir para a IDE.
