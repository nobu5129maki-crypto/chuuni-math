<?php
require __DIR__ . '/auth.php';
chuuni_session_start();

$method = isset($_SERVER['REQUEST_METHOD']) ? (string) $_SERVER['REQUEST_METHOD'] : 'GET';
if ($method === 'GET') {
    $requestPath = parse_url(isset($_SERVER['REQUEST_URI']) ? (string) $_SERVER['REQUEST_URI'] : '', PHP_URL_PATH);
    if (is_string($requestPath) && $requestPath !== '/' && substr($requestPath, -1) !== '/' && !preg_match('/\.php$/', $requestPath)) {
        $query = isset($_SERVER['QUERY_STRING']) && $_SERVER['QUERY_STRING'] !== '' ? '?' . $_SERVER['QUERY_STRING'] : '';
        header('Location: ' . $requestPath . '/' . $query, true, 301);
        exit;
    }
}

if (empty($_SESSION['chuuni_csrf']) || !is_string($_SESSION['chuuni_csrf'])) {
    $_SESSION['chuuni_csrf'] = bin2hex(random_bytes(16));
}

$error = '';
$postedId = '';
if ($method === 'POST') {
    $postedId = isset($_POST['login_id']) ? trim((string) $_POST['login_id']) : '';
    $postedPassword = isset($_POST['password']) ? (string) $_POST['password'] : '';
    $postedToken = isset($_POST['csrf']) ? (string) $_POST['csrf'] : '';
    $tokenOk = is_string($_SESSION['chuuni_csrf']) && hash_equals($_SESSION['chuuni_csrf'], $postedToken);
    if ($tokenOk && chuuni_check_login($postedId, $postedPassword)) {
        session_regenerate_id(true);
        $_SESSION['chuuni_user'] = $postedId;
        $_SESSION['chuuni_csrf'] = bin2hex(random_bytes(16));
        $home = chuuni_cookie_path();
        if ($home !== '/') {
            $home .= '/';
        }
        header('Location: ' . $home, true, 303);
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        exit;
    }
    $error = 'IDまたはパスワードが違います';
}

if (chuuni_logged_in()) {
    $app = __DIR__ . '/index.html';
    if (!is_file($app)) {
        http_response_code(500);
        header('Content-Type: text/plain; charset=UTF-8');
        echo "画面を読み込めません\n";
        exit;
    }
    $html = file_get_contents($app);
    if (!is_string($html)) {
        http_response_code(500);
        header('Content-Type: text/plain; charset=UTF-8');
        echo "画面を読み込めません\n";
        exit;
    }
    $save = <<<'HTML'
<script>(function(){try{var i=sessionStorage.getItem("chuuni_pending_id");var p=sessionStorage.getItem("chuuni_pending_password");if(i&&p){localStorage.setItem("chuuni_login_id",i);localStorage.setItem("chuuni_login_password",p);sessionStorage.removeItem("chuuni_pending_id");sessionStorage.removeItem("chuuni_pending_password");}}catch(e){}})();</script>
HTML;
    $html = preg_replace('/<\\/head>/', $save . '</head>', $html, 1);
    header('Content-Type: text/html; charset=UTF-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');
    header('X-Content-Type-Options: nosniff');
    echo $html;
    exit;
}

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
header('X-Content-Type-Options: nosniff');
http_response_code(200);
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#0c1220">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="数チャレ">
    <meta name="description" content="中学2年生向けの数学ドリル">
    <link rel="manifest" href="./manifest.json">
    <link rel="icon" type="image/png" sizes="192x192" href="./pwa-192x192.png">
    <link rel="apple-touch-icon" href="./pwa-192x192.png">
    <title>ログイン｜数チャレ！中2マスター</title>
    <script>
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(function () {});
        }
    </script>
    <style>
        * { box-sizing: border-box; }
        html, body {
            margin: 0;
            min-height: 100%;
            font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", Meiryo, sans-serif;
            color: #f1f5f9;
            background:
                radial-gradient(900px 520px at 10% 0%, #1e3a5f 0%, transparent 55%),
                radial-gradient(700px 420px at 100% 12%, #4c1d95 0%, transparent 46%),
                linear-gradient(165deg, #0c1220, #141b2d);
        }
        body { min-height: 100vh; }
        main { max-width: 430px; margin: 0 auto; padding: 36px 16px 48px; }
        header { text-align: center; }
        .mark {
            width: 80px;
            height: 80px;
            border-radius: 18px;
            box-shadow: 0 10px 30px rgba(56, 189, 248, 0.28);
        }
        h1 { margin: 16px 0 0; font-size: 1.55rem; letter-spacing: 0.03em; line-height: 1.35; }
        .lead { margin: 8px 0 0; color: #94a3b8; line-height: 1.7; }
        form {
            margin-top: 22px;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 16px;
            padding: 20px;
        }
        label { display: block; font-size: 0.85rem; font-weight: 700; color: #38bdf8; margin-bottom: 6px; }
        .field { margin-bottom: 14px; }
        input {
            width: 100%;
            border: 2px solid rgba(255, 255, 255, 0.14);
            background: #0c1220;
            border-radius: 8px;
            padding: 12px 14px;
            font: inherit;
            color: inherit;
        }
        input:focus { outline: none; border-color: #38bdf8; }
        .password-row { display: flex; gap: 8px; }
        .password-row input { min-width: 0; }
        button, .toggle { font: inherit; cursor: pointer; }
        .toggle {
            flex: 0 0 auto;
            border-radius: 8px;
            border: 2px solid rgba(255, 255, 255, 0.14);
            background: #0c1220;
            color: #f1f5f9;
            padding: 0 14px;
            font-weight: 700;
        }
        .submit {
            width: 100%;
            border: none;
            border-radius: 12px;
            background: #38bdf8;
            color: #0c1220;
            font-weight: 800;
            padding: 14px;
        }
        .error {
            margin: 0 0 14px;
            padding: 10px 12px;
            border-radius: 8px;
            background: rgba(251, 113, 133, 0.16);
            color: #fecdd3;
            font-size: 0.95rem;
            font-weight: 700;
        }
        [hidden] { display: none !important; }
    </style>
</head>
<body>
    <main>
        <header>
            <img class="mark" src="./pwa-192x192.png" alt="" width="80" height="80">
            <h1>数チャレ！中2マスター</h1>
            <p class="lead">入るには ID とパスワードが必要です</p>
        </header>
        <form method="post" action="" autocomplete="off">
            <input type="hidden" name="csrf" value="<?php echo htmlspecialchars($_SESSION['chuuni_csrf'], ENT_QUOTES, 'UTF-8'); ?>">
            <p id="loginError" class="error" role="alert"<?php echo $error === '' ? ' hidden' : ''; ?>><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></p>
            <div class="field">
                <label for="login_id">ID</label>
                <input id="login_id" name="login_id" type="text" inputmode="text" autocomplete="username" required maxlength="64" value="<?php echo htmlspecialchars($postedId, ENT_QUOTES, 'UTF-8'); ?>">
            </div>
            <div class="field">
                <label for="password">パスワード</label>
                <div class="password-row">
                    <input id="password" name="password" type="password" autocomplete="current-password" required maxlength="128">
                    <button type="button" class="toggle" id="togglePassword" aria-controls="password" aria-pressed="false">表示</button>
                </div>
            </div>
            <button type="submit" class="submit">入る</button>
        </form>
    </main>
    <script>
        var idKey = "chuuni_login_id";
        var passwordKey = "chuuni_login_password";
        var form = document.querySelector("form");
        var idInput = document.getElementById("login_id");
        var passwordInput = document.getElementById("password");
        var errorBox = document.getElementById("loginError");

        document.getElementById("togglePassword").addEventListener("click", function () {
            var showing = passwordInput.type === "text";
            passwordInput.type = showing ? "password" : "text";
            this.textContent = showing ? "表示" : "隠す";
            this.setAttribute("aria-pressed", showing ? "false" : "true");
        });

        form.addEventListener("submit", function () {
            try {
                sessionStorage.setItem("chuuni_pending_id", idInput.value.trim());
                sessionStorage.setItem("chuuni_pending_password", passwordInput.value);
            } catch (err) {}
        });

        try {
            var failed = errorBox && !errorBox.hasAttribute("hidden") && errorBox.textContent;
            if (failed) {
                localStorage.removeItem(passwordKey);
                sessionStorage.removeItem("chuuni_pending_id");
                sessionStorage.removeItem("chuuni_pending_password");
            }
            var savedId = localStorage.getItem(idKey) || "";
            var savedPassword = localStorage.getItem(passwordKey) || "";
            if (!failed && savedId && savedPassword) {
                idInput.value = savedId;
                passwordInput.value = savedPassword;
                try {
                    sessionStorage.setItem("chuuni_pending_id", savedId);
                    sessionStorage.setItem("chuuni_pending_password", savedPassword);
                } catch (err) {}
                form.submit();
            } else if (savedId && !idInput.value) {
                idInput.value = savedId;
            }
        } catch (err) {}
    </script>
</body>
</html>
