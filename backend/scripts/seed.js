require('dotenv').config();
const mongoose = require('mongoose');
const Expert = require('../models/Expert');

const generateSlots = () => {
  const times = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
  return times.map(time => ({ time, isBooked: false, bookingId: null }));
};

const generateAvailability = () => {
  const availability = [];
  const today = new Date();
  for (let i = 1; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
      availability.push({
        date: date.toISOString().split('T')[0],
        slots: generateSlots()
      });
    }
  }
  return availability;
};

const experts = [
  {
    name: 'Dr. Priya Sharma',
    category: 'Technology',
    bio: 'Senior Software Architect with 12+ years of experience in distributed systems, cloud infrastructure, and microservices. Previously at Google and Microsoft. Specializes in helping startups scale their engineering teams and architecture.',
    experience: 12,
    rating: 4.9,
    totalReviews: 287,
    hourlyRate: 150,
    profileImage: 'https://randomuser.me/api/portraits/women/1.jpg',
    skills: ['System Design', 'Cloud Architecture', 'React', 'Node.js', 'Kubernetes'],
    languages: ['English', 'Hindi'],
    timezone: 'Asia/Kolkata'
  },
  {
    name: 'Rahul Verma',
    category: 'Business',
    bio: 'Ex-McKinsey consultant turned entrepreneur. Founded and exited 2 startups. Expert in growth strategy, fundraising, and market entry. Mentored 50+ startups through Y Combinator and TechStars programs.',
    experience: 15,
    rating: 4.8,
    totalReviews: 412,
    hourlyRate: 200,
    profileImage: 'https://randomuser.me/api/portraits/men/2.jpg',
    skills: ['Business Strategy', 'Fundraising', 'Growth Hacking', 'Product-Market Fit'],
    languages: ['English', 'Hindi', 'Gujarati'],
    timezone: 'Asia/Kolkata'
  },
  {
    name: 'Sarah Chen',
    category: 'Design',
    bio: 'Head of Design at a Series B SaaS startup. Formerly design lead at Figma and Airbnb. Passionate about design systems, accessibility, and creating delightful user experiences that convert.',
    experience: 9,
    rating: 4.9,
    totalReviews: 198,
    hourlyRate: 130,
    profileImage: 'https://randomuser.me/api/portraits/women/3.jpg',
    skills: ['UX Design', 'Figma', 'Design Systems', 'User Research', 'Prototyping'],
    languages: ['English', 'Mandarin'],
    timezone: 'America/New_York'
  },
  {
    name: 'Arjun Nair',
    category: 'Marketing',
    bio: 'Digital marketing veteran with expertise in performance marketing, SEO, and brand strategy. Managed $50M+ in ad spend across Google and Meta. Helped 100+ D2C brands achieve profitable growth.',
    experience: 10,
    rating: 4.7,
    totalReviews: 334,
    hourlyRate: 120,
    profileImage: 'https://randomuser.me/api/portraits/men/4.jpg',
    skills: ['SEO', 'Performance Marketing', 'Content Strategy', 'Analytics', 'Brand Building'],
    languages: ['English', 'Malayalam', 'Tamil'],
    timezone: 'Asia/Kolkata'
  },
  {
    name: 'Dr. Meera Patel',
    category: 'Finance',
    bio: 'CFA and CFP with 18 years in wealth management and corporate finance. Former VP at Goldman Sachs. Expert in financial modeling, investment strategy, and CFO advisory for growth-stage startups.',
    experience: 18,
    rating: 4.8,
    totalReviews: 156,
    hourlyRate: 250,
    profileImage: 'https://randomuser.me/api/portraits/women/5.jpg',
    skills: ['Financial Modeling', 'Investment Strategy', 'Fundraising', 'M&A', 'Valuation'],
    languages: ['English', 'Gujarati'],
    timezone: 'America/Chicago'
  },
  {
    name: 'James Okafor',
    category: 'Technology',
    bio: 'ML Engineer and AI researcher with a PhD from MIT. Built recommendation systems used by 100M+ users. Expert in LLMs, computer vision, and productionizing ML models at scale.',
    experience: 8,
    rating: 4.9,
    totalReviews: 89,
    hourlyRate: 180,
    profileImage: 'https://randomuser.me/api/portraits/men/6.jpg',
    skills: ['Machine Learning', 'Deep Learning', 'Python', 'TensorFlow', 'MLOps'],
    languages: ['English', 'French'],
    timezone: 'America/Boston'
  },
  {
    name: 'Aditi Krishnan',
    category: 'Legal',
    bio: 'Startup lawyer specializing in tech law, IP, and venture transactions. Handled 200+ startup incorporations and 50+ VC deals. Partner at a leading Silicon Valley law firm with deep expertise in SaaS contracts.',
    experience: 14,
    rating: 4.7,
    totalReviews: 203,
    hourlyRate: 300,
    profileImage: 'https://randomuser.me/api/portraits/women/7.jpg',
    skills: ['Startup Law', 'IP Law', 'SaaS Contracts', 'VC Transactions', 'Employment Law'],
    languages: ['English', 'Tamil', 'Kannada'],
    timezone: 'America/Los_Angeles'
  },
  {
    name: 'Carlos Rivera',
    category: 'Health',
    bio: 'Sports medicine physician and executive wellness coach. Team doctor for professional athletes. Specializes in performance optimization, burnout prevention, and sustainable high performance for founders and executives.',
    experience: 16,
    rating: 4.8,
    totalReviews: 445,
    hourlyRate: 175,
    profileImage: 'https://randomuser.me/api/portraits/men/8.jpg',
    skills: ['Executive Health', 'Performance Optimization', 'Mental Fitness', 'Nutrition', 'Sleep Science'],
    languages: ['English', 'Spanish'],
    timezone: 'America/Miami'
  },
  {
    name: 'Neha Gupta',
    category: 'Education',
    bio: 'EdTech entrepreneur and curriculum designer with expertise in online learning, corporate training, and instructional design. Founded a bootcamp that placed 1000+ students in tech jobs.',
    experience: 11,
    rating: 4.6,
    totalReviews: 321,
    hourlyRate: 100,
    profileImage: 'https://randomuser.me/api/portraits/women/9.jpg',
    skills: ['Curriculum Design', 'E-Learning', 'Corporate Training', 'EdTech', 'Coaching'],
    languages: ['English', 'Hindi', 'Punjabi'],
    timezone: 'Asia/Kolkata'
  },
  {
    name: 'Dr. Kevin Park',
    category: 'Technology',
    bio: 'Cybersecurity expert and CISO advisor with experience at NSA and leading Fortune 500 companies. Expert in zero-trust architecture, penetration testing, and building security-first engineering cultures.',
    experience: 20,
    rating: 4.9,
    totalReviews: 67,
    hourlyRate: 350,
    profileImage: 'https://randomuser.me/api/portraits/men/10.jpg',
    skills: ['Cybersecurity', 'Penetration Testing', 'Zero Trust', 'Compliance', 'Risk Management'],
    languages: ['English', 'Korean'],
    timezone: 'America/Washington'
  },
  {
    name: 'Fatima Al-Hassan',
    category: 'Business',
    bio: 'International business development expert with experience in MENA, South Asian, and African markets. Former diplomat turned entrepreneur. Specializes in cross-cultural partnerships and market entry strategies.',
    experience: 13,
    rating: 4.7,
    totalReviews: 178,
    hourlyRate: 160,
    profileImage: 'https://randomuser.me/api/portraits/women/11.jpg',
    skills: ['Business Development', 'International Markets', 'Partnerships', 'Negotiation', 'Market Entry'],
    languages: ['English', 'Arabic', 'French'],
    timezone: 'Asia/Dubai'
  },
  {
    name: 'Vikram Desai',
    category: 'Design',
    bio: 'Product designer and creative director with 10 years building consumer apps. Former design lead at Uber and Spotify India. Specializes in mobile-first design, design thinking workshops, and building design teams.',
    experience: 10,
    rating: 4.8,
    totalReviews: 254,
    hourlyRate: 140,
    profileImage: 'https://randomuser.me/api/portraits/men/12.jpg',
    skills: ['Product Design', 'Mobile Design', 'Design Thinking', 'Branding', 'Motion Design'],
    languages: ['English', 'Hindi', 'Marathi'],
    timezone: 'Asia/Kolkata'
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Expert.deleteMany({});
    console.log('Cleared existing experts');

    const expertsWithAvailability = experts.map(expert => ({
      ...expert,
      availability: generateAvailability()
    }));

    const created = await Expert.insertMany(expertsWithAvailability);
    console.log(`✅ Seeded ${created.length} experts successfully`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedDatabase();
