import http.server
import socketserver
import os

# Navegar para o diretório public
os.chdir('public')

PORT = 3000
Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Servidor rodando em http://localhost:{PORT}")
    print("Pressione Ctrl+C para parar")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor parado.")
