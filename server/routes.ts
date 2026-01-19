import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium, BrowserContext, Page } from "playwright-core";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { registerAudioRoutes } from "./replit_integrations/audio";
import { openai } from "./replit_integrations/image/client"; 

let browserContext: BrowserContext | null = null;
let page: Page | null = null;

const DEFAULT_VIEWPORT = { width: 1280, height: 800 };
const EXECUTABLE_PATH_ENV_VARS = ["PLAYWRIGHT_EXECUTABLE_PATH", "CHROME_PATH"];
const USER_DATA_DIR =
  process.env.PLAYWRIGHT_USER_DATA_DIR ?? path.join(os.homedir(), ".cache", "playwright-profile");
const HEADLESS = process.env.PLAYWRIGHT_HEADLESS !== "false";

async function resolveExecutablePath(): Promise<string | undefined> {
  for (const envVar of EXECUTABLE_PATH_ENV_VARS) {
    const envPath = process.env[envVar];
    if (envPath && fs.existsSync(envPath)) {
      return envPath;
    }
  }

  return undefined;
}

async function getBrowser() {
  if (!browserContext) {
    const executablePath = await resolveExecutablePath();
    browserContext = await chromium.launchPersistentContext(USER_DATA_DIR, {
      headless: HEADLESS,
      executablePath,
      viewport: DEFAULT_VIEWPORT,
      locale: "en-US",
      timezoneId: "America/Los_Angeles",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled",
        "--disable-infobars",
        "--window-position=0,0",
        "--ignore-certificate-errors",
      ],
    });

    await browserContext.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
      Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, "languages", { get: () => ["en-US", "en"] });
    });

    page = browserContext.pages()[0] ?? (await browserContext.newPage());
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
      Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, "languages", { get: () => ["en-US", "en"] });
    });
  }
  return { browserContext, page };
}

async function getScreenshot() {
  if (!page) return undefined;
  const buffer = await page.screenshot({ type: 'jpeg', quality: 80 });
  return buffer.toString('base64');
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register integration routes
  registerChatRoutes(app);
  registerImageRoutes(app);
  registerAudioRoutes(app);

  app.post(api.browser.launch.path, async (req, res) => {
    try {
      await getBrowser();
      res.json({ message: "Browser launched" });
    } catch (error: any) {
      console.error("Launch error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post(api.browser.action.path, async (req, res) => {
    try {
      const { page: p } = await getBrowser();
      if (!p) throw new Error("Browser not initialized");

      const input = api.browser.action.input.parse(req.body);
      
      switch (input.action) {
        case "navigate":
          if (input.url) {
            await p.goto(input.url, { waitUntil: "domcontentloaded" });
            await storage.addToHistory({ url: input.url, title: await p.title() });
          }
          break;
        case "click":
          if (input.selector) await p.click(input.selector);
          else if (input.x !== undefined && input.y !== undefined) {
            await p.mouse.click(input.x, input.y);
          }
          break;
        case "type":
          if (input.selector && input.text) {
            await p.click(input.selector, { timeout: 5000 });
            await p.type(input.selector, input.text, { delay: 25 });
          } else if (input.text) {
            await p.keyboard.type(input.text, { delay: 25 });
          }
          break;
        case "scroll":
          await p.evaluate(() => window.scrollBy(0, 500));
          break;
        case "back":
          await p.goBack();
          break;
        case "forward":
          await p.goForward();
          break;
        case "reload":
          await p.reload();
          break;
      }

      const screenshot = await getScreenshot();
      const title = await p.title();
      const url = p.url();

      res.json({
        url,
        title,
        screenshot,
        isLoading: false
      });

    } catch (error: any) {
      console.error("Action error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get(api.browser.status.path, async (req, res) => {
    try {
      if (!page) {
         return res.json({ url: "", title: "", isLoading: false });
      }
      const screenshot = await getScreenshot();
      res.json({
        url: page.url(),
        title: await page.title(),
        screenshot,
        isLoading: false
      });
    } catch (error: any) {
       res.status(500).json({ message: error.message });
    }
  });
  
  app.post(api.ai.command.path, async (req, res) => {
     try {
        const { message, context } = req.body;
        const prompt = `
          You are controlling a browser. 
          Current URL: ${context?.url || 'none'}
          Current Title: ${context?.title || 'none'}
          User Request: "${message}"
          
          Determine the next best action.
          Return a JSON object with:
          - message: A short response to the user.
          - action: (Optional) The action to perform.
            - action: "navigate" | "click" | "type" | "scroll" | "back" | "reload"
            - url: (if navigate)
            - selector: (if click/type)
            - text: (if type)
        `;
        
        const completion = await openai.chat.completions.create({
            model: "gpt-5.1",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
        });

        const result = JSON.parse(completion.choices[0].message.content);
        res.json(result);

     } catch (error: any) {
        console.error("AI error:", error);
        res.status(500).json({ message: error.message });
     }
  });

  app.get(api.history.list.path, async (req, res) => {
    const history = await storage.getHistory();
    res.json(history);
  });

  return httpServer;
}
