# SecondBrain - AI-Powered Knowledge Decay Detector

> A personal knowledge management system that tracks what you learn and detects what you've forgotten.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ LTS
- MongoDB (Atlas or local)
- Redis (Upstash or local)
- Angular CLI 18+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/secondbrain.git
   cd secondbrain
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your MongoDB, Redis, and OpenAI credentials
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   ng serve
   ```

4. **Access the application**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:3000

## 📚 Documentation

- [Project Plan](./PROJECT_PLAN.md) - Complete architecture and implementation plan
- [AWS Deployment Guide](./AWS_DEPLOYMENT_GUIDE.md) - Production deployment on AWS
- [Tech Stack Justification](./TECH_STACK_JUSTIFICATION.md) - Why we chose each technology

## 🏗️ Architecture

```
Frontend (Angular 18)
    ↓ HTTP/WebSocket
Backend (Node.js + Express)
    ↓
MongoDB Atlas (Vector Search) + Redis (Cache/Queue)
    ↓
OpenAI API (GPT-4o-mini)
```

## 🛠️ Tech Stack

- **Frontend**: Angular 18, TypeScript, Angular Material, RxJS
- **Backend**: Node.js 20, Express.js, TypeScript
- **Database**: MongoDB Atlas (with Vector Search)
- **Cache**: Redis (ElastiCache/Upstash)
- **AI**: OpenAI GPT-4o-mini
- **Cloud**: AWS (Lambda/Fargate)

## ✨ Features

### Phase 1 (Weeks 1-3) ✅
- [x] Authentication (JWT)
- [x] User profile management
- [x] Concept CRUD
- [x] Source upload (URL, PDF)
- [x] Basic dashboard

### Phase 2 (Weeks 4-6) 🚧
- [ ] AI concept extraction
- [ ] Spaced repetition engine
- [ ] Challenge generation
- [ ] Decay detection
- [ ] Real-time notifications

### Phase 3 (Weeks 7-8) 📋
- [ ] Multi-agent AI system
- [ ] Concept graph visualization
- [ ] Interview preparation mode
- [ ] Deployment & CI/CD

## 📝 License

MIT License - see [LICENSE](LICENSE)

## 🤝 Contributing

This is a personal portfolio project, but feedback is welcome!

## 📧 Contact

- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Name](https://linkedin.com/in/yourprofile)

---

**Built with ❤️ for FAANG placements 2026**
