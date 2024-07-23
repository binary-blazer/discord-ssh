import fs from "node:fs";
import path from "node:path";
import { basename } from "node:path";
import { performance } from "node:perf_hooks";
import { defaultConfig } from "../config.js";
import { logger } from "./logger.js";
import { pathToFileURL } from "node:url"; // Import pathToFileURL

/**
 * Loads all events from the /events folder
 *
 * @param {object} client - The Discord client
 * @returns {Promise<void>} Promise that resolves when all events are loaded
 * @throws {Error} Error that is thrown if an event could not be loaded
 */
export default async function loadEvents(client) {
 try {
  const loadTime = performance.now();

  const eventDirectories = ["guild", "client"];

  for (const dir of eventDirectories) {
   const events = fs.readdirSync(path.join(process.cwd(), "events", dir)).filter((file) => file.endsWith(".js"));
   for (const file of events) {
    const eventName = path.basename(file, ".js");
    const filePath = path.join(process.cwd(), "events", dir, file);
    const fileURL = pathToFileURL(filePath).href;
    const event = await import(fileURL);
    defaultConfig.debugger.displayEventList && logger("event", `Loaded event ${eventName} from /events/${dir}/${file}`);
    client.on(eventName, event[eventName].bind(null, client));
   }
   logger("event", `Loaded ${events.length} events from /events/${dir} in ${Math.round(performance.now() - loadTime)}ms`);
  }
 } catch (error) {
  logger("error", `Error loading events: ${error.message}`);
 }
}
