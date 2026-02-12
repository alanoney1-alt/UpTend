import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

class BiometricAuthService {
  private static instance: BiometricAuthService;

  static getInstance(): BiometricAuthService {
    if (!this.instance) this.instance = new BiometricAuthService();
    return this.instance;
  }

  async isAvailable(): Promise<boolean> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  }

  async getBiometricType(): Promise<BiometricType> {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'facial';
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'fingerprint';
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) return 'iris';
    return 'none';
  }

  async authenticate(reason: string): Promise<boolean> {
    const available = await this.isAvailable();
    if (!available) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      fallbackLabel: 'Use Passcode',
    });

    if (result.success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    return result.success;
  }

  async confirmBooking(serviceDescription: string, amount: string): Promise<boolean> {
    return this.authenticate(`Confirm booking: ${serviceDescription} — ${amount}`);
  }

  async confirmPayment(amount: string): Promise<boolean> {
    return this.authenticate(`Authorize payment of ${amount}`);
  }

  async confirmIdentity(): Promise<boolean> {
    return this.authenticate('Verify your identity');
  }
}

export default BiometricAuthService;
