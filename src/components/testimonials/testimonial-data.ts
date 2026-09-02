export type Testimonial = {
  id: string;
  name: string;
  location?: string;
  service: string;
  rating: number; // 1-5
  text: string;
};

export const TESTIMONIALS: Testimonial[] = [
  { id: "t1", name: "Ananya", location: "Pune", service: "Astrology Consultation", rating: 5, text: "Everything suddenly felt much clearer after my consultation. The reading gave me a practical way to understand what I had been struggling with." },
  { id: "t2", name: "Rohit", location: "Bengaluru", service: "Personalized Report", rating: 5, text: "The report was beautifully explained and surprisingly detailed. I finally understood the patterns I had been noticing in my life." },
  { id: "t3", name: "Meera", location: "Delhi", service: "Healing Session", rating: 5, text: "The healing session felt peaceful and deeply personal. I left with a sense of clarity I had not felt in a long time." },
  { id: "t4", name: "Suresh", location: "Jaipur", service: "Puja Booking", rating: 5, text: "The puja was conducted with so much care and attention to detail. It genuinely felt like a meaningful ritual, not just a formality." },
  { id: "t5", name: "Priya", location: "Mumbai", service: "Gemstone Guidance", rating: 4, text: "I was hesitant about choosing the right gemstone, but the guidance made the whole process simple and reassuring." },
  { id: "t6", name: "Karan", location: "Chandigarh", service: "Astrology Course", rating: 5, text: "The course broke down concepts I'd struggled with for years into something I could actually apply." },
  { id: "t7", name: "Divya", location: "Hyderabad", service: "Tarot Reading", rating: 5, text: "My tarot session gave me a fresh perspective on a decision I'd been putting off for weeks." },
  { id: "t8", name: "Arjun", location: "Kolkata", service: "Numerology", rating: 4, text: "The numerology reading connected dots I hadn't noticed before — small things about timing that made sense in hindsight." },
  { id: "t9", name: "Kavita", location: "Lucknow", service: "Spiritual Guidance", rating: 5, text: "I came in feeling scattered and left with a clearer sense of direction. The session felt unhurried and genuinely attentive." },
  { id: "t10", name: "Nikhil", location: "Ahmedabad", service: "Astrology Consultation", rating: 5, text: "Straightforward, no vague generalities — just a grounded reading I could actually reflect on." },
  { id: "t11", name: "Sneha", location: "Surat", service: "Healing Session", rating: 4, text: "A gentle, calming experience. I wasn't sure what to expect, but it left me feeling lighter." },
  { id: "t12", name: "Devansh", location: "Indore", service: "Gemstone Guidance", rating: 5, text: "Good communication throughout, and the piece arrived exactly as described." },
];
