"""Servidor local de revisión: sirve public/ sin que el navegador guarde copias (siempre la última versión)."""
import functools, http.server, pathlib, sys

class SinCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()

puerto = int(sys.argv[1]) if len(sys.argv) > 1 else 8791
raiz = pathlib.Path(__file__).resolve().parents[1] / 'public'
http.server.ThreadingHTTPServer(('', puerto), functools.partial(SinCache, directory=str(raiz))).serve_forever()
