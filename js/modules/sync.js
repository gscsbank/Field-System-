// js/modules/sync.js

document.addEventListener('DOMContentLoaded', () => {
    const syncWebappUrlInput = document.getElementById('sync-webapp-url');
    const btnTestSync = document.getElementById('btn-test-sync');
    const btnRunSync = document.getElementById('btn-run-sync');
    const btnCopyScript = document.getElementById('btn-copy-script');
    const btnRefreshCloudList = document.getElementById('btn-refresh-cloud-list');

    const APPS_SCRIPT_CODE = `// Google Apps Script for Field Operations Backup & Sync
// Deploy this script as a Web App:
// 1. Execute as: Me (your email)
// 2. Who has access: Anyone

const FOLDER_ID = "1d6qy0_-Jt8LgzAUb8vj0qpN4r8YZp78d"; // Google Drive Folder ID from client

function doGet(e) {
  var action = e.parameter.action;
  
  try {
    var folder = DriveApp.getFolderById(FOLDER_ID);
    
    if (action === "test") {
      return JSONResponse({ status: "success", message: "Connected successfully to Google Drive!" });
    }
    
    if (action === "list") {
      var files = folder.getFiles();
      var list = [];
      while (files.hasNext()) {
        var file = files.next();
        if (file.getName().endsWith(".json")) {
          list.push({
            id: file.getId(),
            name: file.getName(),
            created: file.getDateCreated().toISOString(),
            size: file.getSize()
          });
        }
      }
      // Sort: newest first
      list.sort(function(a, b) {
        return new Date(b.created) - new Date(a.created);
      });
      return JSONResponse(list);
    }
    
    if (action === "get") {
      var fileId = e.parameter.fileId;
      if (!fileId) throw new Error("Missing fileId parameter");
      var file = DriveApp.getFileById(fileId);
      var content = file.getAs("text/plain").getDataAsString();
      return ContentService.createTextOutput(content)
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return JSONResponse({ status: "error", message: "Invalid GET action" });
  } catch (error) {
    return JSONResponse({ status: "error", message: error.toString() });
  }
}

function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    var folder = DriveApp.getFolderById(FOLDER_ID);
    
    if (action === "upload") {
      var filename = postData.filename;
      var content = postData.content;
      
      if (!filename || !content) {
        throw new Error("Missing filename or content");
      }
      
      // Create backup file in drive
      var file = folder.createFile(filename, content, MimeType.PLAIN_TEXT);
      
      return JSONResponse({
        status: "success",
        message: "Backup uploaded successfully",
        fileId: file.getId(),
        name: file.getName(),
        size: file.getSize()
      });
    }
    
    return JSONResponse({ status: "error", message: "Invalid POST action" });
  } catch (error) {
    return JSONResponse({ status: "error", message: error.toString() });
  }
}

function JSONResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

    // --- Initialize Data ---
    initSyncModule();

    async function initSyncModule() {
        // Load Web App URL from Dexie settings
        try {
            const storedUrl = await db.settings.get('google_apps_script_url');
            if (storedUrl && syncWebappUrlInput) {
                syncWebappUrlInput.value = storedUrl.value;
            }

            const storedLastSync = await db.settings.get('google_drive_last_sync');
            if (storedLastSync) {
                updateSyncTimeDisplay(storedLastSync.value);
            }

            // Load backup list if URL is configured
            if (storedUrl && storedUrl.value) {
                loadCloudBackups();
            }
        } catch (e) {
            console.error("Error loading sync settings:", e);
        }
    }

    // Listen to module switches
    document.addEventListener('moduleSwitched', (e) => {
        if (e.detail.target === 'settings') {
            loadCloudBackups();
        }
    });

    // Save Web App URL when modified
    if (syncWebappUrlInput) {
        syncWebappUrlInput.addEventListener('change', async (e) => {
            const url = e.target.value.trim();
            try {
                await db.settings.put({ key: 'google_apps_script_url', value: url });
                window.showToast('Web App URL saved locally.', 'success');
                loadCloudBackups();
            } catch (err) {
                console.error("Failed to save Web App URL:", err);
                window.showToast('Failed to save settings.', 'error');
            }
        });
    }

    // --- Helper Formatting Functions ---
    function formatDateTime(isoString) {
        if (!isoString) return 'Never';
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return 'Never';
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            let hours = date.getHours();
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'AM' : 'PM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            return `${yyyy}/${mm}/${dd} ${hours}:${minutes} ${ampm}`;
        } catch (e) {
            return 'Never';
        }
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        if (!bytes) return 'Unknown';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function updateSyncTimeDisplay(isoString) {
        const lastSyncEl = document.getElementById('last-sync-time');
        if (lastSyncEl) {
            lastSyncEl.textContent = formatDateTime(isoString);
        }
    }

    // --- Copy Script Button ---
    if (btnCopyScript) {
        btnCopyScript.addEventListener('click', () => {
            navigator.clipboard.writeText(APPS_SCRIPT_CODE).then(() => {
                window.showToast('Apps Script code copied to clipboard!', 'success');
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                window.showToast('Failed to copy. Please copy manually.', 'error');
            });
        });
    }

    // --- Test Connection Button ---
    if (btnTestSync) {
        btnTestSync.addEventListener('click', async () => {
            const url = syncWebappUrlInput ? syncWebappUrlInput.value.trim() : '';
            if (!url) {
                window.showAlert('Error', 'Please enter Google Apps Script Web App URL first.', 'error');
                return;
            }

            Swal.fire({
                title: 'Testing Connection',
                text: 'Connecting to Google Apps Script Web App...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            try {
                const response = await fetch(`${url}?action=test`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const result = await response.json();

                if (result.status === 'success') {
                    window.showAlert('Connected', result.message || 'Connection successful!', 'success');
                } else {
                    window.showAlert('Connection Failed', result.message || 'Failed to connect.', 'error');
                }
            } catch (error) {
                console.error("Test sync error", error);
                window.showAlert('Connection Failed', 'Failed to connect. Please verify the URL and ensure the Web App is deployed with "Anyone" access.', 'error');
            }
        });
    }

    // --- Sync Now (Upload Backup) Button ---
    if (btnRunSync) {
        btnRunSync.addEventListener('click', async () => {
            const url = syncWebappUrlInput ? syncWebappUrlInput.value.trim() : '';
            if (!url) {
                window.showAlert('Error', 'Please enter Google Apps Script Web App URL first.', 'error');
                return;
            }

            Swal.fire({
                title: 'Synchronizing',
                text: 'Generating database backup...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            try {
                // 1. Export database to a JSON object
                const backupData = {};
                for (const table of db.tables) {
                    backupData[table.name] = await table.toArray();
                }
                const jsonString = JSON.stringify(backupData);

                // Generate filename: Arunalu_Backup_YYYY-MM-DD_HH-MM-SS.json
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const seconds = String(now.getSeconds()).padStart(2, '0');
                const filename = `Arunalu_Backup_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.json`;

                Swal.update({ text: 'Uploading backup to Google Drive...' });

                // 2. Post to Google Apps Script (Simple request to avoid preflight CORS)
                const response = await fetch(url, {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'upload',
                        filename: filename,
                        content: jsonString
                    })
                });

                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const result = await response.json();

                if (result.status === 'success') {
                    const syncTime = new Date().toISOString();
                    await db.settings.put({ key: 'google_drive_last_sync', value: syncTime });
                    updateSyncTimeDisplay(syncTime);

                    await Swal.fire({
                        title: 'Sync Complete',
                        text: 'Database successfully synced to Google Drive!',
                        icon: 'success',
                        confirmButtonColor: '#1a56db'
                    });

                    // Reload cloud backups list
                    loadCloudBackups();
                } else {
                    window.showAlert('Sync Failed', result.message || 'Error occurred during sync.', 'error');
                }
            } catch (error) {
                console.error("Sync error", error);
                window.showAlert('Sync Failed', 'Failed to sync database to Google Drive. See console for details.', 'error');
            }
        });
    }

    // --- List Cloud Backups ---
    async function loadCloudBackups() {
        const url = syncWebappUrlInput ? syncWebappUrlInput.value.trim() : '';
        const tbody = document.getElementById('cloud-backups-tbody');
        if (!tbody) return;

        if (!url) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-8 text-center text-slate-400 text-xs">
                        <i class="ph ph-cloud-arrow-down text-3xl mb-2 text-slate-300 block mx-auto"></i>
                        Enter a Web App URL and click "Refresh List" to load Google Drive backups.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="px-6 py-8 text-center text-slate-400 text-xs">
                    <div class="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mr-2 align-middle"></div>
                    Loading cloud backups from Google Drive...
                </td>
            </tr>
        `;

        try {
            const response = await fetch(`${url}?action=list`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const list = await response.json();

            if (list.status === 'error') {
                throw new Error(list.message);
            }

            tbody.innerHTML = '';
            if (!Array.isArray(list) || list.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="px-6 py-8 text-center text-slate-400 text-xs">
                            <i class="ph ph-folder-open text-3xl mb-2 text-slate-300 block mx-auto"></i>
                            No backup files (.json) found in the Google Drive folder.
                        </td>
                    </tr>
                `;
                return;
            }

            list.forEach(file => {
                const tr = document.createElement('tr');
                tr.className = 'group hover:bg-slate-50/80 transition-colors';

                tr.innerHTML = `
                    <td class="px-6 py-4">
                        <div class="font-medium text-slate-800 flex items-center gap-2">
                            <i class="ph ph-file-js font-normal text-indigo-500 text-lg"></i>
                            ${file.name}
                        </div>
                    </td>
                    <td class="px-6 py-4 text-slate-500 text-xs">
                        ${formatDateTime(file.created)}
                    </td>
                    <td class="px-6 py-4 text-slate-500 text-xs">
                        ${formatFileSize(file.size)}
                    </td>
                    <td class="px-6 py-4 text-center">
                        <button onclick="restoreFromCloud('${file.id}', '${file.name}')" class="px-4 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 mx-auto transition-all shadow-sm">
                            <i class="ph ph-cloud-arrow-down"></i> RESTORE
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            console.error("Load cloud backups error", error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-8 text-center text-rose-500 text-xs font-medium">
                        <i class="ph ph-warning-circle text-3xl mb-2 text-rose-300 block mx-auto"></i>
                        Failed to load cloud backups: ${error.message || 'Error occurred.'}
                    </td>
                </tr>
            `;
        }
    }

    if (btnRefreshCloudList) {
        btnRefreshCloudList.addEventListener('click', loadCloudBackups);
    }

    // --- Restore from Cloud Function ---
    window.restoreFromCloud = async function (fileId, filename) {
        const url = syncWebappUrlInput ? syncWebappUrlInput.value.trim() : '';
        if (!url) return;

        const confirmed = await window.showConfirm(
            'Restore Cloud Backup',
            `Are you sure you want to download and restore the backup "${filename}"? Current data will be replaced.`,
            'Yes, restore',
            'warning'
        );

        if (!confirmed) return;

        Swal.fire({
            title: 'Restoring Database',
            text: 'Downloading backup from Google Drive...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const response = await fetch(`${url}?action=get&fileId=${fileId}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const backupData = await response.json();

            Swal.update({ text: 'Importing data into local database...' });

            if (typeof window.importDatabase === 'function') {
                await window.importDatabase(backupData);

                await Swal.fire({
                    title: 'Restored Successfully',
                    text: 'Local database has been restored. The application will now reload.',
                    icon: 'success',
                    confirmButtonColor: '#1a56db'
                });
                window.location.reload();
            } else {
                throw new Error("importDatabase function is not loaded in the context.");
            }
        } catch (error) {
            console.error("Cloud restore error", error);
            window.showAlert('Restore Failed', 'Failed to restore database from Google Drive. ' + (error.message || ''), 'error');
        }
    };
});
