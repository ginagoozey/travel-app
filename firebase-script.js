// Initialize Firebase if not already done in another script
const db = firebase.firestore();

// Reference UI elements
const statusBar = document.getElementById("status-bar");
const doneDrivingBtn = document.getElementById("doneDrivingBtn");
const onTheRoadBtn = document.getElementById("onTheRoadBtn");

// Firestore document for current travel status
const statusDoc = db.collection("status").doc("currentStatus");

function initMap() {
  const customIcon = {
    url: 'img/gicon.png',
    scaledSize: new google.maps.Size(40, 40),
    anchor: new google.maps.Point(20, 40),
  };

  const map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 37.7749, lng: -122.4194 },
    zoom: 10,
  });

  fetchLocations(map, customIcon);
  loadStatus(map); // Load rest status marker if present
}

async function fetchLocations(map, customIcon) {
  const snapshot = await db.collection("locations").get();

  console.log(`Fetched ${snapshot.size} marker(s) from Firestore.`);

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (typeof data.lat === "number" && typeof data.lng === "number") {
      addMarkerToMap(map, data.lat, data.lng, data.note, customIcon);
    } else {
      console.warn("Invalid lat/lng in document:", doc.id, data);
    }
  });
}

function addMarkerToMap(map, lat, lng, note, customIcon) {
  new google.maps.Marker({
    position: { lat, lng },
    map,
    title: note || "",
    icon: customIcon,
  });
}

// Load rest/travel status and update UI
async function loadStatus(map) {
  const docSnap = await statusDoc.get();
  if (docSnap.exists) {
    const data = docSnap.data();
    updateStatusBar(data.state);
    if (data.state === "resting" && data.latitude && data.longitude) {
      addRestMarker(map, data);
    }
  } else {
    updateStatusBar("traveling"); // Default
  }
}

// Update the status banner
function updateStatusBar(state) {
  if (state === "resting") {
    statusBar.innerText = "🛏️ Resting for the night!";
  } else {
    statusBar.innerText = "🚗 On the road";
  }
}

// Add rest icon marker
function addRestMarker(map, data) {
  const restIcon = {
    url: "https://cdn-icons-png.flaticon.com/512/2909/2909761.png",
    scaledSize: new google.maps.Size(32, 32),
  };

  new google.maps.Marker({
    position: { lat: data.latitude, lng: data.longitude },
    map,
    icon: restIcon,
    title: `Resting since ${new Date(data.timestamp).toLocaleString()}`,
  });
}

// Event listener: Done driving for the day
doneDrivingBtn?.addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const coords = pos.coords;
      const timestamp = new Date().toISOString();
      await statusDoc.set({
        state: "resting",
        latitude: coords.latitude,
        longitude: coords.longitude,
        timestamp: timestamp
      });
      updateStatusBar("resting");
      location.reload(); // Refresh to show marker
    });
  } else {
    alert("Geolocation not supported.");
  }
});

// Event listener: Back on the road
onTheRoadBtn?.addEventListener("click", async () => {
  await statusDoc.set({
    state: "traveling",
    timestamp: new Date().toISOString()
  });
  updateStatusBar("traveling");
  location.reload(); // Refresh to remove marker
});
