import React, { useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { ScreenShell } from "../components/ScreenShell";
import { SectionCard } from "../components/SectionCard";
import { useAppContext } from "../context/AppContext";
import { appConfig } from "../config/appConfig";
import { UserRole } from "../types";
import { styles } from "./sharedStyles";

export function AuthScreen() {
  const { login, signUp, loginAsDemo } = useAppContext();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<UserRole>("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(role === "customer" ? "customer@example.com" : "farmer@example.com");
  const [password, setPassword] = useState("password123");

  async function handleSubmit() {
    try {
      if (mode === "signin") {
        await login(email.trim(), password);
      } else {
        await signUp({
          name: name.trim() || (role === "customer" ? "New Customer" : "New Farm"),
          email: email.trim(),
          password,
          role
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Unable to continue", message);
    }
  }

  function switchRole(nextRole: UserRole) {
    setRole(nextRole);
    if (mode === "signin") {
      setEmail(nextRole === "customer" ? "customer@example.com" : "farmer@example.com");
      setPassword("password123");
    }
  }

  return (
    <ScreenShell
      title="Buy and sell local meat with pickup or shipping."
      subtitle={
        appConfig.useMockServices
          ? "Mock marketplace mode is enabled for UI testing. Live Supabase and Stripe code is still wired in and can be re-enabled later."
          : "Supabase-ready auth, storage, and database services are wired in. Use demo accounts now or connect your live Supabase project next."
      }
    >
      <View style={styles.heroBanner}>
        <Text style={styles.kicker}>Farm-direct marketplace</Text>
      </View>

      <SectionCard>
        <Text style={styles.sectionTitle}>Account mode</Text>
        <View style={styles.row}>
          <AppButton label="Sign In" kind={mode === "signin" ? "primary" : "secondary"} onPress={() => setMode("signin")} style={styles.flexButton} />
          <AppButton label="Create Account" kind={mode === "signup" ? "primary" : "secondary"} onPress={() => setMode("signup")} style={styles.flexButton} />
        </View>

        <Text style={styles.sectionTitle}>Role</Text>
        <View style={styles.row}>
          <AppButton label="Customer" kind={role === "customer" ? "primary" : "secondary"} onPress={() => switchRole("customer")} style={styles.flexButton} />
          <AppButton label="Farmer" kind={role === "farmer" ? "primary" : "secondary"} onPress={() => switchRole("farmer")} style={styles.flexButton} />
        </View>

        {mode === "signup" ? <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Full name or farm name" /> : null}
        <TextInput value={email} onChangeText={setEmail} style={styles.input} placeholder="Email" autoCapitalize="none" />
        <TextInput value={password} onChangeText={setPassword} style={styles.input} placeholder="Password" secureTextEntry />
        <AppButton label={mode === "signin" ? "Sign In" : "Create Account"} onPress={() => void handleSubmit()} />
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Demo quick access</Text>
        <Text style={styles.paragraph}>Use these while you are still wiring Supabase keys or database tables.</Text>
        <AppButton label="Continue as Demo Customer" kind="secondary" onPress={() => void loginAsDemo("customer")} />
        <AppButton label="Continue as Demo Farmer" kind="secondary" onPress={() => void loginAsDemo("farmer")} />
      </SectionCard>
    </ScreenShell>
  );
}
