/**
 * Feature Flag System
 * Centralized configuration for phased rollout controls
 *
 * Usage:
 *   import { useFeatureFlag, isFeatureFlagEnabled } from '../utils/featureFlags';
 *   const isEnabled = isFeatureFlagEnabled('CENTRALIZED_ERROR_HANDLING');
 *
 * Environment Variables (set in .env or deployment config):
 *   REACT_APP_CENTRALIZED_ERROR_HANDLING=true|false
 *   REACT_APP_USE_SDK_SEARCH_BUILDER=true|false
 *   etc.
 */

/**
 * Feature flag definitions
 * Each flag controls a migration phase
 */
const FEATURE_FLAGS = {
  // Phase 1: Error Handling
  CENTRALIZED_ERROR_HANDLING: {
    name: "CENTRALIZED_ERROR_HANDLING",
    description: "Enable centralized error handling for fetch calls",
    phase: 1,
    default: false,
    envVar: "REACT_APP_CENTRALIZED_ERROR_HANDLING",
  },

  // Phase 2: URL Builders
  USE_SDK_SEARCH_BUILDER: {
    name: "USE_SDK_SEARCH_BUILDER",
    description:
      "Use SDK search query builder instead of legacy buildSearchUrl()",
    phase: 2,
    default: false,
    envVar: "REACT_APP_USE_SDK_SEARCH_BUILDER",
  },
  USE_SDK_REPORT_BUILDER: {
    name: "USE_SDK_REPORT_BUILDER",
    description:
      "Use SDK report query builder instead of legacy buildReportUrl()",
    phase: 2,
    default: false,
    envVar: "REACT_APP_USE_SDK_REPORT_BUILDER",
  },
  USE_SDK_RECORD_BUILDER: {
    name: "USE_SDK_RECORD_BUILDER",
    description: "Use SDK record URL builder",
    phase: 2,
    default: false,
    envVar: "REACT_APP_USE_SDK_RECORD_BUILDER",
  },
  USE_SDK_TYPE_BUILDER: {
    name: "USE_SDK_TYPE_BUILDER",
    description: "Use SDK types/taxonomy URL builder",
    phase: 2,
    default: false,
    envVar: "REACT_APP_USE_SDK_TYPE_BUILDER",
  },
  USE_SDK_CHIP_ADAPTER: {
    name: "USE_SDK_CHIP_ADAPTER",
    description: "Use SDK chip-to-query string adapter",
    phase: 2,
    default: false,
    envVar: "REACT_APP_USE_SDK_CHIP_ADAPTER",
  },
  USE_SDK_API_BUILDER: {
    name: "USE_SDK_API_BUILDER",
    description: "Use SDK API endpoint builder for consolidated selectors",
    phase: 2,
    default: false,
    envVar: "REACT_APP_USE_SDK_API_BUILDER",
  },

  // Phase 3: URL Compatibility
  USE_SDK_URL_COMPAT: {
    name: "USE_SDK_URL_COMPAT",
    description: "Enable URL compatibility layer for legacy hash-based URLs",
    phase: 3,
    default: false,
    envVar: "REACT_APP_USE_SDK_URL_COMPAT",
  },
  USE_QUERY_ONLY_URLS: {
    name: "USE_QUERY_ONLY_URLS",
    description: "Remove hash from URLs, use query params only",
    phase: 3,
    default: false,
    envVar: "REACT_APP_USE_QUERY_ONLY_URLS",
  },

  // Phase 6: Report System
  USE_SDK_REPORT_COMPONENTS: {
    name: "USE_SDK_REPORT_COMPONENTS",
    description: "Use SDK report components instead of embedded reports",
    phase: 6,
    default: false,
    envVar: "REACT_APP_USE_SDK_REPORT_COMPONENTS",
  },

  // Phase 7: RTK Query
  USE_RTKQUERY_CACHE: {
    name: "USE_RTKQUERY_CACHE",
    description: "Use RTK Query for data caching instead of Redux thunks",
    phase: 7,
    default: false,
    envVar: "REACT_APP_USE_RTKQUERY_CACHE",
  },
};

/**
 * Get feature flag value from environment or default
 * @param {string} flagName - Name of the feature flag (e.g., 'CENTRALIZED_ERROR_HANDLING')
 * @returns {boolean} - Whether the feature flag is enabled
 */
export const isFeatureFlagEnabled = (flagName) => {
  const flag = FEATURE_FLAGS[flagName];

  if (!flag) {
    console.warn(`Unknown feature flag: ${flagName}`);
    return false;
  }

  // Try to get from environment variable
  const envValue = process.env[flag.envVar];

  if (envValue !== undefined) {
    // Convert string to boolean
    if (envValue === "true" || envValue === "1" || envValue === true) {
      return true;
    }
    if (envValue === "false" || envValue === "0" || envValue === false) {
      return false;
    }
  }

  // Fall back to default
  return flag.default;
};

/**
 * Get all feature flags with current state
 * Useful for debugging and logging
 * @returns {object} - Object with all flags and their states
 */
export const getAllFeatureFlags = () => {
  const flags = {};
  Object.keys(FEATURE_FLAGS).forEach((flagName) => {
    flags[flagName] = isFeatureFlagEnabled(flagName);
  });
  return flags;
};

/**
 * Get feature flags by phase
 * @param {number} phase - Phase number (1-8)
 * @returns {object} - Flags for this phase with their states
 */
export const getFeatureFlagsByPhase = (phase) => {
  const flags = {};
  Object.entries(FEATURE_FLAGS).forEach(([flagName, config]) => {
    if (config.phase === phase) {
      flags[flagName] = isFeatureFlagEnabled(flagName);
    }
  });
  return flags;
};

/**
 * Get feature flag metadata
 * Useful for CI/CD integration and deployment dashboards
 * @returns {object} - All flag definitions with current values
 */
export const getFeatureFlagMetadata = () => {
  const metadata = {};
  Object.entries(FEATURE_FLAGS).forEach(([flagName, config]) => {
    metadata[flagName] = {
      ...config,
      currentValue: isFeatureFlagEnabled(flagName),
    };
  });
  return metadata;
};

/**
 * React hook to use a feature flag
 * Usage in components:
 *   const isEnabled = useFeatureFlag('CENTRALIZED_ERROR_HANDLING');
 *
 * @param {string} flagName - Name of the feature flag
 * @returns {boolean} - Whether the feature is enabled
 */
export const useFeatureFlag = (flagName) => {
  // In a real implementation with React Context, this would re-render
  // when feature flags are updated. For now, it's a simple wrapper.
  return isFeatureFlagEnabled(flagName);
};

/**
 * Conditional render component helper
 * Usage:
 *   <FeatureFlagWrapper flag="CENTRALIZED_ERROR_HANDLING">
 *     <NewErrorHandler />
 *   </FeatureFlagWrapper>
 *
 * @component
 */
export const FeatureFlagWrapper = ({ flag, children, fallback = null }) => {
  if (isFeatureFlagEnabled(flag)) {
    return children;
  }
  return fallback;
};

/**
 * Log all active feature flags (for debugging)
 * Call this in useEffect on app initialization
 */
export const logActiveFeatureFlags = () => {
  const flags = getAllFeatureFlags();
  const active = Object.entries(flags)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name);

  if (active.length > 0) {
    console.log("🚀 Active feature flags:", active);
  } else {
    console.log(
      "Feature flags: All defaults (no experimental features active)",
    );
  }

  // Log by phase for deployment tracking
  const allMetadata = getFeatureFlagMetadata();
  Object.entries(allMetadata).forEach(([flagName, config]) => {
    if (config.currentValue) {
      console.log(
        `  [Phase ${config.phase}] ✓ ${flagName} - ${config.description}`,
      );
    }
  });
};

/**
 * Export flag definitions for CI/CD integration
 * Used by deployment scripts to verify flag states
 */
export const FLAG_DEFINITIONS = FEATURE_FLAGS;

export default {
  isFeatureFlagEnabled,
  useFeatureFlag,
  FeatureFlagWrapper,
  getAllFeatureFlags,
  getFeatureFlagsByPhase,
  getFeatureFlagMetadata,
  logActiveFeatureFlags,
  FLAG_DEFINITIONS,
};
