// Port Solace — tuning & palette. Logical viewport 1280x720, world is a square city.
export const VIEW = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const WORLD = { size: 2400, block: 480, road: 120 };
export const PLAYER = { radius: 11, walk: 175, sprint: 265, health: 100 };
export const CAR = { radius: 16, accel: 520, maxSpeed: 430, reverse: 150, turn: 2.6 };
export const SAVE_KEY = 'port-solace.save.v1';
export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const PALETTE = {
  backdrop:'#0d1117', grass:'#2e4a34', sidewalk:'#8f979c', road:'#33373d', roadLine:'#e8c547',
  text:'#eef1f5', muted:'#aab3bd', panel:'rgba(18,22,32,0.92)',
  health:'#e5534b', money:'#7bd88a', star:'#f2c94c', marker:'#ffcf40'
};
export const PLACES = ['Marina Bakehouse','Harborlight Clinic','Solace Books','Tidepool Gym','Lantern Hotel','Gull Market','Pier Nine Diner','Cedar Garage','Beacon Library','Coral Arcade','Ferry Office','Dune Florist','Anchor Bank','Solace School','Wave Theatre','Kelp Grocer','Compass Cafe','Harbor Chapel','Saltworks','Lookout Tower','Mermaid Laundry','Cobble Bakery','North Depot','South Kiosk','East Print Shop'];
export const CAR_COLORS = ['#c94f4f','#4f7dc9','#53a06a','#d9a441','#8a6fc9','#d97fb0','#5bb5c4','#c9c9c9'];
export const BUILDING_COLORS = ['#7a6a58','#5d6d7e','#8a5a4a','#64755a','#75627a','#4f6a72','#93765a','#5a5f7a','#7e5d5d','#667a5e'];
