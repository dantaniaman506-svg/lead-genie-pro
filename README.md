# Lead Genie Pro

# n8n Backend Plan — Real Estate Lead Gen Automation (Hinglish Explanation)



## 1. Overall Soch (Architecture Recap)



- Frontend pe Abdul jab "Generate Leads" pe click karega, ek `fetch`/webhook call jayega seedha n8n ke Webhook URL pe (POST request, JSON body mein sab filters).

- n8n ka poora workflow yeh sambhalega: Apollo se leads nikalna, unhe format karna, email bhejna, aur frontend ko wapas JSON response dena taaki table ban jaye.

- Koi CRM nahi, koi extra database nahi (abhi ke liye) — n8n hi poora orchestration/logic sambhalega. Google Sheets ka use bhi abhi optional/future rakh sakte hain agar history chahiye, warna MVP ke liye skip bhi kar sakte ho.



## 2. Kya-Kya Data Frontend se Aayega (Webhook Input)



Jab "Generate" dabaya jayega, frontend yeh JSON n8n ko bhejega:



- `session_id` — har generation ka unique ID

- `owner_email` — jis email se Abdul login kiya tha (isi pe leads jaayengi)

- `countries` — selected countries ka array (UAE default)

- `property_type` — Villa/Apartment/etc

- `budget_min`, `budget_max`, `currency`

- `lead_type` — "investor" / "retail_buyer" / "both"

- `contact_fields` — kaunse fields chahiye (phone, email, linkedin, instagram)



## 3. Node-by-Node — Kya Hoga Andar (n8n Workflow)



1. **Webhook Trigger** — yeh workflow ka entry point hai. Response mode "Respond to Webhook node se manually" rakhna hai (turant auto-response nahi), taaki hum control kar sakein kab aur kya response bhejna hai.



2. **Security Check** — Webhook ke header mein ek secret token check karo (jaise `x-webhook-secret`). Agar match nahi hua, turant 401 error bhej do. Yeh isliye zaroori hai kyunki webhook URL public hoti hai — koi bhi random banda isse hit karke tumhare Apollo credits waste kar sakta hai agar security nahi rakhi.



3. **Validate Input** — Check karo ki `countries` khaali toh nahi, `owner_email` sahi format mein hai ya nahi. Agar kuch missing hai, turant 400 error response bhej do — Apollo tak jaane ki zaroorat nahi.



4. **Build Apollo Query** (Function/Code node) — Yahan filters ko Apollo ke search parameters mein convert karenge:

   - `countries` → Apollo ke `person_locations`

   - `lead_type = investor` → titles jaise "investor", "managing director", "real estate investor", "family office"

   - `lead_type = retail_buyer` → yeh thoda tricky hai (neeche Section 5 mein detail hai)



5. **Apollo Search Call** (HTTP Request node) — Apollo ke search endpoint ko call karo apni API key ke saath. Yeh credit-free call hai (search khud credits nahi khaati, sirf enrichment/reveal khaata hai).



6. **Check Results** (IF node) — Agar 0 results aaye, seedha ek "no_results" response bhej do frontend ko ("filters widen karke try karo") — aage mat badho.



7. **Loop Per Person** (Split in Batches) — Har result ke liye ek-ek karke enrichment call karo (na ki bulk, kyunki bulk enrichment sirf naam+company se kaam karta hai, IDs se nahi — single call zyada reliable hai).



8. **Enrich Karo** (HTTP Request node per person) — Email reveal karo (`reveal_personal_emails: true`). Yeh turant response mein aata hai.



9. **Format Final List** (Function node) — Sabhi leads ko ek clean array mein daalo: `name`, `email`, `linkedin`, `company`, `title`, `country`, `phone` (agar available), `instagram` (hamesha `null`/"Not available" — Apollo deta hi nahi).



10. **Send Email** (Gmail/SMTP node) — Formatted HTML table wale email banao aur `owner_email` pe bhejo.



11. **Respond to Webhook** — Wahi formatted JSON wapas frontend ko bhejo (yeh table banane ke kaam aayega). Email node aur Respond node ko parallel/branch mein rakho taaki dono ek hi execution mein saath-saath ho jaayein — user ko lagega "same time" hua.



## 4. ⚠️ Phone Number ka Technical Masla — Bahut Zaroori



Apollo ka phone number reveal turant nahi milta jab tumhe. Docs ke hisaab se, jab `reveal_phone_number: true` use karte ho, Apollo ko ek `webhook_url` deni padti hai — Apollo phone number dhoondhta hai (kabhi kabhi third-party vendors se), aur jab mil jata hai tab khud tumhare diye hue webhook URL pe wapas call karta hai. Matlab **phone number turant available nahi hota, thoda time baad async aata hai.**



**MVP ke liye recommend karta hu (simplest aur robust):**

- Abhi ke liye sirf Name, Email, LinkedIn, Company turant table mein dikhao.

- Phone number column mein "Fetching phone..." ya "Request Phone" button dikhao.

- Jab client meeting demo karni hai, yeh feature abhi skip karo ya "coming soon" jaisa dikhao — isse workflow simple rahega aur demo mein kuch atakega nahi.



**Phase 2 (baad mein add karna, jab time ho):**

- Ek doosra n8n webhook banao: `/phone-reveal-callback`.

- Jab Apollo ko phone mil jaye, woh is doosre webhook ko hit karega apne aap.

- Yeh workflow us data ko match karke (session_id/person ID se) lead record update karega — phir agli baar Abdul jab us session ko dekhega, phone number update dikh jayega.

- Isse turant table mein dalne ke liye ek chhota storage chahiye hoga (jaise Google Sheets ya koi simple key-value store) taaki data persist ho jab tak callback aaye.



Yeh do-phase approach isliye zaroori hai kyunki agar tum turant response mein phone number ka wait karoge, poora workflow atak jayega ya time-out ho jayega — jo demo ke time bahut bura lagega.



## 5. ⚠️ "Retail Buyer" Leads ka Sach — Client Ko Pehle Hi Bata Dena



Apollo fundamentally ek **B2B professional database** hai — yeh logon ko unke job title, company, seniority ke hisaab se dhoondta hai. "Investor" type leads ke liye yeh kaafi accha kaam karega, kyunki investor/director/family-office jaise titles use karke targeting ho sakti hai.



Lekin "individual retail buyer" — matlab koi bhi normal insaan jo sirf apne liye ghar khareedna chahta hai — iska koi professional signal nahi hota Apollo ke paas. Yeh "personal buying intent" hai, na ki koi job/company data. Isliye retail buyer wale leads Apollo se sirf ek **approximation** honge (jaise: us country ke affluent/senior professionals), na ki verified "yeh banda property khareedne wala hi hai" wale leads.



**Recommend karta hu:** Abdul ko yeh baat clearly bata do meeting mein — taaki expectations match ho. Warna baad mein "yeh leads toh real buyer nahi lag rahe" wali complaint aa sakti hai.



## 6. Worst-Case Scenarios Aur Backup Plan



| Kya ho sakta hai | Kya karna hai |

|---|---|

| Apollo se 0 results aaye | Frontend ko "no leads mile, filters widen karo" message, workflow yahin stop |

| Apollo rate limit (429 error) | Retry with thoda delay (1-2 baar), warna user ko clear error dikhao — silent fail mat hone do |

| Apollo credits khatam ho gaye | Us specific error ko catch karke Aman ko turant pata chale ki recharge karna hai, user ko generic "system busy hai, thodi der mein try karo" dikhao |

| Email bhejna fail ho gaya (SMTP down) | Phir bhi frontend table show ho jaani chahiye — email fail hone se poora result block nahi hona chahiye |

| Same lead baar-baar aana | Abhi ke liye ignore kar sakte ho, future mein ek "already seen" list rakh sakte ho (email/LinkedIn URL se dedupe) |

| Bahut zyada leads maang liye ek baar mein | MVP ke liye ek cap rakho (jaise 15-20 per generation) — warna workflow slow ho jayega ya webhook time-out ho jayega |

| Koi random banda webhook URL guess karke hit kare | Secret header check (Section 3, step 2) isi problem ko rokta hai |

| Instagram field chahiye lekin data nahi hai | Hamesha "Not available" dikhao, kabhi fake data mat daalo |



## 7. Pricing / Business Strategy — Framework (Final Decision Tumhara Hai)



Main financial advisor nahi hu, lekin AI automation agencies mein jo common practice hai woh yeh hai:



**Model — One-time Build Fee + Monthly Retainer** (sabse common aur safe):



- **One-time setup fee:** Is scope (n8n backend + custom frontend + Apollo integration + email flow) ke liye typical range **AED 3,000 – 8,000** (~$800–$2,200) hoti hai chhote/medium automation agencies mein. Dubai real estate business ek established client hai, toh higher end (AED 6,000–12,000) bhi justify ho sakta hai agar value clearly dikhao (roz naye leads = time bachaya + naye deals ka chance).

- **Payment split:** 50% advance pehle (kaam shuru karne se pehle), baaki 50% jab demo/delivery ho jaye aur client satisfied ho. Yeh industry standard hai — isse tumhara risk kam hota hai agar client beech mein backaway kare.

- **Monthly retainer:** Yeh Apollo subscription/credits, hosting, aur tumhara maintenance/support time cover karta hai. Apollo ka Basic plan khud ~$59/month hai, plus har enriched lead par 1-9 credits lagte hain — jitna volume utna cost. Isliye monthly retainer **AED 800 – 2,000/month** (~$220–$550) rakhna reasonable hai, jisme tumhara margin bhi included ho.



**Tiering ka option** (agar chaho toh):

- Starter: X leads/month, dashboard only

- Growth: zyada leads/month + email delivery + priority support

- Pro: sabse zyada leads + future CRM features jab add karoge



Final numbers tumhare positioning, client ke budget, aur kitna value tum dikha pa rahe ho — is par depend karega. Yeh sirf ek starting framework hai jisse tum apne hisaab se adjust kar sakte ho.





Bhai ho mai tujhe dear hu yeah mera project ka pura plan hai ek baar smjh le bs manie tujhe sb smjhane ke liye diya hai smjha so ab mere liye ek bahut hi badiya sa dashboard bna jiesa plan mai btaya gya same sb kuch virsa ho but mere us ai Automation dashboard mai koi bhi chije personal chije reveal mat kardio jo plan mai likhi kyuki yeah project mai apne client ke liye bna Raha hu jiese plan mai likha hai and mai tujhe logo and naam bta Raha hu ki hona chaiye dekh sbse phele toh yeah le images screen shot jo tujhe exact same dashboard bnana hai tujhe same to same dkrhvimage mai manievtujhe ek logo diya hai baki ki images refrence hai tujhe Mera dashboard esa banan hai mobile friendly and desktop bhi and har ek ek chij kaam kare and jab koi lead geneate pe dabye toh us webhook url endport mai sb bhej dijiyo apne hisaab se sb kardio https://aribotics770.app.n8n.cloud/webhook/generate-leads

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/82b35e65-66ed-45b8-ac60-e70d8a47afd2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
