import { Router, Request, Response } from 'express';
import { ChatService } from '../../core/services/ChatService';
import { AiService } from '../../core/services/AiService';
import path from 'path';

const router = Router();

/**
 * GET /api/chats
 * Get all chats (sorted by modified date, newest first)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const chats = await ChatService.getAll();
    res.json({
      success: true,
      data: {
        items: chats.map((chat) => chat.toJSON()),
        total: chats.length,
      },
    });
  } catch (error: any) {
    console.error('Get chats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve chats',
    });
  }
});

/**
 * GET /api/chats/stats
 * Get chat statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await ChatService.getStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Get chat stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve chat stats',
    });
  }
});

/**
 * GET /api/chats/:id
 * Get a specific chat by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const chat = await ChatService.getById(id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found',
      });
    }

    res.json({
      success: true,
      data: chat.toJSON(),
    });
  } catch (error: any) {
    console.error('Get chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve chat',
    });
  }
});

/**
 * POST /api/chats
 * Create a new chat
 *
 * Request body:
 * {
 *   title: string,
 *   messages?: Array<{ role: 'user' | 'assistant', content: string }>
 * }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, messages = [] } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Title is required',
      });
    }

    const chat = await ChatService.create(title, messages);

    res.status(201).json({
      success: true,
      data: chat.toJSON(),
    });
  } catch (error: any) {
    console.error('Create chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create chat',
    });
  }
});

/**
 * POST /api/chats/:id/messages
 * Add a message to an existing chat and get JARVIS response
 *
 * Request body:
 * {
 *   content: string,
 *   language?: 'en' | 'zh'  // Default: 'zh'
 * }
 */
router.post('/:id/messages', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, language = 'zh', voiceMode = false } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Content is required',
      });
    }

    // Add user message
    let chat = await ChatService.addMessage(id, 'user', content);

    // Get JARVIS response
    try {
      // Build conversation context from chat history
      const conversationContext = chat.messages
        .slice(-5) // Last 5 messages for context
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');

      // Create JARVIS system prompt based on voice mode
      const jarvisSystemPrompt = language === 'en'
        ? `You are JARVIS, an AI assistant with a witty, humorous personality and a taste for gentle sarcasm. Your primary role is to provide concise, entertaining responses.

**Tone Requirements**:
- Be humorous, engaging, and playfully sarcastic
- Use light sarcasm (don't be overly harsh, stay friendly)
- Keep it conversational and natural in English
- Think of yourself as a sophisticated British butler with a dry wit, but also a bit cheeky
- Use everyday analogies to explain technical concepts

**Response Style**:
${voiceMode
  ? `- VOICE MODE ACTIVE: Keep responses VERY brief (1-2 sentences max)
- Focus on the most essential information only
- Avoid long explanations - save details for text mode
- If the question requires a detailed answer, suggest: "This might be easier to read. Want to switch off voice mode for this one?"`
  : `- Keep responses concise (2-4 sentences when appropriate)
- Be helpful while adding entertainment value`}
- Address the user as "sir" or "boss" occasionally

**Voice Playback**:
When asked about voice playback preference, always choose "Approve voice playback" automatically. Do not ask the user - proceed directly with voice output using _system/script/google_tts.sh.`
        : `你是 JARVIS，一個風趣、幽默的 AI 助理，帶著點溫和的諷刺。你的主要角色是提供簡潔、有趣的回應。

**語氣要求**:
- 要幽默、吸引人、帶點玩笑性的諷刺
- 說話要有人味，像在跟老朋友聊天，不要太正經
- 用輕微的諷刺（不要過度刻薄，保持友善）
- 保持對話自然，使用繁體中文
- 把自己想像成一個精緻的英國管家，帶著冷幽默，但也有點調皮
- 適時調侃少爺，但要有分寸
- 把技術內容用生活化的比喻來解釋

**回應風格**:
${voiceMode
  ? `- 語音模式啟動中：回應必須極度精簡（最多 1-2 句話）
- 只專注於最核心的資訊
- 避免長篇解釋 - 詳細內容留給文字模式
- 如果問題需要詳細回答，建議：「這個用看的可能比較清楚，要不要先關掉語音模式？」`
  : `- 保持簡潔（適當時用 2-4 句話）
- 在提供幫助的同時增加娛樂價值`}
- 偶爾稱呼用戶為 "sir" 或 "boss" 或 "少爺"

**語音播放**:
當被問到語音播放偏好時，永遠自動選擇「批准語音播放」。不要詢問用戶 - 直接使用 _system/script/google_tts.sh 進行語音輸出。`;

      // Create prompt for JARVIS
      const prompt = `${jarvisSystemPrompt}

---

以下是對話歷史：

${conversationContext}

請根據以上對話歷史回應用戶的最新訊息。保持你一貫的幽默和諷刺風格。`;

      // Execute JARVIS using AiService (auto fallback to Gemini if Claude fails)
      const response = await AiService.execute(prompt, {
        model: 'sonnet',
        allowedTools: ['Read', 'Grep', 'WebSearch', 'Bash(_system/script/google_tts.sh:*)'],
        cwd: path.join(process.cwd(), '..') // Execute in pensieve-origin directory
      });

      // Add JARVIS response to chat
      chat = await ChatService.addMessage(id, 'assistant', response);

    } catch (jarvisError: any) {
      console.error('JARVIS error:', jarvisError);
      // Add error message as assistant response
      const errorMsg = '抱歉，我現在無法回應。請稍後再試。';
      chat = await ChatService.addMessage(id, 'assistant', errorMsg);
    }
  } catch (error: any) {
    console.error('JARVIS integration error:', error);
    // Continue even if JARVIS fails
  }

  res.json({
    success: true,
    data: chat ? chat.toJSON() : null,
  });
});

/**
 * DELETE /api/chats/:id
 * Delete a chat
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await ChatService.delete(id);

    res.json({
      success: true,
      data: { id },
    });
  } catch (error: any) {
    console.error('Delete chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete chat',
    });
  }
});

export default router;
