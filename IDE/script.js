// --- 1. CodeMirror 配置 (維持你的設定) ---
CodeMirror.defineSimpleMode("ejp", {
    start: [
        {regex: /##.*/, token: "comment"},
        {regex: /"(?:[^\\]|\\.)*?"/, token: "string"},
        {regex: /(?:def|sv|rep|canva|log)(?=\()/, token: "keyword"},
        {regex: /[a-zA-Z0-9_]+(?=\()/, token: "variable-3"}, 
        {regex: /%[a-zA-Z0-9_-]+%/, token: "variable-2"},
        {regex: /\{/, indent: true},
        {regex: /\}/, dedent: true}
    ]
});

var editor = CodeMirror.fromTextArea(document.getElementById("editor-text"), {
    lineNumbers: true,
    mode: "ejp",
    theme: "dracula",
    tabSize: 4,
    indentUnit: 4,
    lineWrapping: true,
    matchBrackets: true
});
window.editor = editor;

// --- 2. 檔案處理邏輯 (維持你的設定) ---
function downloadSource() {
    const text = window.editor.getValue();
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = document.getElementById('filename').value || "project.ejp";
    a.click();
}

window.saveBinaryFile = function(pyBytearray, filename) {
    const uint8Array = new Uint8Array(pyBytearray);
    const blob = new Blob([uint8Array], { type: 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}

// --- 3. 核心修復：異步繪圖接口 ---
async function web_canva(action, x, y, color) {
    const pixel = document.getElementById(`p-${x}-${y}`);
    if (pixel && action === "set") {
        pixel.style.backgroundColor = `#${color.replace('#', '')}`;
        
        // 觸發視覺反饋
        pixel.classList.remove("updated");
        void pixel.offsetWidth; // 強制 Reflow
        pixel.classList.add("updated");
    }
    
    // 💡 關鍵：回傳繪圖幀 Promise，讓瀏覽器有時間更新畫面
    return new Promise(resolve => requestAnimationFrame(resolve));
}

// --- 4. 核心修復：執行引擎 ---
async function runPython() {
    // 取得編輯器內容
    let code = window.editor.getValue();
    
    // 🛑 重要修復：自動將使用者代碼中的 web_canva 加上 await
    // 這樣使用者寫 web_canva(...) 時，底層才會真正停下來等渲染
    code = code.replace(/web_canva\(/g, "await web_canva(");
    code = code.replace(/asyncio\.sleep\(/g, "await asyncio.sleep(");

    // 注入全域函數
    pyodide.globals.set("web_canva", web_canva);

    try {
        // 處理縮進並封裝進非同步函數
        const indentedCode = code.split('\n').map(line => "    " + line).join('\n');

        await pyodide.runPythonAsync(`
import asyncio
from js import web_canva

async def _wrapper():
    try:
        # 使用者編寫的 EJP 轉譯代碼在此執行
${indentedCode}
    except Exception as e:
        print(f"Runtime Error: {e}")

# 啟動非同步循環
asyncio.ensure_future(_wrapper())
        `);
    } catch (err) {
        console.error("Pyodide 執行失敗:", err);
    }
}