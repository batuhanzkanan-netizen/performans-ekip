import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Label, styles } from "../components/ui";
export default function Team() {
  return (
    <SafeAreaView style={styles.page}>
      <View style={[styles.content, { paddingTop: 24 }]}>
        <Text style={styles.heading}>Ekip</Text>
        <Label style={styles.muted}>
          Yakında · Eğitmenleri Görevler ekranından yönetebilirsin.
        </Label>
      </View>
    </SafeAreaView>
  );
}
