# Pensieve Mobile - Flutter iOS App Plan

## Project Overview

*   **Name:** Pensieve Mobile
*   **Framework:** Flutter (Dart)
*   **Platforms:** iOS (Primary), Android (Compatible)
*   **Backend:** Connects to your existing Node.js/Express `_system` API.
    *   **Note:** Mobile apps cannot access `localhost` directly on a physical device. You will need to ensure your computer is on the same Wi-Fi network and use its local IP address (e.g., `http://192.168.1.5:3000`), or utilize a tunneling service like `ngrok` for external access.
*   **Key Features:** Note management (PARA), Journaling, Jarvis Chat, and Text-to-Speech.

---

## Phase 1: Environment & Project Setup

**Goal:** Initialize a clean, maintainable Flutter project structure.

1.  **Create Project:**
    *   Create a new directory `mobile-app` in the root of `pensieve-origin`.
    *   Initialize Flutter project: `flutter create --org com.pensieve mobile_app` (using snake_case for folder/package name for Flutter conventions).

2.  **Dependencies (`pubspec.yaml`):**
    *   **Networking:** `dio` (for robust HTTP client requests).
    *   **State Management:** `provider` (chosen for simplicity and ease of integration, aligning with potential React Context-like patterns).
    *   **UI Utilities:**
        *   `google_fonts` (for consistent typography).
        *   `flutter_markdown` (for rendering Markdown content from notes).
        *   `intl` (for locale-aware date and time formatting).
    *   **Navigation:** `go_router` (for declarative routing and deep linking).
    *   **Local Storage:** `shared_preferences` (for storing user settings like the backend API URL and API keys).
    *   **Audio Playback:** `audioplayers` (to play synthesized speech audio).
    *   `path_provider` (to find suitable temporary directories for audio files).
    *   **JSON Serialization:** `json_annotation` and `build_runner` for efficient model serialization.
    *   **Google Cloud TTS:** `http` (for direct API calls to Google Cloud Text-to-Speech).

3.  **Project Architecture:**
    ```
    mobile-app/
    ├── lib/
    │   ├── main.dart             # Application entry point
    │   ├── config/               # Application-wide configurations (theme, constants, routes)
    │   ├── core/                 # Core logic, API client, utility functions
    │   │   ├── api_client.dart
    │   │   ├── tts_service.dart
    │   │   └── utils.dart
    │   ├── models/               # Dart classes mirroring backend data structures
    │   ├── providers/            # State management logic (using Provider)
    │   ├── screens/              # Top-level UI components (pages)
    │   │   ├── dashboard_screen.dart
    │   │   ├── notes_screen.dart
    │   │   ├── note_detail_screen.dart
    │   │   ├── journal_screen.dart
    │   │   ├── chat_screen.dart
    │   │   └── settings_screen.dart
    │   └── widgets/              # Reusable UI widgets
    ├── pubspec.yaml
    └── ... (other Flutter project files)
    ```

---

## Phase 2: Data Layer & Backend Integration

**Goal:** Replicate the backend data models and establish communication with the Pensieve API.

1.  **Data Models:**
    *   Create Dart classes for `Note`, `Journal`, `Project`, `Chat`, `ChatMessage`, `Template`, and `TelegramMessage` (and any other relevant backend models).
    *   Ensure proper `fromJson` and `toJson` methods for serialization, ideally using `json_annotation` and `build_runner`.

2.  **API Client (`ApiClient`):**
    *   Develop a `Dio`-based HTTP client to interact with the backend.
    *   Implement methods for each API endpoint (e.g., `getNotes()`, `getJournalToday()`, `createNote()`, `sendMessageToJarvis()`).
    *   **Configuration:** The API client's base URL (e.g., `http://YOUR_LOCAL_IP:3000`) must be configurable via a **Settings Screen** and stored using `shared_preferences`.

3.  **Service Wrappers (Optional but Recommended):**
    *   Create service classes (e.g., `NotesApi`, `JournalApi`, `ChatApi`) that use the `ApiClient` to provide higher-level, feature-specific data access.

---

## Phase 3: UI Implementation

**Goal:** Build the visual interface using Flutter's Material Design (Material 3).

1.  **Routing (`go_router`):**
    *   Configure `go_router` to handle application navigation.
    *   Implement a `ShellRoute` for persistent navigation elements like a bottom navigation bar.

2.  **Persistent Navigation:**
    *   Implement a `BottomNavigationBar` with destinations for:
        *   **Dashboard:** An overview of key Pensieve data.
        *   **Notes:** Access to all notes, categorized by PARA folders.
        *   **Journal:** Daily journaling view.
        *   **Jarvis Chat:** Interactive chat with the AI assistant.
        *   **Settings:** Application configuration.

3.  **Screen Details:**
    *   **Dashboard Screen:**
        *   Display current journaling streak.
        *   List "Recent Notes" (e.g., last 5 modified notes).
        *   Show "Active Projects" summary.
        *   Display any unread Telegram messages fetched via the backend API.
    *   **Notes Screen:**
        *   Implement a filter/tab UI for PARA folders (Inbox, Projects, Areas, Resources, Archive, People).
        *   Display a list of notes with title, and optionally tags/folder.
        *   `FloatingActionButton` for quick note capture (POST /api/notes).
        *   **Note Detail Screen:**
            *   Fetch and display full note content.
            *   Render Markdown using `flutter_markdown`.
            *   Allow editing note content and tags (PUT /api/notes/:id).
            *   Provide options to move or archive the note (POST /api/notes/:id/move).
            *   Integrate TTS functionality to read note content.
    *   **Journal Screen:**
        *   Display today's journal entry by default (GET /api/journals/today).
        *   Allow navigation to past journal entries (GET /api/journals/:date).
        *   Implement a form to update journal content, mood, energy level, habits, and gratitude (PUT /api/journals/:date).
        *   Show journaling streak (GET /api/journals/streak).
        *   Show overall journal statistics (GET /api/journals/stats).
    *   **Jarvis Chat Screen:**
        *   Build a chat UI with message bubbles (user and assistant).
        *   Input field to send messages (POST /api/chats/:id/messages).
        *   Display responses from Jarvis.
        *   Integrate TTS functionality to speak Jarvis's responses.
    *   **Settings Screen:**
        *   Input field for backend API URL.
        *   Input field for Google Cloud Text-to-Speech API Key.
        *   Theme toggle (Light/Dark mode).
        *   Language selection (en/zh).

---

## Phase 4: Google Cloud TTS Integration

**Goal:** Enable the mobile app to synthesize speech using the Google Cloud Text-to-Speech API.

1.  **API Key Management:**
    *   The Google Cloud TTS API key will be entered by the user in the **Settings Screen** and securely stored using `shared_preferences`.

2.  **`TtsService` Implementation:**
    *   This service will handle direct communication with the Google Cloud Text-to-Speech REST API.
    *   Construct HTTP `POST` requests to `https://texttospeech.googleapis.com/v1/text:synthesize`.
    *   Include the API key in the request headers or as a query parameter.
    *   The API returns a JSON response containing base64-encoded audio data.

3.  **Audio Playback:**
    *   Decode the base64 audio content into raw bytes.
    *   Save the audio bytes to a temporary file in the device's local storage (using `path_provider`).
    *   Utilize `audioplayers` to play the temporary audio file.
    *   Ensure proper error handling and resource cleanup (deleting temporary audio files).

4.  **UI Integration:**
    *   Add a visual indicator (e.g., a speaker icon) next to text content in `Note Detail Screen` and `Jarvis Chat Screen` that, when tapped, synthesizes and plays the corresponding text using the `TtsService`.

---

## Phase 5: Polishing & Build

1.  **iOS-Specific Configuration:**
    *   **`Info.plist`:** Adjust `NSAppTransportSecurity` settings to allow HTTP connections (`NSAllowsArbitraryLoads` set to `YES`) if you are connecting to your local backend via HTTP (which is likely during development). This should be configured carefully for production builds.
2.  **Error Handling & User Feedback:**
    *   Implement robust error handling for API calls and TTS.
    *   Provide user-friendly feedback (loading indicators, error messages, toast notifications).
3.  **Theming:**
    *   Implement light and dark theme support based on Flutter's Material 3 guidelines.
4.  **Testing:**
    *   Thoroughly test API connectivity, data parsing, UI responsiveness, and TTS functionality on an iOS simulator and physical device.
    *   Perform unit and widget tests for key components and services.
5.  **Build:**
    *   Generate a release build for iOS.
---

**Next Step:** Please confirm if this plan is suitable. If so, I will proceed to create the Flutter project and set up the basic directory structure.