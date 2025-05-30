function initMap() {
  const customIcon = {
    url: 'img/gicon.png',
    scaledSize: new google.maps.Size(40, 40),
    anchor: new google.maps.Point(20, 40),
  };

  const map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 37.7749, lng: -122.4194 }, // Fixed key: should be 'center' not 'position'
    zoom: 10,
  });

  // Pass customIcon to fetchLocations
  fetchLocations(map, customIcon);
}

async function fetchLocations(map, customIcon) {
  const db = firebase.firestore();
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
