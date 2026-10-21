const User = require("../models/User");
const Like = require("../models/Like");
const bcrypt = require("bcryptjs");

const SAMPLE_USERS = [
  {
    name: "Aria Sharma",
    email: "aria.sharma@connecthearts.demo",
    age: 24,
    gender: "female",
    bio: "Coffee enthusiast, indie music lover, and amateur painter. Looking for someone to explore hidden cafes and city viewpoints with!",
    city: "Mumbai",
    interests: ["Music", "Art", "Travel", "Photography"],
    lookingFor: "relationship",
    profilePhoto:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    photos: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
    ],
    prompts: [
      {
        question: "A life goal of mine is...",
        answer:
          "To open a seaside art cafe with fresh sourdough and indie vinyl records.",
      },
      {
        question: "Dating me is like...",
        answer:
          "Having someone who will always photograph you at your best angles and steal your fries.",
      },
      {
        question: "My simple pleasures...",
        answer: "A rainy Sunday morning, iced vanilla latte, and watercolor painting.",
      },
    ],
    lifestyle: {
      zodiac: "Scorpio ♏",
      drinking: "Socially",
      smoking: "Never",
      workout: "Often",
      pets: "Dog lover 🐕",
      education: "Bachelor's in Fine Arts",
      height: "5'6\"",
    },
    isVerified: true,
  },
  {
    name: "Rohan Verma",
    email: "rohan.verma@connecthearts.demo",
    age: 27,
    gender: "male",
    bio: "Software architect by day, trail runner by dawn. Always up for spontaneous road trips, stargazing, and great pasta.",
    city: "Bangalore",
    interests: ["Technology", "Fitness", "Nature", "Cooking"],
    lookingFor: "relationship",
    profilePhoto:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    photos: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80",
    ],
    prompts: [
      {
        question: "Two truths and a lie...",
        answer:
          "I ran a marathon in Ladakh, I know 4 programming languages, and I make terrible pasta.",
      },
      {
        question: "The best way to win me over is...",
        answer:
          "Suggest a spontaneous late-night drive to watch the meteor shower with hot chai.",
      },
    ],
    lifestyle: {
      zodiac: "Leo ♌",
      drinking: "Socially",
      smoking: "Never",
      workout: "Every day",
      pets: "Cat lover 🐈",
      education: "Master's in Computer Science",
      height: "6'0\"",
    },
    isVerified: true,
  },
  {
    name: "Ananya Iyer",
    email: "ananya.iyer@connecthearts.demo",
    age: 25,
    gender: "female",
    bio: "Bookworm, plant mom, and board game geek. Seeking thoughtful conversations and someone who doesn't take life too seriously.",
    city: "Pune",
    interests: ["Reading", "Movies", "Gaming", "Nature"],
    lookingFor: "relationship",
    profilePhoto:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
    photos: [
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
    ],
    prompts: [
      {
        question: "My most controversial opinion is...",
        answer:
          "Audiobooks count 100% as reading books and Catan is superior to Monopoly.",
      },
      {
        question: "Together, we could...",
        answer:
          "Build an indoor jungle, conquer escape rooms, and discover obscure indie cinema.",
      },
    ],
    lifestyle: {
      zodiac: "Virgo ♍",
      drinking: "Never",
      smoking: "Never",
      workout: "Sometimes",
      pets: "Plant parent 🪴",
      education: "Master's in Literature",
      height: "5'4\"",
    },
    isVerified: true,
  },
  {
    name: "Kabir Malhotra",
    email: "kabir.malhotra@connecthearts.demo",
    age: 28,
    gender: "male",
    bio: "Musician and weekend hiker. If you love live gigs, street food tours, and spontaneous jam sessions, we'll get along great.",
    city: "Delhi",
    interests: ["Music", "Travel", "Dancing", "Photography"],
    lookingFor: "relationship",
    profilePhoto:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
    photos: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=80",
    ],
    prompts: [
      {
        question: "Dating me is like...",
        answer:
          "Getting custom Spotify mixtapes every week and always having a plus-one to rooftop concerts.",
      },
      {
        question: "I'll know it's time to delete ConnectHearts when...",
        answer:
          "We spend 4 hours talking about life in a parked car and neither of us checks the phone.",
      },
    ],
    lifestyle: {
      zodiac: "Sagittarius ♐",
      drinking: "Socially",
      smoking: "Socially",
      workout: "Often",
      pets: "Dog lover 🐕",
      education: "Bachelor's in Audio Engineering",
      height: "5'11\"",
    },
    isVerified: true,
  },
  {
    name: "Meera Patel",
    email: "meera.patel@connecthearts.demo",
    age: 26,
    gender: "female",
    bio: "Graphic designer with a passion for pottery and modern art museums. Let's debate sci-fi movies over hot cocoa.",
    city: "Ahmedabad",
    interests: ["Art", "Movies", "Technology", "Cooking"],
    lookingFor: "relationship",
    profilePhoto:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
    photos: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    ],
    prompts: [
      {
        question: "A life goal of mine is...",
        answer:
          "To learn ceramic wheel throwing in Kyoto and exhibit my pottery worldwide.",
      },
      {
        question: "My simple pleasures...",
        answer:
          "Clean typography, fresh lavender candles, and baking warm cinnamon rolls.",
      },
    ],
    lifestyle: {
      zodiac: "Taurus ♉",
      drinking: "Socially",
      smoking: "Never",
      workout: "Sometimes",
      pets: "Both dogs & cats 🐾",
      education: "Design Degree",
      height: "5'5\"",
    },
    isVerified: true,
  },
  {
    name: "Siddharth Nair",
    email: "siddharth.nair@connecthearts.demo",
    age: 29,
    gender: "male",
    bio: "Photographer traveling across states capturing sunsets. Looking for deep talks, laughter, and a partner in crime.",
    city: "Kochi",
    interests: ["Photography", "Travel", "Nature", "Music"],
    lookingFor: "relationship",
    profilePhoto:
      "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=80",
    photos: [
      "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    ],
    prompts: [
      {
        question: "Together, we could...",
        answer:
          "Backpack through Kerala backwaters, capture golden hour portraits, and eat fresh seafood.",
      },
    ],
    lifestyle: {
      zodiac: "Pisces ♓",
      drinking: "Socially",
      smoking: "Never",
      workout: "Often",
      pets: "Dog lover 🐕",
      education: "Bachelor's in Visual Media",
      height: "5'10\"",
    },
    isVerified: true,
  },
  {
    name: "Zoya Khan",
    email: "zoya.khan@connecthearts.demo",
    age: 23,
    gender: "female",
    bio: "Dancer, baker, and podcast junkie. Searching for good vibes, great food, and someone to laugh until our stomachs hurt.",
    city: "Hyderabad",
    interests: ["Dancing", "Cooking", "Fitness", "Reading"],
    lookingFor: "casual",
    profilePhoto:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
    photos: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
    ],
    prompts: [
      {
        question: "Dating me is like...",
        answer:
          "Having unlimited samples of freshly baked strawberry tarts and impromptu kitchen dance-offs.",
      },
    ],
    lifestyle: {
      zodiac: "Gemini ♊",
      drinking: "Socially",
      smoking: "Never",
      workout: "Every day",
      pets: "Cat lover 🐈",
      education: "Bachelor's in Psychology",
      height: "5'7\"",
    },
    isVerified: true,
  },
  {
    name: "Arjun Sen",
    email: "arjun.sen@connecthearts.demo",
    age: 26,
    gender: "male",
    bio: "Gamer, fitness buff, and coffee connoisseur. Looking for a genuine connection and someone to share Spotify playlists with.",
    city: "Kolkata",
    interests: ["Gaming", "Fitness", "Music", "Technology"],
    lookingFor: "relationship",
    profilePhoto:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80",
    photos: [
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
    ],
    prompts: [
      {
        question: "The best way to win me over is...",
        answer:
          "Be competitive in Mario Kart, enjoy black coffee, and teach me something you are deeply passionate about.",
      },
    ],
    lifestyle: {
      zodiac: "Aries ♈",
      drinking: "Socially",
      smoking: "Never",
      workout: "Every day",
      pets: "Dog lover 🐕",
      education: "Bachelor's in Engineering",
      height: "6'1\"",
    },
    isVerified: true,
  },
  {
    name: "Tara Sen",
    email: "tara.sen@connecthearts.demo",
    age: 25,
    gender: "female",
    bio: "Architect & vinyl collector. Obsessed with mid-century modern lines, espresso, and rooftop botanical gardens.",
    city: "Mumbai",
    interests: ["Art", "Architecture", "Music", "Coffee"],
    lookingFor: "relationship",
    profilePhoto:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
    photos: [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
    ],
    prompts: [
      {
        question: "A life goal of mine is...",
        answer: "To design a solar-powered cliffside villa that blends into nature.",
      },
      {
        question: "Dating me is like...",
        answer: "Never drinking bad coffee and discovering vintage jazz bars.",
      },
    ],
    lifestyle: {
      zodiac: "Libra ♎",
      drinking: "Socially",
      smoking: "Never",
      workout: "Often",
      pets: "Cat lover 🐈",
      education: "Master of Architecture",
      height: "5'7\"",
    },
    isVerified: true,
  },
  {
    name: "Vikram Rathore",
    email: "vikram.rathore@connecthearts.demo",
    age: 28,
    gender: "male",
    bio: "Restoring heritage estates, polo enthusiast, and amateur pastry chef. Let's explore antique bazaars.",
    city: "Jaipur",
    interests: ["Travel", "History", "Cooking", "Photography"],
    lookingFor: "relationship",
    profilePhoto:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
    photos: [
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    ],
    prompts: [
      {
        question: "The best way to win me over is...",
        answer: "Challenge me to a blind coffee tasting or discuss Rajasthan folklore.",
      },
    ],
    lifestyle: {
      zodiac: "Leo ♌",
      drinking: "Socially",
      smoking: "Never",
      workout: "Every day",
      pets: "Dog lover 🐕",
      education: "Hospitality Management",
      height: "6'1\"",
    },
    isVerified: true,
  },
  {
    name: "Natasha Kapoor",
    email: "natasha.kapoor@connecthearts.demo",
    age: 24,
    gender: "female",
    bio: "Fashion editor, sunset chaser, and Pilates devotee. Seeking someone witty with a great music taste.",
    city: "Delhi",
    interests: ["Fashion", "Fitness", "Travel", "Dancing"],
    lookingFor: "relationship",
    profilePhoto:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
    photos: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
    ],
    prompts: [
      {
        question: "Together, we could...",
        answer: "Spend golden hour at Humayun's tomb and hunt for the best dumplings in town.",
      },
    ],
    lifestyle: {
      zodiac: "Cancer ♋",
      drinking: "Socially",
      smoking: "Never",
      workout: "Often",
      pets: "Dog lover 🐕",
      education: "BA in Journalism",
      height: "5'6\"",
    },
    isVerified: true,
  },
  {
    name: "Advaith Pillai",
    email: "advaith.pillai@connecthearts.demo",
    age: 29,
    gender: "male",
    bio: "AI researcher & jazz keyboardist. I love quantum computing, midnight synthesizer sessions, and hiking.",
    city: "Bangalore",
    interests: ["Technology", "Music", "Gaming", "Nature"],
    lookingFor: "relationship",
    profilePhoto:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80",
    photos: [
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
    ],
    prompts: [
      {
        question: "My most controversial opinion is...",
        answer: "Analog synths and mechanical keyboards make code compile 15% better.",
      },
    ],
    lifestyle: {
      zodiac: "Aquarius ♒",
      drinking: "Never",
      smoking: "Never",
      workout: "Sometimes",
      pets: "Cat lover 🐈",
      education: "PhD in Artificial Intelligence",
      height: "5'11\"",
    },
    isVerified: true,
  },
  {
    name: "Riya D'Souza",
    email: "riya.dsouza@connecthearts.demo",
    age: 26,
    gender: "female",
    bio: "Scuba divemaster & marine conservationist. Happiest at 20 meters underwater or chilling with acoustic guitar.",
    city: "Goa",
    interests: ["Nature", "Travel", "Music", "Fitness"],
    lookingFor: "casual",
    profilePhoto:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    photos: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
    ],
    prompts: [
      {
        question: "Dating me is like...",
        answer: "Learning how to freedive and getting fresh coconut water every morning.",
      },
    ],
    lifestyle: {
      zodiac: "Pisces ♓",
      drinking: "Socially",
      smoking: "Never",
      workout: "Every day",
      pets: "Dog lover 🐕",
      education: "Marine Biology",
      height: "5'5\"",
    },
    isVerified: true,
  },
  {
    name: "Karan Singhania",
    email: "karan.singhania@connecthearts.demo",
    age: 27,
    gender: "male",
    bio: "Sommelier, triathlete, and avid reader. Seeking meaningful conversations, laughter, and great cuisine.",
    city: "Chandigarh",
    interests: ["Fitness", "Reading", "Cooking", "Travel"],
    lookingFor: "relationship",
    profilePhoto:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    photos: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=80",
    ],
    prompts: [
      {
        question: "Two truths and a lie...",
        answer: "I can blind-taste 12 varietals, I finished an Ironman, and I dislike chocolate.",
      },
    ],
    lifestyle: {
      zodiac: "Scorpio ♏",
      drinking: "Socially",
      smoking: "Never",
      workout: "Every day",
      pets: "Dog lover 🐕",
      education: "Sommelier Diploma",
      height: "6'2\"",
    },
    isVerified: true,
  },
  {
    name: "Ishita Sengupta",
    email: "ishita.sengupta@connecthearts.demo",
    age: 25,
    gender: "female",
    bio: "Novel writer & artisan coffee roaster. Let's wander into old bookshops and discuss philosophies over pour-overs.",
    city: "Kolkata",
    interests: ["Reading", "Art", "Coffee", "Movies"],
    lookingFor: "relationship",
    profilePhoto:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
    photos: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    ],
    prompts: [
      {
        question: "A life goal of mine is...",
        answer: "To publish my historical fiction trilogy and run a literary café.",
      },
    ],
    lifestyle: {
      zodiac: "Taurus ♉",
      drinking: "Never",
      smoking: "Never",
      workout: "Sometimes",
      pets: "Cat lover 🐈",
      education: "MA in Creative Writing",
      height: "5'4\"",
    },
    isVerified: true,
  },
  {
    name: "Devendra Joshi",
    email: "devendra.joshi@connecthearts.demo",
    age: 29,
    gender: "male",
    bio: "Wildlife filmmaker & amateur stargazer. If you enjoy camping under the Milky Way and tracking snow leopards, say hi.",
    city: "Udaipur",
    interests: ["Photography", "Nature", "Travel", "Technology"],
    lookingFor: "relationship",
    profilePhoto:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
    photos: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
    ],
    prompts: [
      {
        question: "The best way to win me over is...",
        answer: "Point your telescope at Saturn's rings and hand me a cup of masala chai.",
      },
    ],
    lifestyle: {
      zodiac: "Capricorn ♑",
      drinking: "Socially",
      smoking: "Never",
      workout: "Often",
      pets: "Dog lover 🐕",
      education: "MSc in Wildlife Biology",
      height: "6'0\"",
    },
    isVerified: true,
  },
];

exports.seedProfiles = async (req, res) => {
  try {
    const passwordHash = await bcrypt.hash("demoPassword123", 10);
    const createdUsers = [];

    for (const sample of SAMPLE_USERS) {
      const user = await User.findOneAndUpdate(
        { email: sample.email },
        {
          name: sample.name,
          email: sample.email,
          password: passwordHash,
          age: sample.age,
          gender: sample.gender,
          bio: sample.bio,
          city: sample.city,
          interests: sample.interests,
          lookingFor: sample.lookingFor,
          profilePhoto: sample.profilePhoto,
          photos: sample.photos,
          prompts: sample.prompts,
          lifestyle: sample.lifestyle,
          isVerified: sample.isVerified,
          isActive: true,
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      );
      createdUsers.push(user);
    }

    if (req.userId && createdUsers.length > 0) {
      const Match = require("../models/Match");
      const Message = require("../models/Message");
      const Like = require("../models/Like");

      // 1. Identify active mutual matches to preserve existing conversations
      const activeMatches = await Match.find({ users: req.userId }).select("users");
      const matchedUserIds = activeMatches
        .flatMap((m) => m.users.map((u) => u.toString()))
        .filter((id) => id !== req.userId.toString());

      // 2. Clear any non-mutual likes or passes by this user on the seeded profiles
      // so that clicking "Load More Profiles" immediately makes them discoverable!
      const seededIds = createdUsers.map((u) => u._id);
      await Like.deleteMany({
        fromUser: req.userId,
        toUser: { $in: seededIds, $nin: matchedUserIds },
      });

      // 3. If user has no active match yet, create demo match with first profile
      if (matchedUserIds.length === 0) {
        const demoPartner = createdUsers[0];
        if (demoPartner._id.toString() !== req.userId.toString()) {
          await Like.findOneAndUpdate(
            { fromUser: demoPartner._id, toUser: req.userId },
            { type: "like" },
            { upsert: true }
          );
          await Like.findOneAndUpdate(
            { fromUser: req.userId, toUser: demoPartner._id },
            { type: "like" },
            { upsert: true }
          );

          let match = await Match.findOne({
            users: { $all: [req.userId, demoPartner._id] },
          });

          if (!match) {
            match = await Match.create({
              users: [req.userId, demoPartner._id],
            });

            const openingMsg = await Message.create({
              match: match._id,
              sender: demoPartner._id,
              receiver: req.userId,
              text: "Hey! Loved your profile ❤️ Let's find some cozy coffee spots together!",
              read: false,
            });

            match.lastMessage = openingMsg._id;
            await match.save();
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Seeded ${createdUsers.length} dating profiles with photos, prompts, and lifestyle tags!`,
      profilesCount: createdUsers.length,
    });
  } catch (error) {
    console.error("Seed profiles error:", error.message);
    return res.status(500).json({ message: "Failed to seed demo profiles." });
  }
};
