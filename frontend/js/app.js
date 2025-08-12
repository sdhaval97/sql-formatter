/**
 * SQL Formatter - Main Application Logic
 * Handles UI interactions, formatting operations, and user preferences
 */

class SQLFormatterApp {
    constructor() {
        this.currentSettings = this.getDefaultSettings();
        this.isFormatting = false;
        this.isResizing = false;
        this.lastFormattedSQL = '';
        
        // Initialize the application
        this.init();
    }

    /**
     * Ensure proper line wrapping for long SQL lines
     */
    ensureLineWrapping(sql, maxLineLength = 80) {
        const lines = sql.split('\n');
        const wrappedLines = [];
        
        for (const line of lines) {
            if (line.length <= maxLineLength) {
                wrappedLines.push(line);
            } else {
                // Split long lines at appropriate points
                const words = line.split(' ');
                let currentLine = '';
                
                for (const word of words) {
                    if ((currentLine + ' ' + word).length <= maxLineLength) {
                        currentLine += (currentLine ? ' ' : '') + word;
                    } else {
                        if (currentLine) {
                            wrappedLines.push(currentLine);
                        }
                        currentLine = word;
                    }
                }
                
                if (currentLine) {
                    wrappedLines.push(currentLine);
                }
            }
        }
        
        return wrappedLines.join('\n');
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Load user preferences
            this.loadUserPreferences();
            
            // Initialize UI elements
            this.initializeElements();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Set up keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            // Initialize panel resizing
            this.initializePanelResize();
            
            // Load formatting presets
            await this.loadPresets();
            
            // Update UI with current settings
            this.updateSettingsUI();
            
            // Set initial focus
            document.getElementById('inputSQL').focus();
            
            // Show welcome message
            this.showStatus('Ready to format SQL! Paste your code and click Format.', 'success');
            
            console.log('🚀 SQL Formatter initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showToast('Failed to initialize application', 'error');
        }
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        // Core elements
        this.elements = {
            inputSQL: document.getElementById('inputSQL'),
            outputSQL: document.getElementById('outputSQL'),
            formatBtn: document.getElementById('formatBtn'),
            validateBtn: document.getElementById('validateBtn'),
            minifyBtn: document.getElementById('minifyBtn'),
            clearBtn: document.getElementById('clearBtn'),
            copyBtn: document.getElementById('copyBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            loadFileBtn: document.getElementById('loadFileBtn'),
            fileInput: document.getElementById('fileInput'),
            presetSelect: document.getElementById('presetSelect'),
            
            // Status elements
            inputStats: document.getElementById('inputStats'),
            outputStats: document.getElementById('outputStats'),
            statusMessage: document.getElementById('statusMessage'),
            compressionRatio: document.getElementById('compressionRatio'),
            
            // Modal elements
            settingsModal: document.getElementById('settingsModal'),
            helpModal: document.getElementById('helpModal'),
            settingsBtn: document.getElementById('settingsBtn'),
            helpBtn: document.getElementById('helpBtn'),
            closeSettings: document.getElementById('closeSettings'),
            closeHelp: document.getElementById('closeHelp'),
            saveSettings: document.getElementById('saveSettings'),
            resetSettings: document.getElementById('resetSettings'),
            
            // Loading and toast
            loadingSpinner: document.getElementById('loadingSpinner'),
            toast: document.getElementById('toast'),
            toastMessage: document.getElementById('toastMessage'),
            
            // Resize handle
            resizeHandle: document.getElementById('resizeHandle')
        };

        // Validate all elements exist
        const missingElements = Object.entries(this.elements)
            .filter(([key, element]) => !element)
            .map(([key]) => key);

        if (missingElements.length > 0) {
            console.warn('Missing DOM elements:', missingElements);
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Format buttons
        this.elements.formatBtn.addEventListener('click', () => this.formatSQL());
        this.elements.validateBtn.addEventListener('click', () => this.validateSQL());
        this.elements.minifyBtn.addEventListener('click', () => this.minifySQL());
        
        // Utility buttons
        this.elements.clearBtn.addEventListener('click', () => this.clearAll());
        this.elements.copyBtn.addEventListener('click', () => this.copyToClipboard());
        this.elements.downloadBtn.addEventListener('click', () => this.downloadSQL());
        this.elements.loadFileBtn.addEventListener('click', () => this.elements.fileInput.click());
        this.elements.fileInput.addEventListener('change', (e) => this.loadFile(e));
        
        // Preset selection
        this.elements.presetSelect.addEventListener('change', (e) => this.applyPreset(e.target.value));
        
        // Modal controls
        this.elements.settingsBtn.addEventListener('click', () => this.showModal('settings'));
        this.elements.helpBtn.addEventListener('click', () => this.showModal('help'));
        this.elements.closeSettings.addEventListener('click', () => this.hideModal('settings'));
        this.elements.closeHelp.addEventListener('click', () => this.hideModal('help'));
        this.elements.saveSettings.addEventListener('click', () => this.saveSettings());
        this.elements.resetSettings.addEventListener('click', () => this.resetSettings());
        
        // Input changes
        this.elements.inputSQL.addEventListener('input', () => this.updateInputStats());
        this.elements.inputSQL.addEventListener('paste', () => {
            setTimeout(() => this.updateInputStats(), 100);
        });
        
        // Modal backdrop clicks
        this.elements.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.elements.settingsModal) {
                this.hideModal('settings');
            }
        });
        this.elements.helpModal.addEventListener('click', (e) => {
            if (e.target === this.elements.helpModal) {
                this.hideModal('help');
            }
        });

        // API status changes
        window.addEventListener('api-status-changed', (e) => {
            this.handleAPIStatusChange(e.detail.connected);
        });
    }

    /**
     * Set up keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Enter - Format SQL
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.formatSQL();
            }
            
            // Ctrl+Shift+V - Validate SQL
            if (e.ctrlKey && e.shiftKey && e.key === 'V') {
                e.preventDefault();
                this.validateSQL();
            }
            
            // Ctrl+Shift+C - Copy output
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                this.copyToClipboard();
            }
            
            // Ctrl+Shift+L - Clear all
            if (e.ctrlKey && e.shiftKey && e.key === 'L') {
                e.preventDefault();
                this.clearAll();
            }
            
            // F1 - Show help
            if (e.key === 'F1') {
                e.preventDefault();
                this.showModal('help');
            }
            
            // Escape - Close modals
            if (e.key === 'Escape') {
                this.hideModal('settings');
                this.hideModal('help');
            }
        });
    }

    /**
     * Initialize panel resizing functionality
     */
    initializePanelResize() {
        let startX = 0;
        let startLeftWidth = 0;
        
        this.elements.resizeHandle.addEventListener('mousedown', (e) => {
            this.isResizing = true;
            startX = e.clientX;
            
            const container = document.querySelector('.editor-container');
            const leftPanel = document.querySelector('.input-panel');
            startLeftWidth = leftPanel.offsetWidth;
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            
            e.preventDefault();
        });
        
        const handleMouseMove = (e) => {
            if (!this.isResizing) return;
            
            const container = document.querySelector('.editor-container');
            const deltaX = e.clientX - startX;
            const newLeftWidth = startLeftWidth + deltaX;
            const containerWidth = container.offsetWidth;
            const minWidth = 200;
            const maxWidth = containerWidth - 200;
            
            if (newLeftWidth >= minWidth && newLeftWidth <= maxWidth) {
                const leftPanel = document.querySelector('.input-panel');
                const rightPanel = document.querySelector('.output-panel');
                
                leftPanel.style.flex = `0 0 ${newLeftWidth}px`;
                rightPanel.style.flex = '1';
            }
        };
        
        const handleMouseUp = () => {
            this.isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
        };
    }

    /**
     * Format SQL
     */
    async formatSQL() {
        const sqlText = this.elements.inputSQL.value.trim();
        
        if (!sqlText) {
            this.showToast('Please enter some SQL to format', 'warning');
            this.elements.inputSQL.focus();
            return;
        }

        if (this.isFormatting) {
            this.showToast('Formatting in progress...', 'info');
            return;
        }

        try {
            this.isFormatting = true;
            this.showLoading('Formatting SQL...');
            this.setButtonsDisabled(true);

            console.log('Sending format request...');
            
            const result = await api.formatSQL(sqlText, this.currentSettings);
            
            console.log('Format result received:', result);
            
            if (result && result.formatted_sql) {
                // Process the formatted SQL to ensure proper line wrapping
                let formattedSQL = result.formatted_sql;
                
                // Force line breaks for very long lines (over 80 characters)
                formattedSQL = this.ensureLineWrapping(formattedSQL);
                
                // Simple text update without syntax highlighting for now
                const codeElement = this.elements.outputSQL.querySelector('code');
                if (codeElement) {
                    codeElement.textContent = formattedSQL;
                    this.lastFormattedSQL = formattedSQL;
                }
                
                this.updateOutputStats(result);
                this.showStatus('SQL formatted successfully!', 'success');
                this.showToast('SQL formatted successfully!', 'success');
                
                console.log('Formatting completed successfully');
            } else {
                throw new Error('Invalid response format');
            }
            
        } catch (error) {
            console.error('Format error:', error);
            this.showStatus(`Format failed: ${error.message}`, 'error');
            this.showToast(error.message, 'error');
            
            // Show original SQL in output on error
            const codeElement = this.elements.outputSQL.querySelector('code');
            if (codeElement) {
                codeElement.textContent = sqlText;
            }
            
        } finally {
            this.isFormatting = false;
            this.hideLoading();
            this.setButtonsDisabled(false);
            console.log('Format operation completed');
        }
    }

    /**
     * Validate SQL
     */
    async validateSQL() {
        const sqlText = this.elements.inputSQL.value.trim();
        
        if (!sqlText) {
            this.showToast('Please enter some SQL to validate', 'warning');
            return;
        }

        try {
            this.showLoading('Validating SQL...');
            
            console.log('🔍 Starting validation for SQL:', sqlText);
            
            const validation = await api.validateSQL(sqlText);
            
            console.log('📊 Validation result received:', validation);
            console.log('📊 Is valid:', validation.is_valid);
            console.log('📊 Errors:', validation.errors);
            console.log('📊 Error details:', validation.error_details);
            
            // Clear any previous error highlighting
            this.clearValidationHighlights();
            
            if (validation.is_valid) {
                this.showStatus('✅ SQL is valid!', 'success');
                this.showToast('✅ SQL is valid!', 'success');
            } else {
                const errorCount = validation.errors.length;
                const errorSummary = errorCount === 1 ? '1 error found' : `${errorCount} errors found`;
                
                this.showStatus(`❌ SQL validation failed: ${errorSummary}`, 'error');
                
                // Show a concise error notification
                const primaryError = validation.errors[0];
                // Shorten the error message for the toast
                let shortError = primaryError;
                if (shortError.length > 60) {
                    shortError = shortError.substring(0, 57) + '...';
                }
                this.showToast(`❌ ${shortError}`, 'error');
                
                // Show detailed errors in validation panel
                if (validation.error_details && validation.error_details.length > 0) {
                    this.highlightValidationErrors(validation.error_details);
                }
                
                // Log detailed errors for debugging
                console.log('Validation errors:', validation.errors);
                console.log('Error details:', validation.error_details);
            }
            
            if (validation.warnings && validation.warnings.length > 0) {
                const warningText = validation.warnings.slice(0, 2).join(', ');
                this.showToast(`Warnings: ${warningText}`, 'warning');
                console.log('Validation warnings:', validation.warnings);
            }
            
        } catch (error) {
            console.error('Validation error:', error);
            this.showStatus(`❌ Validation failed: ${error.message}`, 'error');
            this.showToast(`Validation failed: ${error.message}`, 'error');
            
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Highlight validation errors in the input textarea
     */
    highlightValidationErrors(errorDetails) {
        const textarea = this.elements.inputSQL;
        const sqlText = textarea.value;
        
        // Create a visual indicator for errors
        this.showValidationErrors(errorDetails, sqlText);
        
        // Focus on the first error position
        if (errorDetails.length > 0) {
            const firstError = errorDetails[0];
            if (firstError.position !== undefined) {
                // Try to position cursor near the error
                const lines = sqlText.split('\n');
                let charPos = 0;
                
                // Simple approximation - this could be enhanced
                if (firstError.position < sqlText.length) {
                    textarea.focus();
                    textarea.setSelectionRange(firstError.position, firstError.position);
                }
            }
        }
    }

    /**
     * Show validation errors in a detailed view
     */
    showValidationErrors(errorDetails, sqlText) {
        // Create or update an error display panel
        let errorPanel = document.getElementById('validationErrorPanel');
        
        if (!errorPanel) {
            errorPanel = document.createElement('div');
            errorPanel.id = 'validationErrorPanel';
            errorPanel.className = 'validation-error-panel';
            
            // Insert after the input panel
            const inputPanel = document.querySelector('.input-panel');
            inputPanel.appendChild(errorPanel);
        }
        
        // Build error list HTML
        let errorHTML = '<div class="error-header">❌ Validation Errors:</div>';
        errorHTML += '<div class="error-list">';
        
        errorDetails.forEach((error, index) => {
            errorHTML += `
                <div class="error-item" data-position="${error.position || 0}">
                    <div class="error-type">${error.type || 'syntax_error'}</div>
                    <div class="error-message">${error.message}</div>
                    ${error.token ? `<div class="error-token">Near: "${error.token}"</div>` : ''}
                </div>
            `;
        });
        
        errorHTML += '</div>';
        errorHTML += '<div class="error-footer"><button onclick="window.sqlFormatterApp.clearValidationHighlights()">Clear Errors</button></div>';
        
        errorPanel.innerHTML = errorHTML;
        errorPanel.style.display = 'block';
        
        // Add click handlers to jump to error positions
        errorPanel.querySelectorAll('.error-item').forEach(item => {
            item.addEventListener('click', () => {
                const position = parseInt(item.dataset.position) || 0;
                this.jumpToPosition(position);
            });
        });
    }

    /**
     * Clear validation error highlights
     */
    clearValidationHighlights() {
        const errorPanel = document.getElementById('validationErrorPanel');
        if (errorPanel) {
            errorPanel.style.display = 'none';
        }
        
        // Remove any text highlighting
        this.elements.inputSQL.style.backgroundColor = '';
    }

    /**
     * Jump to a specific position in the input textarea
     */
    jumpToPosition(position) {
        const textarea = this.elements.inputSQL;
        textarea.focus();
        
        // Set cursor position
        textarea.setSelectionRange(position, position + 1);
        
        // Scroll to make the position visible
        const lines = textarea.value.substring(0, position).split('\n');
        const lineNumber = lines.length;
        const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
        textarea.scrollTop = (lineNumber - 1) * lineHeight - textarea.clientHeight / 2;
    }

    /**
     * Minify SQL
     */
    async minifySQL() {
        const sqlText = this.elements.inputSQL.value.trim();
        
        if (!sqlText) {
            this.showToast('Please enter some SQL to minify', 'warning');
            return;
        }

        try {
            this.showLoading('Minifying SQL...');
            
            const result = await api.minifySQL(sqlText);
            
            this.elements.outputSQL.querySelector('code').textContent = result.minified_sql;
            this.lastFormattedSQL = result.minified_sql;
            
            // Trigger syntax highlighting
            setTimeout(() => {
                if (window.Prism && window.Prism.highlightElement) {
                    try {
                        const codeElement = this.elements.outputSQL.querySelector('code');
                        if (codeElement) {
                            Prism.highlightElement(codeElement);
                        }
                    } catch (error) {
                        console.warn('Syntax highlighting failed:', error);
                    }
                }
            }, 10);
            
            this.updateCompressionStats(result);
            this.showStatus('SQL minified successfully!', 'success');
            this.showToast(`SQL minified! ${result.compression_ratio}% smaller`, 'success');
            
        } catch (error) {
            console.error('Minify error:', error);
            this.showStatus(`Minify failed: ${error.getUserMessage()}`, 'error');
            this.showToast(error.getUserMessage(), 'error');
            
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Clear all content
     */
    clearAll() {
        this.elements.inputSQL.value = '';
        this.elements.outputSQL.querySelector('code').textContent = '';
        this.lastFormattedSQL = '';
        this.updateInputStats();
        this.elements.outputStats.textContent = 'Ready to format';
        this.elements.compressionRatio.textContent = '';
        this.showStatus('Cleared all content', 'info');
        this.elements.inputSQL.focus();
    }

    /**
     * Copy formatted SQL to clipboard
     */
    async copyToClipboard() {
        const content = this.lastFormattedSQL || this.elements.outputSQL.querySelector('code').textContent;
        
        if (!content.trim()) {
            this.showToast('No formatted SQL to copy', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(content);
            this.showToast('Copied to clipboard!', 'success');
            
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = content;
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                this.showToast('Copied to clipboard!', 'success');
            } catch (fallbackError) {
                this.showToast('Failed to copy to clipboard', 'error');
            }
            
            document.body.removeChild(textArea);
        }
    }

    /**
     * Download formatted SQL as file
     */
    downloadSQL() {
        const content = this.lastFormattedSQL || this.elements.outputSQL.querySelector('code').textContent;
        
        if (!content.trim()) {
            this.showToast('No formatted SQL to download', 'warning');
            return;
        }

        const blob = new Blob([content], { type: 'text/sql' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `formatted_sql_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.sql`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('SQL file downloaded!', 'success');
    }

    /**
     * Load SQL file
     */
    loadFile(event) {
        const file = event.target.files[0];
        
        if (!file) return;

        if (!file.name.match(/\.(sql|txt)$/i)) {
            this.showToast('Please select a .sql or .txt file', 'warning');
            return;
        }

        const reader = new FileReader();
        
        reader.onload = (e) => {
            this.elements.inputSQL.value = e.target.result;
            this.updateInputStats();
            this.showToast(`Loaded ${file.name}`, 'success');
        };
        
        reader.onerror = () => {
            this.showToast('Failed to load file', 'error');
        };
        
        reader.readAsText(file);
        
        // Clear the input so the same file can be loaded again
        event.target.value = '';
    }

    /**
     * Apply formatting preset
     */
    async applyPreset(presetName) {
        if (!presetName) return;

        try {
            const presets = await api.getPresets();
            const preset = presets[presetName];
            
            if (preset) {
                this.currentSettings = { ...this.currentSettings, ...preset };
                this.updateSettingsUI();
                this.saveUserPreferences();
                this.showToast(`Applied ${presetName} preset`, 'success');
            }
            
        } catch (error) {
            console.error('Failed to apply preset:', error);
            this.showToast('Failed to apply preset', 'error');
        }
    }

    /**
     * Load formatting presets
     */
    async loadPresets() {
        try {
            const presets = await api.getPresets();
            const select = this.elements.presetSelect;
            
            // Clear existing options (except the first one)
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
            
            // Add preset options
            Object.keys(presets).forEach(presetName => {
                const option = document.createElement('option');
                option.value = presetName;
                option.textContent = presetName.charAt(0).toUpperCase() + presetName.slice(1);
                select.appendChild(option);
            });
            
        } catch (error) {
            console.warn('Failed to load presets:', error);
        }
    }

    /**
     * Show modal
     */
    showModal(type) {
        const modal = type === 'settings' ? this.elements.settingsModal : this.elements.helpModal;
        modal.classList.add('show');
        
        // Focus first input in settings modal
        if (type === 'settings') {
            setTimeout(() => {
                const firstInput = modal.querySelector('select, input');
                if (firstInput) firstInput.focus();
            }, 100);
        }
    }

    /**
     * Hide modal
     */
    hideModal(type) {
        const modal = type === 'settings' ? this.elements.settingsModal : this.elements.helpModal;
        modal.classList.remove('show');
    }

    /**
     * Save settings from modal
     */
    saveSettings() {
        // Get settings from form
        this.currentSettings = {
            ...this.currentSettings,
            keyword_case: document.getElementById('keywordCase').value,
            indent_width: parseInt(document.getElementById('indentWidth').value),
            indent_tabs: document.getElementById('indentTabs').checked,
            strip_comments: document.getElementById('stripComments').checked,
            comma_first: document.getElementById('commaFirst').checked,
            wrap_after: parseInt(document.getElementById('wrapAfter').value)
        };
        
        this.saveUserPreferences();
        this.hideModal('settings');
        this.showToast('Settings saved!', 'success');
    }

    /**
     * Reset settings to defaults
     */
    resetSettings() {
        this.currentSettings = this.getDefaultSettings();
        this.updateSettingsUI();
        this.saveUserPreferences();
        this.showToast('Settings reset to defaults', 'info');
    }

    /**
     * Update settings UI with current values
     */
    updateSettingsUI() {
        document.getElementById('keywordCase').value = this.currentSettings.keyword_case;
        document.getElementById('indentWidth').value = this.currentSettings.indent_width;
        document.getElementById('indentTabs').checked = this.currentSettings.indent_tabs;
        document.getElementById('stripComments').checked = this.currentSettings.strip_comments;
        document.getElementById('commaFirst').checked = this.currentSettings.comma_first;
        document.getElementById('wrapAfter').value = this.currentSettings.wrap_after;
    }

    /**
     * Update input statistics
     */
    updateInputStats() {
        const text = this.elements.inputSQL.value;
        const charCount = text.length;
        const lineCount = text.split('\n').length;
        
        this.elements.inputStats.textContent = `${charCount} characters, ${lineCount} lines`;
    }

    /**
     * Update output statistics
     */
    updateOutputStats(result) {
        const charCount = result.formatted_length;
        const lineCount = result.formatted_sql.split('\n').length;
        
        this.elements.outputStats.textContent = `${charCount} characters, ${lineCount} lines`;
    }

    /**
     * Update compression statistics
     */
    updateCompressionStats(result) {
        this.elements.compressionRatio.textContent = `${result.compression_ratio}% smaller`;
        this.elements.outputStats.textContent = `${result.minified_length} characters (compressed)`;
    }

    /**
     * Show status message
     */
    showStatus(message, type = 'info') {
        this.elements.statusMessage.textContent = message;
        
        // Remove existing type classes
        this.elements.statusMessage.classList.remove('error', 'success', 'warning', 'info');
        this.elements.statusMessage.classList.add(type);
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        this.elements.toastMessage.textContent = message;
        this.elements.toast.className = `toast ${type}`;
        this.elements.toast.classList.add('show');
        
        // Longer duration for error messages
        const duration = type === 'error' ? 5000 : 3000;
        
        setTimeout(() => {
            this.elements.toast.classList.remove('show');
        }, duration);
    }

    /**
     * Show loading spinner
     */
    showLoading(message = 'Loading...') {
        this.elements.loadingSpinner.querySelector('span').textContent = message;
        this.elements.loadingSpinner.classList.add('show');
    }

    /**
     * Hide loading spinner
     */
    hideLoading() {
        this.elements.loadingSpinner.classList.remove('show');
    }

    /**
     * Set buttons disabled/enabled state
     */
    setButtonsDisabled(disabled) {
        const buttons = [
            this.elements.formatBtn,
            this.elements.validateBtn,
            this.elements.minifyBtn
        ];
        
        buttons.forEach(btn => {
            btn.disabled = disabled;
        });
    }

    /**
     * Handle API status changes
     */
    handleAPIStatusChange(connected) {
        if (!connected) {
            this.showToast('Connection lost. Some features may not work.', 'warning');
            this.setButtonsDisabled(true);
        } else {
            this.setButtonsDisabled(false);
        }
    }

    /**
     * Get default settings
     */
    getDefaultSettings() {
        return {
            keyword_case: 'upper',
            identifier_case: null,
            strip_comments: false,
            indent_tabs: false,
            indent_width: 4,
            wrap_after: 79,
            comma_first: false,
            reindent: true,
            strip_whitespace: true
        };
    }

    /**
     * Save user preferences to localStorage
     */
    saveUserPreferences() {
        try {
            localStorage.setItem('sqlFormatter_settings', JSON.stringify(this.currentSettings));
        } catch (error) {
            console.warn('Failed to save preferences:', error);
        }
    }

    /**
     * Load user preferences from localStorage
     */
    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('sqlFormatter_settings');
            if (saved) {
                this.currentSettings = { ...this.getDefaultSettings(), ...JSON.parse(saved) };
            }
        } catch (error) {
            console.warn('Failed to load preferences:', error);
            this.currentSettings = this.getDefaultSettings();
        }
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.sqlFormatterApp = new SQLFormatterApp();
});

// Export for debugging
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.appDebug = {
        getApp: () => window.sqlFormatterApp,
        getSettings: () => window.sqlFormatterApp?.currentSettings,
        testFormat: () => {
            const app = window.sqlFormatterApp;
            if (app) {
                app.elements.inputSQL.value = 'select u.id,u.name from users u where u.active=1;';
                app.formatSQL();
            }
        }
    };
    
    console.log('🔧 App Debug tools available: window.appDebug');
}