import { NextResponse } from "next/server";

import { getCharacterById } from "@/lib/characters";

type ChatRequestMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatRequestBody = {
  characterId?: string;
  temporaryVocabulary?: string[];
  messages?: ChatRequestMessage[];
};

type TextResponse = {
  message: string;
  usage?: unknown;
};

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-5";
const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";

function buildVocabularyPrompt(words: string[]) {
  if (words.length === 0) {
    return "";
  }

  return [
    "The user is currently practicing the following vocabulary:",
    words.map((word) => `- ${word}`).join("\n"),
    "Naturally guide the conversation so the user has chances to use these words.",
    "If they use a target word correctly, respond positively but naturally.",
    "If they avoid the target vocabulary for a few turns, gently steer the topic toward it.",
  ].join("\n\n");
}

function getProviderConfig() {
  const customBaseUrl = process.env.OPENAI_BASE_URL?.trim();
  const customApiKey = process.env.OPENAI_API_KEY?.trim();
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (customBaseUrl) {
    return {
      provider: "openai-compatible" as const,
      baseUrl: customBaseUrl.replace(/\/$/, ""),
      apiKey: customApiKey,
      model: process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL,
    };
  }

  if (anthropicApiKey) {
    return {
      provider: "anthropic" as const,
      apiKey: anthropicApiKey,
      model: process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL,
    };
  }

  return null;
}

async function requestAnthropicResponse(input: {
  apiKey: string;
  model: string;
  system: string;
  messages: ChatRequestMessage[];
}): Promise<TextResponse> {
  const anthropicResponse = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": input.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: input.model,
      max_tokens: 400,
      system: input.system,
      messages: input.messages.map((message) => ({
        role: message.role,
        content: [{ type: "text", text: message.content }],
      })),
    }),
  });

  if (!anthropicResponse.ok) {
    const errorText = await anthropicResponse.text();

    throw new Error(`Anthropic request failed: ${errorText || anthropicResponse.statusText}`);
  }

  const data = (await anthropicResponse.json()) as {
    content?: Array<{
      type?: string;
      text?: string;
    }>;
    usage?: unknown;
  };

  const message = data.content
    ?.filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text?.trim())
    .filter(Boolean)
    .join("\n\n");

  if (!message) {
    throw new Error("Anthropic returned an empty response.");
  }

  return {
    message,
    usage: data.usage,
  };
}

async function requestOpenAICompatibleResponse(input: {
  baseUrl: string;
  apiKey?: string;
  model: string;
  system: string;
  messages: ChatRequestMessage[];
}): Promise<TextResponse> {
  const response = await fetch(`${input.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(input.apiKey ? { Authorization: `Bearer ${input.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: input.model,
      messages: [
        { role: "system", content: input.system },
        ...input.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
      temperature: 0.8,
      max_tokens: 400,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(`OpenAI-compatible request failed: ${errorText || response.statusText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string | Array<{ type?: string; text?: string }>;
      };
    }>;
    usage?: unknown;
  };

  const rawContent = data.choices?.[0]?.message?.content;
  const message = typeof rawContent === "string"
    ? rawContent.trim()
    : rawContent
        ?.filter((item) => item.type === "text" && typeof item.text === "string")
        .map((item) => item.text?.trim())
        .filter(Boolean)
        .join("\n\n");

  if (!message) {
    throw new Error("OpenAI-compatible endpoint returned an empty response.");
  }

  return {
    message,
    usage: data.usage,
  };
}

export async function POST(request: Request) {
  const providerConfig = getProviderConfig();

  if (!providerConfig) {
    return NextResponse.json(
      {
        error:
          "Configure either ANTHROPIC_API_KEY or OPENAI_BASE_URL (optionally OPENAI_API_KEY / OPENAI_MODEL).",
      },
      { status: 500 }
    );
  }

  const body = (await request.json()) as ChatRequestBody;
  const characterId = body.characterId?.trim();
  const temporaryVocabulary = Array.isArray(body.temporaryVocabulary)
    ? body.temporaryVocabulary.map((item) => item.trim()).filter(Boolean)
    : [];
  const messages = Array.isArray(body.messages)
    ? body.messages.filter(
        (message) =>
          (message.role === "user" || message.role === "assistant") &&
          typeof message.content === "string" &&
          message.content.trim().length > 0
      )
    : [];

  if (!characterId) {
    return NextResponse.json({ error: "characterId is required." }, { status: 400 });
  }

  if (messages.length === 0) {
    return NextResponse.json({ error: "messages are required." }, { status: 400 });
  }

  const character = getCharacterById(characterId);

  if (!character) {
    return NextResponse.json({ error: "Character not found." }, { status: 404 });
  }

  const system = [character.systemPrompt, buildVocabularyPrompt(temporaryVocabulary)]
    .filter(Boolean)
    .join("\n\n");

  try {
    const result =
      providerConfig.provider === "anthropic"
        ? await requestAnthropicResponse({
            apiKey: providerConfig.apiKey,
            model: providerConfig.model,
            system,
            messages,
          })
        : await requestOpenAICompatibleResponse({
            baseUrl: providerConfig.baseUrl,
            apiKey: providerConfig.apiKey,
            model: providerConfig.model,
            system,
            messages,
          });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Model request failed.",
      },
      { status: 502 }
    );
  }
}
