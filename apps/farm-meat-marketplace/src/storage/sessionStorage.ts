import AsyncStorage from "@react-native-async-storage/async-storage";

const MOCK_SESSION_USER_ID_KEY = "farm-marketplace/mock-session-user-id";

export async function loadMockSessionUserId() {
  return AsyncStorage.getItem(MOCK_SESSION_USER_ID_KEY);
}

export async function persistMockSessionUserId(userId: string) {
  await AsyncStorage.setItem(MOCK_SESSION_USER_ID_KEY, userId);
}

export async function clearMockSessionUserId() {
  await AsyncStorage.removeItem(MOCK_SESSION_USER_ID_KEY);
}
