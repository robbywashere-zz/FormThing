var request = require('request')
   ,http = require('http')
   ,Busboy = require('busboy')
   ,nodemailer = require('nodemailer');

var YOUR_GMAIL_ADDRESS = undefined  //fill me in !
   ,YOUR_GMAIL_PASSWORD = undefined //me too


if (!YOUR_GMAIL_ADDRESS || !YOUR_GMAIL_PASSWORD) {
  console.log("*\n*\n*\n*")
  console.log("* Replace `YOUR_GMAIL_ADDRESS` and `YOUR_GMAIL_PASSWORD` with proper credentials!");
  console.log("*\n*\n*\n*")
  process.exit();
}
var smtpTransport = nodemailer.createTransport({
  service: "Gmail",
    auth: {
      user: YOUR_GMAIL_ADDRESS,
      pass: YOUR_GMAIL_PASSWORD
    }
})


var MAIL_OPT = {
  from: YOUR_GMAIL_ADDRESS
 ,to: YOUR_GMAIL_ADDRESS
 ,text: ""
 ,attachments: []
}


http.createServer(function(req, res) {
  if (req.method === 'POST') {

    var busboy = new Busboy({
      headers: req.headers
    });

    var mailOptions = Object.create(MAIL_OPT);  //Create new object from MAIL_OPT 

    mailOptions.subject = "Form From: " + req.connection.remoteAddress; //Get IP from Request object

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {

      var someFile = { filename: filename, content: new Buffer('') }; //Create new object included in file.on('data' ... as a closure below

      mailOptions.attachments.push(someFile);

      file.on('data', function(data) {
        someFile.content = Buffer.concat([someFile.content, data]); //concat data to bufferino
      })

      file.on('end', function() {
      })


    })


      busboy.on('field', function(fieldname, val) {
        mailOptions.text = mailOptions.text.concat('[' + fieldname + ']: ' + val.toString() + '\n')
      })


      busboy.on('finish', function() {

        //Send it out - log errors blah blah who kerrors?
        smtpTransport.sendMail(mailOptions, function(error, response) { if (error) { console.log(error) } else { console.log("Message sent") } });


        //Http code 303 is a redirect.
        res.writeHead(303, { Connection: 'close', Location: '/' });
        res.end();

        busboy = null; //Nullify busboy becuz superstitious memory leaks
      })

      //Last but not least setup requests to 'pipe' into busboy'
      req.pipe(busboy);


  } else if (req.method === 'GET') {
    res.writeHead(200, {
      Connection: 'close'
    })
    res.end('<html><head></head><body>\
        <form method="POST" enctype="multipart/form-data">\
        <input type="text" name="textfield1" value="This is field1"><br />\
        <input type="text" name="textfield2" value="This is field2"><br />\
        <input type="text" name="textfield3" value="This is field3"><br />\
        <input type="file" name="filefield"><br />\
        <input type="submit">\
        </form>\
        </body></html>');
  }
}).listen(8000, function() {
  console.log('Listening for requests');
})
