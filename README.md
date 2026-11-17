<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=venom&color=0:BBF7D0,50:4ADE80,100:5EEAD4&height=240&section=header&text=EcoTrack%20AI&fontSize=64&fontColor=052E16&fontAlignY=38&desc=Your%20Personal%20Carbon%20Footprint%2C%20Tracked%20Live&descAlignY=62&descSize=18&descColor=14532D" width="100%" />
</p>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=600&size=20&duration=3000&pause=900&color=16A34A&center=true&vCenter=true&width=820&lines=Track+every+kilogram+of+CO2;Travel+-+Food+-+Electricity;Gemini+powered+eco+tips+after+every+log;Small+habits.+Real+impact." alt="EcoTrack AI typing banner" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-0B1F14?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/TypeScript-0B1F14?style=for-the-badge&logo=typescript&logoColor=3178C6" />
  <img src="https://img.shields.io/badge/Vite-0B1F14?style=for-the-badge&logo=vite&logoColor=A855F7" />
  <img src="https://img.shields.io/badge/Tailwind-0B1F14?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8" />
  <img src="https://img.shields.io/badge/Firebase-0B1F14?style=for-the-badge&logo=firebase&logoColor=FFCA28" />
  <img src="https://img.shields.io/badge/Gemini_AI-0B1F14?style=for-the-badge&logo=googlegemini&logoColor=8AB4F8" />
  <img src="https://img.shields.io/badge/Jest-27%2F27_Passing-16A34A?style=for-the-badge&logo=jest&logoColor=white" />
</p>

---

## 🌿 About

**EcoTrack AI** is a personal carbon footprint tracker that updates in real time. Log a trip, a meal, or your appliance usage, and the app instantly converts it into CO₂ using real emission factors, compares it with your daily target, and gets a personalised tip from Gemini AI.

Built as an academic mini project (24PMIP301) at M.O.P. Vaishnav College for Women.

> 🟢 **Under target** · 🟡 **Close to target** · 🔴 **Over target**  
> The Earth globe, the Qbit mascot and every ring in the app follow these same three states.

---

## ✨ Features

| | Feature | What it does |
|---|---|---|
| 🌍 | **Live Carbon Score** | Realtime daily total with a spinning CSS Earth that changes colour with your status |
| 🚗 | **Travel Logger** | Car, scooty, bus, train, plane and bike, converted by distance |
| 🍽️ | **Food Logger** | Beef, chicken, fish, vegetarian, vegan and coffee, each with its own footprint |
| ⚡ | **Electricity Logger** | Fan, AC, fridge, TV, geyser and more, calculated from wattage × hours |
| 🤖 | **Gemini Eco Tips** | A personalised suggestion after every logged activity |
| 📊 | **Analytics** | 30-day trend, emission-source breakdown, carbon heatmap, monthly goal |
| 📑 | **Reports** | Monthly breakdown, month-over-month comparison, achievements, past reports |
| 📤 | **Export & Share** | PDF, CSV, Web Share, copy summary, print |
| 🎮 | **Eco Games** | Carbon City Builder and Eco Catch, powered by your real habits |
| 🤖 | **Qbit Mascot** | A colour-reactive 3D-shaded robot companion |
| ⌘ | **Command Palette** | Press `⌘K` / `Ctrl+K` to jump anywhere in the app |
| ⚙️ | **Real Preferences** | Daily target, unit (kg / lbs / tonnes) and display name apply across every page |
| 🔐 | **Secure Auth** | Google and email sign-in, with deployed Firestore security rules |

---

## 🧮 Emission Factors

| 🚗 Travel (kg CO₂ / km) | | 🍽️ Food (kg CO₂ / serving) | | ⚡ Electricity |
|---|---|---|---|---|
| Car | 0.192 | Beef | 6.61 | **0.82 kg / kWh** |
| Scooty | 0.075 | Chicken | 2.33 | *(TNEB grid)* |
| Bus | 0.089 | Fish | 1.96 | |
| Train | 0.041 | Vegetarian | 0.87 | |
| Plane | 0.255 | Vegan | 0.42 | |
| Bike | 0 | Coffee | 0.21 | |

---

## 🛠️ Tech Stack

**Frontend** &nbsp; React · TypeScript · Vite · Tailwind CSS · shadcn/ui · Recharts · Framer Motion  
**Backend & Data** &nbsp; Firebase Authentication · Cloud Firestore (realtime `onSnapshot`) · Firebase Hosting  
**AI** &nbsp; Google Gemini (`@google/genai`)  
**Testing** &nbsp; Jest · React Testing Library  
**Design** &nbsp; Figma

---

## 🗂️ Data Model

```text
users/{uid}                      → displayName, city, vehicleType, dietType, unit, dailyTarget
 ├─ actions/{id}                 → category, subType, value, carbonKg, geminiTip, loggedAt
 └─ dailyScores/{date}           → travelCarbon, foodCarbon, electricityCarbon, totalCarbon, tipCount
```

---

## 🚀 Getting Started

```bash
# 1. Clone
git clone https://github.com/Subhashini-Anbalagan/EcoTrack-AI.git
cd EcoTrack-AI

# 2. Install
npm install

# 3. Add your keys to a .env.local file (see below)

# 4. Run
npm run dev
```

**`.env.local`**

```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_key
```

**Run tests**

```bash
npm test
```

---

## 🧪 Quality

- ✅ 27 / 27 Jest tests passing
- ✅ Firestore security rules deployed
- ✅ Every number on screen comes from real Firestore data

---

## 👩‍💻 Developer

**A. Subhashini** · M.Sc. Information Technology  
🔗 [GitHub](https://github.com/Subhashini-Anbalagan)

---

<p align="center">⭐ If EcoTrack AI inspired you to cut a little carbon, give it a star! 🌱</p>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:14B8A6,50:16A34A,100:052E16&height=120&section=footer" width="100%" />
