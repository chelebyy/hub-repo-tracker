
import { filesystemService } from '../src/features/filesystem/service';
import os from 'node:os';

async function run() {
    console.log("Testing filesystemService...");
    try {
        console.log(`Home dir: ${os.homedir()}`);

        console.log("--- Listing Home Directory ---");
        const homeResult = await filesystemService.listDirectories();
        if (homeResult.error) {
            console.error("Home Directory Error:", homeResult.error);
        } else {
            console.log(`Success! Found ${homeResult.entries.length} entries.`);
            console.log("First 5 entries:", homeResult.entries.slice(0, 5));
        }

        console.log("\n--- Listing C:/Users/muham/OneDrive/Belgeler ---");
        // Adjust path if needed based on known structure
        const docResult = await filesystemService.listDirectories('C:/Users/muham/OneDrive/Belgeler');
        if (docResult.error) {
            console.error("Doc Directory Error:", docResult.error);
        } else {
            console.log(`Success! Found ${docResult.entries.length} entries.`);
        }

    } catch (e) {
        console.error("CRITICAL EXCEPTION:", e);
    }
}

run();
