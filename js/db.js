// js/db.js
// Initialize Dexie database
const db = new Dexie('BankSystemDB');

// Define database schema
db.version(7).stores({
    officers: '++id, name, date',
    fuelLogs: '++id, officerId, date, vehicleNo',
    savings: '++id, month, officerName, date',
    customerActions: '++id, accountNo, date',
    customers: '++id, accountNo, name, NIC',
    schoolSavings: '++id, schoolName, date, accountNo',
    events: '++id, title, date, status',
    loanReports: '++id, applicantName, date, nic',
    postLoanReports: '++id, applicantName, date, accountNo',
    recovery: '++id, accountNo, name, status',
    settings: 'key, value'
});

// Helper functions for Backup and Restore

/**
 * Exports the entire Dexie database to a JSON file and triggers a download.
 */
async function exportDatabase() {
    try {
        const data = {};
        // Using db.tables ensures we capture all tables defined in the current schema
        for (const table of db.tables) {
            data[table.name] = await table.toArray();
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        // Provided by FileSaver.js CDN in index.html
        saveAs(blob, `bank_system_backup_${new Date().toISOString().split('T')[0]}.json`);
        return true;
    } catch (error) {
        console.error("Database export failed:", error);
        return false;
    }
}

/**
 * Imports data into the Dexie database.
 * Supports JSON string, File object, or plain object.
 * Warning: This clears existing data in the tables present in the backup.
 */
async function importDatabase(source) {
    try {
        let data;
        if (source instanceof File) {
            const text = await source.text();
            data = JSON.parse(text);
        } else if (typeof source === 'string') {
            data = JSON.parse(source);
        } else {
            data = source;
        }

        if (!data || typeof data !== 'object') {
            throw new Error("Invalid backup data format");
        }

        // Use a transaction to ensure data integrity during import
        await db.transaction('rw', db.tables, async () => {
            for (const table of db.tables) {
                if (data[table.name] && Array.isArray(data[table.name])) {
                    await table.clear(); // Clear existing data
                    if (data[table.name].length > 0) {
                        await table.bulkAdd(data[table.name]); // Add new data
                    }
                }
            }
        });
        return true;
    } catch (error) {
        console.error("Database import failed:", error);
        throw error; // Re-throw to handle in UI
    }
}

