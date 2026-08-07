// ============================================================
// AyukiLab 外部提出用アップロード中継スクリプト
// 岸上様ご自身のGoogleアカウントで実行する Apps Script Web App。
// 訪問者（ログイン不要）から送られたファイルを、このスクリプトの
// 所有者（岸上様）の権限で岸上様のGoogleドライブに保存します。
//
// デプロイ設定：
//   実行するユーザー: 自分（Me）
//   アクセスできるユーザー: 全員（Anyone）
// ============================================================

var TARGET_FOLDER_NAME = 'AyukiLab_外部からの提出';
var CACHE_PREFIX = 'upload_';
var CACHE_TTL_SECONDS = 21600; // 6時間

function doPost(e) {
  var output;
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;

    if (action === 'init') {
      output = handleInit(body);
    } else if (action === 'chunk') {
      output = handleChunk(body);
    } else {
      output = { error: '不明なaction: ' + action };
    }
  } catch (err) {
    output = { error: 'サーバーエラー: ' + err.message };
  }
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateFolder_(name) {
  var folders = DriveApp.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(name);
}

function handleInit(body) {
  var fileName = body.fileName;
  var mimeType = body.mimeType || 'application/octet-stream';
  var fileSize = body.fileSize;

  if (!fileName || !fileSize) {
    return { error: 'fileNameとfileSizeは必須です' };
  }

  var folder = getOrCreateFolder_(TARGET_FOLDER_NAME);

  var initUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id';
  var metadata = {
    name: fileName,
    parents: [folder.getId()]
  };

  var resp = UrlFetchApp.fetch(initUrl, {
    method: 'post',
    contentType: 'application/json; charset=UTF-8',
    headers: {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
    },
    payload: JSON.stringify(metadata),
    muteHttpExceptions: true
  });

  var headers = resp.getAllHeaders();
  var sessionUri = headers['Location'] || headers['location'];

  if (!sessionUri) {
    return { error: 'アップロードセッションの開始に失敗しました: ' + resp.getContentText() };
  }

  var uploadId = Utilities.getUuid();
  var cache = CacheService.getScriptCache();
  cache.put(CACHE_PREFIX + uploadId, JSON.stringify({
    sessionUri: sessionUri,
    fileSize: fileSize,
    fileName: fileName
  }), CACHE_TTL_SECONDS);

  return { uploadId: uploadId };
}

function handleChunk(body) {
  var uploadId = body.uploadId;
  var start = body.start;
  var end = body.end;
  var dataB64 = body.data;

  var cache = CacheService.getScriptCache();
  var raw = cache.get(CACHE_PREFIX + uploadId);
  if (!raw) {
    return { error: 'アップロードセッションが見つかりません（時間切れの可能性があります。最初からやり直してください）' };
  }
  var session = JSON.parse(raw);
  var bytes = Utilities.base64Decode(dataB64);

  var resp = UrlFetchApp.fetch(session.sessionUri, {
    method: 'put',
    headers: {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
      'Content-Range': 'bytes ' + start + '-' + end + '/' + session.fileSize
    },
    payload: bytes,
    muteHttpExceptions: true
  });

  var status = resp.getResponseCode();

  if (status === 200 || status === 201) {
    cache.remove(CACHE_PREFIX + uploadId);
    var result = JSON.parse(resp.getContentText());
    return { done: true, fileId: result.id, fileName: session.fileName };
  } else if (status === 308) {
    return { done: false };
  } else {
    return { error: 'アップロード失敗 (status ' + status + '): ' + resp.getContentText() };
  }
}
