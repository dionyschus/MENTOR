# Lokaler Server ohne Browser-Cache – Änderungen sind nach einem Reload immer sichtbar.
# Start: python3 serve.py  →  http://localhost:8000
import http.server
import socketserver
import os

PORT = 8000
os.chdir(os.path.dirname(os.path.abspath(__file__)))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('', PORT), NoCacheHandler) as httpd:
    print(f'MENTOR Gerätestudio läuft auf http://localhost:{PORT}')
    httpd.serve_forever()
