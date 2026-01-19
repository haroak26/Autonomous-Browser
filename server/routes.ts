import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { registerAudioRoutes } from "./replit_integrations/audio";
import { openai } from "./replit_integrations/chat/routes"; // Use the configured client

puppeteer.use(StealthPlugin());

let browser: Browser | null = null;
let page: Page | null = null;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true, // Use new headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
  }
  return { browser, page };
}

async function getScreenshot() {
  if (!page) return undefined;
  const buffer = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 80 });
  return buffer as string;
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
      res.status(500).json({ message: error.message });
    }
  });

  app.post(api.browser.action.path, async (req, res) => {
    try {
      const { browser: b, page: p } = await getBrowser();
      if (!p) throw new Error("Browser not initialized");

      const input = api.browser.action.input.parse(req.body);
      
      switch (input.action) {
        case "navigate":
          if (input.url) {
            await p.goto(input.url, { waitUntil: 'domcontentloaded' });
            await storage.addToHistory({ url: input.url, title: await p.title() });
          }
          break;
        case "click":
          if (input.selector) await p.click(input.selector);
          else if (input.x !== undefined && input.y !== undefined) await p.mouse.click(input.x, input.y);
          break;
        case "type":
          if (input.selector && input.text) await p.type(input.selector, input.text);
          else if (input.text) await p.keyboard.type(input.text);
          break;
        case "scroll":
             // Simple scroll down for now
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
      console.error(error);
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
        // Construct prompt with context
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
        
        // Use the imported OpenAI client from the integration
        // Actually, I should use the one I imported or instantiate a new one if not exported.
        // It is exported from replit_integrations/chat/routes.ts but I can also just use the global one if I exported it.
        // Wait, I imported 'openai' from "./replit_integrations/chat/routes". Check if it exports it.
        // The integration code for `server/replit_integrations/chat/routes.ts` DOES NOT export `openai`.
        // `server/replit_integrations/chat/index.ts` exports `openai`? No, it exports registerChatRoutes and chatStorage.
        // `server/replit_integrations/image/client.ts` exports `openai`.
        // I can import from `server/replit_integrations/image/client.ts` or just instantiate it here.
        // I'll stick to the one I imported from image/client or just instantiate it.
        
        // Let's use the one from image/client as it's cleaner.
        const { openai } = require("./replit_integrations/image/client");

        const completion = await openai.chat.completions.create({
            model: "gpt-5.1",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
        });

        const result = JSON.parse(completion.choices[0].message.content);
        res.json(result);

     } catch (error: any) {
        res.status(500).json({ message: error.message });
     }
  });

  app.get(api.history.list.path, async (req, res) => {
    const history = await storage.getHistory();
    res.json(history);
  });

  return httpServer;
}
