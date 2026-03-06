/**
 * EJP Markdown 文檔載入引擎 v3.0
 * 整合功能：路徑自動修復、標題後綴優化、圖片路徑補全、連結導向追蹤
 */

// 1. 核心配置
const CONFIG = {
    // 導覽頁面的基礎路徑
    currentDir: "./index.html?file=",
    // 你的專案 GitHub Pages 根目錄 (結尾須帶 /)
    baseRawUrl: "https://syjhs11450035-glitch.github.io/Easy-Java-Python/",
    // 預設首頁文檔
    defaultMd: "https://syjhs11450035-glitch.github.io/Easy-Java-Python/README.md",
    // 標題後綴
    siteName: "EJP Project"
};

// 2. 🚀 強大的路徑修復引擎 (處理 ./ 與 ../)
function fixLink(currentFile, targetHref) {
    // 處理 GitHub 複雜網址 (跳過 tab 參數，直接抓 README)
    if (targetHref.includes("github.com") && targetHref.includes("readme")) {
        return CONFIG.defaultMd;
    }

    // 如果是絕對路徑，直接返回
    if (targetHref.startsWith('http')) return targetHref;

    // 取得當前文件夾的路徑 (不含檔名)
    // 例如: .../md/如何編寫.md -> .../md/
    const currentDir = currentFile.substring(0, currentFile.lastIndexOf('/') + 1);

    let finalUrl = "";

    if (targetHref.startsWith("./")) {
        // 處理 ./如何編寫/基礎.md -> 拼接當前目錄
        finalUrl = currentDir + targetHref.substring(2);
    } 
    else if (targetHref.startsWith("../")) {
        // 處理 ../原理.md -> 往上一層走
        const parentDir = currentDir.substring(0, currentDir.lastIndexOf('/', currentDir.length - 2) + 1);
        finalUrl = parentDir + targetHref.substring(3);
    }
    else {
        // 處理 基礎.md (直接寫檔名) -> 拼接當前目錄
        finalUrl = currentDir + targetHref;
    }

    return finalUrl;
}

// 3. 📄 核心載入函數
async function loadMarkdown() {
    const urlParams = new URLSearchParams(window.location.search);
    const filePath = urlParams.get('file');

    // 如果沒有 file 參數，自動跳轉到帶參數的 README
    if (!filePath) {
        window.location.replace(CONFIG.currentDir + CONFIG.defaultMd);
        return;
    }

    const container = document.getElementById('md-content');
    if (!container) return; // 確保容器存在
    
    container.innerHTML = "<p style='text-align:center; opacity: 0.6;'>正在載入文檔...</p>";
    
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error("讀取檔案失敗");
        
        const text = await response.text();
        
        // 使用 marked.js 轉換 Markdown (確保 HTML 已引入 marked.js)
        container.innerHTML = marked.parse(text);
        
        // --- 核心：掃描並動態修復連結 ---
        container.querySelectorAll('a').forEach(link => {
            let originalHref = link.getAttribute('href');
            if (originalHref) {
                const fixedUrl = fixLink(filePath, originalHref);
                
                // 如果是連往 .md 檔案，則套用 CURRENT_DIR 框架
                if (fixedUrl.toLowerCase().endsWith(".md") || fixedUrl.toLowerCase().includes("readme")) {
                    link.href = CONFIG.currentDir + fixedUrl;
                } else {
                    link.href = fixedUrl;
                }
            }
        });

        // --- 核心：自動修正圖片路徑 (防止破圖) ---
        container.querySelectorAll('img').forEach(img => {
            let src = img.getAttribute('src');
            if (src && !src.startsWith('http')) {
                img.src = fixLink(filePath, src);
            }
        });

        // --- ✨ 標題優化處理 ---
        // 從路徑提取檔名，移除 .md 後綴，並解碼中文
        let fileName = decodeURIComponent(filePath.split('/').pop());
        let cleanTitle = fileName.replace(/\.md$/i, "");
        document.title = `${cleanTitle} | ${CONFIG.siteName}`;

    } catch (error) {
        console.error("[EJP Error]", error);
        container.innerHTML = `
            <div style="text-align:center; padding: 40px;">
                <h2 style="color: #ff5555;">⚠️ 載入失敗</h2>
                <p style="opacity: 0.7;">無法讀取檔案：${filePath}</p>
                <a href="./index.html" style="color: #8be9fd; text-decoration: none; font-weight: bold;">⬅ 返回首頁</a>
            </div>
        `;
    }
}

// 4. 啟動程序
window.onload = loadMarkdown;