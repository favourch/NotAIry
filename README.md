# NotAIry: Community Notes for Web3 & AI Transparency

A decentralized, AI-powered community notes platform that helps verify Web3, DeFi, and AI-generated content. NotAIry leverages AI agents, blockchain transparency, and staking mechanisms to create a trusted, decentralized fact-checking system.

## 🚀 Key Features

- **AI-Powered Fact Checking**: Automated verification using Amazon Bedrock's RAG and knowledge bases
- **Community-Driven Notes & Voting**: Users submit and vote on annotations with crypto-backed staking
- **Smart Contract Integration**: Onchain tracking of notes, votes, and reputation on Base L2
- **Secure Agent Infrastructure**: Decentralized key management via Lit Protocol Agent Wallet
- **Cross-Platform Presence**: Integration with Telegram, Discord via Gaia & Collab.Land

## 🛠 Tech Stack

### Core Infrastructure
- **Frontend**: SvelteKit
- **Blockchain**: Base L2 (for low fees and Coinbase integration)
- **AI/LLM**: Amazon Bedrock (for RAG and knowledge bases)
- **Data Indexing**: The Graph (for efficient blockchain data querying)

### Key Tools & SDKs
- **Agent Framework**: Coinbase AgentKit (wallet management & onchain actions)
- **Security**: Lit Protocol Agent Wallet (key management & permissions)
- **Agent Deployment**: Gaia & Collab.Land (multi-platform deployment)
- **Smart Contracts**: Base L2 (for scalable, low-cost transactions)
- **Data Querying**: The Graph (custom subgraphs for note verification)

## 🏗 Architecture

```
                                    ┌─────────────────┐
                                    │  Amazon Bedrock │
                                    │    (AI/LLM)     │
                                    └────────┬────────┘
                                            │
┌─────────────┐    ┌──────────────┐    ┌───┴────┐    ┌─────────────┐
│   SvelteKit │    │  AgentKit &  │    │NotAIry │    │ Lit Protocol│
│  Frontend   ├────┤  Base L2     ├────┤ Core   ├────┤Agent Wallet │
└─────────────┘    └──────────────┘    └───┬────┘    └─────────────┘
                                           │
                   ┌──────────────┐    ┌───┴────┐    ┌─────────────┐
                   │    Gaia &    │    │  The   │    │ Community    │
                   │  Collab.Land ├────┤ Graph  ├────┤ Interface    │
                   └──────────────┘    └────────┘    └─────────────┘
```

## 🏁 Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev

# or open in new browser tab
npm run dev -- --open
```

3. Build for production:
```bash
npm run build
```

## 📝 License

[MIT](LICENSE)
