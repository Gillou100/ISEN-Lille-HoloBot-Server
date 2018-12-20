net = require("net");

// Keep the server's ip adress in a variable
var serverIP = require("os").networkInterfaces().wlan0[0].cidr.split("/")[0];
var serverName = "Server";

// Supports multiple client applications
var sockets = [];

// Readable message
var message = "";

// Create a TCP socket listener
var s = net.Server(function (socket)
{
	// Add the new client socket connection to the array of sockets
	sockets.push(socket);

	// Keep the client's ip address in a variable
	socket.ip = socket.remoteAddress.split(":")[3];

	// Save our personnal IP Address with the hotspot TP1
	socket.name = socket.ip;
	switch(socket.name)
	{
		case "10.125.0.21":
			socket.name = "HoloLens";
			break;
		case "10.125.0.50":
			socket.name = "HoloBot";
			break;
	}

	// Indicate the connection with the client's ip address. The message is different if the IP Address is knowed
	if(socket.name === socket.ip)
	{
		console.log(serverName, ":\n\tIncoming connection :", socket.ip);
	}
	else
	{
		console.log(serverName, ":\n\tIncoming connection :", socket.ip, "->", socket.name);
	}

	// "data" is an event that means that a message was just sent by the client application
	socket.on("data", function (msg_sent)
	{
		if(socket.name === "HoloLens" && msg_sent.toString() !== "test connection\r\n" && msg_sent.toString() !== "endS\r\n")
		{
			for(var i = 0; i<sockets.length; i++)
			{
				if(sockets[i].name === "HoloBot")
				{
					sockets[i].write(msg_sent);
					break;
				}
			}
		}
		// resend the message to the client
		socket.write(msg_sent);

		// Display the readable message
		console.log(socket.name, ":\n\t" + msg_sent.toString());

		// For some tests, it may be nice to be able to close the server
		if(msg_sent.toString() === "endS\r\n")
		{
			console.log(serverName, ":\n\tI will close all connection and shut down.");
			s.close(); // Server will close once all clients will be destroyed
			while(sockets.length !== 0) // For all clients...
			{
				sockets[0].end("endC\r\n"); // tell it must close
				sockets[0].destroy();	// destroy the connection
				console.log(serverName, ":\n\tOutgoing connection :", sockets[0].name);
				sockets.shift();	// Remove from the array
			}
			console.log(serverName, ":\n\tGoodbye !");
		}
	});

	// Use splice to get rid of the socket that is ending
	// The "end" event means tcp client has disconnected
	socket.on("end", function ()
	{
		var i = sockets.indexOf(socket);
		sockets.splice(i, 1);
		console.log(serverName, ":\n\tOutgoing connection :", socket.name);
	});

	socket.on("error", function()	// if there is an error...
	{
		console.log(serverName, ":\n\tError for the client :", socket.name);
		socket.destroy();	// destroy the client
		var i = sockets.indexOf(socket);	// Remove the client from the array
		sockets.splice(i, 1);
		console.log(serverName, ": Outgoing connection :", socket.name);
	});
});

var port = 5035;
s.listen(port);
console.log("Server listening ->", serverIP +  ":" + port);
console.log(serverName, ":\n\tHi !");
