import { Capacitor } from "@capacitor/core";

/**
 * Lightweight haptic feedback helpers for the native app. All are no-ops on the web
 * and swallow errors (haptics are non-essential polish, and unsupported devices/the
 * emulator simply do nothing). The plugin is imported lazily so its bridge code never
 * runs during SSR or on the web. See MOBILE.md Step 5.
 */

type Impact = "light" | "medium" | "heavy";

export async function hapticImpact(strength: Impact = "light"): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    const style =
      strength === "heavy" ? ImpactStyle.Heavy : strength === "medium" ? ImpactStyle.Medium : ImpactStyle.Light;
    await Haptics.impact({ style });
  } catch {
    // Haptics are best-effort polish; never let them break an interaction.
  }
}

export async function hapticSuccess(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    // best-effort
  }
}
