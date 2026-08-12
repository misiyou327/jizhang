const e = require('electron'); console.log('app:', !!e.app); e.app.whenReady().then(() => { console.log('ready'); e.app.quit(); });
