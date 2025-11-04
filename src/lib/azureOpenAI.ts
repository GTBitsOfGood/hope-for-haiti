import OpenAI from "openai";

// Azure OpenAI configuration via environment variables
// See: https://ai.azure.com/doc/azure/ai-foundry/openai/supported-languages
// Expected env vars:
// - AZURE_OPENAI_ENDPOINT (e.g., https://<resource-name>.openai.azure.com)
// - AZURE_OPENAI_API_KEY
// - AZURE_OPENAI_DEPLOYMENT (model deployment name, e.g., gpt-4o-mini)

export type AzureOpenAIConfig = {
  endpoint?: string;
  apiKey?: string;
  deployment?: string;
  apiVersion?: string;
};

export function getAzureOpenAIConfig(
  embedding: boolean = false
): AzureOpenAIConfig {
  return {
    endpoint: "https://hfh-ai.cognitiveservices.azure.com/",
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    deployment: embedding
      ? "text-embedding-3-small"
      : "gpt-5-mini",
    apiVersion: embedding? "2024-12-01-preview" : "2024-08-01-preview",
  };
}

export function getOpenAIClient(embedding: boolean = false): {
  client: OpenAI | null;
  deployment: string | null;
  reason?: string;
} {
  const { endpoint, apiKey, deployment, apiVersion } = getAzureOpenAIConfig(embedding);
  if (!endpoint || !apiKey || !deployment) {
    return {
      client: null,
      deployment: deployment ?? null,
      reason: "Missing Azure OpenAI configuration",
    };
  }

  const client = new OpenAI({
    apiKey,
    baseURL: `${endpoint}/openai/deployments/${deployment}`,
    defaultHeaders: {
      "api-key": apiKey,
    },
    defaultQuery: {
      "api-version": apiVersion,
    },
  });

  return { client, deployment };
}