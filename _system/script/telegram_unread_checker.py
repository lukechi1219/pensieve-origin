import os
import asyncio
import sys
from pyrogram import Client, errors

async def get_unread_telegram_messages():
    api_id = os.environ.get("TELEGRAM_APP_API_ID")
    api_hash = os.environ.get("TELEGRAM_APP_API_HASH")
    session_name = os.environ.get("TELEGRAM_SESSION_NAME", "telegram_session") # Use a default session name or get from env

    if not api_id or not api_hash:
        print("Error: TELEGRAM_APP_API_ID and TELEGRAM_APP_API_HASH must be set in environment variables.")
        return []

    # Convert api_id to int
    try:
        api_id = int(api_id)
    except ValueError:
        print("Error: TELEGRAM_APP_API_ID must be an integer.")
        return []

    unread_messages = []
    
    # Remove potential session lock files
    session_file_path = f"{session_name}.session"
    journal_file_path = f"{session_file_path}-journal" # pyrogram uses -journal for locking

    if os.path.exists(journal_file_path):
        print(f"DEBUG: Removing session journal file: {journal_file_path}", file=sys.stderr)
    
    try:
        # Use no_updates=True to avoid receiving new updates during initialization,
        # which can speed up startup if we only need to read existing messages.
        # This will also prevent pyrogram from trying to keep a long-running connection
        # if the script is meant to be short-lived.
        print(f"DEBUG: Initializing Pyrogram Client with session: {session_name}", file=sys.stderr)
        async with Client(session_name, api_id, api_hash, no_updates=True) as app:
            print(f"DEBUG: Client context entered. Is connected: {app.is_connected}", file=sys.stderr)
            try:
                # app.start() is implicitly called by the context manager,
                # or will be called on first API request if not connected.
                # Explicitly calling it again often leads to "Client is already connected" errors.
                # await app.start() # Removed explicit start call
                if not app.is_connected:
                    print("DEBUG: Client not connected, attempting explicit start (should not happen in context manager)", file=sys.stderr)
                    await app.start()

                print("DEBUG: Client is ready, fetching dialogs...", file=sys.stderr)
                dialogs = []
                async for dialog in app.get_dialogs():
                    dialogs.append(dialog)

                print(f"DEBUG: Fetched {len(dialogs)} dialogs.", file=sys.stderr)
                for dialog in dialogs:
                    chat = dialog.chat
                    unread = dialog.unread_messages_count
                    print(f"DEBUG: Chat ID: {chat.id}, Title: {chat.title or chat.first_name}, Unread: {unread}", file=sys.stderr)

                    if unread > 0:
                        unread_messages.append({
                            "chat_id": chat.id,
                            "chat_title": chat.title or chat.first_name,
                            "unread_count": unread
                        })
            except errors.AuthKeyUnregistered:
                print("Error: The authorization key is no longer valid. Please re-authenticate.")
                # This might require manual intervention to log in again, 
                # or ensuring the session is valid.
            except errors.SessionPasswordNeeded:
                print("Error: Two-factor authentication is enabled. Please provide the password.")
            except errors.PhoneCodeExpired:
                print("Error: The phone code has expired. Please try logging in again.")
            except errors.FloodWait as e:
                print(f"Error: Flood wait for {e.value} seconds. Please wait before retrying.")
            except errors.AuthBytesInvalid:
                print("Error: Invalid authorization bytes. Please check your API ID and HASH.")
            except Exception as e:
                print(f"An unexpected error occurred during message fetching: {e}")
            finally:
                # The context manager should handle stopping
                # if app.is_connected:
                #     await app.stop() # Removed explicit stop call
                print(f"DEBUG: Client context exited. Is connected: {app.is_connected}", file=sys.stderr)

    except errors.AuthKeyUnregistered:
        print("Error: The authorization key is no longer valid. Please re-authenticate.")
    except errors.SessionPasswordNeeded:
        print("Error: Two-factor authentication is enabled. Please provide the password.")
    except errors.PhoneCodeExpired:
        print("Error: The phone code has expired. Please try logging in again.")
    except errors.FloodWait as e:
        print(f"Error: Flood wait for {e.value} seconds. Please wait before retrying.")
    except errors.AuthBytesInvalid:
        print("Error: Invalid authorization bytes. Please check your API ID and HASH.")
    except Exception as e:
        print(f"An unexpected error occurred during client initialization: {e}")
    
    return unread_messages

if __name__ == "__main__":
    unread_chats_info = asyncio.run(get_unread_telegram_messages())
    print(f"DEBUG: Final unread_chats_info: {unread_chats_info}", file=sys.stderr)
    # Output as JSON for easy parsing by the Node.js backend
    import json
    print(json.dumps(unread_chats_info))
