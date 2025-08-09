"""
Configuration settings for SQL Formatter application.
Handles environment-specific settings and formatting defaults.
"""

import os
from typing import Dict, Any


class Config:
    """Base configuration class."""
    
    # Flask settings
    DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    TESTING = False
    
    # Server settings
    HOST = os.environ.get('HOST', '127.0.0.1')
    PORT = int(os.environ.get('PORT', 5000))
    
    # CORS settings
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
    
    # Application settings
    APP_NAME = 'SQL Formatter'
    APP_VERSION = '1.0.0'
    
    # File upload settings (for future features)
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
    ALLOWED_EXTENSIONS = {'sql', 'txt'}
    
    # Logging settings
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'


class DevelopmentConfig(Config):
    """Development environment configuration."""
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Production environment configuration."""
    DEBUG = False
    TESTING = False
    
    # Restrict CORS in production
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:5000').split(',')


class TestingConfig(Config):
    """Testing environment configuration."""
    DEBUG = True
    TESTING = True


class SQLFormatterConfig:
    """SQL Formatter specific configuration and defaults."""
    
    # Default formatting options
    DEFAULT_FORMAT_OPTIONS: Dict[str, Any] = {
        'keyword_case': 'upper',          # 'upper', 'lower', 'capitalize'
        'identifier_case': None,          # None, 'upper', 'lower', 'capitalize'
        'strip_comments': False,          # Remove SQL comments
        'indent_tabs': False,             # Use tabs instead of spaces
        'indent_width': 4,                # Number of spaces for indentation
        'wrap_after': 79,                 # Wrap lines after N characters
        'comma_first': False,             # Put commas at start of line
        'reindent': True,                 # Apply indentation
        'strip_whitespace': True,         # Remove extra whitespace
        'add_semicolon': False,           # Add semicolon if missing
        'normalize_functions': True,       # Normalize function names
    }
    
    # Formatting presets for quick selection
    FORMATTING_PRESETS: Dict[str, Dict[str, Any]] = {
        'standard': {
            'keyword_case': 'upper',
            'identifier_case': None,
            'indent_width': 4,
            'indent_tabs': False,
            'reindent': True,
            'strip_whitespace': True
        },
        'compact': {
            'keyword_case': 'upper',
            'identifier_case': None,
            'indent_width': 2,
            'indent_tabs': False,
            'reindent': True,
            'strip_whitespace': True,
            'wrap_after': 120
        },
        'minimal': {
            'keyword_case': 'lower',
            'identifier_case': None,
            'indent_width': 2,
            'indent_tabs': False,
            'reindent': True,
            'strip_whitespace': True
        },
        'legacy': {
            'keyword_case': 'upper',
            'identifier_case': 'upper',
            'indent_width': 8,
            'indent_tabs': True,
            'reindent': True,
            'strip_whitespace': True
        }
    }
    
    # SQL dialect specific settings
    DIALECT_SETTINGS: Dict[str, Dict[str, Any]] = {
        'postgresql': {
            'quote_char': '"',
            'escape_quotes': True,
            'supports_window_functions': True
        },
        'mysql': {
            'quote_char': '`',
            'escape_quotes': True,
            'supports_window_functions': True
        },
        'sqlite': {
            'quote_char': '"',
            'escape_quotes': True,
            'supports_window_functions': True
        },
        'oracle': {
            'quote_char': '"',
            'escape_quotes': True,
            'supports_window_functions': True,
            'keyword_case': 'upper'  # Oracle convention
        },
        'sqlserver': {
            'quote_char': '[',
            'escape_quotes': True,
            'supports_window_functions': True
        }
    }
    
    # Validation settings
    MAX_SQL_LENGTH = 1024 * 1024  # 1MB max SQL size
    VALIDATION_TIMEOUT = 30       # Seconds
    
    # UI settings
    DEFAULT_THEME = 'light'
    AVAILABLE_THEMES = ['light', 'dark', 'auto']
    
    # Editor settings
    EDITOR_SETTINGS = {
        'tab_size': 4,
        'word_wrap': True,
        'line_numbers': True,
        'syntax_highlighting': True,
        'auto_format_on_paste': False,
        'vim_mode': False
    }


def get_config(environment: str = None) -> Config:
    """
    Get configuration based on environment.
    
    Args:
        environment: Environment name ('development', 'production', 'testing')
        
    Returns:
        Configuration object
    """
    if environment is None:
        environment = os.environ.get('FLASK_ENV', 'development')
    
    config_map = {
        'development': DevelopmentConfig,
        'production': ProductionConfig,
        'testing': TestingConfig
    }
    
    return config_map.get(environment, DevelopmentConfig)()


def get_formatter_config() -> SQLFormatterConfig:
    """Get SQL formatter configuration."""
    return SQLFormatterConfig()


# Environment detection
def is_development() -> bool:
    """Check if running in development mode."""
    return os.environ.get('FLASK_ENV', 'development') == 'development'


def is_production() -> bool:
    """Check if running in production mode."""
    return os.environ.get('FLASK_ENV') == 'production'


def is_testing() -> bool:
    """Check if running in testing mode."""
    return os.environ.get('FLASK_ENV') == 'testing'


# Export commonly used configurations
config = get_config()
formatter_config = get_formatter_config()

# Print current configuration on import (development only)
if is_development():
    print(f"SQL Formatter Config Loaded:")
    print(f"  Environment: {os.environ.get('FLASK_ENV', 'development')}")
    print(f"  Debug: {config.DEBUG}")
    print(f"  Host: {config.HOST}:{config.PORT}")
    print(f"  Default keyword case: {formatter_config.DEFAULT_FORMAT_OPTIONS['keyword_case']}")
    print(f"  Available presets: {list(formatter_config.FORMATTING_PRESETS.keys())}")