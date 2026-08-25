import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

const APP_URL = "https://SEU-PROJETO.vercel.app";

export default function App() {
  return (
    <View style={styles.container}>
      <WebView source={{ uri: APP_URL }} style={styles.webview} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1020",
  },
  webview: { flex: 1 },
});
