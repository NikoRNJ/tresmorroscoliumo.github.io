const http = require('http');

function check(port) {
    http.get(`http://localhost:${port}/api/admin/galeria/debug`, (res) => {
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        res.on('end', () => {
            console.log(`PORT ${port}: SUCCESS`);
            try {
                const json = JSON.parse(data);
                console.log(JSON.stringify(json.categories, null, 2));
            } catch (e) {
                console.log(data.substring(0, 200));
            }
        });
    }).on('error', (err) => {
        console.log(`PORT ${port}: Failed - ` + err.message);
    });
}

check(3000);
check(3001);
check(3002);
check(3003);
