import { useState, useRef, useEffect, useCallback } from "react"
import { aiService } from "@/services/aiService"
import { useNavigate } from "react-router-dom"
import { MessageCircle, X, Send, Trash2, Bot, User, Sparkles, ChevronDown } from "lucide-react"

// ─── Helpers ────────────────────────────────────────────────────────────────

const SESSION_KEY = "sportify_ai_session_id"

function getStoredSessionId() {
  return sessionStorage.getItem(SESSION_KEY) || null
}

function saveSessionId(id) {
  if (id) sessionStorage.setItem(SESSION_KEY, id)
}

function removeSessionId() {
  sessionStorage.removeItem(SESSION_KEY)
}

// Render markdown đơn giản: **bold**, *italic*, xuống dòng
function renderMarkdown(text) {
  if (!text) return ""
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline font-medium">$1</a>')
    .replace(/\n/g, "<br/>")
}

// ─── Typing indicator ────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

// ─── Suggestion chips ────────────────────────────────────────────────────────

function SuggestionChips({ suggestions, onSelect }) {
  if (!suggestions?.length) return null
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {suggestions.map((s, i) => (
        <button
          key={i}
          onClick={() => onSelect(s)}
          className="text-xs px-2.5 py-1 rounded-full border border-primary/30 bg-primary/5
                     text-primary hover:bg-primary/15 hover:border-primary/60 transition-all
                     text-left leading-snug"
        >
          {s}
        </button>
      ))}
    </div>
  )
}

// ─── Single message bubble ────────────────────────────────────────────────────

function MessageBubble({ msg, onSuggestionClick }) {
  const navigate = useNavigate()
  const isUser = msg.role === "user"

  const handleClick = (e) => {
    if (e.target.tagName === "A") {
      let href = e.target.getAttribute("href")
      if (href && href.startsWith("/")) {
        e.preventDefault()
        
        // Fix AI generated links /booking?fieldId=xxx -> /fields/xxx
        if (href.startsWith("/booking?")) {
          const urlParams = new URLSearchParams(href.split("?")[1])
          const fieldId = urlParams.get("fieldId")
          if (fieldId) {
            href = `/fields/${fieldId}`
          } else {
            href = "/fields"
          }
        }
        
        navigate(href)
      }
    }
  }

  return (
    <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-white
                    ${isUser ? "bg-primary" : "bg-gradient-to-br from-violet-500 to-blue-500"}`}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>

      <div className={`flex flex-col gap-1 max-w-[82%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          onClick={handleClick}
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed
            ${isUser
              ? "bg-primary text-white rounded-br-sm"
              : "bg-muted text-foreground rounded-bl-sm border border-border"
            }`}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
        />
        {!isUser && msg.suggestions && (
          <SuggestionChips suggestions={msg.suggestions} onSelect={onSuggestionClick} />
        )}
      </div>
    </div>
  )
}

// ─── Main ChatWidget ──────────────────────────────────────────────────────────

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(getStoredSessionId)
  const [hasUnread, setHasUnread] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const chatBodyRef = useRef(null)

  // Scroll to bottom khi có tin mới
  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, loading, isOpen])

  // Focus input khi mở
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150)
      setHasUnread(false)
    }
  }, [isOpen])

  // Tin nhắn chào mừng lần đầu
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "model",
          content:
            "Xin chào! Tôi là trợ lý AI của **Sportify**\n\nTôi có thể giúp bạn:\n- Tìm sân thể thao phù hợp\n- Xem thông tin lịch đặt sân\n- Tư vấn giá và khung giờ\n\nBạn cần hỗ trợ gì không?",
          suggestions: [
            "Sân bóng đá còn trống hôm nay?",
            "Xem lịch đặt sân của tôi",
            "Giá thuê sân bao nhiêu?",
          ],
        },
      ])
    }
  }, [])

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = (text || input).trim()
      if (!trimmed || loading) return

      setInput("")
      setMessages((prev) => [...prev, { role: "user", content: trimmed }])
      setLoading(true)

      try {
        const res = await aiService.chat(trimmed, sessionId)
        const data = res.data?.data || res.data
        const reply = data?.reply || "Xin lỗi, tôi không hiểu. Bạn thử hỏi lại nhé!"
        const newSessionId = data?.sessionId || sessionId
        const suggestions = data?.suggestions || []

        if (newSessionId) {
          setSessionId(newSessionId)
          saveSessionId(newSessionId)
        }

        setMessages((prev) => [
          ...prev,
          { role: "model", content: reply, suggestions },
        ])

        if (!isOpen) setHasUnread(true)
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            content: "Đã có lỗi xảy ra. Vui lòng thử lại sau nhé!",
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [input, loading, sessionId, isOpen]
  )

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleClear = async () => {
    if (sessionId) {
      try {
        await aiService.clearSession(sessionId)
      } catch {}
    }
    removeSessionId()
    setSessionId(null)
    setMessages([
      {
        role: "model",
        content: "Cuộc trò chuyện đã được xóa. Tôi có thể giúp gì cho bạn? 😊",
        suggestions: [
          "Tìm sân thể thao gần đây",
          "Xem lịch đặt sân của tôi",
          "Tư vấn chọn sân",
        ],
      },
    ])
  }

  return (
    <>
      {/* ── Floating button ── */}
      <button
        id="ai-chat-toggle"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Mở chatbot AI"
        className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-2xl flex items-center justify-center
                    transition-all duration-300 hover:scale-110 active:scale-95
                    ${isOpen
                      ? "bg-foreground text-background"
                      : "bg-gradient-to-br from-primary to-emerald-600 text-white"
                    }`}
      >
        {isOpen ? (
          <ChevronDown className="h-6 w-6" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6" />
            {hasUnread && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-white animate-pulse" />
            )}
          </>
        )}
      </button>

      {/* ── Chat panel ── */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)]
                    rounded-2xl shadow-2xl border border-border bg-card
                    flex flex-col overflow-hidden
                    transition-all duration-300 origin-bottom-right
                    ${isOpen
                      ? "opacity-100 scale-100 pointer-events-auto"
                      : "opacity-0 scale-95 pointer-events-none"
                    }`}
        style={{ height: "520px" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary to-emerald-600 text-white shrink-0">
          <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight">Sportify AI</p>
            <p className="text-xs text-white/75">Trợ lý đặt sân thông minh</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleClear}
              title="Xóa cuộc trò chuyện"
              className="h-8 w-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={chatBodyRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        >
          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              msg={msg}
              onSuggestionClick={(s) => sendMessage(s)}
            />
          ))}

          {loading && (
            <div className="flex items-end gap-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white shrink-0">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="px-3 py-2 rounded-2xl rounded-bl-sm bg-muted border border-border">
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-3 py-3 border-t border-border bg-card shrink-0">
          <div className="flex items-end gap-2 rounded-xl border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring/30 transition-all">
            <textarea
              ref={inputRef}
              id="ai-chat-input"
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                // Auto-resize
                e.target.style.height = "auto"
                e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px"
              }}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi của bạn..."
              className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground leading-snug max-h-24 py-0.5"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center
                         hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed
                         transition-all shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-center text-[10px] text-muted-foreground mt-1.5">
            Powered by Gemini AI · Enter để gửi
          </p>
        </div>
      </div>
    </>
  )
}
