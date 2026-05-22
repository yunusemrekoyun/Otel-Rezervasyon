import { Cabin, ExperienceItem, Review } from './types';

export const cabins: Cabin[] = [
  {
    id: 'evergreen-pine',
    name: 'Evergreen Pine Family Lodge',
    location: 'Hardanger, Norway',
    price: 359,
    rating: 4.7,
    reviewsCount: 1842,
    description: 'A breathtaking secluded luxury cabin nestled in a dense, misty pine forest. High glass windows let you connect with nature while keeping you cozy beside the fire.',
    imageUrl: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?q=80&w=1200&auto=format&fit=crop', // A-frame cozy cabin in deep woods
    amenities: ['Outdoor Hot Tub', 'Fireplace', 'Heated Floors', 'Mountain View', 'Private Kitchen', 'Tesla Charger', 'High-speed Wi-Fi', 'Sauna'],
    specs: {
      guests: '2-5 guests',
      beds: '3 Queen beds',
      baths: '2.5 Baths',
      size: '145 m²'
    },
    climate: {
      temperature: 19,
      humidity: 58,
      windSpeed: 12,
      airQuality: 'Excellent (9 AQI)'
    }
  },
  {
    id: 'lakeside-reflective',
    name: 'Mirror Lake Glass Sanctuary',
    location: 'Lofoten, Norway',
    price: 480,
    rating: 4.9,
    reviewsCount: 924,
    description: 'An architectural marvel featuring mirrored glass walls that seamlessly disappear into the serene Norwegian lake reflection. Experience complete silence and starry nights.',
    imageUrl: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=1200&auto=format&fit=crop', // Winter mirror house / lake cabin
    amenities: ['Floating Deck', 'Glass Panoramic Walls', 'Indoor Wood Fireplace', 'Kayak & SUP Access', 'En-suite Glass Bath', 'Organic Espresso Bar', 'Heated Infinity Pool'],
    specs: {
      guests: '2 guests',
      beds: '1 King bed',
      baths: '1.5 Baths',
      size: '88 m²'
    },
    climate: {
      temperature: 21,
      humidity: 62,
      windSpeed: 8,
      airQuality: 'Pristine (4 AQI)'
    }
  },
  {
    id: 'treetops-nest',
    name: 'WoodNest Canopy Treetop',
    location: 'Odda, Norway',
    price: 420,
    rating: 4.8,
    reviewsCount: 1105,
    description: 'Suspended 6 meters above the forest floor, clamped to a single living pine tree. A masterclass in organic architecture with stunning panoramic views of the fjord.',
    imageUrl: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?q=80&w=1200&auto=format&fit=crop', // Forest trees / cozy retreat
    amenities: ['6m Suspended Bridge', 'Rainforest Shower', 'Sateen Linens', 'Fjord-view Balcony', 'Stargazing skylight', 'Underfloor heating', 'Bespoke Scandinavian interior'],
    specs: {
      guests: '1-3 guests',
      beds: '1 King, 1 Twin',
      baths: '1 Bath',
      size: '65 m²'
    },
    climate: {
      temperature: 20,
      humidity: 52,
      windSpeed: 15,
      airQuality: 'Excellent (7 AQI)'
    }
  },
  {
    id: 'arctic-aurora',
    name: 'Aurora Dome & Celestial Nest',
    location: 'Tromsø, Norway',
    price: 520,
    rating: 4.9,
    reviewsCount: 763,
    description: 'A geodetic glass dome designed for 360-degree views of the magical Aurora Borealis. Wake up under the dancing green lights in fully climate-controlled luxury.',
    imageUrl: 'https://images.unsplash.com/photo-1483168527879-c66136b56105?q=80&w=1200&auto=format&fit=crop', // Misty forest / starry sky
    amenities: ['360° Heated Dome', 'Telescope', 'Premium Hot Tub', 'Snowshoe Equipment', 'Private Chef option', 'Under-floor Heating', 'Northern Lights alarm'],
    specs: {
      guests: '2 guests',
      beds: '1 Super King bed',
      baths: '1 Bath',
      size: '72 m²'
    },
    climate: {
      temperature: 22,
      humidity: 45,
      windSpeed: 5,
      airQuality: 'Pure Arctic (2 AQI)'
    }
  }
];

export const reviews: Review[] = [
  {
    id: 'rev-1',
    userName: 'Elena Rostova',
    rating: 5,
    date: 'May 12, 2026',
    comment: 'The silence here is absolute. Waking up to the morning fog moving through the pines was a spiritual experience. Impeccable Scandinavian craftsmanship.',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop'
  },
  {
    id: 'rev-2',
    userName: 'Marcus Vance',
    rating: 5,
    date: 'April 28, 2026',
    comment: 'Exceeded every expectation. The design integration is pure genius. The climate controls inside the pod were flawless even with howling winds outside.',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop'
  },
  {
    id: 'rev-3',
    userName: 'Sophie Lindqvist',
    rating: 4,
    date: 'March 15, 2026',
    comment: 'Living amongst the treetops made us feel so tiny and connected to nature. Highly recommend doing the wood-fired hot tub at dusk as the stars come out!',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=100&auto=format&fit=crop'
  }
];

export const experiencesData: ExperienceItem[] = [
  {
    id: 'kayaking',
    name: 'Midnight Fjord Kayaking',
    price: 120,
    duration: '3 hours',
    rating: 4.9,
    teaser: 'Paddle under the amber twilight',
    description: 'Glide on absolute stillness as the midnight sun paints epic Norwegian glaciers in glowing rose-golds. Includes premium thermal gear, carbon paddles, and expert guiding.',
  },
  {
    id: 'hottub',
    name: 'Private Cedars Hot Tub & Sauna',
    price: 85,
    duration: 'unlimited',
    rating: 4.8,
    teaser: 'Stargaze with cold-plunge steps',
    description: 'Relax in a high-end natural spring wooden tub heated to 41°C. Complemented with locally prepared pine-infused steam essences and luxury organic robes.',
  },
  {
    id: 'trek',
    name: 'Alpine Nordic Highland Trekking',
    price: 150,
    duration: '5 hours',
    rating: 4.9,
    teaser: 'Prehistoric moss forest heights',
    description: 'Hike through wild birch preserves up to spectacular ridge platforms looking down into deep fjord channels. Includes artisan packed lunch jars.',
  },
];
