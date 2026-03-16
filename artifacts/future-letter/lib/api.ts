import * as SecureStore from "expo-secure-store";

const AUTH_TOKEN_KEY = "auth_session_token";

function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  return "";
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
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
