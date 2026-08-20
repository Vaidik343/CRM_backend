const { Event, User, Notification } = require("../models");
const { generateEventCard } = require("../services/gemini.service");
const { createNotification } = require("./notifications.controller");
const { Op } = require("sequelize");
const puppeteer = require("puppeteer");

const creatorInclude = {
  model: User,
  as: "creator",
  attributes: ["id", "name", "employee_id"],
};

const employeeInclude = {
  model: User,
  as: "employee",
  attributes: ["id", "name", "employee_id"],
};

// ─────────────────────────────────────────────
// BUILD CARD HTML
// ─────────────────────────────────────────────

const buildCardHTML = (event, aiConfig = null) => {
  const templates = {
   birthday_1: (e) => `
  <div style="width:800px;height:500px;background:#4f46e5;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;border-radius:20px;padding:40px;box-sizing:border-box;position:relative;overflow:hidden;">
    
    <!-- Updated Soft Wavy Grid & Sparkles SVG (Replaces the 2 solid circles) -->
    <svg style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.15;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" fill="none">
      <path d="M-100 100 C 200 300, 400 0, 900 200" stroke="#ffffff" stroke-width="3" stroke-dasharray="8 8"/>
      <path d="M-100 300 C 300 500, 500 200, 900 400" stroke="#ffffff" stroke-width="2"/>
      
      <!-- Subtle Decorative Sparkles -->
      <path d="M 120 80 L 124 92 L 136 96 L 124 100 L 120 112 L 116 100 L 104 96 L 116 92 Z" fill="#ffffff"/>
      <path d="M 680 380 L 683 389 L 692 392 L 683 395 L 680 404 L 677 395 L 668 392 L 677 389 Z" fill="#ffffff"/>
      <circle cx="650" cy="120" r="4" fill="#ffffff"/>
      <circle cx="150" cy="380" r="6" fill="#ffffff"/>
      <circle cx="720" cy="220" r="3" fill="#ffffff"/>
    </svg>

    <!-- Centered Illustration Badge -->
    <div style="position:relative;z-index:2;background:#ffffff;padding:16px;border-radius:50%;margin-bottom:16px;box-shadow:0 10px 15px -3px rgba(0,0,0,0.2);">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/>
        <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/>
        <path d="M2 21h20"/>
        <path d="M7 8v2"/>
        <path d="M12 8v2"/>
        <path d="M17 8v2"/>
        <path d="M7 4h0"/>
        <path d="M12 4h0"/>
        <path d="M17 4h0"/>
      </svg>
    </div>

    <span style="position:relative;z-index:2;color:#c7d2fe;font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">Happy Birthday</span>
    <h1 style="position:relative;z-index:2;color:#ffffff;font-size:42px;font-weight:900;margin:0 0 8px;text-align:center;">${e.employee_name}</h1>
    <div style="position:relative;z-index:2;width:60px;height:4px;background:#818cf8;border-radius:2px;margin-bottom:20px;"></div>
    <p style="position:relative;z-index:2;color:#e0e7ff;font-size:16px;text-align:center;max-width:520px;line-height:1.6;margin:0;">
      ${e.message || "Wishing you a wonderful birthday filled with joy and happiness!"}
    </p>
  </div>`,

    birthday_2: (e) => `
      <div style="width:800px;height:500px;background:#fffdfa;border:2px solid #fef3c7;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;border-radius:20px;padding:40px;box-sizing:border-box;position:relative;overflow:hidden;">
        <!-- Corner Confetti SVG Accent -->
        <svg style="position:absolute;top:0;right:0;width:200px;height:200px;" viewBox="0 0 200 200" fill="none">
          <circle cx="150" cy="50" r="8" fill="#f59e0b"/>
          <circle cx="170" cy="90" r="5" fill="#ef4444"/>
          <circle cx="120" cy="80" r="6" fill="#3b82f6"/>
          <rect x="130" y="30" width="12" height="12" rx="2" fill="#10b981" transform="rotate(15 130 30)"/>
          <rect x="160" y="120" width="10" height="10" rx="2" fill="#8b5cf6" transform="rotate(45 160 120)"/>
        </svg>

        <div style="background:#fef3c7;padding:20px;border-radius:20px;margin-bottom:16px;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>

        <h1 style="color:#92400e;font-size:38px;font-weight:900;margin:0 0 6px;text-align:center;">Happy Birthday</h1>
        <h2 style="color:#b45309;font-size:24px;font-weight:700;margin:0 0 16px;">${e.employee_name}!</h2>
        <p style="color:#78350f;font-size:15px;text-align:center;max-width:500px;line-height:1.6;margin:0;">
          ${e.message || "May this special day bring you lots of joy. You are an amazing part of our team!"}
        </p>
      </div>`,
promotion_1: (e) => `
      <div style="width:800px;height:500px;background:linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;border-radius:20px;padding:40px;box-sizing:border-box;position:relative;overflow:hidden;">
        <!-- Subtle Radial Ambient Glow -->
        <div style="position:absolute;top:-100px;left:50%;transform:translateX(-50%);width:400px;height:400px;background:radial-gradient(circle, rgba(251,191,36,0.15) 0%, rgba(15,23,42,0) 70%);pointer-events:none;"></div>

        <!-- Elegant Grid & Sparkle Overlay -->
        <svg style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.08;" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid_p1" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" stroke-width="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid_p1)"/>
          <path d="M 120 100 L 123 109 L 132 112 L 123 115 L 120 124 L 117 115 L 108 112 L 117 109 Z" fill="#fbbf24"/>
          <path d="M 680 380 L 683 389 L 692 392 L 683 395 L 680 404 L 677 395 L 668 392 L 677 389 Z" fill="#fbbf24"/>
        </svg>

        <!-- Golden Trophy Badge -->
        <div style="position:relative;z-index:2;background:rgba(30, 41, 59, 0.8);border:1px solid rgba(251,191,36,0.3);padding:18px;border-radius:50%;margin-bottom:16px;box-shadow:0 0 25px rgba(251,191,36,0.2);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-4"/>
            <path d="M4 22h16"/>
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
          </svg>
        </div>

        <span style="position:relative;z-index:2;color:#fde68a;font-size:13px;font-weight:800;letter-spacing:4px;text-transform:uppercase;margin-bottom:8px;">Congratulations</span>
        <h1 style="position:relative;z-index:2;color:#ffffff;font-size:42px;font-weight:900;margin:0 0 6px;text-align:center;">${e.employee_name}</h1>
        <p style="position:relative;z-index:2;color:#94a3b8;font-size:14px;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">On Your Promotion</p>
        <div style="position:relative;z-index:2;width:60px;height:4px;background:#fbbf24;border-radius:2px;margin-bottom:20px;"></div>
        <p style="position:relative;z-index:2;color:#cbd5e1;font-size:15px;text-align:center;max-width:520px;line-height:1.6;margin:0;">
          ${e.message || "Your hard work and dedication have truly paid off. We are proud to have you on our team!"}
        </p>
      </div>`,

    promotion_2: (e) => `
      <div style="width:800px;height:500px;background:linear-gradient(135deg, #064e3b 0%, #022c22 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;border-radius:20px;padding:40px;box-sizing:border-box;position:relative;overflow:hidden;">
        <!-- Glowing Ring Background Effect -->
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:550px;height:550px;border:1px solid stroke="#34d399";border-radius:50%;opacity:0.1;"></div>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:400px;height:400px;border:1px stroke="#34d399";border-radius:50%;opacity:0.15;"></div>

        <!-- Dynamic Bottom Wave Graphic -->
        <svg style="position:absolute;bottom:0;left:0;width:100%;height:130px;opacity:0.12;" viewBox="0 0 800 120" fill="#34d399">
          <path d="M0,32L48,42.7C96,53,192,75,288,80C384,85,480,75,576,58.7C672,43,768,21,816,10.7L864,0L864,120L816,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
        </svg>

        <!-- Rocket Icon Badge -->
        <div style="position:relative;z-index:2;background:rgba(4, 120, 87, 0.6);border:1px solid #34d399;padding:18px;border-radius:50%;margin-bottom:16px;box-shadow:0 10px 20px rgba(0,0,0,0.3);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.71 1.26-1.5 1.63-2.32L4.5 16.5z"/>
            <path d="M12 15l-3-3 5.5-5.5a2.121 2.121 0 0 1 3 3L12 15z"/>
            <path d="M15 12l2.5 2.5"/>
            <path d="M9 9L6.5 6.5"/>
          </svg>
        </div>

        <span style="position:relative;z-index:2;color:#6ee7b7;font-size:13px;font-weight:800;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">Well Deserved</span>
        <h1 style="position:relative;z-index:2;color:#ffffff;font-size:42px;font-weight:900;margin:0 0 6px;text-align:center;">Congratulations, ${e.employee_name}!</h1>
        <div style="position:relative;z-index:2;width:60px;height:4px;background:#34d399;border-radius:2px;margin-bottom:20px;"></div>
        <p style="position:relative;z-index:2;color:#ecfdf5;font-size:15px;text-align:center;max-width:520px;line-height:1.6;margin:0;">
          ${e.message || "Your promotion is a reflection of your talent and commitment. Keep soaring high!"}
        </p>
      </div>`,

    office_1: (e) => `
      <div style="width:800px;height:500px;background:linear-gradient(135deg, #1e293b 0%, #0f172a 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;border-radius:20px;padding:40px;box-sizing:border-box;position:relative;overflow:hidden;">
        <!-- Geometric Accent Lines -->
        <svg style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.1;" viewBox="0 0 800 500" fill="none" stroke="#38bdf8">
          <circle cx="80" cy="80" r="160" stroke-width="2"/>
          <circle cx="720" cy="420" r="200" stroke-width="2"/>
          <line x1="0" y1="250" x2="800" y2="250" stroke-width="1" stroke-dasharray="8 8"/>
        </svg>

        <!-- Building Badge -->
        <div style="position:relative;z-index:2;background:rgba(51, 65, 85, 0.8);border:1px solid #38bdf8;padding:18px;border-radius:50%;margin-bottom:16px;box-shadow:0 10px 20px rgba(0,0,0,0.3);">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
            <path d="M9 22v-4h6v4"/>
            <path d="M8 6h.01"/><path d="M16 6h.01"/>
            <path d="M8 10h.01"/><path d="M16 10h.01"/>
            <path d="M8 14h.01"/><path d="M16 14h.01"/>
          </svg>
        </div>

        <span style="position:relative;z-index:2;color:#7dd3fc;font-size:13px;font-weight:800;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">Office Event</span>
        <h1 style="position:relative;z-index:2;color:#ffffff;font-size:42px;font-weight:900;margin:0 0 8px;text-align:center;">${e.employee_name}</h1>
        <div style="position:relative;z-index:2;width:60px;height:4px;background:#38bdf8;border-radius:2px;margin-bottom:20px;"></div>
        <p style="position:relative;z-index:2;color:#cbd5e1;font-size:15px;text-align:center;max-width:520px;line-height:1.6;margin:0;">
          ${e.message || "Join us for this special occasion. Looking forward to seeing everyone!"}
        </p>
      </div>`,

    office_2: (e) => `
      <div style="width:800px;height:500px;background:linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);border:1px solid #cbd5e1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;border-radius:20px;padding:40px;box-sizing:border-box;position:relative;overflow:hidden;">
        <!-- Clean Modern Background Dots -->
        <svg style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.3;" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots_o2" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#0284c7"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots_o2)"/>
        </svg>

        <!-- Notification Bell Badge -->
        <div style="position:relative;z-index:2;background:#ffffff;padding:18px;border-radius:50%;margin-bottom:16px;box-shadow:0 10px 25px -5px rgba(2, 132, 199, 0.25);">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>

        <span style="position:relative;z-index:2;color:#0284c7;font-size:13px;font-weight:800;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">Announcement</span>
        <h1 style="position:relative;z-index:2;color:#0f172a;font-size:42px;font-weight:900;margin:0 0 8px;text-align:center;">${e.employee_name}</h1>
        <div style="position:relative;z-index:2;width:60px;height:4px;background:#0284c7;border-radius:2px;margin-bottom:20px;"></div>
        <p style="position:relative;z-index:2;color:#475569;font-size:15px;text-align:center;max-width:520px;line-height:1.6;margin:0;">
          ${e.message || "We have exciting news to share. Stay tuned for more details!"}
        </p>
      </div>`,

    trip_1: (e) => `
      <div style="width:800px;height:500px;background:linear-gradient(135deg, #0284c7 0%, #0369a1 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;border-radius:20px;padding:40px;box-sizing:border-box;position:relative;overflow:hidden;">
        <!-- Dynamic Flight Path & Nodes -->
        <svg style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.2;" viewBox="0 0 800 500" fill="none" stroke="#ffffff" stroke-width="2">
          <path d="M-50,400 C 200,100, 500,450, 850,100" stroke-dasharray="8 8"/>
          <circle cx="210" cy="225" r="5" fill="#ffffff"/>
          <circle cx="560" cy="300" r="5" fill="#ffffff"/>
        </svg>

        <!-- Airplane Icon Badge -->
        <div style="position:relative;z-index:2;background:rgba(255,255,255,0.15);backdrop-filter:blur(8px);padding:18px;border-radius:50%;margin-bottom:16px;box-shadow:0 10px 20px rgba(0,0,0,0.2);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.7 5.2c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/>
          </svg>
        </div>

        <span style="position:relative;z-index:2;color:#bae6fd;font-size:13px;font-weight:800;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">Company Trip</span>
        <h1 style="position:relative;z-index:2;color:#ffffff;font-size:42px;font-weight:900;margin:0 0 6px;text-align:center;">${e.employee_name}</h1>
        <div style="position:relative;z-index:2;width:60px;height:4px;background:#38bdf8;border-radius:2px;margin-bottom:20px;"></div>
        <p style="position:relative;z-index:2;color:#e0f2fe;font-size:15px;text-align:center;max-width:520px;line-height:1.6;margin:0;">
          ${e.message || "Get ready for an amazing adventure together. Pack your bags!"}
        </p>
      </div>`,

    trip_2: (e) => `
      <div style="width:800px;height:500px;background:linear-gradient(135deg, #0d9488 0%, #115e59 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;border-radius:20px;padding:40px;box-sizing:border-box;position:relative;overflow:hidden;">
        <!-- Topo / Contour Line Pattern -->
        <svg style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.12;" viewBox="0 0 800 500" fill="none" stroke="#ffffff" stroke-width="2">
          <path d="M 0 100 Q 200 50 400 200 T 800 150"/>
          <path d="M 0 200 Q 300 150 500 350 T 800 300"/>
          <path d="M 0 350 Q 200 250 600 450 T 800 400"/>
        </svg>

        <!-- Compass / Map Badge -->
        <div style="position:relative;z-index:2;background:rgba(17, 94, 89, 0.7);border:1px solid #2dd4bf;padding:18px;border-radius:50%;margin-bottom:16px;box-shadow:0 10px 20px rgba(0,0,0,0.25);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6"/>
            <line x1="9" y1="3" x2="9" y2="18"/>
            <line x1="15" y1="6" x2="15" y2="21"/>
          </svg>
        </div>

        <span style="position:relative;z-index:2;color:#99f6e4;font-size:13px;font-weight:800;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">Adventure Awaits</span>
        <h1 style="position:relative;z-index:2;color:#ffffff;font-size:42px;font-weight:900;margin:0 0 6px;text-align:center;">${e.employee_name}</h1>
        <div style="position:relative;z-index:2;width:60px;height:4px;background:#2dd4bf;border-radius:2px;margin-bottom:20px;"></div>
        <p style="position:relative;z-index:2;color:#ccfbf1;font-size:15px;text-align:center;max-width:520px;line-height:1.6;margin:0;">
          ${e.message || "An exciting journey awaits us all. Let's make memories together!"}
        </p>
      </div>`,

    fun_game_1: (e) => `
      <div style="width:800px;height:500px;background:linear-gradient(135deg, #d97706 0%, #92400e 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;border-radius:20px;padding:40px;box-sizing:border-box;position:relative;overflow:hidden;">
        <!-- Energetic Diagonal Cross Pattern -->
        <svg style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.1;" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="crosses_fg1" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 0 0 L 30 30 M 30 0 L 0 30" stroke="#ffffff" stroke-width="1.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#crosses_fg1)"/>
        </svg>

        <!-- Game Controller Badge -->
        <div style="position:relative;z-index:2;background:rgba(180, 83, 9, 0.7);border:1px solid #fef3c7;padding:18px;border-radius:50%;margin-bottom:16px;box-shadow:0 10px 20px rgba(0,0,0,0.25);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fef3c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/>
            <circle cx="15" cy="11" r="1" fill="#fef3c7"/><circle cx="17" cy="13" r="1" fill="#fef3c7"/>
            <rect x="2" y="6" width="20" height="12" rx="6"/>
          </svg>
        </div>

        <span style="position:relative;z-index:2;color:#fef3c7;font-size:13px;font-weight:800;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">Game On!</span>
        <h1 style="position:relative;z-index:2;color:#ffffff;font-size:42px;font-weight:900;margin:0 0 6px;text-align:center;">${e.employee_name}</h1>
        <div style="position:relative;z-index:2;width:60px;height:4px;background:#fde047;border-radius:2px;margin-bottom:20px;"></div>
        <p style="position:relative;z-index:2;color:#fffbeb;font-size:15px;text-align:center;max-width:520px;line-height:1.6;margin:0;">
          ${e.message || "Time to have some fun! Join us for games and great times together."}
        </p>
      </div>`,

    fun_game_2: (e) => `
      <div style="width:800px;height:500px;background:linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;border-radius:20px;padding:40px;box-sizing:border-box;position:relative;overflow:hidden;">
        <!-- Playful Bubbles / Floating Circles -->
        <svg style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.15;" viewBox="0 0 800 500" fill="#ffffff">
          <circle cx="100" cy="120" r="40"/>
          <circle cx="700" cy="100" r="25"/>
          <circle cx="680" cy="380" r="55"/>
          <circle cx="120" cy="400" r="20"/>
        </svg>

        <!-- Party Emoji / Smiley Badge -->
        <div style="position:relative;z-index:2;background:rgba(109, 40, 217, 0.7);border:1px solid #ddd6fe;padding:18px;border-radius:50%;margin-bottom:16px;box-shadow:0 10px 20px rgba(0,0,0,0.25);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ddd6fe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
        </div>

        <span style="position:relative;z-index:2;color:#ddd6fe;font-size:13px;font-weight:800;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">Fun Time!</span>
        <h1 style="position:relative;z-index:2;color:#ffffff;font-size:42px;font-weight:900;margin:0 0 6px;text-align:center;">${e.employee_name}</h1>
        <div style="position:relative;z-index:2;width:60px;height:4px;background:#c084fc;border-radius:2px;margin-bottom:20px;"></div>
        <p style="position:relative;z-index:2;color:#f5f3ff;font-size:15px;text-align:center;max-width:520px;line-height:1.6;margin:0;">
          ${e.message || "Let's take a break and enjoy some fun activities together as a team!"}
        </p>
      </div>`,
  };

  // AI mode — styled cleanly using aiConfig colors
  if (event.mode === "ai" && aiConfig) {
    const { title, subtitle, message, colors } = aiConfig;
    const bg = colors?.primary || "#4f46e5";
    const text = colors?.text || "#ffffff";
    const accent = colors?.accent || "#c7d2fe";

    return `
      <div style="width:800px;height:500px;background:${bg};display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;border-radius:20px;padding:40px;box-sizing:border-box;position:relative;overflow:hidden;">
        <svg style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.1;" viewBox="0 0 800 500" fill="none">
          <circle cx="400" cy="250" r="300" stroke="${text}" stroke-width="2"/>
        </svg>
        <span style="position:relative;z-index:2;color:${accent};font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">${subtitle || "Announcement"}</span>
        <h1 style="position:relative;z-index:2;color:${text};font-size:42px;font-weight:900;margin:0 0 6px;text-align:center;">${title}</h1>
        <h2 style="position:relative;z-index:2;color:${text};opacity:0.9;font-size:22px;font-weight:700;margin:0 0 16px;">${event.employee_name}</h2>
        <div style="position:relative;z-index:2;width:60px;height:4px;background:${accent};border-radius:2px;margin-bottom:20px;"></div>
        <p style="position:relative;z-index:2;color:${text};opacity:0.85;font-size:15px;text-align:center;max-width:520px;line-height:1.6;margin:0;">
          ${message || event.message}
        </p>
      </div>`;
  }

  const templateFn = templates[event.design_template];
  return templateFn ? templateFn(event) : templates["birthday_1"](event);
};
// ─────────────────────────────────────────────
// CREATE EVENT
// ─────────────────────────────────────────────

const createEvent = async (req, res) => {
  try {
    const {
      event_type,
      mode,
      employee_name,
      employee_id,
      message,
      design_template,
      ai_prompt,
      event_date,
    } = req.body;

    console.log("event",req.body)
    
    const created_by = req.user.id;
    console.log("🚀 ~ createEvent ~ created_by:", created_by)

    if (!event_type || !mode || !employee_name || !event_date) {
      return res.status(400).json({ message: "event_type, mode, name and event_date are required." });
    }

    let ai_config = {};
    let finalMessage = message;

    if (mode === "ai") {
      if (!ai_prompt) {
        return res.status(400).json({ message: "ai_prompt is required for AI mode." });
      }
      const aiResult = await generateEventCard({
        event_type,
        employee_name,
        message,
        ai_prompt,
      });
      ai_config = aiResult;
      finalMessage = aiResult.message;
    }

    // Build card HTML
    const cardData = {
      employee_name,
      message: finalMessage,
      design_template,
      mode,
    };
    const card_html = buildCardHTML(cardData, mode === "ai" ? ai_config : null);

    const display_id = `EV${Date.now().toString().slice(-8)}`;

    const event = await Event.create({
      event_type,
      mode,
      created_by,
      employee_id: employee_id || null,
      employee_name,
      message: finalMessage,
      design_template: mode === "manual" ? design_template : null,
      ai_prompt: mode === "ai" ? ai_prompt : null,
      ai_config,
      event_date,
      card_html,
      display_id,
      is_published: true,
    });
    console.log("🚀 ~ createEvent ~ event:", event)

    return res.status(201).json({ message: "Event created successfully.", event });
  } catch (error) {
    console.error("createEvent error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET ALL EVENTS — Admin
// ─────────────────────────────────────────────

const getAllEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { event_type, search } = req.query;
    const where = {};

    if (event_type) where.event_type = event_type;
    if (search) where.employee_name = { [Op.iLike]: `%${search}%` };

    const { count, rows } = await Event.findAndCountAll({
      where,
      include: [creatorInclude, employeeInclude],
      order: [["created_at", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET ALL EVENTS — Employee
// ─────────────────────────────────────────────

const getEmployeeEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { event_type } = req.query;
    const where = { is_published: true };
    if (event_type) where.event_type = event_type;

    const { count, rows } = await Event.findAndCountAll({
      where,
      include: [creatorInclude],
      order: [["event_date", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET SINGLE EVENT
// ─────────────────────────────────────────────

const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id, {
      include: [creatorInclude, employeeInclude],
    });
    if (!event) return res.status(404).json({ message: "Event not found." });
    return res.status(200).json({ event });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// DELETE EVENT — Admin
// ─────────────────────────────────────────────

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id);
    if (!event) return res.status(404).json({ message: "Event not found." });
    await event.destroy();
    return res.status(200).json({ message: "Event deleted." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// EXPORT CARD AS PNG — using Puppeteer
// ─────────────────────────────────────────────

const exportCardPNG = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id);
    if (!event) return res.status(404).json({ message: "Event not found." });

    const fullHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8"/>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { width: 800px; height: 500px; overflow: hidden; }
          </style>
        </head>
        <body>${event.card_html}</body>
      </html>`;

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 500 });
    await page.setContent(fullHTML, { waitUntil: "networkidle0" });

    const screenshot = await page.screenshot({ type: "png" });
    await browser.close();

    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="event-${event.display_id}.png"`
    );
    return res.send(screenshot);
  } catch (error) {
    console.error("exportCardPNG error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// AI PREVIEW — generate without saving
// ─────────────────────────────────────────────

const previewAICard = async (req, res) => {
  try {
    const { event_type, employee_name, message, ai_prompt } = req.body;

    if (!event_type || !employee_name || !ai_prompt) {
      return res.status(400).json({ message: "event_type, employee_name and ai_prompt are required." });
    }

    const aiResult = await generateEventCard({ event_type, employee_name, message, ai_prompt });

    const cardData = { employee_name, message: aiResult.message, mode: "ai" };
    const card_html = buildCardHTML(cardData, aiResult);

    return res.status(200).json({ ai_config: aiResult, card_html });
  } catch (error) {
    console.error("previewAICard error:", error);
    return res.status(500).json({ message: error.message });
  }
};

const announceEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id, {
      include: [creatorInclude],
    });

    if (!event) return res.status(404).json({ message: "Event not found." });

    await event.update({ is_announced: true });

    // Emit to ALL connected employees instantly
    const io = req.app.get("io");
    io.emit("EVENT_ANNOUNCED", {
      id:            event.id,
      display_id:    event.display_id,
      event_type:    event.event_type,
      employee_name: event.employee_name,
      message:       event.message,
      card_html:     event.card_html,
      event_date:    event.event_date,
    });

    return res.status(200).json({ message: "Event announced successfully.", event });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


const getDesignPreviews = async (req, res) => {
  try {
    const { event_type, employee_name, message } = req.query;

    if (!event_type) {
      return res.status(400).json({ message: "event_type is required." });
    }

    const DESIGNS_BY_TYPE = {
      birthday:  ["birthday_1",  "birthday_2"],
      promotion: ["promotion_1", "promotion_2"],
      office:    ["office_1",    "office_2"],
      trip:      ["trip_1",      "trip_2"],
      fun_game:  ["fun_game_1",  "fun_game_2"],
    };

    const designs = DESIGNS_BY_TYPE[event_type] || [];

    const previews = designs.map((design_template) => {
      const html = buildCardHTML(
        {
          employee_name: employee_name || "Name",  // ← use real name if provided
          message:       message       || "Your custom message will appear here.",
          design_template,
          mode: "manual",
        },
        null
      );
      return { design_template, html };
    });

    return res.status(200).json({ previews });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
module.exports = {
    createEvent, getAllEvents, getEmployeeEvents, getEventById, deleteEvent, exportCardPNG, previewAICard, announceEvent, getDesignPreviews
}