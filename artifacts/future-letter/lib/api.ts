import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const AUTH_TOKEN_KEY = "auth_session_token";

function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  return "";
}

async function getToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  if (token) {
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  }
  return { "Content-Type": "application/json" };
}

export interface Message {
  id: number;
  userId: string;
  content: string;
  frequency: "yearly" | "biannual";
  createdAt: string;
  deliverAt: string;
  isDelivered: boolean;
  isRead: boolean;
}

export async function fetchMessages(): Promise<Message[]> {
  const base = getApiBaseUrl();
  const headers = await getAuthHeaders();
  const res = await fetch(`${base}/api/messages`, { headers });
  if (!res.ok) throw new Error("Failed to fetch messages");
  const data = await res.json();
  return data.messages;
}

export async function createMessage(content: string, frequency: "yearly" | "biannual"): Promise<Message> {
  const base = getApiBaseUrl();
  const headers = await getAuthHeaders();
  const res = await fetch(`${base}/api/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify({ content, frequency }),
  });
  if (!res.ok) throw new Error("Failed to create message");
  const data = await res.json();
  return data.message;
}

export async function deleteMessage(id: number): Promise<void> {
  const base = getApiBaseUrl();
  const headers = await getAuthHeaders();
  const res = await fetch(`${base}/api/messages/${id}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error("Failed to delete message");
}

export async function markMessageRead(id: number): Promise<Message> {
  const base = getApiBaseUrl();
  const headers = await getAuthHeaders();
  const res = await fetch(`${base}/api/messages/${id}/read`, {
    method: "POST",
    headers,
  });
  if (!res.ok) throw new Error("Failed to mark message as read");
  const data = await res.json();
  return data.message;
}

export async function getPhoneNumber(): Promise<string | null> {
  const base = getApiBaseUrl();
  const headers = await getAuthHeaders();
  const res = await fetch(`${base}/api/phone`, { headers });
  if (!res.ok) throw new Error("Failed to get phone number");
  const data = await res.json();
  return data.phoneNumber;
}

export async function savePhoneNumber(phoneNumber: string, deliveryChannel: "whatsapp" | "sms" = "whatsapp"): Promise<void> {
  const base = getApiBaseUrl();
  const headers = await getAuthHeaders();
  const res = await fetch(`${base}/api/phone`, {
    method: "POST",
    headers,
    body: JSON.stringify({ phoneNumber, deliveryChannel }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to save phone number");
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to request password reset");
  }
}

export async function resetPassword(email: string, code: string, newPassword: string): Promise<void> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, newPassword }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to reset password");
  }
}

export async function sendSupportMessage(subject: string, message: string): Promise<void> {
  const base = getApiBaseUrl();
  const headers = await getAuthHeaders();
  const res = await fetch(`${base}/api/support`, {
    method: "POST",
    headers,
    body: JSON.stringify({ subject, message }),
  });
  if (!res.ok) {
    let errorMsg = "Failed to send message";
    try {
      const data = await res.json();
      if (data.error) errorMsg = data.error;
    } catch {}
    throw new Error(errorMsg);
  }
}
