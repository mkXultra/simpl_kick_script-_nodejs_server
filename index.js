const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');
const settingJson = fs.readFileSync('setting.json')
const setting = JSON.parse(settingJson)

const hostname = setting.host;
const port = setting.port;

let running = false;
const server = http.createServer(async (req, res) => {
  console.log(req.url);
  if (req.url === '/execute') {
    res.setHeader('Content-Type', 'text/plain');
    if (running) {
      console.log('already running');
      res.statusCode = 503;
      res.end('already running');
      return;
    }
    running = true;
    res.statusCode = 200;
    res.end('execute');
    await executeProcess(setting.executeScript)
    running = false;
  } else if(req.url === '/version') {
    console.log('version');
    res.setHeader('Content-Type', 'text/plain');
    res.statusCode = 200;
    const cpRes = await executeProcess(setting.healthCheckScript)
    res.end(cpRes.data);
  } else{
    res.setHeader('Content-Type', 'text/plain');
    res.statusCode = 404;
    res.end('404 Not Found');
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

function executeProcess(executeFile) {
  return new Promise((resolve, reject) => {
    console.log('executeProcess');
    const cp = spawn('bash', [executeFile]);
    let chunk = '';
    cp.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
      chunk += data;
    });
    cp.on('error', (err) => {
      reject(err)
    });
    cp.on('exit', (code) => {
      console.log(`child process exited with code ${code}`);
      console.log(chunk);
      resolve(
        {
          data:chunk,
          code
        }
        );
    });
  })
}