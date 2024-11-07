//-------------------------------------------------------------------------------------------------
"use strict";

//______________________global core modules___________________________________________

const path = require("node:path");
const fs = require("node:fs");
const fs_Async = require("node:fs/promises");
const http = require("node:http");
const os = require("os");
const EventEmitter = require("node:events");
const fileEventEmitter = new EventEmitter();
const { createGzip } = require("node:zlib");
const gzip = createGzip();
//______________________ End global core modules___________________________________________

let port = 3000
// Helper function to handle JSON parsing safely
      function parseJSONSafe(data) {
        try {
          return JSON.parse(data);
        } catch (error) {
          return null;
        }
      }
//______________________________________________________________________

//----------------------------------Assignment4 for Node Js ---------------------------------------------------------------
/*
*/
{
  // Create an HTTP server
  const server = http.createServer((req, res) => {
    const { url, method } = req;

    if (url == "/" && method == "GET") {
      res.writeHead(200, "ok", { "content-type": "text/plain" });
      res.write("______________Assignment 4 Node Js_______\n ");
      res.write(
        "Endpoint  Use ...> POST /path-info\nPOST /path-check\n POST /create-file \n DELETE /delete-file \n GET /system-info \n POST  compress-file \n POST copy-file \n POST stream-file \n POST read-async \n POST append-async \n POST delete-async \n POST create-async"
      );
      res.end();
    } else if (url === "/path-info" && method === "POST") {
      let bodyData = "";
      req.on("data", (chunk) => {
        console.log(chunk);
        bodyData += chunk;
      });
      req.on("end", (chunk) => {
        // console.log(bodyData);
        console.log(JSON.parse(bodyData));
        const { url } = JSON.parse(bodyData);
        console.log({ parsedpase: path.parse(url), formattedpath: url });

        res.writeHead(200, { "Content-type": "application/json" });
        res.end(
          JSON.stringify({ parsedpase: path.parse(url), formattedpath: url })
        );
      });
    } else if (url === "/path-check" && method === "POST") {
      let bodyData = "";
      req.on("data", (chunk) => {
        console.log(chunk);
        bodyData += chunk;
      });
      req.on("end", (chunk) => {
        // console.log(bodyData);
        console.log(JSON.parse(bodyData));
        const { url } = JSON.parse(bodyData);

        console.log({
          isAbsolute: path.isAbsolute(url),
          basename: path.basename(url),
          extname: path.extname(url),
          joinedpass: path.isAbsolute(url)
            ? path.join(url, "../../", "folder", path.basename(url))
            : path.join("./folder", url),
          resolvedpath: path.isAbsolute(url) ? url : path.join(__dirname, url),
        });

        res.writeHead(200, { "Content-type": "application/json" });
        res.end(
          JSON.stringify({
            isAbsolute: path.isAbsolute(url),
            basename: path.basename(url),
            extname: path.extname(url),
            joinedpass: path.isAbsolute(url)
              ? path.join(url, "../../", "folder", path.basename(url))
              : path.join("./folder", url),
            resolvedpath: path.isAbsolute(url)
              ? url
              : path.join(__dirname, url),
          })
        );
      });
    } else if (url === "/create-file" && method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });

      req.on("end", () => {
        const { fileName, content } = JSON.parse(body);
        if (fileName) {
          const filePath = path.join(__dirname, fileName);
          fs.writeFile(filePath, content || "", (err) => {
            if (err) {
              res.writeHead(500, { "Content-Type": "text/plain" });
              res.end("Error creating file");
            }
            // Event listeners for file operations
            fileEventEmitter.on("fileCreated", (fileName) => {
              console.log(`Event emitted: fileCreated for ${fileName}`);
              res.writeHead(201, { "Content-Type": "text/plain" });
              res.end(`File ${fileName} created successfully`);
            });
            // Emit the 'fileCreated' event
            fileEventEmitter.emit("fileCreated", fileName);
          });
        } else {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end(
            "Invalid input. Please provide a file name in the request body."
          );
        }
      });
    } else if (url === "/delete-file" && method === "DELETE") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });

      req.on("end", () => {
        const { fileName } = JSON.parse(body);
        if (fileName) {
          const filePath = path.join(__dirname, fileName);
          fs.unlink(filePath, (err) => {
            if (err) {
              res.writeHead(500, { "Content-Type": "text/plain" });
              res.end("Error deleting file or file not found");
            }
            // Event listeners for file operations
            fileEventEmitter.on("fileDeleted", (fileName) => {
              console.log(`Event: A file ${fileName} was deleted `);
              res.writeHead(200, { "Content-Type": "text/plain" });
              res.end(`File ${fileName} deleted successfully`);
            });
            // Emit the 'fileDeleted' event
            fileEventEmitter.emit("fileDeleted", filePath);
          });
        } else {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end(
            "Invalid input. Please provide a file name in the request body."
          );
        }
      });
    } else if (url == "/read-file" && method == "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });

      req.on("end", () => {
        const { fileName } = JSON.parse(body);
        if (fileName) {
          const filePath = path.join(__dirname, fileName);
          const readFileStream = fs.createReadStream(filePath, {
            encoding: "utf-8",
            flags: "r",
            highWaterMark: 10,
          });
          res.writeHead(200, { "content-type": "text/html" });
          // readFileStream.pipe(res)// pipe will emit end automatic
          //or
          readFileStream.on("data", (chunk) => {
            res.write(chunk);
          });
          readFileStream.on("end", () => {
            fileEventEmitter.on("fileRead", (fileName) => {
              console.log(`Event: A file ${fileName} was read `);
            });
            fileEventEmitter.emit("fileRead", fileName);
            res.end("stream ended");
          });
        } else {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end(
            "Invalid input. Please provide a file name in the request body."
          );
        }
      });
    } else if (url === "/create-async" && method === "POST") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));

      req.on("end", async () => {
        const { fileName, content } = parseJSONSafe(body) || {};
        if (fileName) {
          const filePath = path.join(__dirname, fileName);
          try {
            await fs_Async.writeFile(filePath, content || "");
            res.writeHead(201, { "Content-Type": "text/plain" });
            res.end(`File ${fileName} created successfully at ${filePath}`);
          } catch (error) {
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Error creating file: " + error.message);
          }
        } else {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("Invalid input. Please provide a valid file name.");
        }
      });
    } else if (url === "/delete-async" && method === "DELETE") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));

      req.on('end', async () => {
            const { fileName } = parseJSONSafe(body) || {};
            if (fileName) {
                const filePath = path.join(__dirname, fileName);
                try {
                    await fs_Async.unlink(filePath);
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end(`File ${fileName} deleted successfully`);
                } catch (error) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Error deleting file: ' + error.message);
                }
            } else {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Invalid input. Please provide a valid file name.');
            }
        });
    } else if (url === "/append-async" && method === "POST") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));

      req.on("end", async () => {
        const { fileName, content } = parseJSONSafe(body) || {};
        if (fileName && content) {
          const filePath = path.resolve(__dirname, fileName);
          try {
            await fs_Async.appendFile(filePath, content);
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end(`Content appended to file ${fileName} at ${filePath}`);
          } catch (error) {
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Error appending to file: " + error.message);
          }
        } else {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end(
            "Invalid input. Please provide a valid file name and content in body."
          );
        }
      });
    } else if (url === "/read-async" && method === "POST") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));

      req.on("end", async () => {
        const { fileName } = parseJSONSafe(body) || {};
        if (fileName) {
          const filePath = path.resolve(__dirname, fileName);
          try {
            const data = await fs_Async.readFile(filePath, "utf-8");
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end(`Contents of ${fileName}:\n\n${data}`);
          } catch (error) {
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Error reading file: " + error.message);
          }
        } else {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("Invalid input. Please provide a valid file name.");
        }
      });
    } else if (url == "/stream-file" && method == "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });

      req.on("end", () => {
        const { fileName } = JSON.parse(body);
        if (fileName) {
          const filePath = path.join(__dirname, fileName);
          const readFileStream = fs.createReadStream(filePath, {
            encoding: "utf-8",
            flags: "r",
            highWaterMark: 16,
          });
          res.writeHead(200, { "content-type": "text/html" });
          readFileStream.pipe(res); // pipe will emit end automatic
          readFileStream.on("open", () => {
            console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
            console.log("stream Opened");
            console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
          });
          readFileStream.on("ready", () => {
            console.log("$$$$$$$$$$$$$$$$$$$$");
            console.log("stream Ready");
            console.log("$$$$$$$$$$$$$$$$$$$$");
          });

          readFileStream.on("data", (chunk) => {
            console.log("==============================");
            console.log(`Data event received: ${chunk}`);
            // writeStream.write(chunk);
            console.log("==============================");
          });
          readFileStream.on("end", (chunk) => {
            console.log("______________________________");
            console.log("stream Ended");
            // readFileStream.closed();
            console.log("______________________________");
          });
          readFileStream.on("error", (err) => {
            console.log("/////////////////////");
            console.error("Stream error:", err);
            console.log("/////////////////////");
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Failed to stream file" }));
          });
        } else {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end(
            "Invalid input. Please provide a file name in the request body."
          );
        }
      });
    } else if (url == "/copy-file" && method == "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });

      req.on("end", () => {
        const { sourceFile, destinationFile } = JSON.parse(body);
        if (sourceFile && destinationFile) {
          const sourcePath = path.join(__dirname, sourceFile);
          const destPath = path.join(__dirname, destinationFile);
          // Create read and write streams
          const writeStream = fs.createWriteStream(destPath, {
            encoding: "utf-8",
            flags: "w",
          });
          const readStream = fs.createReadStream(sourcePath, {
            encoding: "utf-8",
            flags: "r",
            highWaterMark: 16,
          });

          // Handle stream events
          readStream.on("error", (err) => {
            console.error("Error reading source file:", err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Failed to read source file" }));
          });

          writeStream.on("error", (err) => {
            console.error("Error writing to destination file:", err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({ error: "Failed to write to destination file" })
            );
          });

          writeStream.on("finish", () => {
            console.log("File successfully copied");
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "File successfully copied" }));
          });

          // Pipe the read stream to the write stream to perform copy
          readStream.pipe(writeStream);
        } else {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end(
            "Invalid input. Please provide sourceFile and destinationFile  in the request body."
          );
        }
      });
    } else if (url == "/compress-file" && method == "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });

      req.on("end", () => {
        const { fileName } = JSON.parse(body);
        if (fileName) {
          const sourcePath = path.join(__dirname, fileName);
          const filePathWZip = path.join(__dirname, `./${fileName}.gz`);
          // Create read and write streams
          const readStream = fs.createReadStream(sourcePath, {
            encoding: "utf-8",
            flags: "r",
            highWaterMark: 16,
          });
          const writeStream = fs.createWriteStream(filePathWZip, {
            encoding: "utf-8",
            flags: "w",
          });

          // Handle stream events
          readStream.on("error", (err) => {
            console.error("Error reading file:", err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({ error: "Failed to read file for compression" })
            );
          });

          writeStream.on("error", (err) => {
            console.error("Error writing compressed file:", err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({ error: "Failed to write compressed file" })
            );
          });

          writeStream.on("finish", () => {
            console.log("File successfully compressed");
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Compression done" }));
          });
          // Pipe the read stream to the write stream to perform copy
          readStream.pipe(gzip).pipe(writeStream);
        } else {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end(
            "Invalid input. Please provide fileName  in the request body to compressed."
          );
        }
      });
    } else if (url == "/system-info" && method == "GET") {
      const systemInfo = {
        architecture: os.arch(),
        platform: os.platform(),
        freeMemory: `${(os.freemem() / 1024 / 1024).toFixed(2)} MB`,
        totalMemory: `${(os.totalmem() / 1024 / 1024).toFixed(2)} MB`,
      };
      // Respond with the system information in JSON format
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(systemInfo, null, 2));
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end(
        "Endpoint not found. Use ...> POST /path-info\nPOST /path-check\n POST /create-file \n DELETE /delete-file \n GET /system-info \n POST  compress-file \n POST copy-file \n POST stream-file \n POST read-async \n POST append-async \n POST delete-async \n POST create-async"
      );
    }
  });

  // Server listens on port 3000
  server.listen(port, "localhost", 511, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
  // server error connect
  server.on("error", (err) => {
    if (err.code == "EADDRINUSE") {
      //  port=3001
      console.error("server error..invalid port...port token");
      // setTimeout(() => {
      //   server.listen(port)
      // }, 1000);
      //------------or------------
      setTimeout(() => {
        server.close();
        server.listen(port);
      }, 1000);
    }
  });
}
//_____________________________________________________________________

//--------------------------------------------------------------------------------------------------

// //--------------------------------------------------------------------------------------------------
//*************************************************************************************************
//---------------------------------END OF ASSIGNMENT THANK YOU-------------------------------------
//*************************************************************************************************
//********************************Dev by Basem mouner rizk**********************************************
