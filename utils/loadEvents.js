import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";
import { logger } from "./logger.js";

export default async function loadEvents(client) {
 try {
  const loadTime = performance.now();
  const eventsPath = path.join(process.cwd(), "events");
  const eventDirectories = fs.readdirSync(eventsPath).filter((dir) => fs.statSync(path.join(eventsPath, dir)).isDirectory());

  let loadedEvents = [];

  for (const dir of eventDirectories) {
   const events = fs.readdirSync(path.join(eventsPath, dir)).filter((file) => file.endsWith(".js"));
   for (const file of events) {
    const eventName = path.basename(file, ".js");
    const filePath = path.join(eventsPath, dir, file);
    const fileURL = pathToFileURL(filePath).href;
    const event = await import(fileURL);
    client.on(eventName, event[eventName].bind(null, client));
    loadedEvents.push(`${eventName} from /events/${dir}/${file}`);
   }
  }

  if (loadedEvents.length > 0) {
   logger("event", `Loaded ${loadedEvents.length} events: ${loadedEvents.join(", ")} in ${Math.round(performance.now() - loadTime)}ms`);
  }
 } catch (error) {
  logger("error", `Error loading events: ${error.message}`);
 }
}
