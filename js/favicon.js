/**
 * EJP 全局視覺引擎 v2.0
 * 功能：自動圖標注入、標題後綴優化、分頁活躍偵測
 */
(function() {
    // === 1. 配置設定 ===
    const CONFIG = {
        siteName: "EJP Project",
        // 使用絕對路徑確保在任何子資料夾都能讀取
        iconUrl: "https://syjhs11450035-glitch.github.io/Easy-Java-Python/favicon.ico",
        // 分頁失去焦點時的趣味標題 (選配)
        awayTitle: "(つ´ω`)つ 快回來寫代碼！",
        suffixSeparator: " | "
    };

    // === 2. 自動圖標注入 ===
    function injectFavicon() {
        // 如果 HTML 裡已經手寫了 icon，先移除它（避免衝突）
        const existingIcon = document.querySelector("link[rel*='icon']");
        if (existingIcon) existingIcon.remove();

        // 建立新的 Link 標籤
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/x-icon';
        link.href = CONFIG.iconUrl;

        // Apple Touch Icon (手機書籤優化)
        const appleLink = document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        appleLink.href = CONFIG.iconUrl;

        document.head.appendChild(link);
        document.head.appendChild(appleLink);
    }

    // === 3. 標題後綴自動補完 ===
    function updateTitleSuffix() {
        let currentTitle = document.title.trim();
        
        // 如果標題為空，給予預設值
        if (!currentTitle) currentTitle = "EJP IDE";

        // 移除可能存在的 .md 後綴 (針對直接讀取檔名的情況)
        currentTitle = currentTitle.replace(/\.md$/i, "");

        // 如果標題還沒包含 SITE_NAME，則加上後綴
        if (!currentTitle.includes(CONFIG.siteName)) {
            document.title = `${currentTitle}${CONFIG.suffixSeparator}${CONFIG.siteName}`;
        }
    }

    // === 4. 分頁活躍偵測 (當使用者切換分頁時) ===
    function initTabTracker() {
        const originalTitle = document.title;
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                // 使用者離開分頁
                document.title = CONFIG.awayTitle;
            } else {
                // 使用者回來了，恢復原始標題 (並重新跑一次後綴檢查)
                updateTitleSuffix();
            }
        });
    }

    // === 5. 啟動執行 ===
    // 確保在 DOM 載入時立即執行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            injectFavicon();
            updateTitleSuffix();
            initTabTracker();
        });
    } else {
        injectFavicon();
        updateTitleSuffix();
        initTabTracker();
    }

    console.log(`%c 🚀 EJP 視覺引擎已啟動 | ${CONFIG.siteName} `, "color: #50fa7b; background: #282a36; padding: 5px; border-radius: 5px;");
})();