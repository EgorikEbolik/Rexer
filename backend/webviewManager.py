import webview
from settings import settings

_window = None


def run_webview():
    global _window
    _window = webview.create_window("Rexer", "http://127.0.0.1:8765")
    _window.events.closing += on_closing
    is_debug = settings.data["debug"]
    webview.start(debug=is_debug if is_debug else False)


def on_closing():
    if _window:
        _window.hide()
    return False


def close_window():
    global _window
    if _window:
        _window.destroy()


def show_window():
    global _window
    if _window is None:
        import threading

        t = threading.Thread(target=run_webview, daemon=True)
        t.start()
    else:
        _window.show()
