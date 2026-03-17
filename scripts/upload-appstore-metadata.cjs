const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const KEY_ID = process.env.ASC_KEY_ID;
const ISSUER_ID = process.env.ASC_ISSUER_ID;
let PRIVATE_KEY = process.env.ASC_PRIVATE_KEY;
if (PRIVATE_KEY && !PRIVATE_KEY.includes('\n')) {
  PRIVATE_KEY = PRIVATE_KEY
    .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
    .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----')
    .replace(/(.{64})/g, '$1\n')
    .replace(/\n\n/g, '\n');
}
const APP_ID = '6760695652';
const LOCALE = 'en-GB';

function generateToken() {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: ISSUER_ID,
    iat: now,
    exp: now + 1200,
    aud: 'appstoreconnect-v1'
  };
  return jwt.sign(payload, PRIVATE_KEY, {
    algorithm: 'ES256',
    header: { alg: 'ES256', kid: KEY_ID, typ: 'JWT' }
  });
}

const token = generateToken();
const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
};
const BASE = 'https://api.appstoreconnect.apple.com/v1';

async function apiGet(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) { console.error('GET failed:', res.status, await res.text()); return null; }
  return res.json();
}

async function apiPost(url, body) {
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) { console.error('POST failed:', res.status, await res.text()); return null; }
  return res.json();
}

async function apiPatch(url, body) {
  const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(body) });
  if (!res.ok) { console.error('PATCH failed:', res.status, await res.text()); return null; }
  return res.json();
}

async function run() {
  console.log('=== App Store Connect Metadata Upload ===\n');

  // 1. Get the app's editable version
  console.log('1. Finding editable app version...');
  const versionsData = await apiGet(`${BASE}/apps/${APP_ID}/appStoreVersions?filter[appStoreState]=PREPARE_FOR_SUBMISSION,DEVELOPER_REJECTED,REJECTED,METADATA_REJECTED,WAITING_FOR_REVIEW,IN_REVIEW,READY_FOR_SALE&limit=5`);
  if (!versionsData || !versionsData.data || versionsData.data.length === 0) {
    // Try without filter
    const allVersions = await apiGet(`${BASE}/apps/${APP_ID}/appStoreVersions?limit=5`);
    if (!allVersions || !allVersions.data || allVersions.data.length === 0) {
      console.error('No app versions found');
      return;
    }
    console.log('Available versions:', allVersions.data.map(v => `${v.attributes.versionString} (${v.attributes.appStoreState})`));
  }
  
  const editableVersion = versionsData?.data?.find(v => 
    ['PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED'].includes(v.attributes.appStoreState)
  ) || versionsData?.data?.[0];
  
  if (!editableVersion) {
    console.error('No editable version found');
    return;
  }
  
  const versionId = editableVersion.id;
  console.log(`   Found version: ${editableVersion.attributes.versionString} (${editableVersion.attributes.appStoreState})`);

  // 2. Get or create localization
  console.log('\n2. Setting up localization for', LOCALE, '...');
  const locData = await apiGet(`${BASE}/appStoreVersions/${versionId}/appStoreVersionLocalizations`);
  let localization = locData?.data?.find(l => l.attributes.locale === LOCALE);
  
  const metadataFields = {
    description: "Send a message to your future self and receive it in 6 months or a year via SMS or WhatsApp.\n\nText Capsule lets you write letters, set goals, send encouragement, and capture memories — then delivers them back to you when the time comes.\n\nFeatures:\n• Write messages with creative writing prompts\n• Choose delivery in 6 months or 1 year\n• Receive via SMS or WhatsApp\n• View your message history\n• Simple, beautiful chat-style interface\n\nWrite today. Receive tomorrow.",
    keywords: "time capsule,future self,messages,letter,goals,motivation,SMS,WhatsApp,reminders,journal",
    supportUrl: "https://future-message-timer.replit.app/api/support",
    marketingUrl: "https://future-message-timer.replit.app",
    promotionalText: "Send messages to your future self",
  };

  if (localization) {
    console.log('   Updating existing localization...');
    await apiPatch(`${BASE}/appStoreVersionLocalizations/${localization.id}`, {
      data: {
        type: 'appStoreVersionLocalizations',
        id: localization.id,
        attributes: metadataFields
      }
    });
  } else {
    console.log('   Creating new localization...');
    const created = await apiPost(`${BASE}/appStoreVersionLocalizations`, {
      data: {
        type: 'appStoreVersionLocalizations',
        attributes: { locale: LOCALE, ...metadataFields },
        relationships: {
          appStoreVersion: { data: { type: 'appStoreVersions', id: versionId } }
        }
      }
    });
    localization = created?.data;
  }
  
  if (!localization) { console.error('Failed to set up localization'); return; }
  console.log('   Metadata updated successfully!');

  // 3. Update app-level info (subtitle, privacy policy)
  console.log('\n3. Updating app info...');
  const appInfos = await apiGet(`${BASE}/apps/${APP_ID}/appInfos`);
  if (appInfos?.data?.[0]) {
    const appInfoId = appInfos.data[0].id;
    const appInfoLocs = await apiGet(`${BASE}/appInfos/${appInfoId}/appInfoLocalizations`);
    let appInfoLoc = appInfoLocs?.data?.find(l => l.attributes.locale === LOCALE);
    
    const appInfoFields = {
      name: 'Text Capsule',
      subtitle: 'Messages to your future self',
      privacyPolicyUrl: 'https://future-message-timer.replit.app/api/privacy',
    };
    
    if (appInfoLoc) {
      await apiPatch(`${BASE}/appInfoLocalizations/${appInfoLoc.id}`, {
        data: {
          type: 'appInfoLocalizations',
          id: appInfoLoc.id,
          attributes: appInfoFields
        }
      });
      console.log('   App info updated!');
    } else {
      await apiPost(`${BASE}/appInfoLocalizations`, {
        data: {
          type: 'appInfoLocalizations',
          attributes: { locale: LOCALE, ...appInfoFields },
          relationships: {
            appInfo: { data: { type: 'appInfos', id: appInfoId } }
          }
        }
      });
      console.log('   App info localization created!');
    }
  }

  // 4. Upload screenshots
  console.log('\n4. Uploading screenshots...');
  const screenshotDir = path.join(__dirname, '..', 'artifacts', 'future-letter', 'assets', 'store', 'screenshots', 'iphone67');
  const screenshotFiles = fs.readdirSync(screenshotDir).filter(f => f.endsWith('.png')).sort();
  console.log(`   Found ${screenshotFiles.length} screenshots`);

  // Get existing screenshot sets
  const setsData = await apiGet(`${BASE}/appStoreVersionLocalizations/${localization.id}/appScreenshotSets`);
  
  // iPhone 6.7" display type
  const DISPLAY_TYPE = 'APP_IPHONE_67';
  let screenshotSet = setsData?.data?.find(s => s.attributes.screenshotDisplayType === DISPLAY_TYPE);
  
  if (!screenshotSet) {
    console.log('   Creating screenshot set for iPhone 6.7"...');
    const setResult = await apiPost(`${BASE}/appScreenshotSets`, {
      data: {
        type: 'appScreenshotSets',
        attributes: { screenshotDisplayType: DISPLAY_TYPE },
        relationships: {
          appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: localization.id } }
        }
      }
    });
    screenshotSet = setResult?.data;
  }
  
  if (!screenshotSet) { console.error('Failed to create screenshot set'); return; }
  console.log('   Screenshot set ready:', screenshotSet.id);

  // Upload each screenshot
  for (const file of screenshotFiles) {
    const filePath = path.join(screenshotDir, file);
    const fileData = fs.readFileSync(filePath);
    const fileSize = fileData.length;
    
    console.log(`   Uploading ${file} (${Math.round(fileSize/1024)}KB)...`);
    
    // Reserve the screenshot
    const reservation = await apiPost(`${BASE}/appScreenshots`, {
      data: {
        type: 'appScreenshots',
        attributes: {
          fileName: file,
          fileSize: fileSize
        },
        relationships: {
          appScreenshotSet: { data: { type: 'appScreenshotSets', id: screenshotSet.id } }
        }
      }
    });
    
    if (!reservation?.data) {
      console.error(`   Failed to reserve ${file}`);
      continue;
    }
    
    const screenshotId = reservation.data.id;
    const uploadOps = reservation.data.attributes.uploadOperations;
    
    // Upload each part
    for (const op of uploadOps) {
      const chunk = fileData.slice(op.offset, op.offset + op.length);
      const uploadHeaders = {};
      for (const h of op.requestHeaders) {
        uploadHeaders[h.name] = h.value;
      }
      
      const uploadRes = await fetch(op.url, {
        method: op.method,
        headers: uploadHeaders,
        body: chunk
      });
      
      if (!uploadRes.ok) {
        console.error(`   Upload part failed:`, uploadRes.status);
      }
    }
    
    // Commit the upload
    await apiPatch(`${BASE}/appScreenshots/${screenshotId}`, {
      data: {
        type: 'appScreenshots',
        id: screenshotId,
        attributes: {
          uploaded: true,
          sourceFileChecksum: reservation.data.attributes.sourceFileChecksum
        }
      }
    });
    
    console.log(`   ${file} uploaded!`);
  }

  console.log('\n=== All done! Metadata and screenshots uploaded to App Store Connect ===');
}

run().catch(e => console.error('Error:', e));
