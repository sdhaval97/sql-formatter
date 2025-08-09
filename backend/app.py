"""
Flask backend API for SQL Formatter application.
Provides endpoints for SQL formatting, validation, and minification.
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import sys

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from formatter import SQLFormatter

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend-backend communication

# Initialize SQL formatter
sql_formatter = SQLFormatter()

# Configuration
app.config['DEBUG'] = True
app.config['JSON_SORT_KEYS'] = False


@app.route('/')
def index():
    """Serve the main application page."""
    try:
        # Serve the frontend index.html file
        frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend')
        return send_from_directory(frontend_dir, 'index.html')
    except Exception as e:
        return jsonify({'error': 'Frontend not found', 'details': str(e)}), 404


@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files (CSS, JS, etc.)."""
    try:
        frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend')
        return send_from_directory(frontend_dir, filename)
    except Exception as e:
        return jsonify({'error': 'File not found', 'details': str(e)}), 404


@app.route('/api/format', methods=['POST'])
def format_sql():
    """
    Format SQL with specified options.
    
    Expected JSON payload:
    {
        "sql": "SELECT * FROM users WHERE id=1",
        "options": {
            "keyword_case": "upper",
            "indent_width": 4,
            "indent_tabs": false,
            ...
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        sql_text = data.get('sql', '')
        options = data.get('options', {})
        
        if not sql_text:
            return jsonify({
                'success': False,
                'error': 'No SQL text provided'
            }), 400
        
        # Format the SQL
        result = sql_formatter.format_sql(sql_text, options)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}',
            'formatted_sql': data.get('sql', '') if 'data' in locals() else ''
        }), 500


@app.route('/api/validate', methods=['POST'])
def validate_sql():
    """
    Validate SQL syntax.
    
    Expected JSON payload:
    {
        "sql": "SELECT * FROM users"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        sql_text = data.get('sql', '')
        
        if not sql_text:
            return jsonify({
                'success': False,
                'error': 'No SQL text provided'
            }), 400
        
        # Validate the SQL
        validation_result = sql_formatter.validate_sql(sql_text)
        
        return jsonify({
            'success': True,
            'validation': validation_result
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Validation error: {str(e)}'
        }), 500


@app.route('/api/minify', methods=['POST'])
def minify_sql():
    """
    Minify SQL by removing unnecessary whitespace.
    
    Expected JSON payload:
    {
        "sql": "SELECT * FROM users WHERE id = 1"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        sql_text = data.get('sql', '')
        
        if not sql_text:
            return jsonify({
                'success': False,
                'error': 'No SQL text provided'
            }), 400
        
        # Minify the SQL
        minified = sql_formatter.minify_sql(sql_text)
        
        return jsonify({
            'success': True,
            'minified_sql': minified,
            'original_length': len(sql_text),
            'minified_length': len(minified),
            'compression_ratio': round((1 - len(minified) / len(sql_text)) * 100, 1) if len(sql_text) > 0 else 0
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Minification error: {str(e)}',
            'minified_sql': sql_text
        }), 500


@app.route('/api/options', methods=['GET'])
def get_format_options():
    """Get available formatting options and their default values."""
    try:
        return jsonify({
            'success': True,
            'options': sql_formatter.default_options,
            'keyword_cases': ['upper', 'lower', 'capitalize'],
            'identifier_cases': [None, 'upper', 'lower', 'capitalize'],
            'indent_widths': [2, 4, 8],
            'sql_keywords': sql_formatter.get_sql_keywords()[:50]  # First 50 keywords for reference
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error getting options: {str(e)}'
        }), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'SQL Formatter API',
        'version': '1.0.0'
    })


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


if __name__ == '__main__':
    # Development server
    print("Starting SQL Formatter API...")
    print("Available endpoints:")
    print("  POST /api/format   - Format SQL")
    print("  POST /api/validate - Validate SQL")
    print("  POST /api/minify   - Minify SQL")
    print("  GET  /api/options  - Get formatting options")
    print("  GET  /api/health   - Health check")
    print("  GET  /            - Frontend application")
    
    # Get port from environment or use default
    port = int(os.environ.get('PORT', 5000))
    
    app.run(
        host='127.0.0.1',
        port=port,
        debug=True,
        threaded=True
    )