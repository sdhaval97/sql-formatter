# 🔧 SQL Formatter

A powerful, local SQL formatting tool that helps data analysts clean, validate, and format their SQL queries instantly. Built with Python Flask backend and vanilla JavaScript frontend.

![SQL Formatter Demo](https://img.shields.io/badge/Status-Complete-green) ![Python](https://img.shields.io/badge/Python-3.8+-blue) ![Flask](https://img.shields.io/badge/Flask-3.0+-red) ![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)

## ✨ Features

### Core Functionality
- **🎨 SQL Formatting** - Transform messy SQL into clean, readable code
- **✅ SQL Validation** - Catch syntax errors with detailed error reporting
- **📦 SQL Minification** - Compress SQL by removing unnecessary whitespace
- **⚙️ Customizable Settings** - Multiple formatting options and presets

### Advanced Features
- **🎯 Error Highlighting** - Visual error indicators with position tracking
- **📋 Copy to Clipboard** - One-click copying of formatted SQL
- **💾 File Operations** - Load SQL files and download formatted results
- **🔄 Formatting Presets** - Standard, Compact, Minimal, and Legacy styles
- **📱 Responsive Design** - Works on desktop, tablet, and mobile devices
- **⌨️ Keyboard Shortcuts** - Power user friendly shortcuts

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- Virtual environment (recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sql-formatter-app
   ```

2. **Create and activate virtual environment**
   ```bash
   # Create virtual environment
   python -m venv venv
   
   # Activate virtual environment
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**
   ```bash
   python run.py
   ```

5. **Open your browser**
   The application will automatically open at `http://localhost:5000`

## 📁 Project Structure

```
sql-formatter-app/
├── requirements.txt          # Python dependencies
├── run.py                   # Application launcher
├── .gitignore              # Git ignore rules
├── README.md               # Project documentation
├── backend/                # Flask backend
│   ├── app.py             # Flask routes and API endpoints
│   ├── formatter.py       # Core SQL formatting logic
│   └── config.py          # Configuration settings
└── frontend/              # Frontend assets
    ├── index.html         # Main application interface
    ├── css/
    │   ├── style.css      # Main styling
    │   └── prism.css      # Syntax highlighting
    └── js/
        ├── app.js         # Main application logic
        ├── api.js         # Backend communication
        ├── snippets.js    # SQL snippet utilities
        └── prism.js       # Syntax highlighting library
```

## 🎮 Usage

### Basic Workflow
1. **Paste SQL** - Enter your messy SQL in the left panel
2. **Choose Action**:
   - 🎨 **Format** - Clean and beautify SQL
   - ✅ **Validate** - Check for syntax errors
   - 📦 **Minify** - Compress SQL
3. **Copy Result** - Use the formatted SQL from the right panel

### Keyboard Shortcuts
- `Ctrl+Enter` - Format SQL
- `Ctrl+Shift+V` - Validate SQL
- `Ctrl+Shift+C` - Copy formatted SQL
- `Ctrl+Shift+L` - Clear all content
- `F1` - Show help

### Formatting Options
Access via the Settings button:
- **Keyword Case**: UPPERCASE, lowercase, or Capitalize
- **Indentation**: 2, 4, or 8 spaces, or tabs
- **Line Width**: Wrap lines after specified characters
- **Comments**: Strip or preserve SQL comments
- **Style**: Comma-first formatting option

### Presets
Quick formatting styles:
- **Standard** - Balanced formatting with proper indentation
- **Compact** - Tighter formatting with minimal spacing
- **Minimal** - Lowercase keywords with compact layout  
- **Legacy** - Traditional uppercase with tab indentation

## 🔧 API Endpoints

The Flask backend provides a REST API:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/format` | POST | Format SQL with options |
| `/api/validate` | POST | Validate SQL syntax |
| `/api/minify` | POST | Minify SQL |
| `/api/options` | GET | Get available formatting options |
| `/api/health` | GET | Health check |

### Example API Usage

**Format SQL:**
```bash
curl -X POST http://localhost:5000/api/format \
  -H "Content-Type: application/json" \
  -d '{"sql": "select * from users where id=1", "options": {"keyword_case": "upper"}}'
```

**Validate SQL:**
```bash
curl -X POST http://localhost:5000/api/validate \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT name WHERE id = 1"}'
```

## 🧪 Testing

### Test the Application
Use these sample queries to test different features:

**Format Test:**
```sql
select u.id,u.name,count(*) as order_count from users u left join orders o on u.id=o.user_id where u.active=1 group by u.id,u.name order by order_count desc;
```

**Validation Test (Should Fail):**
```sql
SELECT name, email WHERE id = 1;
```

**Minify Test:**
```sql
SELECT 
    u.id,
    u.name,
    COUNT(o.id) as orders
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.active = 1
GROUP BY u.id, u.name;
```

### Error Scenarios
The validator catches common SQL errors:
- Missing FROM clauses
- Unmatched parentheses and quotes
- Keyword typos (SELCT → SELECT)
- Incomplete INSERT statements
- Syntax errors with detailed position information

## 🛠️ Technical Details

### Backend (Python/Flask)
- **Flask 3.0+** - Web framework
- **sqlparse** - SQL parsing and formatting library
- **Flask-CORS** - Cross-origin resource sharing

### Frontend (JavaScript/HTML/CSS)
- **Vanilla JavaScript** - No frameworks, lightweight and fast
- **CSS Grid/Flexbox** - Modern responsive layout
- **Prism.js** - Syntax highlighting
- **Fetch API** - Modern HTTP client

### Key Libraries
- `sqlparse` - Python SQL parsing
- `flask` - Web framework
- `flask-cors` - CORS support

## 🚀 Deployment

### Local Development
```bash
python run.py
```

### Production Deployment
1. Set environment variables:
   ```bash
   export FLASK_ENV=production
   export PORT=5000
   ```

2. Use a production WSGI server:
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 backend.app:app
   ```

## 🔐 Security

- **Local-first**: All processing happens locally, no data sent to external servers
- **No authentication required**: Simple, focused tool
- **CORS configured**: Secure cross-origin requests
- **Input validation**: SQL injection protection through parameterized parsing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup
```bash
# Install development dependencies
pip install -r requirements.txt

# Run in development mode
python run.py

# The app will auto-reload on file changes
```

## 🎯 Use Cases

Perfect for:
- **Data Analysts** - Clean up messy SQL queries from logs or colleagues
- **Database Developers** - Format SQL before code reviews
- **Students** - Learn proper SQL formatting and catch syntax errors
- **DevOps Teams** - Standardize SQL formatting across projects
- **Code Reviews** - Ensure consistent SQL style

## 🔄 Future Enhancements

Potential features for future versions:
- [ ] SQL dialect-specific formatting (PostgreSQL, MySQL, SQLite)
- [ ] Query performance analysis
- [ ] SQL snippet library with common patterns
- [ ] Batch file processing
- [ ] Custom formatting rule configuration
- [ ] Dark mode theme
- [ ] Export to different formats (HTML, PDF)

## 🐛 Known Issues

- Very large SQL files (>1MB) may cause performance issues
- Complex nested queries might have minor formatting edge cases
- Syntax highlighting disabled for performance (can be re-enabled)

## 📞 Support

If you encounter issues:
1. Check the browser console for JavaScript errors
2. Verify all dependencies are installed correctly
3. Ensure you're using Python 3.8 or higher
4. Try with a simple SQL query first

## 🙏 Acknowledgments

- **sqlparse** library for robust SQL parsing
- **Prism.js** for syntax highlighting
- **Flask** community for excellent documentation
- All the data analysts who provided feedback and test cases

---

**Built with ❤️ for the data community**

*Happy SQL formatting! 🎉*
