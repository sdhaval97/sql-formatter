"""
SQL Formatter Application Launcher
Starts the Flask server and opens the application in the default browser.
"""

import os
import sys
import time
import threading
import webbrowser
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_dir))

try:
    from backend.app import app
    from backend.config import config
except ImportError as e:
    print(f"Error importing application: {e}")
    print("Make sure you're in the project root directory and have installed dependencies:")
    print("  pip install -r requirements.txt")
    sys.exit(1)


def check_dependencies():
    """Check if required dependencies are installed."""
    required_packages = ['flask', 'sqlparse', 'flask_cors']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print("❌ Missing required packages:")
        for package in missing_packages:
            print(f"   - {package}")
        print("\nInstall them with:")
        print("   pip install -r requirements.txt")
        return False
    
    return True


def check_frontend_files():
    """Check if frontend files exist."""
    frontend_dir = Path(__file__).parent / 'frontend'
    required_files = ['index.html']
    
    missing_files = []
    for file in required_files:
        if not (frontend_dir / file).exists():
            missing_files.append(file)
    
    if missing_files:
        print("⚠️  Frontend files not found:")
        for file in missing_files:
            print(f"   - frontend/{file}")
        print("\nThe app will start but frontend may not work properly.")
        return False
    
    return True


def wait_for_server(host, port, timeout=30):
    """Wait for the Flask server to start."""
    import socket
    
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex((host, port))
            sock.close()
            
            if result == 0:
                return True
                
            time.sleep(0.5)
        except Exception:
            time.sleep(0.5)
    
    return False


def open_browser(url, delay=2):
    """Open the application in the default browser after a delay."""
    def _open():
        time.sleep(delay)
        try:
            print(f"🌐 Opening browser: {url}")
            webbrowser.open(url)
        except Exception as e:
            print(f"Could not open browser automatically: {e}")
            print(f"Please open your browser and go to: {url}")
    
    thread = threading.Thread(target=_open, daemon=True)
    thread.start()


def print_startup_info():
    """Print application startup information."""
    print("=" * 60)
    print("🔧 SQL FORMATTER APPLICATION")
    print("=" * 60)
    print(f"Environment: {os.environ.get('FLASK_ENV', 'development')}")
    print(f"Debug mode: {config.DEBUG}")
    print(f"Host: {config.HOST}")
    print(f"Port: {config.PORT}")
    print("-" * 60)


def print_usage_info():
    """Print usage information and available endpoints."""
    base_url = f"http://{config.HOST}:{config.PORT}"
    
    print("📡 AVAILABLE ENDPOINTS:")
    print(f"   Application:  {base_url}/")
    print(f"   Format SQL:   {base_url}/api/format")
    print(f"   Validate SQL: {base_url}/api/validate")
    print(f"   Minify SQL:   {base_url}/api/minify")
    print(f"   Options:      {base_url}/api/options")
    print(f"   Health Check: {base_url}/api/health")
    print("-" * 60)
    print("💡 USAGE:")
    print("   • The app will open automatically in your browser")
    print("   • Paste SQL in the left panel, formatted output on the right")
    print("   • Use Ctrl+C to stop the server")
    print("=" * 60)


def main():
    """Main application entry point."""
    print_startup_info()
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Check frontend files (warning only)
    check_frontend_files()
    
    # Configure Flask app
    app.config.from_object(config)
    
    # Determine URL
    url = f"http://{config.HOST}:{config.PORT}"
    
    print_usage_info()
    
    try:
        # Open browser automatically (unless disabled)
        if not os.environ.get('NO_BROWSER'):
            open_browser(url, delay=1.5)
        
        print("🚀 Starting Flask server...")
        print(f"📱 Access the app at: {url}")
        print("\n⏹️  Press Ctrl+C to stop the server\n")
        
        # Start Flask development server
        app.run(
            host=config.HOST,
            port=config.PORT,
            debug=config.DEBUG,
            use_reloader=False,  # Disable reloader to prevent double-opening browser
            threaded=True
        )
        
    except KeyboardInterrupt:
        print("\n👋 Shutting down SQL Formatter...")
        sys.exit(0)
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ Port {config.PORT} is already in use!")
            print("Either:")
            print("  1. Stop the other application using this port")
            print("  2. Set a different port: export PORT=5001")
            print(f"  3. Or try: python run.py --port 5001")
        else:
            print(f"❌ Error starting server: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)


def parse_args():
    """Parse command line arguments."""
    import argparse
    
    parser = argparse.ArgumentParser(description='SQL Formatter Application')
    parser.add_argument('--host', default=config.HOST, 
                       help=f'Host to bind to (default: {config.HOST})')
    parser.add_argument('--port', type=int, default=config.PORT,
                       help=f'Port to bind to (default: {config.PORT})')
    parser.add_argument('--no-browser', action='store_true',
                       help='Do not open browser automatically')
    parser.add_argument('--debug', action='store_true',
                       help='Enable debug mode')
    
    args = parser.parse_args()
    
    # Update config with command line arguments
    config.HOST = args.host
    config.PORT = args.port
    
    if args.debug:
        config.DEBUG = True
    
    if args.no_browser:
        os.environ['NO_BROWSER'] = '1'
    
    return args


if __name__ == '__main__':
    # Parse command line arguments
    args = parse_args()
    
    # Run the application
    main()