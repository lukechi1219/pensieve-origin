#!/bin/bash
# Google Cloud Text-to-Speech 語音播放腳本
# 用法: ./google_tts.sh "要播放的文字" [語言代碼]
# 語言代碼: cmn-TW (中文，預設) 或 en-GB (英文)

set -e

TEXT="${1:-測試語音}"
LANG_CODE="${2:-cmn-TW}"

# 根據語言選擇語音
if [ "$LANG_CODE" = "en-GB" ]; then
    VOICE_NAME="en-GB-Standard-B"
else
    VOICE_NAME="cmn-TW-Wavenet-A"
    LANG_CODE="cmn-TW"
fi

# 找到 gcloud 路徑
GCLOUD_PATH=""
if command -v gcloud &> /dev/null; then
    GCLOUD_PATH="gcloud"
elif [ -f "/opt/homebrew/bin/gcloud" ]; then
    GCLOUD_PATH="/opt/homebrew/bin/gcloud"
elif [ -f "/usr/local/bin/gcloud" ]; then
    GCLOUD_PATH="/usr/local/bin/gcloud"
elif [ -f "$HOME/google-cloud-sdk/bin/gcloud" ]; then
    GCLOUD_PATH="$HOME/google-cloud-sdk/bin/gcloud"
elif [ -f "/opt/homebrew/Caskroom/google-cloud-sdk/latest/google-cloud-sdk/bin/gcloud" ]; then
    GCLOUD_PATH="/opt/homebrew/Caskroom/google-cloud-sdk/latest/google-cloud-sdk/bin/gcloud"
fi

if [ -z "$GCLOUD_PATH" ]; then
    echo "錯誤: 找不到 gcloud，請先安裝 Google Cloud SDK"
    echo "安裝指令: brew install google-cloud-sdk"
    exit 1
fi

# 執行 Python TTS
# SECURITY FIX (VULN-001): Pass variables via environment variables
# This prevents command injection - Python reads from environment, not shell expansion
export TTS_TEXT="$TEXT"
export TTS_VOICE_NAME="$VOICE_NAME"
export TTS_LANGUAGE_CODE="$LANG_CODE"
export TTS_GCLOUD_PATH="$GCLOUD_PATH"

python3 - << 'PYTHON_SCRIPT'
# -*- coding: utf-8 -*-
import subprocess
import json
import base64
import tempfile
import os
import urllib.request
import urllib.error

# Read from environment variables (safe - no shell expansion in Python)
TEXT = os.environ.get('TTS_TEXT', '測試語音')
VOICE_NAME = os.environ.get('TTS_VOICE_NAME', 'cmn-TW-Wavenet-A')
LANGUAGE_CODE = os.environ.get('TTS_LANGUAGE_CODE', 'cmn-TW')
GCLOUD_PATH = os.environ.get('TTS_GCLOUD_PATH', 'gcloud')

try:
    # 取得 access token
    token = subprocess.check_output([GCLOUD_PATH, "auth", "print-access-token"]).decode().strip()

    # 取得 project ID
    project_id = subprocess.check_output([GCLOUD_PATH, "config", "get-value", "project"], stderr=subprocess.DEVNULL).decode().strip()

    if not project_id:
        print("錯誤: 未設定 GCP project，請執行: gcloud config set project YOUR_PROJECT_ID")
        exit(1)

    # 準備 request body
    request_body = {
        "input": {"text": TEXT},
        "voice": {
            "languageCode": LANGUAGE_CODE,
            "name": VOICE_NAME
        },
        "audioConfig": {
            "audioEncoding": "LINEAR16",
            "sampleRateHertz": 24000
        }
    }

    # 呼叫 API
    req = urllib.request.Request(
        "https://texttospeech.googleapis.com/v1/text:synthesize",
        data=json.dumps(request_body).encode(),
        headers={
            "Authorization": f"Bearer {token}",
            "x-goog-user-project": project_id,
            "Content-Type": "application/json; charset=utf-8"
        }
    )

    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode())

    # 儲存並播放音檔
    audio_content = base64.b64decode(result["audioContent"])
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(audio_content)
        temp_path = f.name

    # 使用 afplay 播放（macOS）
    subprocess.run(["afplay", temp_path], check=True)
    os.unlink(temp_path)

except urllib.error.HTTPError as e:
    error_body = e.read().decode()
    print(f"API 錯誤 ({e.code}): {error_body}")
    exit(1)
except Exception as e:
    print(f"錯誤: {e}")
    exit(1)
PYTHON_SCRIPT
