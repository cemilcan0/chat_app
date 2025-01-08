const { PeerServer } = require('peer');

// PeerJS sunucusunu başlat
const peerServer = PeerServer({ port: 9000, path: '/' });


console.log('PeerJS server is running on http://localhost:9000');
