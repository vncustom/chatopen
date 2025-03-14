"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { sendMessage } from "@/app/actions"
import { Paperclip, Loader2, X } from "lucide-react"
import Image from "next/image"

interface Message {
  role: "user" | "assistant" | "error"
  content: string
  timestamp: string
  attachments?: {
    name: string
    type: string
    content?: string
    url?: string
  }[]
}

interface FileAttachment {
  name: string
  type: string
  content?: string
  url?: string
}

export default function ChatPage() {
  const [apiKey, setApiKey] = useState<string>("")
  const [model, setModel] = useState<string>("deepseek/deepseek-r1:free")
  const [input, setInput] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [attachments, setAttachments] = useState<FileAttachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const models = [
    "deepseek/deepseek-r1:free",
    "qwen/qwen2.5-vl-72b-instruct:free",
    "deepseek/deepseek-chat:free",
    "google/gemini-2.0-flash-lite-preview-02-05:free",
    "google/gemini-2.0-flash-exp:free",
    "google/gemini-2.0-pro-exp-02-05:free",
    "google/gemini-2.0-flash-thinking-exp:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "qwen/qwq-32b:free",
    "cognitivecomputations/dolphin3.0-r1-mistral-24b:free",
    "deepseek/deepseek-r1-distill-llama-70b:free",
  ]

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()

      if (file.type.startsWith("image/")) {
        reader.onload = (e) => {
          const result = e.target?.result as string
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              type: file.type,
              url: result,
            },
          ])
        }
        reader.readAsDataURL(file)
      } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        reader.onload = (e) => {
          const result = e.target?.result as string
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              type: file.type,
              content: result,
            },
          ])
        }
        reader.readAsText(file)
      } else {
        // For other file types, just store the name and type
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type,
          },
        ])
      }
    })

    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isProcessing) {
      return
    }

    if (!apiKey) {
      setMessages([
        ...messages,
        {
          role: "error",
          content: "Vui lòng nhập API Key trước",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ])
      return
    }

    if (!input.trim() && attachments.length === 0) {
      return
    }

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setAttachments([])
    setIsProcessing(true)

    try {
      // Prepare content with file information if needed
      let messageContent = input
      if (attachments.length > 0) {
        const fileInfo = attachments
          .map((att) => {
            if (att.type.startsWith("image/")) {
              return `[Image attached: ${att.name}]`
            } else if (att.content) {
              return `[Text file attached: ${att.name}]`
            } else {
              return `[File attached: ${att.name}]`
            }
          })
          .join("\n")

        messageContent = messageContent.trim() ? `${messageContent}\n\n${fileInfo}` : fileInfo
      }

      const response = await sendMessage(messageContent, model, apiKey)

      if (response.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "error",
            content: `Lỗi: ${response.error}`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response.message,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ])
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          content: `Lỗi: ${error instanceof Error ? error.message : "Đã xảy ra lỗi"}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ])
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">OpenRouter Chat Bot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="model">Chọn model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger id="model">
                <SelectValue placeholder="Chọn model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Nhập OpenRouter API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              {apiKey ? "Đã nhập API Key" : "Chưa có API Key nào được nhập"}
            </p>
          </div>

          <Card className="border">
            <CardHeader className="py-3">
              <CardTitle className="text-lg">Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">
                          {message.role === "user" ? "Bạn" : message.role === "assistant" ? "Bot" : "Lỗi"}
                        </span>
                        <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                      </div>
                      <div
                        className={`p-3 rounded-lg ${
                          message.role === "user"
                            ? "bg-primary/10"
                            : message.role === "assistant"
                              ? "bg-secondary/20"
                              : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        <div>{message.content}</div>

                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {message.attachments.map((attachment, idx) => (
                              <div key={idx} className="border rounded p-2">
                                <div className="text-xs text-muted-foreground mb-1">{attachment.name}</div>
                                {attachment.type.startsWith("image/") && attachment.url && (
                                  <div className="relative h-40 w-full">
                                    <Image
                                      src={attachment.url || "/placeholder.svg"}
                                      alt={attachment.name}
                                      fill
                                      className="object-contain"
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <>
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center bg-secondary/20 rounded-lg p-2 text-sm">
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-1"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Nhập tin nhắn..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isProcessing}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
              </div>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý
                  </>
                ) : (
                  "Gửi"
                )}
              </Button>
            </form>
          </>
        </CardContent>
        <div className="text-center text-xs text-muted-foreground py-2 border-t">Author: bobchang0301@gmail.com</div>
      </Card>
    </div>
  )
}

