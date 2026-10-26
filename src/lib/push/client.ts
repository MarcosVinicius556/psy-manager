"use client";

import { getFirebaseAuth } from "@/lib/admin/firebase";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64Safe);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export function pushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

export async function registerAppServiceWorker() {
  if (!pushSupported()) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

export async function subscribeWebPush(publicKey: string) {
  if (!pushSupported()) throw new Error("push_nao_suportado");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("permissao_negada");

  const registration = (await navigator.serviceWorker.ready) || (await registerAppServiceWorker());
  if (!registration) throw new Error("sw_indisponivel");

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("nao_autenticado");
  const idToken = await user.getIdToken();

  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      plataforma: /iphone|ipad|ipod/i.test(navigator.userAgent) ? "ios" : "android",
    }),
  });
  if (!response.ok) throw new Error("falha_registro");
  return subscription;
}

export async function unsubscribeWebPush() {
  if (!pushSupported()) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (user) {
    const idToken = await user.getIdToken();
    await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
  }
  await subscription.unsubscribe();
}
