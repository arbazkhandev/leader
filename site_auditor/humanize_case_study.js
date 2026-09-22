const fs = require('fs');

const filePath = 'C:/personal portfolio/folio-tailwind-1.0.0/case-study.html';
let content = fs.readFileSync(filePath, 'utf8');

const updatedProjectsData = `  projectsData: {
    'movins': {
      title: 'Movins: On-Demand Courier & Delivery App',
      badge: 'Mobile App & Delivery',
      category: 'Mobile & Apps',
      tags: ['Mobile Delivery App', 'Live GPS Tracking', 'Nearby Driver Matching', 'Fast Booking', 'In-App Signature'],
      dateRange: '2024 · 10 weeks',
      tagline: 'A mobile app that lets users book a courier in seconds and watch their parcel delivery live on a map just like Uber.',
      client: 'Movins Logistics App',
      industry: 'Logistics & Parcel Delivery',
      location: 'United Kingdom',
      role: 'Lead Mobile Developer & Backend Engineer',
      timeline: '2024 (10 Weeks)',
      deliverables: 'Mobile App for iOS & Android, Live GPS Map Tracking, Instant Driver Matching, Digital Delivery Signature',
      stack: ['Mobile App (Flutter / React Native)', 'PHP & MySQL Backend', 'Google Maps API', 'Live WebSockets', 'Push Alerts'],
      heroImg: 'picture/movins.png',
      gallery: [
        'picture/movins.png'
      ],
      stats: [
        { val: '<10s', label: 'Driver matching time', sub: 'Fast nearby dispatch' },
        { val: '99.8%', label: 'Live GPS uptime', highlight: true, sub: 'Smooth map tracking' },
        { val: '4.8 / 5', label: 'User & driver rating', sub: 'Happy customers' },
        { val: 'Zero', label: 'Lost parcel issues', sub: 'Signed proof of delivery' }
      ],
      overview: 'Movins is a parcel delivery mobile app that connects everyday people and small businesses with nearby delivery drivers for fast, same-day package delivery.',
      challenge: 'Making sure live driver tracking on the map stayed smooth without draining the driver\\'s phone battery or slowing down the app during busy hours.',
      solutionHeading: 'Live Map Tracking & Instant Nearby Driver Matching',
      solution: 'I created a clean mobile app for both customers and drivers. When someone needs a package sent, the system automatically finds the closest available driver, sends them the pickup request, and lets the sender watch the driver\\'s exact location live on a map until delivery.',
      keyPoints: [
        { title: 'Live Driver Tracking on Map', desc: 'Senders can see their driver moving on a live map with an accurate estimated arrival time.' },
        { title: 'Instant Nearby Driver Matching', desc: 'Deliveries are automatically assigned to the closest driver in under 10 seconds.' },
        { title: 'Simple 3-Step Booking', desc: 'Enter pickup and drop-off addresses, choose package size, and see the exact price upfront.' },
        { title: 'Digital Proof of Delivery', desc: 'Drivers take a photo and get a signature on their phone screen when the parcel is delivered.' },
        { title: 'Helpful Push Notifications', desc: 'Instant phone alerts when a driver accepts, picks up the parcel, and arrives at the door.' }
      ],
      outcome: 'Movins launched smoothly with fast pickup times, happy drivers, and 100% successful deliveries with zero lost packages.'
    },
    'cars-and-vans-uk': {
      title: 'Cars and Vans UK: Dealership CRM & Website',
      badge: 'UK Dealership Platform',
      category: 'Automotive & CRM',
      tags: ['Dealership CRM', 'Live Car Inventory', 'Finance Calculator', 'Digital Signatures', '1-Click Invoices'],
      dateRange: '2025 · 8 weeks',
      tagline: 'A custom platform that helps a UK car dealership list vehicles online, calculate monthly finance payments, and sign deals digitally.',
      client: 'Cars and Vans UK',
      industry: 'Automotive Dealership & Finance',
      location: 'United Kingdom',
      role: 'Lead Full-Stack Developer & CRM Engineer',
      timeline: '2025 (8 Weeks)',
      deliverables: 'Custom Dealership CRM, Live Vehicle Website, Monthly Finance Engine, Phone Signature Tool, PDF Invoicing',
      stack: ['PHP (Laravel / MVC)', 'MySQL Database', 'Tailwind CSS', 'Alpine.js', 'DOMPDF', 'Digital Signatures'],
      heroImg: 'picture/cvextras/ladning_vehicle_for_sale_white.png',
      gallery: [
        'picture/cvextras/ladning_vehicle_for_sale_white.png',
        'picture/cvextras/landing_hero_why_us_white.png',
        'picture/cvextras/landing_vehicle_image_scope_white.png',
        'picture/cvextras/landing_vehicle_finance_white.png',
        'picture/cvextras/landing_reviews_white.png',
        'picture/cvextras/landing_lcoation_white.png'
      ],
      stats: [
        { val: '+65%', label: 'Online sales inquiries', highlight: true, sub: 'Easy vehicle browsing' },
        { val: '−50%', label: 'Paperwork time cut', sub: '100% paperless system' },
        { val: '100%', label: 'Live stock accuracy', sub: 'Zero duplicate listings' },
        { val: '4.9 / 5', label: 'Sales team rating', sub: 'Simple to use' }
      ],
      overview: 'Cars and Vans UK is a car and van dealership in the UK. I built a modern website to showcase their vehicles to buyers, alongside an easy-to-use back-office CRM to manage customer leads, calculate monthly car finance, and collect digital signatures.',
      challenge: 'Selling cars involves lots of paperwork, complicated finance calculations (HP and PCP loans), and manual spreadsheets that were slowing down the sales team.',
      solutionHeading: 'Complete Dealership System & Paperless Finance Tools',
      solution: 'I built a custom dashboard where salespeople can see every customer lead on a visual board, easily calculate monthly car payments with interest, and email customers finance contracts that they can sign directly from their smartphone.',
      keyPoints: [
        { title: 'Visual Sales Board (Pipeline)', desc: 'Sales staff can drag and drop customer deals from New Lead to In Progress to Sold.' },
        { title: 'Live Vehicle Inventory Hub', desc: 'Easily add new cars with photos, mileage, specs, and prices with instant updates on the website.' },
        { title: 'Instant Monthly Finance Calculator', desc: 'Customers and dealers can calculate exact monthly costs for HP, PCP, and Lease options in seconds.' },
        { title: 'Digital Signatures by Phone', desc: 'Send contracts to customers by email or SMS so they can sign with their finger without printing paper.' },
        { title: 'Safe Document Vault', desc: 'Upload and store customer driving licenses and signed agreements securely in one organized place.' },
        { title: '1-Click Invoices & Quotes', desc: 'Generate clean PDF invoices and sales orders with a single click.' }
      ],
      outcome: 'The dealership team cut their paperwork time in half, closed deals much faster, and increased online inquiries by 65%.'
    },
    'influencex-pr': {
      title: 'InfluenceX PR: PR Agency Website',
      badge: 'WordPress Agency Website',
      category: 'Websites & CMS',
      tags: ['WordPress Website', 'PR Agency', 'WhatsApp Action Cards', 'Social Proof', 'Fast Page Speed'],
      dateRange: '2024 · 4 weeks',
      tagline: 'A fast, modern WordPress website for a PR agency, built to turn visitors into client inquiries.',
      client: 'InfluenceX PR Agency',
      industry: 'Public Relations & Marketing',
      location: 'United Kingdom / Global',
      role: 'WordPress Developer & Speed Specialist',
      timeline: '2024 (4 Weeks)',
      deliverables: 'Modern Website Redesign, WhatsApp Contact Cards, Client Spotlight Showcase, Mobile Layout Fixes, Fast Page Speeds',
      stack: ['WordPress', 'PHP', 'Gutenberg Blocks', 'Tailwind / CSS3', 'JavaScript', 'Rank Math SEO'],
      heroImg: 'picture/influencex/hero.png',
      gallery: [
        'picture/influencex/hero.png',
        'picture/influencex/book.png',
        'picture/influencex/mid.png',
        'picture/influencex/mid2.png',
        'picture/influencex/end.png'
      ],
      stats: [
        { val: '95+', label: 'Google Speed Score', highlight: true, sub: 'Loads in under 1 second' },
        { val: '+45%', label: 'Client inquiries', sub: 'Easy WhatsApp button' },
        { val: '5 Features', label: 'Media spotlight profiles', sub: 'Real client proof' },
        { val: 'Zero', label: 'Broken links', sub: 'Clean Google URLs' }
      ],
      overview: 'InfluenceX PR is a digital PR and influencer agency in the UK. I upgraded their website design, fixed layout bugs, highlighted their client features on MSN, and made it super easy for visitors to reach out directly on WhatsApp and email.',
      challenge: 'The old website had long complicated contact forms that visitors abandoned, uneven testimonial cards that looked broken on mobile, and slow loading pages.',
      solutionHeading: 'Clean Design, Direct WhatsApp Contact & Faster Speeds',
      solution: 'I replaced the long forms with direct contact cards (WhatsApp chat, direct email, and phone), aligned all client reviews neatly, fixed mobile layout glitches, and optimized Google search URLs to protect their ranking.',
      keyPoints: [
        { title: 'Direct Action Contact Cards', desc: 'Visitors can start a WhatsApp chat or send an inquiry with one tap instead of filling long forms.' },
        { title: 'Real Client Success Stories', desc: 'Highlighted real client profiles featured on major media outlets like MSN to build trust.' },
        { title: 'Clean Mobile Layout', desc: 'Fixed broken cards and image sizes so the site looks crisp on all phone screens.' },
        { title: 'Easy Service Switching', desc: 'Visitors can click between different PR services smoothly without waiting for new pages to load.' },
        { title: 'Clean Google Search URLs', desc: 'Cleaned up page links so the website ranks higher on Google without any broken 404 links.' }
      ],
      outcome: 'The new site loads in under a second with a 95+ Google speed score and boosted client inquiries by 45%.'
    },
    'daily-insi': {
      title: 'Daily Insi: Fast Digital News Platform',
      badge: 'News & Magazine Website',
      category: 'Websites & CMS',
      tags: ['WordPress News Site', 'High Speed 98/100', 'Clean Categories', 'Google Search SEO', 'Mobile First'],
      dateRange: '2026 · 3 weeks',
      tagline: 'A lightning-fast WordPress news and magazine website designed for readers on mobile and ranked high on Google.',
      client: 'Daily Insi Publication',
      industry: 'Digital News & Media',
      location: 'Global Web',
      role: 'WordPress Developer & SEO Engineer',
      timeline: '2026',
      deliverables: 'Fast Magazine Theme, Category Layouts, Google Search Optimization, Instant Mobile Pages',
      stack: ['WordPress', 'PHP', 'Tailwind CSS', 'Schema.org SEO', 'LiteSpeed Caching'],
      heroImg: 'picture/cvextras/dailyisni.png',
      gallery: [
        'picture/cvextras/dailyisni.png'
      ],
      stats: [
        { val: '98 / 100', label: 'Mobile speed score', highlight: true, sub: 'Loads in milliseconds' },
        { val: '+85%', label: 'Google search traffic', sub: 'Organic search growth' },
        { val: '<0.8s', label: 'Page load time', sub: 'Optimized images & code' },
        { val: '100%', label: 'Mobile friendly', sub: 'Easy reading on phones' }
      ],
      overview: 'Daily Insi is an online magazine publishing daily news and articles. I built a clean, reader-friendly platform that loads in milliseconds, displays trending articles clearly, and is fully optimized for Google search.',
      challenge: 'News websites often become heavy and slow with lots of photos and ads, causing readers on mobile phones to leave before the page loads.',
      solutionHeading: 'Speed Optimization & Clean Magazine Layout',
      solution: 'I created a lightweight WordPress theme with smart image loading, clean category menus, and automated Google News tags so articles appear instantly in Google search results.',
      keyPoints: [
        { title: 'Instant Mobile Loading', desc: 'Pages and photos load in the blink of an eye, even on slow mobile data connections.' },
        { title: 'Trending Articles & Categories', desc: 'Readers can easily discover top stories, editor picks, and latest news across categories.' },
        { title: 'Google News & Rich Search Tags', desc: 'Structured tags so Google shows article headlines with rich thumbnails in search results.' },
        { title: 'Easy Admin Publishing', desc: 'Writers and editors can format, preview, and publish articles in a few clicks.' }
      ],
      outcome: 'The site achieved a 98/100 speed score and increased organic Google visitors by 85% within three months.'
    },
    'laptop-harbor': {
      title: 'Laptop Harbor: Laptop Selling Mobile App',
      badge: 'E-Commerce Mobile App',
      category: 'Mobile & E-Commerce',
      tags: ['Laptop Selling Mobile App', 'Admin CRUD Panel', 'Shopping Cart & Checkout', 'Account Auth', 'Inventory Tracking'],
      dateRange: '2025 · 8 weeks',
      tagline: 'A simple and fast mobile shopping app where customers can easily browse laptops, add them to their cart, and place orders securely.',
      client: 'Laptop Harbor Retail',
      industry: 'Consumer Electronics & Mobile E-Commerce',
      location: 'Regional Retail',
      role: 'Mobile App & Backend Developer',
      timeline: '2025 (8 Weeks)',
      deliverables: 'Customer Mobile App, Full Admin Panel, Shopping Cart & Checkout, Login & Password Reset, Live Inventory Count',
      stack: ['PHP / Laravel', 'MySQL Database', 'Tailwind CSS', 'Alpine.js', 'Token Auth', 'DOMPDF'],
      heroImg: 'picture/laptop harbor/thumbnail.jpg',
      gallery: [
        'picture/laptop harbor/thumbnail.jpg',
        'picture/laptop harbor/products listing.png',
        'picture/laptop harbor/admin_full.png',
        'picture/laptop harbor/full_pic.png'
      ],
      stats: [
        { val: '100%', label: 'Inventory accuracy', sub: 'Zero overselling' },
        { val: '−60%', label: 'Order processing time', highlight: true, sub: 'Automated workflow' },
        { val: '<250ms', label: 'Search speed', sub: 'Instant product search' },
        { val: '100%', label: 'Secure accounts', sub: 'Safe login & password reset' }
      ],
      overview: 'Laptop Harbor is an e-commerce mobile app built for selling laptops online. It gives buyers a clean screen to search and buy laptops, and gives store owners an easy admin dashboard to add products, update prices, and track inventory.',
      challenge: 'Customers needed a smooth way to filter laptops by RAM, processor, and price on their phones, while the store owner needed a simple dashboard to manage orders and stock without confusion.',
      solutionHeading: 'Easy Shopping Experience & Simple Store Management',
      solution: 'I built a user-friendly mobile app with two main sides: an easy shopping area for customers to find and order laptops, and a password-protected admin area where the shop owner can add new laptops, update photos, change prices, and view customer orders.',
      keyPoints: [
        { title: 'Easy Admin Dashboard', desc: 'Add, edit, or remove laptop models, photos, and prices in seconds with full control.' },
        { title: 'Fast Product Browsing & Filters', desc: 'Customers can quickly filter by brand, budget, and specs to find the exact laptop they need.' },
        { title: 'Safe Cart & Quick Checkout', desc: 'Simple add-to-cart flow, saved customer addresses, and secure order placement.' },
        { title: 'Automatic Stock Count', desc: 'Product stock updates automatically with every purchase so you never run out of inventory unexpectedly.' },
        { title: 'Simple Login & Password Reset', desc: 'Easy signup, secure login, and email password reset if a user forgets their password.' }
      ],
      outcome: 'The app made ordering laptops quick and easy for buyers, and gave the store owner a clean system to manage all daily sales from one place.'
    },
    'any2convert': {
      title: 'Any2Convert: Free Online File Converter',
      badge: 'Web Tools & Converter',
      category: 'Web Tools & Utilities',
      tags: ['Online File Converter', 'Text from Photos (OCR)', 'Fast Background Queue', '100% User Privacy'],
      dateRange: '2026 · 8 weeks',
      tagline: 'A simple web tool that lets anyone convert PDFs, images, and documents into any format in seconds.',
      client: 'Any2Convert Web Utilities',
      industry: 'Online Tools & SaaS',
      location: 'Global Web',
      role: 'Web Developer & Automation Engineer',
      timeline: '2026',
      deliverables: 'File Conversion Engine, Text from Image Scanner (OCR), Fast Background Queue, Automatic File Deletion',
      stack: ['PHP Core', 'Tesseract OCR', 'ImageMagick', 'AJAX Background Workers', 'Cron Automation'],
      heroImg: 'picture/any2convert/main.png',
      gallery: [
        'picture/any2convert/main.png',
        'picture/any2convert/tools.png',
        'picture/any2convert/tools2.png',
        'picture/any2convert/footer.png'
      ],
      stats: [
        { val: '10,000+', label: 'Daily file conversions', highlight: true, sub: 'Fast & smooth' },
        { val: '<3.0s', label: 'Average conversion time', sub: 'Converts in seconds' },
        { val: '99.9%', label: 'Conversion success rate', sub: 'Reliable tools' },
        { val: '100%', label: 'User data privacy', sub: 'Files deleted automatically' }
      ],
      overview: 'Any2Convert (any2convert.com) is an online converter tool used by thousands of people to convert documents, images, and scanned files directly in their browser for free.',
      challenge: 'Converting heavy files and extracting text from images takes a lot of computer power and can cause the website to freeze if multiple people upload at the same time.',
      solutionHeading: 'Fast Background Processing & Total User Privacy',
      solution: 'I built a smart system where file conversions happen quietly in the background without freezing the webpage. Users see a real-time progress bar, and all uploaded files are permanently deleted after download for 100% privacy.',
      keyPoints: [
        { title: 'Convert Any File Format', desc: 'Easily convert between PDF, Word, PNG, JPG, WebP, and text files.' },
        { title: 'Extract Text from Photos (OCR)', desc: 'Turn photos of documents and receipts into editable text automatically.' },
        { title: 'Live Progress Bar', desc: 'Clear progress indicator so users know exactly when their download is ready.' },
        { title: 'Automatic Privacy Cleanup', desc: 'All uploaded and converted files are automatically wiped from the server after 30 minutes.' }
      ],
      outcome: 'The platform handles over 10,000 file conversions every day with an average speed of under 3 seconds per file.'
    },
    'food-for-nought': {
      title: 'FoodForNought: Food Donation Management',
      badge: 'Charity & Community Platform',
      category: 'Charity & Community',
      tags: ['Charity Platform', 'CodeIgniter PHP', 'Map Pickup Locations', 'Food Waste Tracking', 'Volunteer Records'],
      dateRange: '2024 · 6 weeks',
      tagline: 'A web platform connecting food charities with surplus food donors to stop food waste in local communities.',
      client: 'FoodForNought Platform',
      industry: 'Charity & Food Waste Reduction',
      location: 'United Kingdom',
      role: 'Backend Developer',
      timeline: '2024',
      deliverables: 'Map-Based Food Pickup System, Database Setup, Volunteer Status Updates, Activity Reports',
      stack: ['CodeIgniter', 'PHP & MySQL', 'JavaScript & AJAX', 'Google Maps API'],
      heroImg: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1400&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1400&q=80'
      ],
      stats: [
        { val: '100%', label: 'Location accuracy', highlight: true, sub: 'Clear map pickups' },
        { val: '500+', label: 'Tonnes of food saved', sub: 'Delivered to families' },
        { val: '<200ms', label: 'Fast page response', sub: 'Smooth & lightweight' },
        { val: '100%', label: 'Completed on time', sub: 'Fully tested' }
      ],
      overview: 'FoodForNought is a community platform in the UK dedicated to stopping food waste by helping charities collect surplus food from local businesses and deliver it to people in need.',
      challenge: 'Tracking food donation locations, volunteer drivers, and delivery statuses in real-time without confusing paperwork.',
      solutionHeading: 'Location Tracking & Simple Donation Management',
      solution: 'I developed the backend system using CodeIgniter and MySQL, built map-based tracking to locate surplus food pickups, and created simple screens for volunteers to update deliveries without reloading the page.',
      keyPoints: [
        { title: 'Map-Based Food Pickups', desc: 'Uses map locations to find the closest donor and plan the fastest pickup route.' },
        { title: 'Clear Donation Records', desc: 'Organizes food types, weight, donor details, and expiry dates cleanly.' },
        { title: 'Instant Screen Updates', desc: 'Volunteers can mark deliveries as picked up or completed with instant real-time updates.' },
        { title: 'Reliable & Easy to Use', desc: 'Built with clean CodeIgniter and PHP code that runs smoothly on both phones and computers.' }
      ],
      outcome: 'Helped manage over 500 tonnes of surplus food efficiently, delivering fresh meals to local families on time.'
    }
  }`;

const pStart = content.indexOf('projectsData: {');
const pEnd = content.indexOf('get current() {');

if (pStart !== -1 && pEnd !== -1) {
  content = content.substring(0, pStart) + updatedProjectsData + ',\n  ' + content.substring(pEnd);
  fs.writeFileSync(filePath, content);
  console.log('Successfully updated case-study.html with clean humanized text!');
} else {
  console.error('Could not find projectsData block in case-study.html');
}
