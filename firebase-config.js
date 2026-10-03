// Importa a função do SDK modular que cria uma instância do Firebase a partir da configuração.
import { initializeApp } from "firebase/app";
// Importa a função do Firestore que obtém o banco associado a uma instância do Firebase.
import { getFirestore } from "firebase/firestore";

// Reúne os identificadores necessários para conectar este aplicativo ao projeto Firebase.
// Esses valores identificam o projeto no cliente; restrinja o uso da chave de API no Google Cloud.
const firebaseConfig = {
  // Chave usada pelo SDK para identificar o projeto e aplicar as restrições configuradas para ela.
  apiKey: "AIzaSyAqDzTonoylazrY1VwrLSa1rSwW7_xhE5w",
  // Domínio usado pelos fluxos de autenticação do Firebase, caso sejam habilitados no aplicativo.
  authDomain: "tiafinanceira.firebaseapp.com",
  // ID único do projeto Firebase ao qual este aplicativo se conecta.
  projectId: "tiafinanceira",
  // Endereço do bucket padrão do Firebase Storage; não inicializa nem acessa o Storage por si só.
  storageBucket: "tiafinanceira.firebasestorage.app",
  // Identificador do remetente usado por serviços como o Firebase Cloud Messaging.
  messagingSenderId: "589471962373",
  // Identificador desta aplicação web dentro do projeto Firebase.
  appId: "1:589471962373:web:b68ef1a9b92f646b1a936c",
  // Identificador do Google Analytics; só é utilizado quando o Analytics é inicializado.
  measurementId: "G-HLN1D6X3CP",
};

// Recebe o objeto de configuração e devolve a instância principal do Firebase.
// Essa inicialização centralizada permite que os módulos do projeto compartilhem a mesma instância.
// Se os dados forem inválidos ou a inicialização falhar, a exceção é propagada; não há captura aqui.
const firebaseApp = initializeApp(firebaseConfig);
// Recebe a instância do Firebase e devolve o cliente do Cloud Firestore associado ao projeto.
// A chamada prepara o cliente; problemas de acesso/rede geralmente aparecem nas operações feitas no banco.
const db = getFirestore(firebaseApp);

// Exporta o cliente do Firestore para que outros módulos consultem e atualizem os dados do aplicativo.
export { db };
