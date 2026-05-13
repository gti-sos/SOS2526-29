const { spawn } = require("node:child_process");
const http = require("node:http");
const https = require("node:https");

const [, , targetUrl, ...commandParts] = process.argv;

if (!targetUrl || commandParts.length === 0) {
  console.error("Usage: node scripts/run-with-server.cjs <url> <command...>");
  process.exit(1);
}

const command = commandParts.join(" ");
const timeoutMs = 120000;
const intervalMs = 500;

// Hace una peticion ligera a la URL objetivo y devuelve true si el servidor ya responde.
function requestUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith("https:") ? https : http;
    const req = client.get(url, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });

    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });

    req.on("error", () => resolve(false));
  });
}

// Espera a que el servidor local este listo antes de lanzar Playwright/Newman.
async function waitForUrl(url, serverProcess) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (await requestUrl(url)) {
      return;
    }

    if (serverProcess && serverProcess.exitCode !== null) {
      throw new Error(`Server exited early with code ${serverProcess.exitCode}`);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

// Arranca el backend real del proyecto con Node, igual que haria npm start.
function startServer() {
  return spawn(process.execPath, ["index.js"], {
    stdio: "inherit",
    windowsHide: true
  });
}

// Ejecuta el comando recibido por CLI una vez que el servidor esta disponible.
function runCommand() {
  return new Promise((resolve) => {
    const child = spawn(command, {
      stdio: "inherit",
      shell: true,
      windowsHide: true,
      env: {
        ...process.env,
        PLAYWRIGHT_REUSE_SERVER: "1"
      }
    });

    child.on("exit", (code, signal) => {
      if (signal) {
        resolve(1);
        return;
      }

      resolve(code ?? 1);
    });
  });
}

// Cierra el servidor que haya arrancado este script para no dejar procesos abiertos.
function stopServer(serverProcess) {
  return new Promise((resolve) => {
    if (!serverProcess || serverProcess.exitCode !== null) {
      resolve();
      return;
    }

    if (process.platform === "win32") {
      const killer = spawn("taskkill", ["/pid", String(serverProcess.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true
      });
      killer.on("exit", () => resolve());
      return;
    }

    serverProcess.once("exit", () => resolve());
    serverProcess.kill("SIGTERM");
    setTimeout(() => {
      if (serverProcess.exitCode === null) {
        serverProcess.kill("SIGKILL");
      }
    }, 3000);
  });
}

(async () => {
  let serverProcess = null;

  try {
    // Si el usuario ya tenia el servidor levantado, reutilizamos ese proceso.
    const alreadyRunning = await requestUrl(targetUrl);

    if (!alreadyRunning) {
      serverProcess = startServer();
      await waitForUrl(targetUrl, serverProcess);
    }

    const exitCode = await runCommand();
    await stopServer(serverProcess);
    process.exit(exitCode);
  } catch (error) {
    console.error(error.message);
    await stopServer(serverProcess);
    process.exit(1);
  }
})();
