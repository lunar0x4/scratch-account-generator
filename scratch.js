const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1528700558259523684/NZAkL-9Xth17v_lEu7BHyH4e0a4iVaKKRTO2bsj5AhSUvRi8p_n4P17RWbpmIVJCkG8r';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};

function logSuccess(msg) { console.log(colors.green + '[+] ' + msg + colors.reset); }
function logError(msg) { console.log(colors.red + '[-] ' + msg + colors.reset); }
function logInfo(msg) { console.log(colors.cyan + '[*] ' + msg + colors.reset); }
function logWarning(msg) { console.log(colors.yellow + '[!] ' + msg + colors.reset); }
function logHighlight(msg) { console.log(colors.magenta + colors.bright + msg + colors.reset); }
function logAccount(msg) { console.log(colors.bgGreen + colors.bright + ' ' + msg + ' ' + colors.reset); }
function logCaptcha(msg) { console.log(colors.bgRed + colors.bright + ' ' + msg + ' ' + colors.reset); }

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateUsername() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const length = Math.floor(Math.random() * 5) + 8;
  let username = '';
  for (let i = 0; i < length; i++) {
    username += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return username;
}

function generatePassword() {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=';
  const all = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += symbols.charAt(Math.floor(Math.random() * symbols.length));
  
  for (let i = 4; i < 16; i++) {
    password += all.charAt(Math.floor(Math.random() * all.length));
  }
  
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

async function createTempEmail() {
  const response = await fetch('https://api.internal.temp-mail.io/api/v3/email/new', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      min_name_length: 10,
      max_name_length: 10
    })
  });
  
  const data = await response.json();
  return data.email;
}

async function sendToDiscord(username, password, email) {
  try {
    const embed = {
      title: 'NEW SCRATCH ACCOUNT CREATED!',
      color: 0x00ff00,
      fields: [
        {
          name: 'Username',
          value: `\`${username}\``,
          inline: true
        },
        {
          name: 'Password',
          value: `\`${password}\``,
          inline: true
        },
        {
          name: 'Email',
          value: `\`${email}\``,
          inline: false
        }
      ],
      footer: {
        text: 'Scratch Account Creator v1.0',
        icon_url: 'https://logos-world.net/wp-content/uploads/2023/08/Scratch-Emblem.png'
      },
      timestamp: new Date().toISOString()
    };

    const payload = {
      content: '**NEW ACCOUNT DROPPED!**',
      embeds: [embed]
    };

    const response = await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      logSuccess('Account sent to Discord!');
    } else {
      logError('Failed to send to Discord: ' + response.status);
    }
  } catch (error) {
    logError('Discord webhook error: ' + error.message);
  }
}

function saveAccount(username, password, email) {
  try {
    const filePath = path.join(__dirname, 'accs.txt');
    const data = `${username}:${password}|${email}\n`;
    
    fs.writeFileSync(filePath, data, { 
      flag: 'a+', 
      encoding: 'utf8',
      mode: 0o666 
    });
    
    logSuccess('Account saved to accs.txt');
    
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(username)) {
      logSuccess('✓ Verification: Account successfully written!');
    }
    
  } catch (err) {
    logError('Failed to save account: ' + err.message);
    try {
      const filePath = path.join(process.cwd(), 'accs.txt');
      fs.writeFileSync(filePath, `${username}:${password}|${email}\n`);
      logSuccess('Account saved to accs.txt using alternative path');
    } catch (err2) {
      logError('Alternative save also failed: ' + err2.message);
    }
  }
}

(async () => {
  console.log(colors.bright + colors.cyan + '═══════════════════════════════════════' + colors.reset);
  console.log(colors.bright + colors.magenta + '     SCRATCH ACCOUNT CREATOR v1.0     ' + colors.reset);
  console.log(colors.bright + colors.cyan + '═══════════════════════════════════════' + colors.reset);
  console.log('');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    logInfo('Creating temp email...');
    const email = await createTempEmail();
    logSuccess('Temp email created: ' + colors.yellow + email + colors.reset);

    const username = generateUsername();
    const password = generatePassword();
    logHighlight('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logSuccess('Username: ' + colors.bright + username + colors.reset);
    logSuccess('Password: ' + colors.bright + password + colors.reset);
    logHighlight('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    logInfo('Navigating to Scratch signup...');
    await page.goto('https://scratch.mit.edu/join', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    logInfo('Step ' + colors.yellow + '1/5' + colors.reset + ' - Username & Password');
    await page.waitForSelector('#username', { timeout: 10000 });
    await page.type('#username', username);
    await page.keyboard.press('Tab');
    await delay(500);

    await page.waitForSelector('#password', { timeout: 10000 });
    await page.type('#password', password);
    await delay(500);

    await page.waitForSelector('#passwordConfirm', { timeout: 10000 });
    await page.type('#passwordConfirm', password);
    await delay(500);

    await page.click('button[type="submit"] .modal-title.next-step-title');
    await delay(2000);
    
    logInfo('Step ' + colors.yellow + '2/5' + colors.reset + ' - Country Selection');
    await page.waitForSelector('#country', { timeout: 10000 });
    await page.select('#country', 'United Kingdom');
    await delay(1000);

    await page.click('button[type="submit"] .modal-title.next-step-title');
    await delay(2000);
    
    logInfo('Step ' + colors.yellow + '3/5' + colors.reset + ' - Birthday');
    await page.waitForSelector('#birth_month', { timeout: 10000 });
    const month = Math.floor(Math.random() * 12) + 1;
    await page.select('#birth_month', month.toString());
    await delay(500);
    
    await page.waitForSelector('#birth_year', { timeout: 10000 });
    await page.select('#birth_year', '2000');
    await delay(500);

    await page.click('button[type="submit"] .modal-title.next-step-title');
    await delay(2000);

    logInfo('Step ' + colors.yellow + '4/5' + colors.reset + ' - Gender');
    await page.waitForSelector('#GenderRadioOptionMale', { timeout: 10000 });
    await page.click('#GenderRadioOptionMale');
    await delay(500);

    await page.click('button[type="submit"] .modal-title.next-step-title');
    await delay(2000);

    logInfo('Step ' + colors.yellow + '5/5' + colors.reset + ' - Email & Terms');
    await page.waitForSelector('#email', { timeout: 10000 });
    await page.type('#email', email);
    await delay(500);

    await page.waitForSelector('#tos', { timeout: 10000 });
    await page.click('#tos');
    await delay(500);

    logInfo('Creating account...');
    await page.click('button[type="submit"] .modal-title.next-step-title');
    
    logInfo('Waiting 3 seconds to check for captcha...');
    await delay(3000);
    
    const captchaPresent = await page.evaluate(() => {
      const captcha = document.querySelector('#rc-imageselect');
      return captcha !== null;
    });
    
    if (captchaPresent) {
      logCaptcha('  CAPTCHA DETECTED!  ');
      logWarning('Please complete the captcha manually...');
      logWarning('Waiting up to 60 seconds for completion...');
      
      let captchaSolved = false;
      let attempts = 0;
      const maxAttempts = 12;
      
      while (!captchaSolved && attempts < maxAttempts) {
        await delay(5000);
        attempts++;
        
        const welcomeExists = await page.evaluate(() => {
          return document.querySelector('.join-flow-welcome-title') !== null;
        });
        
        if (welcomeExists) {
          captchaSolved = true;
          logSuccess('Captcha solved! Continuing...');
          break;
        }
        
        console.log(`   Waiting for captcha completion... (${attempts * 5}s / 60s)`);
      }
      
      if (!captchaSolved) {
        logError('Captcha not solved within 60 seconds!');
        logError('Account creation may have failed.');
      }
    } else {
      logInfo('No captcha detected.');
    }
    
    logInfo('Waiting for account creation confirmation...');
    await page.waitForSelector('.join-flow-welcome-title', { timeout: 30000 });
    
    const welcomeText = await page.evaluate(() => {
      return document.querySelector('.join-flow-welcome-title')?.innerText || '';
    });
    
    console.log('');
    logAccount('  ACCOUNT CREATED SUCCESSFULLY!  ');
    console.log('');
    logSuccess(colors.bright + welcomeText + colors.reset);
    console.log('');
    logSuccess('Email: ' + colors.cyan + email + colors.reset);
    logSuccess('Password: ' + colors.cyan + password + colors.reset);
    console.log('');
    
    saveAccount(username, password, email);
    
    logInfo('Sending to Discord...');
    await sendToDiscord(username, password, email);
    
    console.log('');
    logWarning('IMPORTANT:');
    logWarning('Email: ' + colors.yellow + email + colors.reset);
    logWarning('Password: ' + colors.yellow + password + colors.reset);
    logWarning('User must verify email manually via the link sent to the temp email!');
    logWarning('Check temp-mail at: ' + colors.cyan + 'https://api.internal.temp-mail.io/api/v3/email/' + email + '/messages' + colors.reset);
    
  } catch (error) {
    logError('Error during automation: ' + error.message);
  } finally {
    console.log('');
    logInfo('Keeping browser open for 10 seconds...');
    await delay(10000);
    await browser.close();
    logSuccess('Browser closed.');
    console.log('');
    console.log(colors.bright + colors.cyan + '═══════════════════════════════════════' + colors.reset);
  }
})();

if (!global.fetch) {
  const fetch = require('node-fetch');
  global.fetch = fetch;
}
