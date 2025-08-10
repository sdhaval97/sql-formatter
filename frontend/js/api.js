/**
 * SQL Formatter API Client
 * Handles all communication with the Flask backend
 */

class SQLFormatterAPI {
    constructor() {
        this.baseURL = window.location.origin;
        this.timeout = 30000; // 30 seconds
        this.retryCount = 3;
        this.isOnline = true;
        
        // Initialize connection monitoring
        this.initConnectionMonitoring();
    }

    /**
     * Initialize connection monitoring
     */
    initConnectionMonitoring() {
        // Check API health on startup
        this.checkHealth();
        
        // Periodic health checks
        setInterval(() => {
            this.checkHealth();
        }, 60000); // Every minute

        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.checkHealth();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateConnectionStatus(false);
        });
    }

    /**
     * Generic API request method with error handling and retries
     */
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };

        for (let attempt = 1; attempt <= this.retryCount; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);

                const response = await fetch(url, {
                    ...defaultOptions,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                return data;

            } catch (error) {
                console.warn(`API request attempt ${attempt} failed:`, error.message);

                if (attempt === this.retryCount) {
                    // Last attempt failed
                    this.updateConnectionStatus(false);
                    throw new APIError(
                        `Failed after ${this.retryCount} attempts: ${error.message}`,
                        error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR'
                    );
                }

                // Wait before retry (exponential backoff)
                await this.sleep(1000 * Math.pow(2, attempt - 1));
            }
        }
    }

    /**
     * Format SQL text
     * @param {string} sqlText - The SQL to format
     * @param {Object} options - Formatting options
     * @returns {Promise<Object>} Formatted result
     */
    async formatSQL(sqlText, options = {}) {
        try {
            const result = await this.makeRequest('/api/format', {
                method: 'POST',
                body: JSON.stringify({
                    sql: sqlText,
                    options: options
                })
            });

            if (!result.success) {
                throw new APIError(result.error || 'Format operation failed', 'FORMAT_ERROR');
            }

            return result;

        } catch (error) {
            console.error('Format SQL error:', error);
            throw error;
        }
    }

    /**
     * Validate SQL syntax
     * @param {string} sqlText - The SQL to validate
     * @returns {Promise<Object>} Validation result
     */
    async validateSQL(sqlText) {
        try {
            const result = await this.makeRequest('/api/validate', {
                method: 'POST',
                body: JSON.stringify({
                    sql: sqlText
                })
            });

            if (!result.success) {
                throw new APIError(result.error || 'Validation failed', 'VALIDATION_ERROR');
            }

            return result.validation;

        } catch (error) {
            console.error('Validate SQL error:', error);
            throw error;
        }
    }

    /**
     * Minify SQL text
     * @param {string} sqlText - The SQL to minify
     * @returns {Promise<Object>} Minified result
     */
    async minifySQL(sqlText) {
        try {
            const result = await this.makeRequest('/api/minify', {
                method: 'POST',
                body: JSON.stringify({
                    sql: sqlText
                })
            });

            if (!result.success) {
                throw new APIError(result.error || 'Minify operation failed', 'MINIFY_ERROR');
            }

            return result;

        } catch (error) {
            console.error('Minify SQL error:', error);
            throw error;
        }
    }

    /**
     * Get formatting options and presets
     * @returns {Promise<Object>} Available options
     */
    async getFormatOptions() {
        try {
            const result = await this.makeRequest('/api/options');

            if (!result.success) {
                throw new APIError(result.error || 'Failed to get options', 'OPTIONS_ERROR');
            }

            return result;

        } catch (error) {
            console.error('Get options error:', error);
            throw error;
        }
    }

    /**
     * Check API health status
     * @returns {Promise<boolean>} Health status
     */
    async checkHealth() {
        try {
            const result = await this.makeRequest('/api/health');
            const isHealthy = result.status === 'healthy';
            this.updateConnectionStatus(isHealthy);
            return isHealthy;

        } catch (error) {
            console.warn('Health check failed:', error.message);
            this.updateConnectionStatus(false);
            return false;
        }
    }

    /**
     * Update connection status in UI
     * @param {boolean} isConnected - Connection status
     */
    updateConnectionStatus(isConnected) {
        const statusElement = document.getElementById('apiStatus');
        if (statusElement) {
            if (isConnected) {
                statusElement.textContent = '🟢 Connected';
                statusElement.style.color = 'var(--success-color)';
            } else {
                statusElement.textContent = '🔴 Disconnected';
                statusElement.style.color = 'var(--danger-color)';
            }
        }

        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('api-status-changed', {
            detail: { connected: isConnected }
        }));
    }

    /**
     * Get current formatting presets
     * @returns {Promise<Object>} Preset configurations
     */
    async getPresets() {
        try {
            const options = await this.getFormatOptions();
            return {
                standard: {
                    keyword_case: 'upper',
                    identifier_case: null,
                    indent_width: 4,
                    indent_tabs: false,
                    reindent: true,
                    strip_whitespace: true
                },
                compact: {
                    keyword_case: 'upper',
                    identifier_case: null,
                    indent_width: 2,
                    indent_tabs: false,
                    reindent: true,
                    strip_whitespace: true,
                    wrap_after: 120
                },
                minimal: {
                    keyword_case: 'lower',
                    identifier_case: null,
                    indent_width: 2,
                    indent_tabs: false,
                    reindent: true,
                    strip_whitespace: true
                },
                legacy: {
                    keyword_case: 'upper',
                    identifier_case: 'upper',
                    indent_width: 8,
                    indent_tabs: true,
                    reindent: true,
                    strip_whitespace: true
                }
            };

        } catch (error) {
            console.warn('Failed to get presets, using defaults:', error);
            // Return default presets if API fails
            return this.getDefaultPresets();
        }
    }

    /**
     * Get default preset configurations
     * @returns {Object} Default presets
     */
    getDefaultPresets() {
        return {
            standard: {
                keyword_case: 'upper',
                identifier_case: null,
                indent_width: 4,
                indent_tabs: false,
                reindent: true,
                strip_whitespace: true
            },
            compact: {
                keyword_case: 'upper',
                identifier_case: null,
                indent_width: 2,
                indent_tabs: false,
                reindent: true,
                strip_whitespace: true
            },
            minimal: {
                keyword_case: 'lower',
                identifier_case: null,
                indent_width: 2,
                indent_tabs: false,
                reindent: true,
                strip_whitespace: true
            },
            legacy: {
                keyword_case: 'upper',
                identifier_case: 'upper',
                indent_width: 8,
                indent_tabs: true,
                reindent: true,
                strip_whitespace: true
            }
        };
    }

    /**
     * Batch format multiple SQL statements
     * @param {Array<string>} sqlStatements - Array of SQL strings
     * @param {Object} options - Formatting options
     * @returns {Promise<Array>} Array of formatted results
     */
    async batchFormat(sqlStatements, options = {}) {
        const results = [];

        for (const sql of sqlStatements) {
            try {
                const result = await this.formatSQL(sql, options);
                results.push({
                    success: true,
                    original: sql,
                    formatted: result.formatted_sql,
                    stats: {
                        original_length: result.original_length,
                        formatted_length: result.formatted_length
                    }
                });
            } catch (error) {
                results.push({
                    success: false,
                    original: sql,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Utility method to pause execution
     * @param {number} ms - Milliseconds to sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get API statistics
     * @returns {Object} API usage statistics
     */
    getStats() {
        return {
            baseURL: this.baseURL,
            timeout: this.timeout,
            retryCount: this.retryCount,
            isOnline: this.isOnline,
            lastHealthCheck: this.lastHealthCheck || null
        };
    }
}

/**
 * Custom API Error class
 */
class APIError extends Error {
    constructor(message, type = 'UNKNOWN_ERROR', details = null) {
        super(message);
        this.name = 'APIError';
        this.type = type;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }

    /**
     * Get user-friendly error message
     */
    getUserMessage() {
        switch (this.type) {
            case 'TIMEOUT':
                return 'Request timed out. Please try again.';
            case 'NETWORK_ERROR':
                return 'Network error. Please check your connection.';
            case 'FORMAT_ERROR':
                return 'Failed to format SQL. Please check your syntax.';
            case 'VALIDATION_ERROR':
                return 'Failed to validate SQL.';
            case 'MINIFY_ERROR':
                return 'Failed to minify SQL.';
            default:
                return this.message || 'An unexpected error occurred.';
        }
    }
}

/**
 * Initialize API client
 */
const api = new SQLFormatterAPI();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SQLFormatterAPI, APIError, api };
} else {
    // Browser environment
    window.SQLFormatterAPI = SQLFormatterAPI;
    window.APIError = APIError;
    window.api = api;
}

// Debug helper for development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.apiDebug = {
        getStats: () => api.getStats(),
        checkHealth: () => api.checkHealth(),
        testFormat: (sql) => api.formatSQL(sql || 'SELECT * FROM users WHERE id = 1;'),
        testValidate: (sql) => api.validateSQL(sql || 'SELECT * FROM users'),
        testMinify: (sql) => api.minifySQL(sql || 'SELECT   *   FROM   users   WHERE   id   =   1;')
    };
    
    console.log('🔧 API Debug tools available: window.apiDebug');
}