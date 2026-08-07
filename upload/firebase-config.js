// ------------------------------------------------------------
// Firebase 接続設定（このファイルに岸上様ご自身のプロジェクト情報を入力してください）
//
// 入手方法：
// 1. https://console.firebase.google.com/ でプロジェクトを作成
// 2. 「プロジェクトの設定」→「全般」→「マイアプリ」でウェブアプリを追加
// 3. 表示される firebaseConfig の値をそのまま下にコピー
//
// ※ この apiKey 等は「公開されて問題ない」設計の値です（Firebaseの仕様）。
//    実際のアクセス制御は Storage のセキュリティルールと Authentication で行います。
//    詳細は「動画アップロード機能_セットアップ手順.md」を参照してください。
// ------------------------------------------------------------

window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyD4n-tBvTbdpwdYV-3AbQU0Zh1Sm4kVLBU",
  authDomain: "ayukilab-storage.firebaseapp.com",
  projectId: "ayukilab-storage",
  storageBucket: "ayukilab-storage.firebasestorage.app",
  messagingSenderId: "123180414253",
  appId: "1:123180414253:web:f47474c780debd691e8f4"
};

// ログインを許可する管理者アカウントのUID（セットアップ手順の手順5で取得して入力）
// 空欄のままだと「ログインした人全員」がアクセスできてしまうため、必ず設定してください。
window.ADMIN_UID = "";
