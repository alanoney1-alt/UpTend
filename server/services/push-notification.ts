/**
 * Push Notification Service - Expo Push API
 */

interface PushResult {
  success: boolean;
  ticketId?: string;
  error?: string;
}

export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<PushResult> {
  if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken[')) {
    return { success: false, error: 'Invalid Expo push token' };
  }

  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: expoPushToken,
        title,
        body,
        data: data || {},
        sound: 'default',
        badge: 1,
        channelId: 'default',
      }),
    });

    const result = await res.json();
    if (result.data?.status === 'ok') {
      console.log(`[Push] Sent to ${expoPushToken.slice(0, 30)}... - ticket: ${result.data.id}`);
      return { success: true, ticketId: result.data.id };
    } else {
      const errMsg = result.data?.message || result.errors?.[0]?.message || 'Unknown error';
      console.error(`[Push] Error: ${errMsg}`);
      return { success: false, error: errMsg };
    }
  } catch (error: any) {
    console.error('[Push] Error:', error.message);
    return { success: false, error: error.message };
  }
}
