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
import { Loader2 } from "lucide-react"

interface Message {
  role: "user" | "assistant" | "error"
  content: string
  timestamp: string
}

export default function ChatPage() {
  const [apiKey, setApiKey] = useState<string>("")
  const [model, setModel] = useState<string>("deepseek/deepseek-r1:free")
  const [input, setInput] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const models = [
    "deepseek/deepseek-r1:free",
    "qwen/qwen2.5-vl-72b-instruct:free",
    "deepseek/deepseek-chat:free",
    "google/gemini-2.0-flash-lite-preview-02-05:free",
    "google/gemini-2.0-flash-exp:free",
    "google/gemini-2.0-pro-exp-02-05:free",
    "google/gemini-2.0-flash-thinking-exp:free",
    "meta-llama/llama-3.3-70b-instruct:free",
  ]

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
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

    if (!input.trim()) {
      return
    }

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsProcessing(true)

    try {
      const response = await sendMessage(input, model, apiKey)

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
                        {message.content}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isProcessing}
            />
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
        </CardContent>
      </Card>
    </div>
  )
}

