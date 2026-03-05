import tkinter as tk
from tkinter import filedialog, messagebox, scrolledtext, simpledialog
import re
import os
import time

# --- EJP 核心 6-bit 字典 ---
CHAR_MAP = { 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4, 'f': 5, 'g': 6, 'h': 7, 'i': 8, 'j': 9, 'k': 10, 'l': 11, 'm': 12, 'n': 13, 'o': 14, 'p': 15, 'q': 16, 'r': 17, 's': 18, 't': 19, 'u': 20, 'v': 21, 'w': 22, 'x': 23, 'y': 24, 'z': 25, '0': 26, '1': 27, '2': 28, '3': 29, '4': 30, '5': 31, '6': 32, '7': 33, '8': 34, '9': 35, '=': 36, '<': 37, '>': 38, ';': 39, '(': 40, ')': 41, '{': 42, '}': 43, '[': 44, ']': 45, ',': 46, '"': 47, "'": 48, '%': 49, '#': 50, '\\': 51, '^': 52, '+': 53, '-': 54, '~': 55, " ": 56, 'Ⓔ': 59, 'Ⓑ': 60, 'Ⓢ': 61, 'Ⓐ': 62, 'Ⓤ': 63 }
REV_MAP = {v: k for k, v in CHAR_MAP.items()}

class CanvasWindow(tk.Toplevel):
    def __init__(self, parent):
        super().__init__(parent)
        self.title("EJP 實體畫布")
        self.configure(bg="#1a1a1a")
        self.pixels = {}
        self.canvas_frame = tk.Frame(self, bg="#1a1a1a")
        self.canvas_frame.pack(padx=10, pady=10)

    def add_grid(self, w, h):
        for widget in self.canvas_frame.winfo_children(): widget.destroy()
        self.pixels = {}
        for y in range(h):
            for x in range(w):
                p = tk.Frame(self.canvas_frame, width=20, height=20, bg="#222", highlightthickness=1)
                p.grid(row=y, column=x)
                self.pixels[(x, y)] = p

    def set_pixel(self, x, y, color):
        if (x, y) in self.pixels:
            c = f"#{color}" if len(color)==6 else color
            self.pixels[(x, y)].configure(bg=c)
            self.update()

class EJPEngine:
    @staticmethod
    def transpile(raw_text):
        # 1. 處理內嵌 py{...} 塊 (將其暫存，避免被後續邏輯破壞)
        py_blocks = []
        def save_py(m):
            py_blocks.append(m.group(1))
            return f"__PY_BLOCK_{len(py_blocks)-1}__"
        
        # 支援 py{ code } 語法
        processed_text = re.sub(r'py\s*\{(.*?)\}', save_py, raw_text, flags=re.DOTALL)
        
        # 2. 強制結構化：依據分號與大括號斷行
        processed_text = processed_text.replace('{', '{\n').replace('}', '\n}\n').replace(';', ';\n')
        lines = processed_text.split('\n')
        
        py_code = ["import time", "vars_dict = {}"]
        indent = 0
        
        for line in lines:
            line = line.strip()
            if not line or line.startswith("##"): continue
            if line == "}": indent = max(0, indent - 1); continue

            # 還原內嵌 Python 代碼
            if "__PY_BLOCK_" in line:
                idx = int(re.search(r'__PY_BLOCK_(\d+)__', line).group(1))
                inner_py = py_blocks[idx]
                for p_line in inner_py.split('\n'):
                    py_code.append("    " * indent + p_line.strip())
                continue

            # 轉換 def("name", x, y){
            m = re.match(r'def\("(.*?)"\s*,\s*(.*?)\s*,\s*(.*?)\)\s*\{', line)
            if m:
                py_code.append("    " * indent + f"def {m.group(1)}({m.group(2)}, {m.group(3)}):")
                indent += 1; continue

            # 轉換 if(cond){
            m = re.match(r'if\((.*?)\)\s*\{', line)
            if m:
                cond = m.group(1).replace('%', '') # 簡化 if 內的變數
                py_code.append("    " * indent + f"if {cond}:")
                indent += 1; continue

            # 轉換 rep(F, n){
            m = re.match(r'rep\((T|F)\s*,\s*(.*?)\)\s*\{', line)
            if m:
                v = m.group(2).strip("%")
                c = f'int(vars_dict.get("{v}", {v}))' if "%" in m.group(2) else m.group(2)
                py_code.append("    "*indent + ("while True:" if m.group(1)=="T" else f"for _ in range(int({c})):"))
                indent += 1; continue

            # 處理 sv(%"x"%, 10);
            line = re.sub(r'sv\(%"(.*?)"%,\s*(.*?)\)', r'vars_dict["\1"] = \2', line)
            
            # 處理 %var% 調用
            line = re.sub(r'%(.*?)%', lambda x: f'({x.group(1)} if "{x.group(1)}" in locals() else vars_dict.get("{x.group(1)}", 0))' if x.group(1) not in ['add', 'set', 'back', 'ask', 'time'] else x.group(1), line)

            # 保護關鍵字並移除分號
            for kw in ['add', 'set', 'back', 'ask', 'time']: 
                line = re.sub(rf'\((\s*){kw}(\s*),', rf'("\1{kw}\2",', line)
            
            clean_line = line.replace(';', '').strip()
            if clean_line: py_code.append("    " * indent + clean_line)

        return "\n".join(py_code)

class App:
    def __init__(self, root):
        self.root = root
        self.root.title("EJP Toolkit V3.0 - Multilang Support")
        self.root.geometry("800x600")
        self.root.configure(bg="#282a36")
        self.canvas_win = None

        # 控制區
        btn_frame = tk.Frame(root, bg="#282a36")
        btn_frame.pack(pady=10)
        tk.Button(btn_frame, text="📦 編譯 EJP", command=self.do_compile, bg="#ff79c6").pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="▶ 執行(含 py{} 支援)", command=self.do_run, bg="#50fa7b", font=("Arial", 10, "bold")).pack(side=tk.LEFT, padx=5)

        self.console = scrolledtext.ScrolledText(root, bg="#1e1e1e", fg="#f8f8f2", font=("Consolas", 11))
        self.console.pack(expand=True, fill="both", padx=15, pady=10)

    def log(self, *args):
        msg = " ".join(map(str, args))
        self.console.insert(tk.END, f"> {msg}\n")
        self.console.see(tk.END); self.root.update()

    def ask_user(self, prompt):
        res = simpledialog.askstring("EJP 詢問", prompt)
        try: return int(res) if res.isdigit() else res
        except: return res

    def wait_time(self, seconds):
        time.sleep(float(seconds))

    def handle_canva(self, action, *args):
        if not self.canvas_win or not tk.Toplevel.winfo_exists(self.canvas_win):
            self.canvas_win = CanvasWindow(self.root)
        if action == "add": self.canvas_win.add_grid(int(args[0]), int(args[1]))
        elif action == "set": self.canvas_win.set_pixel(int(args[0]), int(args[1]), str(args[2]))

    def do_run(self):
        path = filedialog.askopenfilename()
        if not path: return
        content = open(path, 'r', encoding='utf-8').read() # 簡化為讀取 txt
        py_script = EJPEngine.transpile(content)
        
        exec_globals = {
            "log": self.log, "canva": self.handle_canva, "ask": self.ask_user,
            "time": self.wait_time, "T": True, "F": False, "int": int
        }
        try:
            exec(py_script, exec_globals)
        except Exception as e: self.log(f"運行錯誤: {e}")

    def do_compile(self):
        path = filedialog.askopenfilename()
        if path:
            with open(path, 'r', encoding='utf-8') as f: binary = EJPEngine.encode(f.read())
            with open(path.rsplit('.', 1)[0]+".EJP", 'wb') as f: f.write(binary)
            self.log("編譯成功")

    def do_decompile(self):
        path = filedialog.askopenfilename()
        if path:
            with open(path, 'rb') as f: text = EJPEngine.decode(f.read())
            with open(path.rsplit('.', 1)[0]+"_src.txt", 'w', encoding='utf-8') as f: f.write(text)
            self.log("還原成功")

    def do_run(self):
        path = filedialog.askopenfilename()
        if not path: return
        content = EJPEngine.decode(open(path, 'rb').read()) if path.endswith(".EJP") else open(path, 'r', encoding='utf-8').read()
        
        py_script = EJPEngine.transpile_to_py(content)
        exec_globals = {
            "log": self.log, # 這裡傳入的是支援 *args 的方法
            "canva": self.handle_canva,
            "T": True, "F": False, "int": int, "time": __import__("time")
        }
        try:
            exec(py_script, exec_globals)
            self.log("執行完成")
        except Exception as e:
            self.log(f"運行錯誤: {e}")

if __name__ == "__main__":
    root = tk.Tk()
    app = App(root)
    root.mainloop()