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
};

export function getAzureOpenAIConfig(
  embedding: boolean = false
): AzureOpenAIConfig {
  return {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    deployment: embedding
      ? process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT
      : process.env.AZURE_OPENAI_DEPLOYMENT,
  };
}

export function getOpenAIClient(embedding: boolean = false): {
  client: OpenAI | null;
  deployment: string | null;
  reason?: string;
} {
  const { endpoint, apiKey, deployment } = getAzureOpenAIConfig(embedding);
  if (!endpoint || !apiKey || !deployment) {
    return {
      client: null,
      deployment: deployment ?? null,
      reason: "Missing Azure OpenAI configuration",
    };
  }

  // The OpenAI SDK supports Azure by setting baseURL and api-version header
  const apiVersion =
    process.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview";
  const baseEndpoint = endpoint.replace(/\/+$/, ""); // trim trailing slashes
  const client = new OpenAI({
    apiKey,
    baseURL: `${baseEndpoint}/openai/deployments/${deployment}`,
    defaultHeaders: {
      "api-key": apiKey,
    },
    // Azure requires api-version as a query parameter
    defaultQuery: {
      "api-version": apiVersion,
    },
  });

  return { client, deployment };
}