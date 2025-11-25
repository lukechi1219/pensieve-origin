#!/bin/bash
# Google Cloud SDK Setup Script for Pensieve
# Installs and configures Google Cloud SDK for Text-to-Speech

set -e

echo "=================================================="
echo "☁️  Google Cloud SDK Setup for Pensieve"
echo "=================================================="
echo ""

# Check if gcloud is already installed
if command -v gcloud &> /dev/null; then
    echo "✅ Google Cloud SDK is already installed"
    gcloud --version
    echo ""
else
    echo "📦 Installing Google Cloud SDK via Homebrew..."

    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew is not installed. Please install Homebrew first:"
        echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi

    if brew install --cask google-cloud-sdk; then
        echo "✅ Google Cloud SDK installed successfully"
    else
        echo "❌ Failed to install Google Cloud SDK"
        exit 1
    fi
    echo ""
fi

# Authenticate with Google Cloud
echo "🔐 Google Cloud Authentication"
echo ""
echo "Step 1: Authenticate with your Google account"
echo "This will open your browser for authentication..."
read -p "Press Enter to continue..."

if gcloud auth login; then
    echo "✅ Authentication successful"
else
    echo "❌ Authentication failed"
    exit 1
fi

echo ""

# List projects
echo "📋 Listing your Google Cloud projects..."
gcloud projects list
echo ""

# Ask user to select or enter project ID
echo "Please enter your Google Cloud Project ID"
echo "(You can create a new project at: https://console.cloud.google.com/projectcreate)"
read -p "Project ID: " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Project ID cannot be empty"
    exit 1
fi

# Set project
echo ""
echo "Setting project to: $PROJECT_ID"
if gcloud config set project "$PROJECT_ID"; then
    echo "✅ Project set successfully"
else
    echo "❌ Failed to set project"
    exit 1
fi

echo ""

# Enable Text-to-Speech API
echo "🎤 Enabling Text-to-Speech API..."
if gcloud services enable texttospeech.googleapis.com; then
    echo "✅ Text-to-Speech API enabled"
else
    echo "❌ Failed to enable Text-to-Speech API"
    exit 1
fi

echo ""

# Set up Application Default Credentials
echo "🔑 Setting up Application Default Credentials"
echo "This will open your browser again for ADC authentication..."
read -p "Press Enter to continue..."

if gcloud auth application-default login; then
    echo "✅ Application Default Credentials configured"
else
    echo "❌ Failed to configure ADC"
    exit 1
fi

echo ""
echo "=================================================="
echo "✅ Google Cloud SDK setup completed!"
echo "=================================================="
echo ""
echo "Configuration:"
echo "  - Project ID: $PROJECT_ID"
echo "  - Text-to-Speech API: Enabled"
echo "  - Credentials: ~/.config/gcloud/application_default_credentials.json"
echo ""
echo "Testing TTS (optional)..."
read -p "Do you want to test Text-to-Speech now? (y/N): " TEST_TTS

if [[ "$TEST_TTS" =~ ^[Yy]$ ]]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    TTS_SCRIPT="$SCRIPT_DIR/google_tts.sh"

    if [ -f "$TTS_SCRIPT" ]; then
        chmod +x "$TTS_SCRIPT"
        echo ""
        echo "Testing English TTS..."
        "$TTS_SCRIPT" "Hello, JARVIS is now online" "en-GB"
        echo ""
        echo "Testing Chinese TTS..."
        "$TTS_SCRIPT" "您好，老賈已經上線" "cmn-TW"
        echo ""
        echo "✅ TTS test completed! Did you hear the audio?"
    else
        echo "⚠️  TTS script not found at: $TTS_SCRIPT"
    fi
fi

echo ""
