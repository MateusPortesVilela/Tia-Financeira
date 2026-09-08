# Tia Financeira

> Um painel simples para registrar, organizar e entender sua vida financeira.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=20232A)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=fff)](https://vite.dev/)
[![Node](https://img.shields.io/badge/Node.js-24-339933?logo=node.js&logoColor=fff)](https://nodejs.org/)

Aplicacao web para organizar a vida financeira. Registre entradas e saidas, acompanhe compromissos, crie categorias, navegue pelo historico mensal e gere relatorios em PDF.

Tambem e possivel enviar uma imagem de comprovante ou extrato. A aplicacao envia a imagem para a API, que usa a Anthropic para identificar os lancamentos e devolve os dados para revisao antes de salva-los.

## Indice

- [Principais recursos](#principais-recursos)
- [Tecnologias](#tecnologias)
- [Como executar](#como-executar)
- [Configuracao da analise por imagem](#configuracao-da-analise-por-imagem)
- [Comandos disponiveis](#comandos-disponiveis)
- [Deploy na Vercel](#deploy-na-vercel)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Observacoes](#observacoes)

## Principais recursos

- Cadastro e edicao de entradas e saidas.
- Resumo mensal com navegacao entre meses.
- Gerenciamento de categorias de receitas e despesas.
- Calendario de compromissos financeiros e alertas visuais.
- Importacao de lancamentos a partir de imagens.
- Geracao de relatorio mensal em PDF.
- Tema claro e escuro.

## Tecnologias

- React 19
- Vite
- Firebase Firestore
- Express
- Anthropic API para analise de imagens
- `@react-pdf/renderer` para relatorios em PDF

## Como os dados funcionam

- Lancamentos, compromissos, categorias e o tema sao salvos no `localStorage` do navegador.
- Ao iniciar, o frontend tenta sincronizar categorias existentes na colecao `categorias` do Firestore.
- A analise de imagem passa pelo endpoint `POST /api/analisar-imagem`. A chave da Anthropic fica somente no servidor, na variavel `ANTHROPIC_API_KEY`.
- Em desenvolvimento, o Vite encaminha chamadas `/api` para `http://localhost:8787`.

## Como executar

### 1. Pre-requisitos

- Node.js 24.x
- npm
- Um projeto Firebase configurado para Firestore, caso queira usar a sincronizacao de categorias
- Uma chave da Anthropic, caso queira analisar imagens

### 2. Instalar dependencias

Na pasta do projeto, execute:

```bash
npm install
```

### 3. Iniciar o frontend

Em um terminal, na raiz do projeto:

Terminal 1, frontend:

```bash
npm run dev
```

Acesse `http://localhost:5173`.

### 4. Iniciar a API de imagens

Em um segundo terminal, na raiz do projeto:

```bash
npm run dev:api
```

A API fica disponivel em `http://localhost:8787`. Para habilitar a analise, configure a chave antes de iniciar o servidor.

O endpoint `GET /api/health` pode ser usado para verificar se a API esta respondendo.

## Configuracao da analise por imagem

A API precisa da variavel `ANTHROPIC_API_KEY`. Configure-a antes de iniciar o servidor.

No PowerShell:

```powershell
$env:ANTHROPIC_API_KEY="sua-chave-da-anthropic"
npm run dev:api
```

No macOS/Linux:

```bash
export ANTHROPIC_API_KEY="sua-chave-da-anthropic"
npm run dev:api
```

O frontend usa o proxy configurado no Vite para encaminhar `/api` para `http://localhost:8787`. Sem essa API, o restante do painel continua funcionando, mas a importacao por imagem fica indisponivel.

## Comandos disponiveis

```bash
npm run dev       # inicia o frontend com Vite
npm run dev:api   # inicia a API Express local
npm run build     # gera a versao de producao em dist/
npm run preview   # visualiza o build localmente
npm run lint      # executa o Oxlint
```

## Deploy na Vercel

1. Importe o repositorio na Vercel.
2. Use `npm run build` como comando de build.
3. Use `dist` como diretorio de saida.
4. Cadastre `ANTHROPIC_API_KEY` nas Environment Variables do projeto.
5. Faca o deploy.

O arquivo `api/analisar-imagem.js` e usado como funcao serverless pela Vercel. Sem a variavel `ANTHROPIC_API_KEY`, o restante da aplicacao funciona, mas a analise de imagens retorna erro de configuracao.

## Estrutura do projeto

```text
src/
	App.jsx                   # telas e regras principais do aplicativo
	components/               # relatorios, impressao e tabela de lancamentos
	hooks/useImageAnalysis.js # envio e normalizacao da analise de imagens
firebase-config.js          # configuracao do Firebase/Firestore
server.js                   # API Express para desenvolvimento local
api/analisar-imagem.js      # funcao serverless da Vercel
vite.config.js              # servidor Vite e proxy da API
```

## Observacoes

- A configuracao atual do Firebase esta no arquivo `firebase-config.js`. As regras de seguranca do Firestore devem ser configuradas no proprio projeto Firebase.
- Os dados salvos no `localStorage` pertencem ao navegador e nao sao automaticamente compartilhados entre dispositivos.
- A analise de imagens envia o conteudo para a Anthropic; evite enviar documentos com dados sensiveis sem avaliar essa implicacao.
