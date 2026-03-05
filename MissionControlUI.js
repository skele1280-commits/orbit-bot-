const io = require('socket.io-client');
const { logToFile } = require('./activity-logger');

// Log initialization event
logToFile({ type: 'mission_control_ui_initiated' });

const socket = io('http://localhost:3133');

console.log(`Socket IO connected`);
signalStatus(true, `Socket IO connected`, { channel: "telegram" }); 

socket.on('connect', () => {
    console.log("Connected to WebSocket server.");
    
    // Log connection event in UI
    logToFile({ type: 'websocket_connection_established_in_UI'});
});
signalStatus(true, `Live Activity Dashboard now available`, { style: "success", channel: "telegram" });

socket.on('disconnect', () => {
    console.log("Disconnected from WebSocket server.");
    
    // Log disconnection event in UI
    logToFile({ type: 'websocket_connection_closed_in_UI' });
signalStatus(false, `Lost connection to Live Activity Dashboard`, { style: "warning", channel: "telegram" });
});
// Listen for real-time data events and update the UI accordingly.
socket.on('activityLog', (log) => {
    console.log(`Received activity data in UI: ${log.activity}`);
    
signalStatus(true, `received activity data ${log.activity}`, { channel: "telegram" });
    // Log received data in UI
    logToFile({ type: 'websocket_data_received_in_UI', data: log });
});