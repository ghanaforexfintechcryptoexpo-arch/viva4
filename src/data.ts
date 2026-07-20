import { Product, FaqItem, UserReview } from "./types";

export const PRODUCTS: Product[] = [
  {
    id: "proviva",
    name: "ProViva Herbal Tablets",
    tagline: "Prioritize Your Vitality and Comfort Naturally.",
    goal: "Prostate",
    shortHook: "ProViva Herbal Tablets offer a premium, natural approach to prostate health and urinary comfort.",
    basePrice: 34.99,
    rating: 4.9,
    reviewsCount: 142,
    colorTheme: "purple",
    colorGradStart: "#6B21A8", // Rich Purple
    colorGradEnd: "#3B0764",
    imageUrl: "/images/proviva.jpg",
    imageUrls: [
      "/images/proviva.jpg"
    ],
    sizes: [
      { name: "180 Tablets (Standard)", count: 180, priceModifier: 1.0 },
      { name: "360 Tablets (Value Pack)", count: 360, priceModifier: 1.7 }
    ],
    benefits: [
      "Supports healthy prostate function and helps maintain normal prostate size.",
      "Promotes consistent, healthy urinary flow and comfortable bladder emptying.",
      "Formulated with Serenoa repens (Saw Palmetto) to assist with nighttime comfort and uninterrupted sleep.",
      "Contains Carica papaya and Zea mays for premium botanical defense and renal/urinary tract support."
    ],
    activeIngredients: [
      { name: "Serenoa repens (Saw Palmetto) Extract", amount: "320 mg", percentageDV: "†", function: "Supports healthy prostate size, structure, and urinary comfort" },
      { name: "Carica papaya Extract", amount: "200 mg", percentageDV: "†", function: "Provides key cellular enzymes to support smooth muscle integrity" },
      { name: "Zea mays (Corn Silk) Extract", amount: "130 mg", percentageDV: "†", function: "Soothes the urinary lining and promotes fluid balance" }
    ],
    directions: "Take 2 tablets thrice daily before meals with a full glass of water, or as directed by your clinical healthcare practitioner.",
    storageWarnings: [
      "Store in a cool, dry place below 30°C.",
      "Keep bottle tightly closed and away from direct heat or moisture.",
      "Keep out of reach of children. Consult a physician if pregnant, nursing, or taking prescription medication."
    ],
    seoTitle: "ProViva Herbal Tablets | Natural Prostate & Urinary Comfort Support",
    seoDescription: "Prioritize your vitality and comfort naturally. ProViva Herbal Tablets offer a premium synergistic formula of Saw Palmetto, Carica papaya, and Zea mays.",
    detailedCopy: "ProViva Herbal Tablets offer a premium, natural approach to prostate health and urinary comfort. Formulated with a synergistic blend of time-tested botanical ingredients, including Serenoa repens (Saw Palmetto) and Carica papaya, this daily supplement supports healthy prostate function, promotes consistent urinary flow, and helps maintain your overall quality of life. Take control of your daily comfort with a gentle, plant-based formula you can trust.",
    specifications: [
      { feature: "Primary Benefit", details: "Supports optimal prostate health and urinary function" },
      { feature: "Key Ingredients", details: "Serenoa repens, Carica papaya, Zea mays" },
      { feature: "Tablet Weight", details: "650mg approx." },
      { feature: "Recommended Usage", details: "2 tablets to be taken thrice daily before meals" },
      { feature: "Storage Conditions", details: "Store in a cool, dry place below 30°C" }
    ]
  },
  {
    id: "vivalax",
    name: "VivaLax Natural Tablets",
    tagline: "Gentle Relief. Natural Balance.",
    goal: "Digestion",
    shortHook: "Relieves occasional constipation and supports regular bowel movements.",
    basePrice: 29.99,
    rating: 4.8,
    reviewsCount: 98,
    colorTheme: "teal",
    colorGradStart: "#14B8A6", // Teal
    colorGradEnd: "#0F766E",
    imageUrl: "/images/vivalax.jpg",
    imageUrls: [
      "/images/vivalax.jpg",
      "/images/vivalax_side.jpg",
      "/images/vivalax_back.jpg"
    ],
    sizes: [
      { name: "90 Tablets (Standard)", count: 90, priceModifier: 1.0 },
      { name: "180 Tablets (Value Pack)", count: 180, priceModifier: 1.7 }
    ],
    benefits: [
      "Provides a mild, reliable laxative effect derived entirely from natural herbal ingredients.",
      "Designed to work in harmony with your body’s digestive system to relieve constipation smoothly without harsh cramping or sudden urgency.",
      "Helps restore your natural rhythm and supports a lighter, more comfortable digestive tract every day.",
      "Offers a mild, non-habit-forming formulation for adults seeking gentle, plant-based digestive relief."
    ],
    activeIngredients: [
      { name: "Aloe Vera (Aloe barbadensis) Inner Leaf Powder", amount: "200 mg", percentageDV: "†", function: "Intestinal lubrication & digestive mucosal protection" },
      { name: "Senna Leaf Extract (standardized to 20% Sennosides)", amount: "150 mg", percentageDV: "†", function: "Stimulates bowel motility gently & effectively" },
      { name: "Psyllium Husk (Plantago ovata) Seed Powder", amount: "300 mg", percentageDV: "†", function: "Bulk-forming soluble fiber for moisture absorption" },
      { name: "Slippery Elm (Ulmus rubra) Bark Extract", amount: "100 mg", percentageDV: "†", function: "Demulcent action to soothe irritated tissues" }
    ],
    directions: "Take 1 to 2 tablets with a full glass of water, preferably at bedtime. Expect natural, comfortable bowel activity within 8 to 12 hours. Best taken with a full glass of water for optimal results.",
    storageWarnings: [
      "Keep container tightly closed in a cool, dry place.",
      "Do not use if safety seal under cap is broken or missing.",
      "Keep out of reach of children. Discontinue if loose stools or abdominal cramps persist."
    ]
  },
  {
    id: "vivadio",
    name: "VivaDio",
    tagline: "Nourish Your Heart, Protect Your Future.",
    goal: "Heart",
    shortHook: "Your cardiovascular system is the engine of your body—keep it running at its absolute best with VivaDio Herbal Tablets. Specifically engineered for comprehensive heart health support, each 650mg tablet delivers highly concentrated herbal extracts that promote optimal blood circulation, maintain arterial health, and support strong cardiac performance.",
    basePrice: 39.99,
    rating: 4.9,
    reviewsCount: 115,
    colorTheme: "sky",
    colorGradStart: "#0EA5E9", // Sky Blue
    colorGradEnd: "#0369A1",
    imageUrl: "/images/vivadio.jpg",
    imageUrls: [
      "/images/vivadio.jpg",
      "/images/vivadio_side.jpg",
      "/images/vivadio_back.jpg"
    ],
    sizes: [
      { name: "60 Tablets (Standard)", count: 60, priceModifier: 1.0 },
      { name: "200 Tablets (Value Pack)", count: 200, priceModifier: 2.7 }
    ],
    benefits: [
      "Provides targeted daily cardiovascular and circulatory support.",
      "Promotes optimal blood circulation and helps maintain arterial health.",
      "Supports strong cardiac performance and myocardial energy requirements.",
      "Delivers highly concentrated premium herbal extracts in a 650mg tablet."
    ],
    activeIngredients: [
      { name: "Hawthorn (Crataegus oxyacantha) Berry Extract", amount: "300 mg", percentageDV: "†", function: "Improves coronary micro-circulation and cardiac tone" },
      { name: "Garlic (Allium sativum) Bulb Extract (Odor-Controlled)", amount: "150 mg", percentageDV: "†", function: "Encourages smooth vasodilation & cardiovascular defense" },
      { name: "Coenzyme Q10 (as Ubiquinone)", amount: "100 mg", percentageDV: "†", function: "Critical co-factor in mitochondrial ATP generation in heart tissue" },
      { name: "Olive Leaf Extract (standardized to 20% Oleuropein)", amount: "100 mg", percentageDV: "†", function: "Potent free radical scavenger targeting LDL cholesterol" }
    ],
    directions: "Take 1 tablet twice daily with 8 oz of purified water, preferably with a meal, or as directed by your clinical healthcare practitioner.",
    storageWarnings: [
      "Store below 30°C, away from direct sunlight.",
      "Do not use if safety seal under cap is broken or missing.",
      "If you are taking blood thinning medications or anticipating surgery, consult your physician prior to use."
    ]
  },
  {
    id: "vivaplus",
    name: "VIVA Plus Tablets",
    tagline: "The Ultimate Daily Triple-Action Defense.",
    goal: "Detox",
    shortHook: "Revitalize your entire system from the inside out. Delivering a robust triple-action benefit of deep cellular detoxification, enhanced blood circulation, and powerful immune system support, VIVA Plus helps your body flush out toxins, look vibrant, and stay resilient.",
    basePrice: 34.99,
    rating: 4.9,
    reviewsCount: 180,
    colorTheme: "green",
    colorGradStart: "#22C55E", // Fresh Green
    colorGradEnd: "#15803D",
    imageUrl: "/images/vivaplus.jpg",
    imageUrls: [
      "/images/vivaplus.jpg",
      "/images/vivaplus_side.jpg",
      "/images/vivaplus_back.jpg"
    ],
    sizes: [
      { name: "180 Tablets (Standard)", count: 180, priceModifier: 1.0 },
      { name: "360 Tablets (Value Pack)", count: 360, priceModifier: 1.7 }
    ],
    benefits: [
      "Provides deep cellular detoxification to flush out harmful toxins and waste from the body.",
      "Enhances system-wide blood circulation to transport vital oxygen and nutrients efficiently.",
      "Delivers powerful immune system support to stay resilient against daily environmental stressors.",
      "Formulated with premium Aloe Vera extracts and key botanicals for total daily wellness maintenance."
    ],
    activeIngredients: [
      { name: "Aloe Vera (Aloe barbadensis) Inner Leaf Powder", amount: "250 mg", percentageDV: "†", function: "Facilitates deep cellular detoxification and toxin flushing" },
      { name: "Garlic (Allium sativum) Bulb Extract (Odor-Controlled)", amount: "150 mg", percentageDV: "†", function: "Promotes healthy blood vessel dilation and robust circulation" },
      { name: "Astragalus membranaceus Root Extract", amount: "200 mg", percentageDV: "†", function: "Strengthens baseline immune cell response and defense mechanisms" },
      { name: "Ginseng (Panax Ginseng) Extract (10% Ginsenosides)", amount: "100 mg", percentageDV: "†", function: "Improves daily energy, vitality, and systemic resilience" }
    ],
    directions: "Take 1 to 2 tablets daily with a full glass of water, preferably in the morning to support daytime detoxification and circulation, or as directed by a healthcare professional.",
    storageWarnings: [
      "Store securely in a cool, dry environment. Avoid heat and direct sunlight.",
      "Do not use if safety seal under cap is broken or missing.",
      "Keep bottle tightly closed to maintain structural stability of active extracts."
    ]
  },
  {
    id: "vivanego",
    name: "Viva Nego Tablets",
    tagline: "Reclaim Your Day from Body Aches and Pain.",
    goal: "Pain Relief",
    shortHook: "Move freely and live comfortably again. Crafted by Venus Industry Ltd., this premium herbal supplement is specifically formulated to provide fast-acting, reliable relief from muscular aches, joint discomfort, and everyday physical strain.",
    basePrice: 32.99,
    rating: 4.8,
    reviewsCount: 124,
    colorTheme: "indigo",
    colorGradStart: "#6366F1", // Indigo
    colorGradEnd: "#4338CA",
    imageUrl: "/images/vivanego.jpg",
    imageUrls: [
      "/images/vivanego.jpg",
      "/images/vivanego_side.jpg",
      "/images/vivanego_back.jpg"
    ],
    sizes: [
      { name: "90 Tablets (Standard)", count: 90, priceModifier: 1.0 },
      { name: "180 Tablets (Value Pack)", count: 180, priceModifier: 1.7 }
    ],
    benefits: [
      "Provides natural, targeted relief from bodily aches, muscular pain, and joint discomfort.",
      "Formulated as a fast-absorbing, stomach-friendly herbal blend that protects your digestive lining.",
      "Completely free from harsh synthetic chemicals that irritate the stomach or liver.",
      "Helps you recover, relax, and restore physical mobility to get back to what you love."
    ],
    activeIngredients: [
      { name: "White Willow (Salix alba) Bark Extract (Standardized to 15% Salicin)", amount: "400 mg", percentageDV: "†", function: "Natural, stomach-friendly botanical pain and ache relief" },
      { name: "Turmeric (Curcuma longa) Extract (95% Curcuminoids)", amount: "200 mg", percentageDV: "†", function: "Powerful anti-inflammatory compound for joint comfort" },
      { name: "Boswellia Serrata Extract (65% Boswellic Acids)", amount: "150 mg", percentageDV: "†", function: "Supports healthy joint structure and flexible physical mobility" },
      { name: "Ginger (Zingiber officinale) Root Extract", amount: "100 mg", percentageDV: "†", function: "Synergistic herbal digestive defense to soothe the stomach" }
    ],
    directions: "Take 1 to 2 tablets with a full glass of water, preferably after meals, when experiencing muscular aches or physical discomfort. Do not exceed 4 tablets daily unless advised by a healthcare professional.",
    storageWarnings: [
      "Keep out of reach of children.",
      "Store in a cool, dry place.",
      "Do not use if safety seal under cap is broken or missing.",
      "Formulated and produced under premium clinical controls by Venus Industry Ltd."
    ]
  },
  {
    id: "hepaviva",
    name: "HepaViva Herbal Tablets",
    tagline: "Pure Support for Your Body's Ultimate Filter.",
    goal: "Liver",
    shortHook: "Promotes optimal liver function, detoxification, and cellular defense.",
    basePrice: 32.99,
    rating: 4.9,
    reviewsCount: 167,
    colorTheme: "violet",
    colorGradStart: "#8B5CF6", // Violet/Purple
    colorGradEnd: "#6D28D9",
    imageUrl: "/images/hepaviva.jpg",
    imageUrls: [
      "/images/hepaviva.jpg",
      "/images/hepaviva_side.jpg",
      "/images/hepaviva_back.jpg"
    ],
    sizes: [
      { name: "90 Tablets (Standard)", count: 90, priceModifier: 1.0 },
      { name: "180 Tablets (Value Pack)", count: 180, priceModifier: 1.7 }
    ],
    benefits: [
      "Stimulates healthy liver enzyme levels, optimizes bile production, and defends hepatic cells against oxidative damage.",
      "Promotes cleaner energy, better digestion, and total metabolic wellness by supporting your body's ultimate filter.",
      "Loaded with specialized hepatoprotective herbs designed for complete metabolic detoxification.",
      "Supplies 100% natural, active botanical extracts to protect hepatocytes from daily environmental toxins."
    ],
    activeIngredients: [
      { name: "Milk Thistle (Silybum marianum) (80% Silymarin)", amount: "350 mg", percentageDV: "†", function: "Strengthens liver cell outer membranes against incoming toxins" },
      { name: "N-Acetyl L-Cysteine (NAC)", amount: "200 mg", percentageDV: "†", function: "Direct intracellular precursor for glutathione manufacturing" },
      { name: "Artichoke (Cynara scolymus) Leaf Extract", amount: "100 mg", percentageDV: "†", function: "Spurs healthy bile flow and lipid emulsification processes" },
      { name: "Dandelion (Taraxacum officinale) Root Extract", amount: "100 mg", percentageDV: "†", function: "Natural diuretic assistance & hepatic congestion reliever" }
    ],
    directions: "Take 1 tablet in the morning with breakfast and 1 tablet in the evening with a full glass of water, or as directed by your clinical healthcare practitioner.",
    storageWarnings: [
      "Store securely in a cool, dry place. Avoid heat and direct sunlight.",
      "Do not use if safety seal under cap is broken or missing.",
      "Keep bottle tightly closed to maintain structural stability of active extracts."
    ]
  },
  {
    id: "nephroviva",
    name: "NephroViva Herbal Tablets",
    tagline: "Premium Care for Your Renal Wellness.",
    goal: "Kidney",
    shortHook: "Protect and support your renal system with NephroViva Herbal Tablets. Formulated in a convenient 90-count bottle to promote healthy kidney function and fluid balance naturally.",
    basePrice: 32.99,
    rating: 4.9,
    reviewsCount: 154,
    colorTheme: "purple",
    colorGradStart: "#701A75", // Deep Plum
    colorGradEnd: "#4A044E",
    imageUrl: "/images/nephroviva.jpg",
    imageUrls: [
      "/images/nephroviva.jpg",
      "/images/nephroviva_side.jpg",
      "/images/nephroviva_back.jpg"
    ],
    sizes: [
      { name: "90 Tablets (Standard)", count: 90, priceModifier: 1.0 },
      { name: "180 Tablets (Value Pack)", count: 180, priceModifier: 1.7 }
    ],
    benefits: [
      "Provides targeted daily support for healthy waste filtration and fluid balance.",
      "Promotes optimal kidney filtration function and overall urinary tract health.",
      "Loaded with active botanical extracts to defend nephrons against environmental toxins.",
      "Composed of 100% certified pure natural ingredients with high bioavailability."
    ],
    activeIngredients: [
      { name: "Cranberry (Vaccinium macrocarpon) Fruit Extract", amount: "400 mg", percentageDV: "†", function: "Helps maintain a clean urinary tract and prevents bacterial adhesion" },
      { name: "Astragalus membranaceus Root Extract", amount: "250 mg", percentageDV: "†", function: "Supports renal micro-circulation and healthy glomerular filtration" },
      { name: "Dandelion (Taraxacum officinale) Leaf Extract", amount: "200 mg", percentageDV: "†", function: "Promotes natural fluid balance and smooth waste filtration" },
      { name: "Stinging Nettle (Urtica dioica) Root Extract", amount: "150 mg", percentageDV: "†", function: "Supports healthy fluid balance and renal defense pathways" }
    ],
    directions: "Take 1 to 2 tablets daily with a full glass of water, preferably with a meal, or as directed by your healthcare professional.",
    storageWarnings: [
      "Store securely in a cool, dry place below 30°C.",
      "Keep out of reach of children.",
      "Do not use if safety seal under cap is broken or missing.",
      "Formulated and clinically tested by Venus Industry Ltd."
    ],
    seoTitle: "NephroViva Herbal Tablets (90s) | Natural Kidney Health Support",
    seoDescription: "Protect and support your renal system with NephroViva Herbal Tablets. Formulated in a convenient 90-count bottle to promote healthy kidney function and fluid balance naturally.",
    detailedCopy: "Premium Care for Your Renal Wellness.\n\nYour kidneys play a vital role in filtering waste and maintaining fluid balance. Give them the targeted, natural support they deserve with NephroViva Herbal Tablets. Each 90-tablet bottle is crafted with high-quality botanical extracts specifically selected to promote optimal kidney function, support healthy detoxification pathways, and maintain overall renal wellness. Easy to integrate into your daily routine, NephroViva is your proactive step toward long-term vital health.",
    specifications: [
      { feature: "Primary Benefit", details: "Supports healthy kidney function, waste filtration, and renal defense" },
      { feature: "Quantity", details: "90 tablets per bottle" },
      { feature: "Target System", details: "Renal / Urinary tract support" },
      { feature: "Formula Type", details: "100% natural, premium herbal extract blend" },
      { feature: "Storage Conditions", details: "Store securely in a cool, dry place below 30°C" }
    ]
  }
];

export const FAQS: FaqItem[] = [
  {
    category: "Shipping & Orders",
    question: "How long does shipping take and what are the delivery charges?",
    answer: "We offer expedited premium ground shipping across the nation. Orders over $50 qualify for 100% Free Shipping. For orders under $50, a standard flat fee of $4.95 is applied. Standard delivery takes 3 to 5 business days, and orders are processed within 24 hours of checkout. You will receive a secure tracking link via email as soon as your parcel leaves our state-of-the-art climate-controlled warehouse."
  },
  {
    category: "Refunds & Guarantees",
    question: "What is your return policy?",
    answer: "We believe in the therapeutic purity of our supplements, which is why we offer an industry-leading 30-Day Unopened Bottle Money-Back Guarantee. If you change your mind for any reason, simply contact our Customer Care squad at support@provivawellness.com to initiate a quick return. Once we receive your unopened bottle, we will issue a full refund to your original payment method, no questions asked."
  },
  {
    category: "Clinical Integration",
    question: "Can I take these supplements alongside my prescription medication?",
    answer: "While our formulations are composed of 100% certified pure natural ingredients, active botanicals possess physiological activity that may interact with certain pharmaceutical drugs (e.g., blood thinners, immunosuppressants). We strongly advise consulting with your primary medical practitioner or cardiologist before starting any new supplement regimen to ensure safety and clinical harmony."
  },
  {
    category: "Quality Assurance",
    question: "Are these supplements third-party laboratory tested?",
    answer: "Absolutely. Every single batch of ProViva, VivaLax, VivaDio, VIVA Plus, Viva Nego, and HepaViva undergoes strict testing in ISO-certified laboratories. We test for heavy metals, mold, microbiological contaminants, and active ingredient potency. Only batches that match our stringent clinical standards are released for bottling, ensuring you receive pure, potent, and safe supplementation."
  },
  {
    category: "Manufacturing Integrity",
    question: "Where are your supplements manufactured?",
    answer: "All of our products are designed, sourced, and manufactured in advanced pharmaceutical-grade laboratories adhering strictly to Good Manufacturing Practices (GMP). Our facilities are fully registered, temperature-regulated to protect delicate botanicals, and routinely audited by third-party sanitization organizations to ensure absolute clinical safety."
  }
];

export const MOCK_REVIEWS: UserReview[] = [
  {
    id: "rev-1",
    productId: "proviva",
    author: "Dr. Eleanor Vance, MD",
    verified: true,
    rating: 5,
    date: "June 24, 2026",
    title: "Remarkable Bioavailability & Formulation",
    comment: "As an integrative medicine physician, I am highly selective about the supplements I recommend to my patients. The ProViva formulation offers exceptional active ingredient dosages without the typical cheap synthetic binders or talc. Absolutely excellent."
  },
  {
    id: "rev-1-2",
    productId: "proviva",
    author: "Catherine L.",
    verified: true,
    rating: 4,
    date: "May 12, 2026",
    title: "Helped my husband immensely",
    comment: "I purchased ProViva Herbal Tablets for my husband three months ago. It has given him incredible comfort and significantly reduced his frequent nighttime trips to the bathroom. His sleep quality is back, and he feels much more energized during the day."
  },
  {
    id: "rev-2",
    productId: "vivadio",
    author: "Julian K.",
    verified: true,
    rating: 5,
    date: "July 02, 2026",
    title: "VivaDio changed my daily energy levels",
    comment: "I was looking for a high-purity CoQ10 supplement that wouldn't irritate my stomach. VivaDio is incredibly gentle, and after 3 weeks of taking it daily with my breakfast, I feel a tangible, steady improvement in my morning stamina. No artificial colors or weird fillers—absolutely excellent product."
  },
  {
    id: "rev-2-2",
    productId: "vivadio",
    author: "Dr. Arthur P.",
    verified: true,
    rating: 4,
    date: "April 15, 2026",
    title: "Solid cardiovascular profile",
    comment: "The clinical synergy of CoQ10 and hawthorn berry extract in VivaDio is outstanding. Patient response has been extremely favorable regarding endothelial comfort and arterial elasticity."
  },
  {
    id: "rev-3",
    productId: "vivalax",
    author: "Sarah M.",
    verified: true,
    rating: 4,
    date: "June 18, 2026",
    title: "VivaLax is highly reliable",
    comment: "I travel frequently and suffer from occasional bowel irregularity. VivaLax worked overnight exactly as described. It's gentle, didn't cause stomach cramping, and has become a staple in my travel bag. Highly recommend the 120-capsule value pack as it lasts much longer."
  },
  {
    id: "rev-3-2",
    productId: "vivalax",
    author: "Robert T.",
    verified: true,
    rating: 5,
    date: "March 10, 2026",
    title: "Smooth Overnight Relief",
    comment: "Absolutely works without any cramping or discomfort! The psyllium and aloe blend is much smoother than any pharmaceutical laxative I have tried."
  },
  {
    id: "rev-4",
    productId: "vivaplus",
    author: "Marcus T.",
    verified: true,
    rating: 5,
    date: "May 29, 2026",
    title: "VIVA Plus is my joint saver",
    comment: "I run 15 miles a week and my knees feel the impact. VIVA Plus has reduced my recovery time significantly. The addition of black pepper extract is a genius formulation touch because it actually makes a massive difference in turmeric's effectiveness. Will be buying a subscription."
  },
  {
    id: "rev-4-2",
    productId: "vivaplus",
    author: "Brenda S.",
    verified: false,
    rating: 4,
    date: "February 22, 2026",
    title: "Great joint comfort",
    comment: "My morning joint stiffness is almost entirely gone since starting VIVA Plus. Very happy with the 95% standardized curcuminoids dosage."
  },
  {
    id: "rev-5",
    productId: "vivanego",
    author: "Gerald B.",
    verified: true,
    rating: 5,
    date: "May 05, 2026",
    title: "Incredible muscular pain relief",
    comment: "After taking Viva Nego for a couple of weeks, my back aches and muscle tension have practically vanished. Incredible relief and a massive improvement in overall physical mobility."
  },
  {
    id: "rev-5-2",
    productId: "vivanego",
    author: "Raymond D.",
    verified: true,
    rating: 4,
    date: "June 11, 2026",
    title: "Fast-acting and gentle on stomach",
    comment: "The combination of white willow bark and turmeric extract works wonders for joint stiffness without upsetting my stomach like synthetic alternatives. Highly recommended."
  },
  {
    id: "rev-6",
    productId: "hepaviva",
    author: "Eleanor S.",
    verified: true,
    rating: 5,
    date: "July 01, 2026",
    title: "Highly protective detox",
    comment: "The standardized Milk Thistle extract and NAC in HepaViva is incredibly therapeutic. I feel significantly cleaner, less bloated after fatty foods, and my hepatologist approved the formula."
  },
  {
    id: "rev-6-2",
    productId: "hepaviva",
    author: "Marcus L.",
    verified: true,
    rating: 4,
    date: "April 30, 2026",
    title: "Great for metabolic cleanse",
    comment: "I use HepaViva regularly for detox cycles. It keeps my liver enzymes perfectly balanced and helps with overall digestion and energy levels."
  }
];
