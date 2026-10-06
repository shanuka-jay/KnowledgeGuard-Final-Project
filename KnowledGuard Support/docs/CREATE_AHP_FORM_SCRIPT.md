# Auto-Generate Your AHP Manager Survey

Instead of manually typing out the 10 complex pairwise comparisons for your AHP survey, you can use this script to instantly generate the perfect academic survey for your managers.

## Step 1: Open Google Apps Script
1. Go to [script.google.com](https://script.google.com).
2. Click **"New Project"**.

## Step 2: Paste the Code
Paste this exact code into the editor:

```javascript
function createAHPForm() {
  const form = FormApp.create('Expert Validation Survey: Knowledge Loss Risk');
  form.setDescription('As a domain expert, please help validate the academic weights for our Knowledge Risk formula.\\n\\nFor each pair below, please select which factor contributes MORE to the risk of an organization losing critical knowledge if the employee leaves.\\n\\nScale:\\n1 = Factor A is much more important\\n5 = They are equally important\\n9 = Factor B is much more important');
  
  // We do not collect emails for this one to keep it anonymous for managers
  form.setCollectEmail(false);

  const pairs = [
    ['Expertise Uniqueness', 'Documentation Gap'],
    ['Expertise Uniqueness', 'Project Criticality'],
    ['Expertise Uniqueness', 'Collaboration Dependency'],
    ['Expertise Uniqueness', 'Tenure'],
    ['Documentation Gap', 'Project Criticality'],
    ['Documentation Gap', 'Collaboration Dependency'],
    ['Documentation Gap', 'Tenure'],
    ['Project Criticality', 'Collaboration Dependency'],
    ['Project Criticality', 'Tenure'],
    ['Collaboration Dependency', 'Tenure']
  ];

  pairs.forEach(pair => {
    form.addScaleItem()
        .setTitle(`Compare: ${pair[0]} vs. ${pair[1]}`)
        .setBounds(1, 9)
        .setLabels(`1 = ${pair[0]} is more important`, `9 = ${pair[1]} is more important`)
        .setRequired(true);
  });

  Logger.log('Published URL: ' + form.getPublishedUrl());
  Logger.log('Editor URL: ' + form.getEditUrl());
}
```

## Step 3: Run the Script
1. Click the **Save** icon.
2. Click **Run**.
3. Grant permissions if Google asks.
4. Check the **Execution Log** at the bottom for your new Form URLs!

*(You do NOT need to attach a webhook to this form. This form is purely for you to collect data for your thesis chapter!)*
