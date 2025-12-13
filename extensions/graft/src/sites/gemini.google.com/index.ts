console.log("Graft: Gemini script loaded");

// 会話IDを抽出する関数
function extractConversationId(element: Element): string | null {
  const jslog = element.getAttribute("jslog");
  if (!jslog) return null;
  
  // jslog="...;BardVeMetadataKey:[...,[&quot;c_637dd0c444724b12&quot;,null,0]];..."
  // IDは c_ + 16文字のhex
  const match = jslog.match(/c_([a-f0-9]{16})/);
  // URLには c_ を含めないため、キャプチャグループ(ID部分のみ)を返す
  return match ? match[1] : null;
}

// 全体のスタイル調整 (CSS注入)
// 会話タイトルとアクションボタンが重ならないようにタイトルの右パディングを増やすなどの調整
function injectGlobalStyles() {
  if (document.getElementById('graft-global-styles')) return;

  const style = document.createElement('style');
  style.id = 'graft-global-styles';
  style.textContent = `
    /* アクションボタン追加に伴い、タイトルとの重なりを防ぐ */
    .conversation-title {
      padding-right: 40px !important; 
    }

    /* ボタンのスタイル定義 */
    .graft-open-tab-button {
      background: transparent;
      border: none;
      cursor: pointer;
      width: 30px;
      height: 30px;
      margin-right: 0px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: inherit; /* 親の文字色を継承 (ダークモード対応) */
      opacity: 0; /* デフォルト非表示 */
      transition: background-color 0.2s, opacity 0.2s;
    }
    
    /* ホバー時の背景色 */
    .graft-open-tab-button:hover {
      background-color: rgba(128, 128, 128, 0.2);
      opacity: 1 !important;
    }
    
    /* 親要素(会話行)ホバー時に表示 */
    /* セレクタを複数指定して検知漏れを防ぐ */
    div[data-test-id="conversation"]:hover .graft-open-tab-button,
    .conversation-actions-container:hover .graft-open-tab-button {
      opacity: 0.7;
      visibility: visible;
      z-index: 10; /* 他の要素に隠れないように */
    }
  `;
  document.head.appendChild(style);
}

// ボタンを追加する処理
function processConversationItem(element: Element) {
  // 会話IDを取得
  const conversationId = extractConversationId(element);
  if (!conversationId) return;

  // アクションコンテナを探す
  let actionsContainer = element.parentElement?.querySelector('.conversation-actions-container');
  if (!actionsContainer) {
    actionsContainer = element.querySelector('.conversation-actions-container');
  }

  if (!actionsContainer) return;

  // 既にボタンがあるかチェック
  if (actionsContainer.querySelector('.graft-open-tab-button')) {
    return;
  }

  // メニューボタン（3点リーダー）を探す
  const menuButton = actionsContainer.querySelector('.conversation-actions-menu-button') || actionsContainer.querySelector('button');
  
  // ボタン作成
  const openButton = document.createElement('button');
  openButton.className = 'graft-open-tab-button';
  openButton.title = '新しいタブで開く';
  
  // SVGアイコン
  openButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor">
      <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z"/>
    </svg>
  `;

  // クリックイベント
  openButton.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    const url = `https://gemini.google.com/app/${conversationId}`;
    window.open(url, '_blank');
  });

  // 挿入位置
  if (menuButton) {
    actionsContainer.insertBefore(openButton, menuButton);
  } else {
    actionsContainer.insertBefore(openButton, actionsContainer.firstChild);
  }
}

// 全体をスキャンして処理する関数
function scanAndProcess() {
  const items = document.querySelectorAll('div[data-test-id="conversation"]');
  items.forEach(processConversationItem);
}

// 監視設定 (MutationObserver)
const observer = new MutationObserver((mutations) => {
  // 変更があったらスキャン実行 (頻度制限してもいいが、単純な処理なので毎回呼ぶ)
  scanAndProcess();
});

// 初期化と監視開始
function init() {
  console.log("Graft: Initializing...");
  
  injectGlobalStyles(); // スタイル注入
  
  // 初回実行
  scanAndProcess();

  // DOM監視開始
  observer.observe(document.body, { childList: true, subtree: true });

  // 保険: 定期ポーリング (DOM監視で見逃すケースや、大規模な書き換え対策)
  setInterval(scanAndProcess, 2000);
}

// 実行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
