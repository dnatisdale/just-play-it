function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(TRACK_STORE)) {
        database.createObjectStore(TRACK_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAudioDuration(file) {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const audioObj = new Audio();
    audioObj.addEventListener("loadedmetadata", () => {
      resolve(audioObj.duration);
      URL.revokeObjectURL(objectUrl);
    });
    audioObj.addEventListener("error", () => {
      resolve(0);
      URL.revokeObjectURL(objectUrl);
    });
    audioObj.src = objectUrl;
  });
}

function saveTrackBlob(id, file, duration = 0) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRACK_STORE, "readwrite");
    const store = tx.objectStore(TRACK_STORE);

    store.put({
      id,
      blob: file,
      title: file.name,
      type: file.type || "audio/*",
      size: file.size || 0,
      duration: duration,
      updatedAt: Date.now(),
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function getTrackBlob(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRACK_STORE, "readonly");
    const store = tx.objectStore(TRACK_STORE);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

function getAllTrackBlobs() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRACK_STORE, "readonly");
    const store = tx.objectStore(TRACK_STORE);
    const request = store.getAll();

    request.onsuccess = () =>
      resolve(Array.isArray(request.result) ? request.result : []);
    request.onerror = () => reject(request.error);
  });
}

function clearAllTrackBlobs() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRACK_STORE, "readwrite");
    const store = tx.objectStore(TRACK_STORE);
    store.clear();

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Delete a single stored track blob by ID
function deleteTrackBlob(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRACK_STORE, "readwrite");
    const store = tx.objectStore(TRACK_STORE);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function updateStorageUsage() {
  try {
    const records = db ? await getAllTrackBlobs() : [];
    const deviceBytes = records.reduce(
      (sum, item) => sum + (item.size || item.blob?.size || 0),
      0,
    );

    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;
      storageUsageText.textContent = `Offline storage: ${formatBytes(deviceBytes)}. Browser usage: ${formatBytes(usage)} of ${formatBytes(quota)}.`;
    } else {
      storageUsageText.textContent = `Offline storage: ${formatBytes(deviceBytes)}.`;
    }
  } catch (error) {
    console.error("Could not estimate storage:", error);
    storageUsageText.textContent = "Storage usage unavailable in this browser.";
  }
}
