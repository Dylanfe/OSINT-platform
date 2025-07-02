# OSINT 🔍

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4.4%2B-green.svg)](https://www.mongodb.com/)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/your-username/osint-platform/issues)

An advanced Open Source Intelligence (OSINT) platform that provides comprehensive tools and API integrations for cybersecurity professionals, researchers, and investigators.

[osint-platform.web.app](https://osint-platform.web.app)

# osint-platform.web.app

## 🎯 Features

- **Multi-Tool Integration**: Seamless integration with popular OSINT APIs (Shodan, VirusTotal, Have I Been Pwned, etc.)
- **Real-time Investigation**: Live data gathering and analysis with Socket.IO
- **User Management**: Secure authentication and role-based access control
- **Investigation Tracking**: Organize and track your OSINT investigations
- **Report Generation**: Generate comprehensive reports from your findings
- **RESTful API**: Well-documented API for integration with other tools
- **Web Scraping**: Built-in Puppeteer support for advanced web reconnaissance
- **Rate Limiting**: Built-in protection against API abuse
- **Extensible Architecture**: Easy to add new tools and integrations

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Web Scraping**: Puppeteer, Cheerio
- **Real-time**: Socket.IO
- **Security**: Helmet, CORS, Rate Limiting
- **Testing**: Jest, Supertest
- **Logging**: Winston, Morgan

## 🚀 Quick Start

### Prerequisites

- Node.js (v16.0.0 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone
   cd osint-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/osint-platform
   JWT_SECRET=your-super-secret-jwt-key
   
   # Add your API keys for OSINT services
   SHODAN_API_KEY=your-shodan-api-key
   VIRUSTOTAL_API_KEY=your-virustotal-api-key
   # ... other API keys
   ```

4. **Start MongoDB**
   ```bash
   # On macOS with Homebrew
   brew services start mongodb-community
   
   # On Ubuntu/Debian
   sudo systemctl start mongod
   
   # On Windows
   net start MongoDB
   ```

5. **Initialize the database**
   ```bash
   npm run setup
   npm run seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Access the application**
   Open your browser and navigate to `http://localhost:5000`

## 📖 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Core Endpoints

#### Health Check
```http
GET /api/health
```

#### Tools
```http
GET /api/tools          # Get all available tools
POST /api/tools         # Add a new tool
GET /api/tools/:id      # Get specific tool
PUT /api/tools/:id      # Update tool
DELETE /api/tools/:id   # Delete tool
```

#### OSINT Operations
```http
POST /api/osint/domain-lookup     # Domain investigation
POST /api/osint/ip-lookup         # IP address investigation
POST /api/osint/email-lookup      # Email investigation
POST /api/osint/phone-lookup      # Phone number investigation
POST /api/osint/social-search     # Social media search
```

### Example Request
```javascript
// Domain lookup
fetch('/api/osint/domain-lookup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    domain: 'example.com',
    tools: ['whois', 'dns', 'subdomain']
  })
})
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/osint-platform` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRE` | JWT expiration time | `30d` |

### API Keys

The platform supports integration with numerous OSINT services. Add your API keys to the `.env` file:

- **Shodan**: Network intelligence
- **VirusTotal**: File and URL analysis
- **Have I Been Pwned**: Breach data
- **Hunter.io**: Email finder
- **Censys**: Internet-wide scanning
- **SecurityTrails**: DNS and domain data
- **And many more...**

## 🔌 Adding New Tools

1. **Create a tool definition**
   ```javascript
   // In scripts/seedTools.js or via API
   const newTool = {
     name: "New OSINT Tool",
     category: "Network",
     description: "Description of the tool",
     endpoint: "/api/tools/new-tool",
     method: "POST",
     parameters: [
       {
         name: "target",
         type: "string",
         required: true,
         description: "Target to investigate"
       }
     ]
   };
   ```

2. **Implement the tool logic**
   ```javascript
   // In routes/osint.js
   router.post('/new-tool', async (req, res) => {
     try {
       const { target } = req.body;
       // Implement your tool logic here
       const results = await performOSINTOperation(target);
       res.json(results);
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   });
   ```

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📁 Project Structure

```
osint-platform/
├── middleware/          # Express middleware
├── models/             # Database models
├── public/             # Static frontend files
├── routes/             # API routes
├── scripts/            # Setup and utility scripts
├── logs/              # Application logs
├── uploads/           # File uploads
├── .env.example       # Environment template
├── .gitignore         # Git ignore rules
├── package.json       # Dependencies and scripts
├── server.js          # Main application entry
└── README.md          # This file
```

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add  feature'`)
7. Push to the branch (`git push origin feature/feature`)
8. Open a Pull Request

## 🔒 Security

### Reporting Security Issues

If you discover a security vulnerability, please refer to [dylanf.dev] instead of using the issue tracker.

### Security Best Practices

- Never commit API keys or sensitive data
- Use strong JWT secrets in production
- Enable HTTPS in production
- Regularly update dependencies
- Follow OWASP security guidelines

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🗺️ Roadmap

- [ ] Advanced visualization dashboards
- [ ] Machine learning threat detection
- [ ] Plugin architecture for custom tools
- [ ] Docker containerization
- [ ] Cloud deployment guides
- [ ] Mobile application
- [ ] Advanced reporting features
- [ ] Integration with threat intelligence feeds

---

**⚠️ Disclaimer**: This tool is intended for legitimate security research and authorized testing only. Users are responsible for complying with applicable laws and regulations. The developers assume no liability for misuse of this software.
