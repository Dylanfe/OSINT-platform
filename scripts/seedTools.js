const mongoose = require('mongoose');
const Tool = require('../models/Tool');
require('dotenv').config();

const osintTools = [
    // Search Engines
    {
        name: "Google Dorking",
        category: "search-engines",
        subcategory: "general",
        description: "Advanced Google search operators for finding specific information and exposed files",
        url: "https://google.com",
        type: "website",
        pricing: "free",
        requiresRegistration: false,
        requiresApiKey: false,
        tags: ["google", "dorks", "search", "operators"],
        features: ["Advanced search operators", "File type filtering", "Site-specific searches"],
        inputTypes: ["text"],
        outputTypes: ["html"],
        accuracy: "high",
        reliability: "high",
        opsecRisk: "low",
        methodology: "passive",
        usageExamples: [
            {
                scenario: "Find exposed documents",
                input: "filetype:pdf site:example.com confidential",
                expectedOutput: "PDF files containing 'confidential' on example.com"
            }
        ]
    },
    {
        name: "Shodan",
        category: "domain-ip",
        subcategory: "network-scanning",
        description: "Search engine for Internet-connected devices and services",
        url: "https://shodan.io",
        type: "website",
        pricing: "freemium",
        requiresRegistration: true,
        requiresApiKey: true,
        tags: ["shodan", "iot", "network", "scanning", "services"],
        features: ["Device discovery", "Service identification", "Vulnerability scanning", "Historical data"],
        inputTypes: ["ip", "domain", "text"],
        outputTypes: ["json", "html"],
        accuracy: "high",
        reliability: "high",
        opsecRisk: "medium",
        methodology: "passive",
        apiEndpoint: "https://api.shodan.io",
        documentation: "https://developer.shodan.io/api"
    },
    
    // Email Investigation
    {
        name: "Have I Been Pwned",
        category: "email-investigation",
        subcategory: "breach-checking",
        description: "Check if email addresses have been compromised in data breaches",
        url: "https://haveibeenpwned.com",
        type: "website",
        pricing: "freemium",
        requiresRegistration: false,
        requiresApiKey: true,
        tags: ["email", "breach", "pwned", "security"],
        features: ["Breach checking", "Paste monitoring", "Domain monitoring"],
        inputTypes: ["email", "domain"],
        outputTypes: ["json", "html"],
        accuracy: "high",
        reliability: "high",
        opsecRisk: "low",
        methodology: "passive",
        apiEndpoint: "https://haveibeenpwned.com/api/v3"
    },
    {
        name: "Hunter.io",
        category: "email-investigation",
        subcategory: "email-finder",
        description: "Find and verify email addresses associated with domains",
        url: "https://hunter.io",
        type: "website",
        pricing: "freemium",
        requiresRegistration: true,
        requiresApiKey: true,
        tags: ["email", "finder", "verification", "domain"],
        features: ["Email discovery", "Email verification", "Domain search"],
        inputTypes: ["domain", "email", "name"],
        outputTypes: ["json"],
        accuracy: "high",
        reliability: "high",
        opsecRisk: "medium",
        methodology: "passive",
        apiEndpoint: "https://api.hunter.io/v2"
    },
    
    // Social Media
    {
        name: "Sherlock",
        category: "username-search",
        subcategory: "social-media",
        description: "Hunt down social media accounts by username across social networks",
        url: "https://github.com/sherlock-project/sherlock",
        type: "tool",
        pricing: "free",
        requiresRegistration: false,
        requiresApiKey: false,
        tags: ["username", "social-media", "osint", "python"],
        features: ["Multi-platform search", "400+ sites", "Command line tool"],
        inputTypes: ["username"],
        outputTypes: ["text", "json"],
        accuracy: "high",
        reliability: "high",
        opsecRisk: "medium",
        methodology: "active"
    },
    {
        name: "Social Searcher",
        category: "social-media",
        subcategory: "monitoring",
        description: "Real-time social media search engine and analytics",
        url: "https://socialsearcher.com",
        type: "website",
        pricing: "freemium",
        requiresRegistration: true,
        requiresApiKey: false,
        tags: ["social-media", "monitoring", "analytics", "real-time"],
        features: ["Real-time monitoring", "Sentiment analysis", "Historical data"],
        inputTypes: ["text", "username"],
        outputTypes: ["html", "json"],
        accuracy: "medium",
        reliability: "medium",
        opsecRisk: "low",
        methodology: "passive"
    },
    
    // Image Analysis
    {
        name: "TinEye",
        category: "image-analysis",
        subcategory: "reverse-search",
        description: "Reverse image search engine to find where images appear online",
        url: "https://tineye.com",
        type: "website",
        pricing: "freemium",
        requiresRegistration: false,
        requiresApiKey: true,
        tags: ["image", "reverse-search", "tineye"],
        features: ["Reverse image search", "Image modification detection", "API access"],
        inputTypes: ["image", "url"],
        outputTypes: ["html", "json"],
        accuracy: "high",
        reliability: "high",
        opsecRisk: "low",
        methodology: "passive",
        apiEndpoint: "https://api.tineye.com/rest/"
    },
    {
        name: "Google Images",
        category: "image-analysis",
        subcategory: "reverse-search",
        description: "Google's reverse image search for finding similar images",
        url: "https://images.google.com",
        type: "website",
        pricing: "free",
        requiresRegistration: false,
        requiresApiKey: false,
        tags: ["google", "image", "reverse-search"],
        features: ["Reverse image search", "Similar images", "Image sources"],
        inputTypes: ["image", "url"],
        outputTypes: ["html"],
        accuracy: "high",
        reliability: "high",
        opsecRisk: "low",
        methodology: "passive"
    },
    
    // Domain/IP Analysis
    {
        name: "VirusTotal",
        category: "threat-intelligence",
        subcategory: "malware-analysis",
        description: "Analyze suspicious files, URLs, domains and IP addresses",
        url: "https://virustotal.com",
        type: "website",
        pricing: "freemium",
        requiresRegistration: true,
        requiresApiKey: true,
        tags: ["virustotal", "malware", "analysis", "security"],
        features: ["Multi-engine scanning", "Behavior analysis", "Threat intelligence"],
        inputTypes: ["file", "url", "domain", "ip", "hash"],
        outputTypes: ["json", "html"],
        accuracy: "high",
        reliability: "high",
        opsecRisk: "medium",
        methodology: "passive",
        apiEndpoint: "https://www.virustotal.com/api/v3"
    },
    {
        name: "Whois Lookup",
        category: "domain-ip",
        subcategory: "registration-info",
        description: "Domain and IP address registration information lookup",
        url: "https://whois.net",
        type: "website",
        pricing: "free",
        requiresRegistration: false,
        requiresApiKey: false,
        tags: ["whois", "domain", "registration", "dns"],
        features: ["Domain registration info", "Historical records", "DNS information"],
        inputTypes: ["domain", "ip"],
        outputTypes: ["text", "html"],
        accuracy: "high",
        reliability: "high",
        opsecRisk: "low",
        methodology: "passive"
    },
    
    // People Search
    {
        name: "Pipl",
        category: "people-search",
        subcategory: "identity-search",
        description: "Deep web people search engine for identity verification",
        url: "https://pipl.com",
        type: "website",
        pricing: "paid",
        requiresRegistration: true,
        requiresApiKey: true,
        tags: ["people", "identity", "search", "verification"],
        features: ["Deep web search", "Identity verification", "Contact information"],
        inputTypes: ["name", "email", "phone", "username"],
        outputTypes: ["json", "html"],
        accuracy: "high",
        reliability: "high",
        opsecRisk: "medium",
        methodology: "passive"
    },
    {
        name: "WhitePages",
        category: "people-search",
        subcategory: "contact-info",
        description: "Find people, phone numbers, addresses and more",
        url: "https://whitepages.com",
        type: "website",
        pricing: "freemium",
        requiresRegistration: false,
        requiresApiKey: false,
        tags: ["people", "phone", "address", "directory"],
        features: ["People search", "Reverse phone lookup", "Address search"],
        inputTypes: ["name", "phone", "address"],
        outputTypes: ["html"],
        accuracy: "medium",
        reliability: "medium",
        opsecRisk: "medium",
        methodology: "passive"
    },
    
    // Corporate Research
    {
        name: "OpenCorporates",
        category: "corporate-research",
        subcategory: "company-records",
        description: "The largest open database of companies in the world",
        url: "https://opencorporates.com",
        type: "website",
        pricing: "freemium",
        requiresRegistration: false,
        requiresApiKey: true,
        tags: ["corporate", "company", "business", "records"],
        features: ["Company information", "Officer details", "Network analysis"],
        inputTypes: ["company", "name"],
        outputTypes: ["json", "html"],
        accuracy: "high",
        reliability: "high",
        opsecRisk: "low",
        methodology: "passive",
        apiEndpoint: "https://api.opencorporates.com"
    },
    
    // Geolocation
    {
        name: "GeoGuessr",
        category: "geolocation",
        subcategory: "visual-geolocation",
        description: "Geography game that can help with visual geolocation skills",
        url: "https://geoguessr.com",
        type: "website",
        pricing: "freemium",
        requiresRegistration: true,
        requiresApiKey: false,
        tags: ["geolocation", "visual", "training", "geography"],
        features: ["Visual geolocation training", "Street view analysis", "Geographic challenges"],
        inputTypes: ["image"],
        outputTypes: ["coordinates"],
        accuracy: "variable",
        reliability: "medium",
        opsecRisk: "low",
        methodology: "passive"
    },
    {
        name: "IP2Location",
        category: "geolocation",
        subcategory: "ip-geolocation",
        description: "IP address geolocation and proxy detection service",
        url: "https://ip2location.com",
        type: "website",
        pricing: "freemium",
        requiresRegistration: true,
        requiresApiKey: true,
        tags: ["ip", "geolocation", "proxy", "detection"],
        features: ["IP geolocation", "Proxy detection", "ISP information"],
        inputTypes: ["ip"],
        outputTypes: ["json", "xml"],
        accuracy: "high",
        reliability: "high",
        opsecRisk: "low",
        methodology: "passive"
    },
    
    // Phone Investigation
    {
        name: "TrueCaller",
        category: "phone-investigation",
        subcategory: "caller-id",
        description: "Caller ID and spam detection service",
        url: "https://truecaller.com",
        type: "website",
        pricing: "freemium",
        requiresRegistration: true,
        requiresApiKey: false,
        tags: ["phone", "caller-id", "spam", "detection"],
        features: ["Caller identification", "Spam detection", "Number lookup"],
        inputTypes: ["phone"],
        outputTypes: ["html"],
        accuracy: "medium",
        reliability: "medium",
        opsecRisk: "medium",
        methodology: "passive"
    },
    
    // Breach Data
    {
        name: "DeHashed",
        category: "breach-data",
        subcategory: "credential-search",
        description: "Search engine for leaked credentials and personal information",
        url: "https://dehashed.com",
        type: "website",
        pricing: "paid",
        requiresRegistration: true,
        requiresApiKey: true,
        tags: ["breach", "credentials", "leaked", "data"],
        features: ["Credential search", "Data breach analysis", "API access"],
        inputTypes: ["email", "username", "name", "phone"],
        outputTypes: ["json", "html"],
        accuracy: "high",
        reliability: "high",
        opsecRisk: "medium",
        methodology: "passive"
    },
    
    // Metadata Analysis
    {
        name: "ExifTool",
        category: "metadata",
        subcategory: "file-analysis",
        description: "Platform-independent library and application for reading metadata",
        url: "https://exiftool.org",
        type: "software",
        pricing: "free",
        requiresRegistration: false,
        requiresApiKey: false,
        tags: ["metadata", "exif", "analysis", "files"],
        features: ["Metadata extraction", "Multiple file formats", "Command line tool"],
        inputTypes: ["file", "image"],
        outputTypes: ["text", "json"],
        accuracy: "high",
        reliability: "high",
        opsecRisk: "low",
        methodology: "passive"
    },
    
    // Network Analysis
    {
        name: "Censys",
        category: "network-analysis",
        subcategory: "internet-scanning",
        description: "Search engine for discovering and analyzing Internet infrastructure",
        url: "https://censys.io",
        type: "website",
        pricing: "freemium",
        requiresRegistration: true,
        requiresApiKey: true,
        tags: ["censys", "network", "scanning", "infrastructure"],
        features: ["Internet-wide scanning", "Certificate analysis", "Historical data"],
        inputTypes: ["ip", "domain", "text"],
        outputTypes: ["json", "html"],
        accuracy: "high",
        reliability: "high",
        opsecRisk: "medium",
        methodology: "passive",
        apiEndpoint: "https://search.censys.io/api"
    },
    
    // Code Search
    {
        name: "GitHub Search",
        category: "code-search",
        subcategory: "repository-search",
        description: "Search code repositories for sensitive information",
        url: "https://github.com/search",
        type: "website",
        pricing: "free",
        requiresRegistration: false,
        requiresApiKey: false,
        tags: ["github", "code", "repository", "search"],
        features: ["Code search", "Repository analysis", "User investigation"],
        inputTypes: ["text", "username"],
        outputTypes: ["html"],
        accuracy: "high",
        reliability: "high",
        opsecRisk: "low",
        methodology: "passive"
    },
    
    // Dark Web
    {
        name: "OnionScan",
        category: "dark-web",
        subcategory: "hidden-services",
        description: "Tool for investigating Dark Web sites and services",
        url: "https://github.com/s-rah/onionscan",
        type: "tool",
        pricing: "free",
        requiresRegistration: false,
        requiresApiKey: false,
        tags: ["dark-web", "tor", "onion", "scanning"],
        features: ["Hidden service analysis", "Security assessment", "Information leakage detection"],
        inputTypes: ["url"],
        outputTypes: ["json", "text"],
        accuracy: "medium",
        reliability: "medium",
        opsecRisk: "high",
        methodology: "active"
    }
];

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/osint-nexus');
        console.log('Connected to MongoDB');

        // Clear existing tools (optional)
        // await Tool.deleteMany({});
        // console.log('Cleared existing tools');

        // Insert tools
        for (const toolData of osintTools) {
            try {
                // Check if tool already exists
                const existingTool = await Tool.findOne({ name: toolData.name });
                if (existingTool) {
                    console.log(`Tool "${toolData.name}" already exists, skipping...`);
                    continue;
                }

                const tool = await Tool.create({
                    ...toolData,
                    metadata: {
                        source: 'seed-script'
                    }
                });
                console.log(`Created tool: ${tool.name}`);
            } catch (error) {
                console.error(`Error creating tool "${toolData.name}":`, error.message);
            }
        }

        console.log(`Seeding completed. ${osintTools.length} tools processed.`);
        
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the seed script
if (require.main === module) {
    seedDatabase();
}

module.exports = { osintTools, seedDatabase };
