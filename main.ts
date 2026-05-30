import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { app, BrowserWindow } from 'electron';

let mainWindow: BrowserWindow | null = null;
let bundledApiProcess: ChildProcess | null = null;

function getDataDir(): string {
  return path.join(app.getPath('userData'), 'data');
}

function startBundledApi(): string {
  const port = Number(process.env.XIANXIA_API_PORT ?? 3000);
  const apiUrl = `http://127.0.0.1:${port}`;
  if (bundledApiProcess)
    return apiUrl;

  const apiEntry = path.join(__dirname, '../api/src/main.js');
  if (!fs.existsSync(apiEntry))
    throw new Error(`未找到内置 Nest API 入口: ${apiEntry}`);

  bundledApiProcess = spawn(process.execPath, [apiEntry], {
    env: {
      ...process.env,
      PORT: String(port),
      XIANXIA_DATA_DIR: getDataDir(),
      XIANXIA_WEB_DIST_DIR: path.join(__dirname, '../web'),
    },
    stdio: 'ignore',
  });

  bundledApiProcess.once('exit', () => {
    bundledApiProcess = null;
  });

  return apiUrl;
}

async function waitForLocalApi(apiUrl: string): Promise<void> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${apiUrl}/ai/config`);
      if (response.ok)
        return;
      lastError = new Error(`HTTP ${response.status}`);
    }
    catch (error) {
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`内置 Nest API 启动失败: ${String(lastError)}`);
}

function stopBundledApi(): void {
  bundledApiProcess?.kill();
  bundledApiProcess = null;
}

async function createWindow(): Promise<void> {
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: '凡人修仙传 - AI修仙RPG',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (devServerUrl) {
    await mainWindow.loadURL(devServerUrl);
  }
  else {
    const apiUrl = startBundledApi();
    await waitForLocalApi(apiUrl);
    await mainWindow.loadURL(apiUrl);
  }

  if (devServerUrl) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBundledApi();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow().catch((error) => {
      console.error('创建窗口失败:', error);
    });
  }
});
