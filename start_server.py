import http.server
import socketserver
import os
import signal
import sys

PORT = 8000

def signal_handler(sig, frame):
    print('\nShutting down server...')
    sys.exit(0)

def start_server():
    # Register signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    
    # Change directory to project root
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    Handler = http.server.SimpleHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nShutting down server...')
            httpd.shutdown()

if __name__ == "__main__":
    start_server()