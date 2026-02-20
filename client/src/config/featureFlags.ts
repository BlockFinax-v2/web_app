/**
 * Feature Flags Configuration (Web App)
 * 
 * Central configuration for feature toggles across the web app.
 * Adapted from the mobile app to use Vite environment variables.
 */

export interface FeatureFlags {
    USE_ALCHEMY_AA: boolean;
    ALCHEMY_AA_SCREENS: string[];
    ALCHEMY_DEBUG_MODE: boolean;
    ALCHEMY_GAS_SPONSORSHIP: boolean;
}

export const FEATURE_FLAGS: FeatureFlags = {
    USE_ALCHEMY_AA: true,
    ALCHEMY_AA_SCREENS: [],
    ALCHEMY_DEBUG_MODE: import.meta.env.DEV, // Vite's development mode check
    ALCHEMY_GAS_SPONSORSHIP: !!import.meta.env.VITE_ALCHEMY_GAS_POLICY_ID,
};

export function shouldUseAlchemyForScreen(screenName?: string): boolean {
    if (!FEATURE_FLAGS.USE_ALCHEMY_AA) {
        return false;
    }
    if (FEATURE_FLAGS.ALCHEMY_AA_SCREENS.length === 0) {
        return true;
    }
    return screenName ? FEATURE_FLAGS.ALCHEMY_AA_SCREENS.includes(screenName) : false;
}

export function getFeatureFlagsWithOverrides(): FeatureFlags {
    return {
        ...FEATURE_FLAGS,
        USE_ALCHEMY_AA:
            import.meta.env.VITE_USE_ALCHEMY_AA === 'true'
                ? true
                : FEATURE_FLAGS.USE_ALCHEMY_AA,
    };
}

export function logFeatureFlags(): void {
    if (import.meta.env.DEV) {
        console.log('[FeatureFlags] Current configuration:', {
            USE_ALCHEMY_AA: FEATURE_FLAGS.USE_ALCHEMY_AA,
            ALCHEMY_AA_SCREENS: FEATURE_FLAGS.ALCHEMY_AA_SCREENS,
            ALCHEMY_DEBUG_MODE: FEATURE_FLAGS.ALCHEMY_DEBUG_MODE,
            ALCHEMY_GAS_SPONSORSHIP: FEATURE_FLAGS.ALCHEMY_GAS_SPONSORSHIP,
        });
    }
}
