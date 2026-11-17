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

<p align="center">
  <a href="#-about"><img src="https://img.shields.io/badge/About-16A34A?style=flat-square" /></a>
  <a href="#-features"><img src="https://img.shields.io/badge/Features-22C55E?style=flat-square" /></a>
  <a href="#-how-it-works"><img src="https://img.shields.io/badge/How_It_Works-14B8A6?style=flat-square" /></a>
  <a href="#-emission-factors"><img src="https://img.shields.io/badge/Emission_Factors-0D9488?style=flat-square" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/Tech_Stack-0F766E?style=flat-square" /></a>
  <a href="#-getting-started"><img src="https://img.shields.io/badge/Getting_Started-115E59?style=flat-square" /></a>
  <a href="#-developer"><img src="https://img.shields.io/badge/Developer-134E4A?style=flat-square" /></a>
</p>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:BBF7D0,50:4ADE80,100:5EEAD4&height=3" width="100%" />

## 🌿 About

**EcoTrack AI** is a personal carbon footprint tracker that updates in real time. Log a trip, a meal or your appliance usage, and the app converts it into CO₂ using real emission factors, measures it against your daily target and gives you a personalised tip from Gemini AI.

Built as an academic mini project (**24PMIP301**) at M.O.P. Vaishnav College for Women.

> [!TIP]
> The Earth globe, the Qbit mascot and every progress ring in the app follow the same three states below.

<table align="center">
  <tr>
    <td align="center" width="200">🟢<br><b>Under target</b><br><sub>You're on track</sub></td>
    <td align="center" width="200">🟡<br><b>Close to target</b><br><sub>Watch your habits</sub></td>
    <td align="center" width="200">🔴<br><b>Over target</b><br><sub>Time to cut back</sub></td>
  </tr>
</table>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:BBF7D0,50:4ADE80,100:5EEAD4&height=3" width="100%" />

## ✨ Features

<table>
  <tr>
    <td width="50%" valign="top">

![Track](https://img.shields.io/badge/TRACK-16A34A?style=for-the-badge)

- 🚗 **Travel:** car, scooty, bus, train, plane, bike
- 🍽️ **Food:** beef, chicken, fish, vegetarian, vegan, coffee
- ⚡ **Electricity:** fan, AC, fridge, TV, geyser and more
- 🌍 **Live score:** realtime daily total with a spinning Earth

   </td>
   <td width="50%" valign="top">

![Understand](https://img.shields.io/badge/UNDERSTAND-0D9488?style=for-the-badge)

- 🤖 **Gemini eco tips** after every logged activity
- 📈 **30-day trend** and emission-source breakdown
- 🗓️ **Carbon heatmap** and monthly goal
- 🏅 **Achievements** earned from your real data

   </td>
  </tr>
  <tr>
    <td width="50%" valign="top">

![Report](https://img.shields.io/badge/REPORT-F59E0B?style=for-the-badge)

- 📊 Monthly breakdown and month-over-month comparison
- 📄 Export as **PDF** or **CSV**
- 📤 Web Share, copy summary and print

   </td>
   <td width="50%" valign="top">

![Engage](https://img.shields.io/badge/ENGAGE-8B5CF6?style=for-the-badge)

- 🏙️ **Carbon City Builder** and 🎯 **Eco Catch** games
- 🤖 **Qbit**, a colour-reactive 3D robot mascot
- ⌘ **Command palette** (`Ctrl+K` / `⌘K`)
- ⚙️ **Preferences:** daily target, unit, display name

   </td>
  </tr>
</table>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:BBF7D0,50:4ADE80,100:5EEAD4&height=3" width="100%" />

## 🔄 How It Works

```mermaid
flowchart LR
    A([👤 User logs activity]):::user --> B[🧮 Emission factors<br/>convert to kg CO₂]:::calc
    B --> C[(🔥 Cloud Firestore)]:::db
    B --> D[🤖 Gemini AI<br/>personalised tip]:::ai
    D --> C
    C -- onSnapshot --> E[⚛️ React hooks]:::ui
    E --> F[📊 Dashboard · Analytics · Reports]:::ui

    classDef user fill:#BBF7D0,stroke:#16A34A,color:#052E16,stroke-width:2px
    classDef calc fill:#D1FAE5,stroke:#0D9488,color:#064E3B,stroke-width:2px
    classDef db fill:#FEF3C7,stroke:#F59E0B,color:#78350F,stroke-width:2px
    classDef ai fill:#DBEAFE,stroke:#3B82F6,color:#1E3A8A,stroke-width:2px
    classDef ui fill:#CCFBF1,stroke:#14B8A6,color:#134E4A,stroke-width:2px
```

Every number on screen is read live from Firestore through realtime hooks, so a new log updates the score, charts and reports instantly.

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:BBF7D0,50:4ADE80,100:5EEAD4&height=3" width="100%" />

## 🧮 Emission Factors

<p align="center">
  <img src="https://img.shields.io/badge/Low-16A34A?style=flat-square" />
  <img src="https://img.shields.io/badge/Medium-F59E0B?style=flat-square" />
  <img src="https://img.shields.io/badge/High-DC2626?style=flat-square" />
</p>

<table>
  <tr>
    <th>🚗 Travel <sub>(kg CO₂ / km)</sub></th>
    <th>🍽️ Food <sub>(kg CO₂ / serving)</sub></th>
    <th>⚡ Electricity</th>
  </tr>
  <tr>
    <td valign="top">

![Bike](https://img.shields.io/badge/Bike-0-16A34A?style=flat-square)<br>
![Train](https://img.shields.io/badge/Train-0.041-16A34A?style=flat-square)<br>
![Scooty](https://img.shields.io/badge/Scooty-0.075-84CC16?style=flat-square)<br>
![Bus](https://img.shields.io/badge/Bus-0.089-84CC16?style=flat-square)<br>
![Car](https://img.shields.io/badge/Car-0.192-F59E0B?style=flat-square)<br>
![Plane](https://img.shields.io/badge/Plane-0.255-DC2626?style=flat-square)

   </td>
   <td valign="top">

![Coffee](https://img.shields.io/badge/Coffee-0.21-16A34A?style=flat-square)<br>
![Vegan](https://img.shields.io/badge/Vegan-0.42-16A34A?style=flat-square)<br>
![Vegetarian](https://img.shields.io/badge/Vegetarian-0.87-84CC16?style=flat-square)<br>
![Fish](https://img.shields.io/badge/Fish-1.96-F59E0B?style=flat-square)<br>
![Chicken](https://img.shields.io/badge/Chicken-2.33-F59E0B?style=flat-square)<br>
![Beef](https://img.shields.io/badge/Beef-6.61-DC2626?style=flat-square)

   </td>
   <td valign="top" align="center">
<br><br>
<b>0.82</b><br>
kg CO₂ / kWh<br>
<sub>TNEB grid</sub>
   </td>
  </tr>
</table>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:BBF7D0,50:4ADE80,100:5EEAD4&height=3" width="100%" />

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| 🎨 **Frontend** | React · TypeScript · Vite · Tailwind CSS · shadcn/ui · Recharts · Framer Motion |
| 🔥 **Backend & Data** | Firebase Authentication · Cloud Firestore · Firebase Hosting |
| 🤖 **AI** | Google Gemini (`@google/genai`) |
| 🧪 **Testing** | Jest · React Testing Library |
| 🖌️ **Design** | Figma |

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:BBF7D0,50:4ADE80,100:5EEAD4&height=3" width="100%" />

## 🗂️ Data Model

```text
users/{uid}                 → displayName, city, vehicleType, dietType, unit, dailyTarget
 ├─ actions/{id}            → category, subType, value, carbonKg, geminiTip, loggedAt
 └─ dailyScores/{date}      → travelCarbon, foodCarbon, electricityCarbon, totalCarbon, tipCount
```

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:BBF7D0,50:4ADE80,100:5EEAD4&height=3" width="100%" />

## 🚀 Getting Started

**1. Clone and install**

```bash
git clone https://github.com/Subhashini-Anbalagan/EcoTrack-AI.git
cd EcoTrack-AI
npm install
```

**2. Add your keys**

<details>
<summary>📄 Create a <code>.env.local</code> file in the project root</summary>

```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_key
```

</details>

> [!IMPORTANT]
> Never commit `.env.local`. It is already listed in `.gitignore`.

**3. Run**

```bash
npm run dev
```

**4. Test**

```bash
npm test
```

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:BBF7D0,50:4ADE80,100:5EEAD4&height=3" width="100%" />

## 🧪 Quality

<p>
  <img src="https://img.shields.io/badge/Tests-27%2F27_Passing-16A34A?style=for-the-badge&logo=jest&logoColor=white" />
  <img src="https://img.shields.io/badge/Security-Firestore_Rules_Deployed-F59E0B?style=for-the-badge&logo=firebase&logoColor=white" />
  <img src="https://img.shields.io/badge/Data-100%25_Real_Firestore-0D9488?style=for-the-badge" />
</p>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:BBF7D0,50:4ADE80,100:5EEAD4&height=3" width="100%" />

## 👩‍💻 Developer

<table>
  <tr>
    <td>
      <b>A. Subhashini</b><br>
      🎓 M.Sc. Information Technology<br>
      🔗 <a href="https://github.com/Subhashini-Anbalagan">GitHub</a>
    </td>
  </tr>
</table>

<p align="center">
  <b>⭐ If EcoTrack AI inspired you to cut a little carbon, give it a star! 🌱</b>
</p>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:5EEAD4,50:4ADE80,100:BBF7D0&height=120&section=footer" width="100%" />
