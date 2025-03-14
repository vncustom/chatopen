"use server"

export async function sendMessage(
  message: string,
  model: string,
  apiKey: string,
): Promise<{ message: string; error?: string }> {
  try {
    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://openrouter-chat.vercel.app",
    }

    const payload = {
      model: model,
      messages: [{ role: "user", content: message }],
    }

    console.log("Sending to OpenRouter API:", JSON.stringify(payload))

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.text()
      return { message: "", error: `API Error: ${errorData}` }
    }

    const data = await response.json()
    return { message: data.choices[0].message.content }
  } catch (error) {
    console.error("Error sending message:", error)
    return {
      message: "",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

