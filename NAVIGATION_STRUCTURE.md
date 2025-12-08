# Navigation Structure Guide

## Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  TOP HEADER (Academy Info)                                      │
│  Logo | About | Courses | Coaching | Resources | Contact | User │
└─────────────────────────────────────────────────────────────────┘
┌──────────┬──────────────────────────────────────────────────────┐
│          │                                                      │
│  SIDE    │                                                      │
│  NAV     │              MAIN CONTENT AREA                       │
│          │                                                      │
│  Home    │                                                      │
│  Puzzles │                                                      │
│  Tourna. │                                                      │
│  Profile │                                                      │
│  Settings│                                                      │
│          │                                                      │
│  ────────│                                                      │
│  [User]  │                                                      │
│  Avatar  │                                                      │
└──────────┴──────────────────────────────────────────────────────┘
```

## Mobile Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  TOP HEADER                                                      │
│  Logo                                    Login | Signup          │
└─────────────────────────────────────────────────────────────────┘
│                                                                  │
│                                                                  │
│                    MAIN CONTENT AREA                             │
│                    (Full Width)                                  │
│                                                                  │
│                                                                  │
┌─────────────────────────────────────────────────────────────────┐
│  BOTTOM NAVIGATION                                               │
│  [Home]  [Puzzles]  [Tournaments]  [Profile]                    │
└─────────────────────────────────────────────────────────────────┘
```

## Navigation Breakdown

### Top Header (Always Visible)
**Purpose**: Academy and general information

| Link | Description | Target Audience |
|------|-------------|-----------------|
| About Us | Information about the academy | New visitors |
| Courses | Available chess courses | Students |
| Coaching | Personal coaching services | Serious learners |
| Resources | Learning materials, articles | All users |
| Contact | Get in touch with academy | Support seekers |

**Right Side**:
- Login/Signup buttons (guests)
- User avatar + name (logged in users)

### Side Navigation (Main Features)
**Purpose**: Core application functionality

| Link | Icon | Description | Auth Required |
|------|------|-------------|---------------|
| Home | 🏠 | Landing page with overview | No |
| Puzzles | ♟️ | Solve chess puzzles | Yes |
| Tournaments | 🏆 | Browse and join tournaments | Yes |
| Profile | 👤 | User profile and stats | No* |
| Settings | ⚙️ | App preferences | No |

*Profile redirects to login if not authenticated

**Bottom Section**:
- User avatar
- Username
- Rating/Level

## Page Hierarchy

```
Root (/)
├── Home (/)
│   └── Hero section
│   └── Features overview
│
├── Puzzles (/puzzle)
│   └── Puzzle board
│   └── Timer
│   └── Stats
│   └── Puzzle selector
│
├── Tournaments (/dashboard)
│   └── Tournament cards
│   └── Upcoming events
│   └── Registration
│
├── Profile (/profile)
│   └── User info
│   └── Statistics
│   └── Activity history
│   └── Achievements
│
└── Settings (/settings)
    ├── Board Customization
    │   ├── Board themes
    │   └── Piece sets
    ├── Notifications
    │   ├── Email
    │   ├── Push
    │   ├── Tournaments
    │   └── Achievements
    └── Account
        └── Delete account
```

## User Flows

### New Visitor Flow
1. Lands on Home page
2. Sees Top Header with academy info
3. Can explore: About, Courses, Coaching, Resources
4. Clicks "Login" or "Sign Up" to access features

### Logged-in User Flow
1. Sees personalized Top Header (avatar + name)
2. Uses Side Navigation for main features
3. Quick access to:
   - Solve puzzles
   - Join tournaments
   - Check profile/stats
   - Adjust settings

### Mobile User Flow
1. Top Header for academy info (collapsed on small screens)
2. Bottom Navigation for main features
3. Tap icons to navigate
4. Swipe-friendly interface

## Design Principles

### Consistency
- Top Header: Same across all pages
- Side Navigation: Same across all pages
- Light theme: Consistent colors and shadows
- Spacing: Uniform padding and margins

### Clarity
- Clear separation between academy info (top) and app features (side)
- Active states clearly indicated
- Logical grouping of related features

### Accessibility
- High contrast text
- Large touch targets (mobile)
- Keyboard navigation support
- Screen reader friendly

### Responsiveness
- Desktop: Full sidebar + top header
- Tablet: Narrower sidebar + top header
- Mobile: Bottom nav + simplified top header
