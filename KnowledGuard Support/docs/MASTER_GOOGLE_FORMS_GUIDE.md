# 🚀 The Ultimate Google Forms Master Guide

Let's start fresh. Forget the old guides. Follow this step-by-step to get everything working flawlessly from start to finish.

---

## Phase 1: Create the Form
1. Log into your KnowledgeGuard App as an HR Admin or Analyst.
2. Go to the **Research & Export** tab on the sidebar.
3. Scroll down to **Interactive Quarterly Form Studio**.
4. Select the quarter you want to run (Q1, Q2, Q3, or Q4) and click **Copy Google Apps Script**.
5. Go to [script.google.com](https://script.google.com).
6. Click **New Project**.
7. Delete the empty code block and paste the code you copied from KnowledgeGuard.
8. Click **Save** and then **Run**. 
9. Check the **Execution Log** at the bottom of the screen. Click the link that says **Editor URL**. 
10. *Congratulations! Your dynamic quarterly form is built. Keep this form open in a tab.*

---

## Phase 2: Start the Pinggy Tunnel (Windows Hack)
*Since Google's servers are in California, they cannot reach your laptop in your house. We use "Pinggy" to give your laptop a temporary public web address.*

1. In VS Code, go to **Terminal -> New Terminal** at the very top of your screen. 
   *(Make sure your backend server `npm run dev` is still running in the other terminal tab!)*
2. In this new, blank terminal, copy and paste this exact command and hit Enter:
   `ssh -p 443 -R0:localhost:5000 a.pinggy.io`
3. A menu will appear in the terminal. Look for the row that says **http://**. 
4. Copy that URL! It will look something like `https://rnkjs-101-102.a.free.pinggy.link`. 
   *(Keep this terminal open, it is keeping the tunnel alive).*

---

## Phase 3: Connect the Form to Your App (The Webhook)
1. Go back to your beautiful **Google Form** (the one that opened in Phase 1).
2. Click the **three dots (⋮)** in the top right corner of the form.
3. Click **Apps Script** (Google used to call this Script Editor). A new tab will open.
4. Delete the empty `function myFunction() {}` that is sitting there.
5. Copy the code box below, and paste it in:

```javascript
function onSubmit(e) {
  // PASTE YOUR PINGGY URL RIGHT HERE AND LEAVE THE /api/webhooks/google-form AT THE END!
  const WEBHOOK_URL = "https://YOUR-PINGGY-URL.a.free.pinggy.link/api/webhooks/google-form";
  
  const form = FormApp.getActiveForm();
  const allResponses = form.getResponses();
  const latestResponse = allResponses[allResponses.length - 1];
  const itemResponses = latestResponse.getItemResponses();
  
  const payload = { email: latestResponse.getRespondentEmail() };
  
  for (let i = 0; i < itemResponses.length; i++) {
    const question = itemResponses[i].getItem().getTitle();
    const answer = itemResponses[i].getResponse();
    payload[question] = answer;
  }
  
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  };
  UrlFetchApp.fetch(WEBHOOK_URL, options);
}
```

6. Very carefully replace `https://YOUR-PINGGY-URL.a.free.pinggy.link` on Line 3 with the URL you copied from your terminal in Phase 2. Make sure it still ends with `/api/webhooks/google-form`!
7. Click the **Save** (floppy disk) icon.

---

## Phase 4: Turn it on! (The Trigger)
1. While still on the Apps Script page, look at the very left sidebar and click the **Triggers** icon (it looks like an alarm clock).
2. Click the big **+ Add Trigger** button in the bottom right corner.
3. Set the boxes exactly like this:
   - Choose which function to run: `onSubmit`
   - Choose which deployment should run: `Head`
   - Select event source: `From form`
   - Select event type: `On form submit`
4. Click **Save**.
5. Google will ask for permission. Click your Google account, then click **Advanced**, then click **Go to Untitled project (unsafe)**, and finally click **Allow**.

**✅ YOU ARE DONE!** 
Go back to your Google Form, fill out a fake response yourself, and hit Submit. Within 2 seconds, that fake user will appear in your KnowledgeGuard Admin Dashboard!
