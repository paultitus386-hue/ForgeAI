# ForgeAI

> **Your AI developer that actually builds.**

ForgeAI is a personal AI coding agent and developer platform designed to take software ideas from natural language to planning, creating, modifying, testing, debugging, and managing production-ready software in an interactive workspace.

---

## 🌟 Overview & Workflow

ForgeAI operates iteratively through a true agentic development lifecycle:

```text
User Request
      ↓
Choose Model / Auto
      ↓
ForgeAI Agent
      ↓
Selected AI Provider (OpenAI / Anthropic / Gemini)
      ↓
Files + Terminal + Browser + Tools
      ↓
Build
      ↓
Test
      ↓
Debug
      ↓
Fix
      ↓
Working Software
```

---

## 🧠 Multi-Model AI Architecture

ForgeAI supports multiple frontier AI providers through a unified provider abstraction, central model registry, intelligent routing, and automatic fallback:

```text
                         FORGEAI
                            │
                      AgentManager
                            │
                       ModelRouter
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
        OpenAIProvider  AnthropicProvider GeminiProvider
              │             │             │
              ▼             ▼             ▼
       GPT-6 Astra      Claude Fable 5    Gemini
              │             │             │
              └─────────────┼─────────────┘
                            ▼
                     Tool / Agent Layer
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
       Files             Terminal          Browser
          │                 │                 │
          └─────────────────┼─────────────────┘
                            ▼
                         Testing
                            │
                            ▼
                      Working Project
```

---

## 🤖 Supported Models

| Provider | Display Name | API Model ID | Best For | Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **OpenAI** | **GPT-6 Astra** | `gpt-6-astra` | Complex coding, deep reasoning, agent workflows, computer/tool use | Streaming, Tools, Vision, Code, Computer Use, Reasoning |
| **Anthropic** | **Claude Fable 5** | `claude-fable-5` | Massive-context coding, multi-file refactoring, code comprehension | Streaming, Tools, Vision, Code, Reasoning |
| **Google** | **Gemini 2.0 Flash** | `gemini-2.0-flash-exp` | Ultra-fast turnaround, Google ecosystem workflows, multimodal input | Streaming, Tools, Vision, Code, High-speed |
| **Google** | **Gemini 1.5 Pro** | `gemini-1.5-pro` | 2-million token context window, repository-wide architectural queries | Streaming, Tools, Vision, Code, Deep Context |
| **Local AI** | **Llama 3 (Ollama)** | `ollama/llama3` | 100% offline development, air-gapped privacy, zero cost | Streaming, Code, Offline Privacy |

---

## 🎯 Model Selection Modes

1. **Manual Selection:**
   - Choose your preferred model anytime via the model selector in the main prompt bar, top navigation bar, or conversational chat panel.
   - Live capability badges, context window size, and "Best For" tags inform your decision.

2. **Auto Mode (`[ Auto ▾ ]`):**
   - Automatically assesses task semantics, codebase size, and required capabilities:
     - High-complexity / computer-use / architecture tasks $\longrightarrow$ **GPT-6 Astra**
     - Large codebase / multi-file refactoring tasks $\longrightarrow$ **Claude Fable 5**
     - Google Cloud / rapid feedback loops $\longrightarrow$ **Gemini 2.0 Flash**
     - Simple lightweight adjustments $\longrightarrow$ **Gemini 2.0 Flash**
   - Provides clear explanations for routing decisions (e.g. `ForgeAI selected GPT-6 Astra: High-complexity coding task + multi-step tool usage`).

3. **Automatic Fallback Chain:**
   - If a primary provider encounters an outage or rate limit, ForgeAI automatically switches to the next configured model in the fallback chain (e.g. `GPT-6 Astra` $\rightarrow$ `Claude Fable 5` $\rightarrow$ `Gemini 2.0 Flash`).
   - The user is notified without losing conversation history, files, or tasks.

4. **Model Comparison Mode:**
   - Click the **Compare** button in the TopBar or ChatPanel to run prompts side-by-side across models.
   - Review competing architectural plans or code implementations, and click **Use This Solution** to apply it directly into your workspace.

---

## 🔒 API Key Management & Security

- **Safe Handling:** API keys are never exposed in chat messages, terminal history, generated code, or browser consoles.
- **Connection Testing:** In **Settings $\rightarrow$ AI Models**, click **Test Connection** for any provider to verify credentials in real-time.
- **Standalone Simulation:** If you do not have external API keys configured, ForgeAI operates smoothly in built-in simulation mode with model-tailored plans, so all UI and agent workflows remain 100% testable out-of-the-box.

---

## ⚙️ Configuration & Environment Variables

Copy `.env.example` to `.env.local` to configure your keys:

```bash
cp .env.example .env.local
```

```env
# OpenAI API Key (GPT-6 Astra)
OPENAI_API_KEY=your_openai_api_key

# Anthropic API Key (Claude Fable 5)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# Optional: Local Ollama Endpoint (default: http://localhost:11434)
LOCAL_AI_BASE_URL=http://localhost:11434
```

> [!CAUTION]
> Never commit `.env` or `.env.local` files to version control repositories.

---

## 🔌 How to Add Another Provider

Adding a new provider is completely modular:

1. **Implement Provider Interface:**
   Create a class implementing `LLMProviderInterface` in `src/lib/providers/your-provider.ts`:
   ```typescript
   export class MyCustomProvider implements LLMProviderInterface {
     readonly provider = 'custom' as const;
     readonly name = 'My Provider';

     async generate(messages, options): Promise<LLMResponse> {
       // Call your provider endpoint
     }

     async validateCredentials(apiKey): Promise<{ valid: boolean; message?: string }> {
       // Validate API credentials
     }

     getAvailableModels(): AIModelDefinition[] {
       return ModelRegistry.getByProvider('custom');
     }
   }
   ```

2. **Register Models:**
   Add model definitions in `src/lib/model-registry.ts` with metadata and capability flags.

3. **Register in LLMService:**
   In `src/lib/llm-service.ts`, add your provider instance to `this.providers.set('custom', new MyCustomProvider())`.

---

## 📦 How to Run

### 1. Install Dependencies
```bash
cd forgeai
npm install
```

### 2. Run Test Suite
```bash
node scripts/test-multi-model.mjs
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 4. Build for Production
```bash
npm run build
npm run start
```
