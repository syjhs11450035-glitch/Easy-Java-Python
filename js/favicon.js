/**
 * EJP 全局視覺引擎 v2.1
 * 修復重點：絕對路徑優化、標題後綴重複修復、緩存刷新機制
 */
(function() {
    // === 1. 配置設定 ===
    const CONFIG = {
        siteName: "EJP Project",
        // 加入時間戳記避免 logo 圖片緩存不更新
        iconUrl: "https://syjhs11450035-glitch.github.io/Easy-Java-Python/logo/2.png?v=" + new Date().getTime(),
        awayTitle: "(つ´ω`)つ 快回來寫代碼！",
        suffixSeparator: " | "
    };

    // 儲存進入頁面時的最初標題，避免 updateTitleSuffix 導致後綴無限疊加
    let baseTitle = document.title.trim() || "EJP";

    // === 2. 自動圖標注入 ===
    function injectFavicon() {
        // 移除所有舊的 icon 標籤（包含 rel='shortcut icon' 或 rel='icon'）
        const existingIcons = document.querySelectorAll("link[rel*='icon']");
        existingIcons.forEach(el => el.remove());

        // 建立新的 Link 標籤
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png'; // 根據你的路徑是 .png，建議從 x-icon 改為 image/png
        link.href = CONFIG.iconUrl;

        // Apple Touch Icon
        const appleLink = document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        appleLink.href = CONFIG.iconUrl;

        document.head.appendChild(link);
        document.head.appendChild(appleLink);
    }

    // === 3. 標題後綴自動補完 ===
    function updateTitleSuffix(forceRestore = false) {
        let currentTitle = forceRestore ? baseTitle : document.title.trim();

        // 1. 處理檔名後綴
        currentTitle = currentTitle.replace(/\.md$/i, "").replace(/\.html$/i, "");

        // 2. 核心修復：防止後綴重複疊加 (例如變成 A | EJP | EJP)
        if (currentTitle.includes(CONFIG.siteName)) {
            // 如果已經有後綴了，先拆開取前半段
            currentTitle = currentTitle.split(CONFIG.suffixSeparator)[0].trim();
        }

        document.title = `${currentTitle}${CONFIG.suffixSeparator}${CONFIG.siteName}`;
    }

    // === 4. 分頁活躍偵測 ===
    function initTabTracker() {
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                // 儲存當前正確的標題，以便回來時恢復
                document.title = CONFIG.awayTitle;
            } else {
                // 使用者回來了，恢復基礎標題並補上後綴
                updateTitleSuffix(true); 
            }
        });
    }

    // === 5. 啟動執行 ===
    const runEngine = () => {
        injectFavicon();
        updateTitleSuffix();
        initTabTracker();
    };

    // 修復啟動時機：針對部分瀏覽器 DOMContentLoaded 觸發過快的問題
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
        runEngine();
    } else {
        document.addEventListener('DOMContentLoaded', runEngine);
    }

    console.log(`%c 🚀 EJP 視覺引擎 v2.1 已啟動 | ${CONFIG.siteName} `, "color: #58a6ff; background: #0d1117; padding: 5px; border-radius: 3px; border: 1px solid #30363d;");
})();