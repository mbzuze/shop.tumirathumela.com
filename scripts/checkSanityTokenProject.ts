import https from "https";

const token = process.env.SANITY_API_TOKEN;

if (!token) {
    console.error("SANITY_API_TOKEN is missing");
    process.exit(1);
}

const options = {
    hostname: 'api.sanity.io',
    path: '/v1/projects',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            const projects = JSON.parse(data);
            console.log("Projects associated with this token:");
            if (Array.isArray(projects)) {
                projects.forEach((p: any) => {
                    console.log(`- ID: ${p.id}, Name: ${p.displayName || p.name}`);
                });
            } else {
                 console.log("Response is not an array:", projects);
            }
        } else {
            console.error(`Failed to fetch projects. Status: ${res.statusCode}`);
            console.error(data);
        }
    });
});

req.on('error', (e) => {
    console.error(e);
});

req.end();
