import * as Updates from 'expo-updates';

export async function checkForAppUpdate() {
  try {
    // Skip in development
    if (__DEV__) {
      return null;
    }

    // Skip if expo-updates isn't enabled
    if (!Updates.isEnabled) {
      return null;
    }

    const update = await Updates.checkForUpdateAsync();

    if (!update.isAvailable) {
      return null;
    }

    return update;
  } catch (err) {
    console.log('[Updates] Check failed:', err);
    return null;
  }
}

export async function installUpdate() {
  try {
    if (!Updates.isEnabled) {
      return false;
    }

    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();

    return true;
  } catch (err) {
    console.log('[Updates] Install failed:', err);
    return false;
  }
}