const mongoose = require('mongoose');

// Your MongoDB Atlas connection string
const MONGODB_URI = "mongodb+srv://osint-user:YcreolsnNfs7Kjyj@cluster0.vsrgvin.mongodb.net/osint-tools?retryWrites=true&w=majority";

// Tool schema
const toolSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    url: { type: String, required: true },
    pricing: { type: String, enum: ['free', 'freemium', 'paid'], default: 'free' },
    opsecRisk: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    tags: [String],
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalUses: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Tool = mongoose.model('Tool', toolSchema);

// OSINT Tools data
const osintTools = [
    {
        name: "WhatsMyName",
        category: "username-search",
        description: "Web-based tool that enumerates a username across hundreds of websites and services, categorizing hits by platform type",
        url: "https://whatsmyname.app/",
        pricing: "free",
        opsecRisk: "low",
        tags: ["username", "enumeration", "social-media"],
        averageRating: 4.6,
        totalUses: 1250
    },
    {
        name: "Sherlock",
        category: "username-search",
        description: "Powerful command-line tool to hunt for social media accounts by username across a vast number of sites",
        url: "https://github.com/sherlock-project/sherlock",
        pricing: "free",
        opsecRisk: "low",
        tags: ["username", "cli", "python"],
        averageRating: 4.8,
        totalUses: 2100
    },
    {
        name: "Have I Been Pwned",
        category: "email-investigation",
        description: "Check if email addresses have been compromised in data breaches",
        url: "https://haveibeenpwned.com",
        pricing: "free",
        opsecRisk: "low",
        tags: ["email", "breach", "security"],
        averageRating: 4.9,
        totalUses: 3200
    },
    {
        name: "Hunter.io",
        category: "email-investigation",
        description: "Find and verify email addresses associated with domains",
        url: "https://hunter.io",
        pricing: "freemium",
        opsecRisk: "medium",
        tags: ["email", "finder", "verification"],
        averageRating: 4.3,
        totalUses: 1890
    },
    {
        name: "Holehe",
        category: "email-investigation",
        description: "Check if an email is used to register on sites like Twitter, Instagram using password reset functions",
        url: "https://github.com/megadose/holehe",
        pricing: "free",
        opsecRisk: "medium",
        tags: ["email", "cli", "python"],
        averageRating: 4.2,
        totalUses: 780
    },
    {
        name: "Shodan",
        category: "domain-ip",
        description: "Search engine for internet-connected devices, servers, webcams, and industrial control systems",
        url: "https://shodan.io",
        pricing: "freemium",
        opsecRisk: "medium",
        tags: ["iot", "network", "scanning"],
        averageRating: 4.8,
        totalUses: 2890
    },
    {
        name: "urlscan.io",
        category: "domain-ip",
        description: "Browses submitted URLs and records all activity, domains contacted, resources requested, and technologies used",
        url: "https://urlscan.io/",
        pricing: "freemium",
        opsecRisk: "low",
        tags: ["url", "analysis", "api"],
        averageRating: 4.7,
        totalUses: 1560
    },
    {
        name: "Censys",
        category: "domain-ip",
        description: "Continuously scans the internet to discover devices, networks, and certificates",
        url: "https://search.censys.io/",
        pricing: "freemium",
        opsecRisk: "medium",
        tags: ["scanning", "certificates", "api"],
        averageRating: 4.5,
        totalUses: 1200
    },
    {
        name: "BGPView",
        category: "network-analysis",
        description: "Explores internet structure via ASNs, IP prefixes, and BGP peering data",
        url: "https://bgpview.io/",
        pricing: "free",
        opsecRisk: "low",
        tags: ["bgp", "asn", "network"],
        averageRating: 4.4,
        totalUses: 890
    },
    {
        name: "theHarvester",
        category: "domain-ip",
        description: "Gathers emails, subdomains, hosts, employee names from public sources like search engines",
        url: "https://github.com/laramies/theHarvester",
        pricing: "free",
        opsecRisk: "medium",
        tags: ["subdomains", "cli", "python"],
        averageRating: 4.6,
        totalUses: 1340
    },
    {
        name: "OWASP Amass",
        category: "domain-ip",
        description: "Comprehensive network mapping using passive and active reconnaissance techniques",
        url: "https://github.com/owasp-amass/amass",
        pricing: "free",
        opsecRisk: "medium",
        tags: ["reconnaissance", "cli", "go"],
        averageRating: 4.7,
        totalUses: 980
    },
    {
        name: "Maltego",
        category: "visualization",
        description: "Interactive data mining tool for link analysis, information gathering and forensic investigation",
        url: "https://maltego.com/",
        pricing: "freemium",
        opsecRisk: "low",
        tags: ["visualization", "link-analysis", "gui"],
        averageRating: 4.7,
        totalUses: 2340
    },
    {
        name: "SpiderFoot",
        category: "frameworks",
        description: "Open-source automation tool integrating with 200+ data sources for target mapping",
        url: "https://github.com/smicallef/spiderfoot",
        pricing: "free",
        opsecRisk: "medium",
        tags: ["automation", "framework", "python"],
        averageRating: 4.6,
        totalUses: 1100
    },
    {
        name: "TinEye",
        category: "image-analysis",
        description: "Reverse image search engine to find where images appear online",
        url: "https://tineye.com",
        pricing: "freemium",
        opsecRisk: "low",
        tags: ["image", "reverse-search"],
        averageRating: 4.1,
        totalUses: 1890
    },
    {
        name: "Google Earth",
        category: "geolocation",
        description: "3D Earth representation with satellite imagery, aerial photography, and historical data",
        url: "https://earth.google.com/",
        pricing: "free",
        opsecRisk: "low",
        tags: ["satellite", "geolocation", "imagery"],
        averageRating: 4.8,
        totalUses: 3200
    },
    {
        name: "ExifTool",
        category: "metadata",
        description: "Command-line utility for reading/writing metadata from images, documents, videos",
        url: "https://exiftool.org/",
        pricing: "free",
        opsecRisk: "low",
        tags: ["metadata", "exif", "cli"],
        averageRating: 4.9,
        totalUses: 2100
    },
    {
        name: "FlightAware",
        category: "transportation",
        description: "Real-time commercial and military aircraft tracking with route mapping",
        url: "https://flightaware.com/",
        pricing: "freemium",
        opsecRisk: "low",
        tags: ["aviation", "tracking", "geolocation"],
        averageRating: 4.6,
        totalUses: 1560
    },
    {
        name: "MarineTraffic",
        category: "transportation",
        description: "Live vessel tracking via AIS with historical vessel data",
        url: "https://marinetraffic.com/",
        pricing: "freemium",
        opsecRisk: "low",
        tags: ["maritime", "tracking", "vessels"],
        averageRating: 4.4,
        totalUses: 890
    },
    {
        name: "Wayback Machine",
        category: "archives",
        description: "View historical snapshots of websites and web pages",
        url: "https://web.archive.org",
        pricing: "free",
        opsecRisk: "low",
        tags: ["archive", "historical", "wayback"],
        averageRating: 4.7,
        totalUses: 2890
    },
    {
        name: "Dehashed",
        category: "breach-data",
        description: "Search billions of leaked records for usernames, emails, passwords, and PII",
        url: "https://dehashed.com/",
        pricing: "paid",
        opsecRisk: "medium",
        tags: ["breach", "leaked-data", "api"],
        averageRating: 4.3,
        totalUses: 1200
    }
];

async function seedDatabase() {
    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected successfully!');

        // Clear existing tools
        console.log('Clearing existing tools...');
        await Tool.deleteMany({});

        // Insert new tools
        console.log('Inserting OSINT tools...');
        const insertedTools = await Tool.insertMany(osintTools);
        
        console.log(`✅ Successfully inserted ${insertedTools.length} OSINT tools!`);
        console.log('Your MongoDB Atlas database is now populated.');
        
        // Display some stats
        const totalTools = await Tool.countDocuments();
        const categories = await Tool.distinct('category');
        
        console.log('\n📊 Database Statistics:');
        console.log(`Total Tools: ${totalTools}`);
        console.log(`Categories: ${categories.length}`);
        console.log(`Categories: ${categories.join(', ')}`);
        
        await mongoose.disconnect();
        console.log('\n🚀 Database seeding complete! Your Firebase app will now show real data.');
        
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

// Run the seeding
seedDatabase();
