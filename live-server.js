const WebSocket = require('ws');
const { logToFile } = require('./activity-logger');

// Log initialization event
logToFile({ type: 'websocket_server_initiated' });

const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (socket) => {
    console.log("WebSocket connection established.");
    
    // Log connection event
    logToFile({ type: 'websocket_connection_established' });
    
    socket.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            if (message.type === 'activityLog') {
                console.log(`Received activity data: ${message.activity}`);
                
                // Log received activity
                logToFile({ type: 'websocket_data_received', data: message });
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    });
    
    socket.on('close', () => {
        console.log("WebSocket connection closed.");
        
        // Log disconnection event
        logToFile({ type: 'websocket_connection_closed' });
    });
});