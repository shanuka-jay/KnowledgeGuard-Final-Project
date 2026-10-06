# Google Forms Webhook Setup Guide

This guide will show you exactly how to connect your Google Form to your new fully-automated KnowledgeGuard webhook.

## Prerequisites
Ensure your Google Form has the following two required questions:
1. **Email Address** (Make sure this is set to collect emails)
2. **Start Date** (A Date Picker question, or short answer e.g., "YYYY-MM-DD")

## Step 1: Start your Pinggy Tunnel (Windows Hack)
Because you are running the server locally, Google cannot reach your laptop. We will use Pinggy (which requires zero installation) to create a tunnel.

1. Open a **new** terminal in your VS Code (leave the backend running in the first one).
2. Paste this exact command and hit Enter:
   `ssh -p 443 -R0:localhost:5000 a.pinggy.io`
   *(If it asks "Are you sure you want to continue connecting?", type `yes` and hit Enter).*
3. A menu will appear in the terminal. Look for the **http://** URL (it will look like `https://rnkjs-101-102.a.free.pinggy.link`). Copy that URL!

## Step 2: Open Google Apps Script
1. Open your Google Form in edit mode.
2. Click the **three dots (⋮)** in the top right corner.
3. Select **Apps Script** (Google recently renamed this from Script Editor). This will open a new tab.

## Step 3: Paste the Code
Delete any existing code in the editor and paste the following snippet. **Make sure you paste your Pinggy URL into line 3!**

```javascript
function onSubmit(e) {
  // PASTE YOUR PINGGY URL HERE AND LEAVE THE /api/webhooks/google-form AT THE END!
  const WEBHOOK_URL = "https://YOUR-PINGGY-URL.a.free.pinggy.link/api/webhooks/google-form";
  
  const form = FormApp.getActiveForm();
  const allResponses = form.getResponses();
  const latestResponse = allResponses[allResponses.length - 1];
  const itemResponses = latestResponse.getItemResponses();
  
  // Build the JSON payload
  const payload = {
    email: latestResponse.getRespondentEmail()
  };
  
  for (let i = 0; i < itemResponses.length; i++) {
    const question = itemResponses[i].getItem().getTitle();
    const answer = itemResponses[i].getResponse();
    payload[question] = answer;
  }
  
  // Send the POST request to KnowledgeGuard
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  };
  
  UrlFetchApp.fetch(WEBHOOK_URL, options);
}
```

## Step 3: Set up the Trigger
1. Save the script (Ctrl+S or Cmd+S).
2. On the left sidebar, click the **Triggers** icon (it looks like a clock).
3. Click **+ Add Trigger** in the bottom right corner.
4. Set it up exactly like this:
   - Choose which function to run: `onSubmit`
   - Choose which deployment should run: `Head`
   - Select event source: `From form`
   - Select event type: `On form submit`
5. Click **Save**.
6. Google will ask for permissions. Click "Advanced" and "Go to script" to allow it.

## You're Done!
Now, every time your friends submit this form, it will instantly ping your KnowledgeGuard backend, auto-create their account, and calculate their risk score!
