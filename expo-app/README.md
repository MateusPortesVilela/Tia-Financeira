# Meu Financeiro no Expo Go

## Configurar o endereco publicado

Depois de publicar a pasta principal na Vercel, abra `App.js` e substitua:

```js
const APP_URL = "https://SEU-PROJETO.vercel.app";
```

pelo endereco real da Vercel.

## Executar no Expo Go

```powershell
cd expo-app
npx expo start
```

Escaneie o QR Code no aplicativo Expo Go. O celular precisa ter acesso a internet; nao precisa estar na mesma rede do computador quando `APP_URL` for um endereco da Vercel.
