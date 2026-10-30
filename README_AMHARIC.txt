YAMRAL MIHRETU — PORTFOLIO WEBSITE
==================================

ይህ ፕሮጀክት የሚያካትተው፦
- የግል Portfolio website
- የተጠቃሚ ፎቶ (public/assets/yamral-profile.png)
- Injibara University — 2nd Year Accounting
- Software Development እና Digital Marketing ፍላጎቶች
- English / Amharic ቋንቋ መቀየሪያ
- Dark / Light mode
- Backend API (Node.js + Express)
- SQLite Database
- Admin Panel: projects ማከል/መሰረዝ እና መልዕክቶችን ማየት/መሰረዝ

WINDOWS 10 ላይ ለማስኬድ
-----------------------
1. Node.js LTS ከ https://nodejs.org ጫን።
2. ይህን ZIP ፋይል Extract አድርግ።
3. የፕሮጀክቱን folder ክፈት።
4. በfolder ውስጥ CMD ወይም PowerShell ክፈት።
5. የሚከተሉትን ትዕዛዞች አስኪድ፦

   npm install

6. .env.example የሚለውን ቅዳ እና .env ብለህ ስሙን ቀይር።
7. .env ውስጥ ADMIN_PASSWORD እና SESSION_SECRET ቀይር።
   ጠንካራ የራስህን password ተጠቀም።
8. ከዚያ፦

   npm start

9. Website: http://localhost:3000
10. Admin Panel: http://localhost:3000/admin

DEFAULT ADMIN LOGIN (ለመጀመሪያ ሙከራ ብቻ)
-------------------------------------------
Username: yamral
Password: ChangeThisPassword123!

ከመጀመሪያው ሩጫ በፊት .env ውስጥ password ቀይር።
ይህን password በሕዝብ ድረ-ገጽ ላይ አታጋራ።

DATABASE
--------
SQLite database በመጀመሪያ ሲሰራ data/portfolio.db ውስጥ በራሱ ይፈጠራል።
Projects እና contact messages እዚያ ይቀመጣሉ።

IMPORTANT
---------
- ይህ የመጀመሪያ local version ነው። በኢንተርኔት ላይ ከማተምህ በፊት HTTPS,
  production session store, backups, rate limiting እና secure hosting ማዘጋጀት ያስፈልጋል።
- በpublic site ላይ የግል ስልክ ቁጥር፣ የቤት አድራሻ፣ password ወይም ሌላ
  የግል መረጃ አታስቀምጥ።
- Contact form መልዕክቶችን database ውስጥ ያስቀምጣል፤ በAdmin Panel ማየት ይቻላል።
