import os
import asyncio
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
    
    try:
        # Use no_updates=True to avoid receiving new updates during initialization,
        # which can speed up startup if we only need to read existing messages.
        # This will also prevent pyrogram from trying to keep a long-running connection
        # if the script is meant to be short-lived.
        async with Client(session_name, api_id, api_hash, no_updates=True) as app:
            try:
                await app.start() # Ensure client is started

                dialogs = []
                async for dialog in app.get_dialogs():
                    dialogs.append(dialog)

                for dialog in dialogs:
                    chat = dialog.chat
                    unread = dialog.unread_messages_count

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
                if app.is_connected:
                    await app.stop() # Ensure client is stopped

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
    # Output as JSON for easy parsing by the Node.js backend
    import json
    print(json.dumps(unread_chats_info))
