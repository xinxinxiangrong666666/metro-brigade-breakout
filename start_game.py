#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
地铁旅团弹射·城市突围 —— 一键启动器

双击本文件（或 `python 启动游戏.py`）即可：
  1. 在项目目录起一个 **多线程** HTTP 服务（解决 Windows 上 python -m http.server
     单线程被浏览器 keep-alive 预连接堵死、页面转圈打不开的问题）
  2. 自动挑一个空闲端口，避免和已占用的 8080 冲突
  3. 自动用默认浏览器打开游戏

关掉这个黑窗口即停止服务。
"""

import http.client
import http.server
import os
import socket
import socketserver
import subprocess
import sys
import threading
import time
import webbrowser

# Windows 控制台默认 GBK，打印中文会抛 UnicodeEncodeError 让脚本直接崩。
# 强制 stdout/stderr 走 UTF-8，遇到无法编码的字符也只替换不报错。
for _stream in ("stdout", "stderr"):
    _s = getattr(sys, _stream, None)
    if _s is not None and hasattr(_s, "reconfigure"):
        try:
            _s.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

ROOT = os.path.dirname(os.path.abspath(__file__))
PREFERRED_PORTS = [8090, 8123, 8765, 9080, 9123, 8080]


def _powershell(command: str, timeout: int = 8) -> str:
    """静默调 powershell，拿回 stdout。失败返回空串。"""
    try:
        out = subprocess.run(
            ["powershell", "-NoProfile", "-Command", command],
            capture_output=True, text=True, timeout=timeout, check=False,
        )
        return (out.stdout or "") + (out.stderr or "")
    except Exception:
        return ""


def free_port(port: int) -> bool:
    """把 port 上已经占用它的 python 进程杀掉（如果有）。返回是否清空。"""

    # 1) 找谁占着这个端口
    out = _powershell(
        "$conn = Get-NetTCPConnection -LocalPort %d -State Listen -ErrorAction SilentlyContinue;"
        "if ($conn) { $conn.OwningProcess }" % port
    )
    pids = []
    for tok in out.replace("\r", " ").split():
        if tok.isdigit():
            pid = int(tok)
            if pid > 4:
                pids.append(pid)
    if not pids:
        return True

    # 2) 只杀 python — 别的进程别动（避免误杀浏览器/代理）
    killed_any = False
    for pid in set(pids):
        if pid == os.getpid():
            continue
        info = _powershell(
            "(Get-Process -Id %d -ErrorAction SilentlyContinue).ProcessName" % pid
        ).strip().lower()
        if info in ("python", "python3", "py"):
            _powershell("Stop-Process -Id %d -Force -ErrorAction SilentlyContinue" % pid)
            print("   清掉占用 %d 端口的旧 python 进程 PID=%d" % (port, pid))
            killed_any = True

    if killed_any:
        # 等一等让系统真正释放 socket
        for _ in range(10):
            time.sleep(0.25)
            if port_is_free(port):
                return True
    return port_is_free(port)


class Handler(http.server.SimpleHTTPRequestHandler):
    """带正确 MIME、禁用缓存、且不打印噪音日志的静态文件处理器。"""

    # Windows 注册表有时把 .js 映射成 text/plain，会导致脚本被拒绝执行
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "application/javascript",
        ".mjs": "application/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".webmanifest": "application/manifest+json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".svg": "image/svg+xml",
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".ogg": "audio/ogg",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        # 改完代码刷新就能看到最新效果，不用手动清缓存
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        super().end_headers()

    def log_message(self, fmt, *args):
        # 只报错误，成功请求不刷屏
        status = args[1] if len(args) > 1 else ""
        if str(status).startswith(("4", "5")):
            sys.stderr.write("  [%s] %s\n" % (status, args[0] if args else ""))


class Server(socketserver.ThreadingTCPServer):
    """多线程 + 端口可立即复用。

    ThreadingTCPServer 是关键：浏览器会开多条 keep-alive 长连接，
    单线程的 http.server 会被第一条连接独占，表现就是页面一直转圈。
    """

    daemon_threads = True
    allow_reuse_address = True


def port_is_free(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            s.bind(("127.0.0.1", port))
            return True
        except OSError:
            return False


def pick_port() -> int:
    # 优先用 8080：先把占用它的旧 python（如果有）杀掉
    for port in PREFERRED_PORTS:
        if port == 8080:
            free_port(port)            # 最优路径：干掉旧服务，自己接替 8080
        if port_is_free(port):
            return port
    # 全都被占：让系统分配一个随机高位端口
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def sanity_check() -> bool:
    """启动前确认关键文件都在，避免起了服务却是空目录。"""
    required = ["index.html", "styles.css", os.path.join("src", "game.js")]
    missing = [f for f in required if not os.path.isfile(os.path.join(ROOT, f))]
    if missing:
        print("!! 缺少关键文件，无法启动：")
        for f in missing:
            print("   -", f)
        print("\n   请确认本脚本放在项目根目录（和 index.html 同级）。")
        return False

    assets = os.path.join(ROOT, "assets")
    n = len([f for f in os.listdir(assets) if f.lower().endswith(".png")]) if os.path.isdir(assets) else 0
    if n == 0:
        print("!! assets/ 目录下没有找到 PNG 图片，游戏会缺图。")
        return False

    print("   文件检查通过（assets/ 下 %d 张图片）" % n)
    return True


def main():
    os.chdir(ROOT)

    print("=" * 58)
    print("  地铁旅团弹射 · 城市突围   一键启动器")
    print("=" * 58)
    print("   项目目录：%s" % ROOT)

    if not sanity_check():
        input("\n按回车键退出...")
        return 1

    port = pick_port()
    url = "http://127.0.0.1:%d/index.html" % port

    try:
        httpd = Server(("127.0.0.1", port), Handler)
    except OSError as e:
        print("\n!! 端口 %d 绑定失败：%s" % (port, e))
        input("按回车键退出...")
        return 1

    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    time.sleep(0.4)  # 给服务线程一点启动时间，再让浏览器来敲门

    # 快速自检：真的能从本机拿到 index.html 再开浏览器
    # 避免"服务起来了浏览器却转圈"的假启动
    def _self_check(tries: int = 6) -> bool:
        for i in range(tries):
            try:
                conn = http.client.HTTPConnection("127.0.0.1", port, timeout=3)
                conn.request("HEAD", "/index.html")
                resp = conn.getresponse()
                ok = (resp.status == 200)
                conn.close()
                if ok:
                    return True
            except Exception:
                pass
            time.sleep(0.3)
        return False

    if not _self_check():
        print("\n!! 服务自检失败：本机拿不到 /index.html")
        print("   可能被 Windows 防火墙或代理拦截。")
        print("   试试：把这个 .bat 关掉，右键以管理员身份运行一次让防火墙放行。")
        input("按回车键退出...")
        try: httpd.shutdown(); httpd.server_close()
        except Exception: pass
        return 1

    print("\n   服务已启动（多线程模式 + 自检通过）")
    print("   游戏地址：%s" % url)
    print("\n   正在打开浏览器...")

    try:
        webbrowser.open(url)
    except Exception:
        print("   自动打开失败，请手动复制上面的地址到浏览器。")

    print("\n" + "-" * 58)
    print("  玩的时候请保持这个黑窗口开着。")
    print("  关掉窗口 或 按 Ctrl+C 即停止服务。")
    print("-" * 58 + "\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n   已停止服务，拜拜~")
    finally:
        httpd.shutdown()
        httpd.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
