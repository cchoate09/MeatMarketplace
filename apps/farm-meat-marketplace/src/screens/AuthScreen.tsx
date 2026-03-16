import React, { useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { ScreenShell } from "../components/ScreenShell";
import { SectionCard } from "../components/SectionCard";
import { appConfig } from "../config/appConfig";
import { useAppContext } from "../context/AppContext";
import { UserRole } from "../types";
import { styles } from "./sharedStyles";

export function AuthScreen() {
  const { login, signUp, loginAsDemo } = useAppContext();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<UserRole>("slaughterhouse");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("slaughterhouse@example.com");
  const [password, setPassword] = useState("password123");

  async function handleSubmit() {
    try {
      if (mode === "signin") {
        await login(email.trim(), password);
        return;
      }

      await signUp({
        name: name.trim() || (role === "slaughterhouse" ? "New Slaughterhouse" : "New Farm"),
        email: email.trim(),
        password,
        role
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Unable to continue", message);
    }
  }

  function switchRole(nextRole: UserRole) {
    setRole(nextRole);
    if (mode === "signin") {
      setEmail(nextRole === "slaughterhouse" ? "slaughterhouse@example.com" : "farmer@example.com");
      setPassword("password123");
    }
  }

  return (
    <ScreenShell
      title="Auction livestock and meat lots between farms and slaughterhouses."
      subtitle={
        appConfig.useMockServices
          ? "Mock auction mode is enabled for UI testing. Live Supabase and Stripe settlement hooks are still wired in and can be re-enabled later."
          : "Supabase-ready auth, storage, and database services are wired in. Use demo accounts now or connect your live project next."
      }
    >
      <View style={styles.heroBanner}>
        <Text style={styles.kicker}>Farmer-led auction exchange</Text>
      </View>

      <SectionCard>
        <Text style={styles.sectionTitle}>Account mode</Text>
        <View style={styles.row}>
          <AppButton label="Sign In" kind={mode === "signin" ? "primary" : "secondary"} onPress={() => setMode("signin")} style={styles.flexButton} />
          <AppButton label="Create Account" kind={mode === "signup" ? "primary" : "secondary"} onPress={() => setMode("signup")} style={styles.flexButton} />
        </View>

        <Text style={styles.sectionTitle}>Role</Text>
        <View style={styles.row}>
          <AppButton
            label="Slaughterhouse"
            kind={role === "slaughterhouse" ? "primary" : "secondary"}
            onPress={() => switchRole("slaughterhouse")}
            style={styles.flexButton}
          />
          <AppButton label="Farmer" kind={role === "farmer" ? "primary" : "secondary"} onPress={() => switchRole("farmer")} style={styles.flexButton} />
        </View>

        {mode === "signup" ? <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Facility or farm name" /> : null}
        <TextInput value={email} onChangeText={setEmail} style={styles.input} placeholder="Email" autoCapitalize="none" />
        <TextInput value={password} onChangeText={setPassword} style={styles.input} placeholder="Password" secureTextEntry />
        <AppButton label={mode === "signin" ? "Sign In" : "Create Account"} onPress={() => void handleSubmit()} />
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Demo quick access</Text>
        <Text style={styles.paragraph}>Use these while you shape the auction workflow and backend migration.</Text>
        <AppButton label="Demo Slaughterhouse" kind="secondary" onPress={() => void loginAsDemo("slaughterhouse")} />
        <AppButton label="Demo Farmer" kind="secondary" onPress={() => void loginAsDemo("farmer")} />
      </SectionCard>
    </ScreenShell>
  );
}
